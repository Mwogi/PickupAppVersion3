App.factory('TaxiRide', function(_, $cordovaLocalNotification, $filter, $http, $interval, $ionicLoading, $ionicModal, $ionicPlatform, $q, $rootScope, $state, $translate, $timeout, $window, Application, Customer, GoogleMaps, Url, SafePopups, AUTH_EVENTS,$anchorScroll,$location,$cordovaSocialSharing, $ionicSlideBoxDelegate,$cordovaCamera,$ionicActionSheet,$ionicPopup) {

    var TAXIRIDE_LOCAL_NOTIFICATION_ID = 725858;

    var factory = {};


    $rootScope.$on('$cordovaLocalNotification:click', function(event, notification, state) {
        if(!!_.get(notification, "data.taxiride")) {
            $state.go("taxi_ride-map", {value_id: factory.value_id});
            cancelTaxiRideNotification();
        }
    });

    function cancelTaxiRideNotification() {
        try {
            $cordovaLocalNotification.cancel([TAXIRIDE_LOCAL_NOTIFICATION_ID]);
        } catch(e) {
            console.error("error cancelling taxiride notification");
        }
    } 

    $ionicPlatform.on('resume', cancelTaxiRideNotification);

    factory.CUSTOM_FIELDS_MODAL_STATE_UPDATE = "taxiride_custom_fields_modal_state_update";
    factory.PAYMENTS_SETTINGS_MODAL_STATE_UPDATE = "taxiride_payments_settings_modal_state_update";
    factory.DRIVER_ACCEPTED_REQUEST = "taxiride_driver_accepted_request";
    factory.DRIVER_REJECTED_REQUEST = "taxiride_driver_rejected_request";
    factory.REQUEST_UPDATED = "taxiride_request_updated";
    factory.REQUEST_CHAT = "taxiride_chat_updated";
    factory.MAP_EVENTS = {
        DRIVER_APPEARED: "taxiride_driver_appeared",
        DRIVER_UPDATED: "taxiride_driver_updated",
        DRIVER_DISAPPEARED: "taxiride_driver_disappeared",
        DRIVERS_MAP_UPDATED: "taxiride_drivers_map_updated"
    };
	factory.REQUEST_DETAILS = "taxiride_details_updated";

    var _customers = {};
    var _vehicule_types = null;

    var positionBuffer = (new (function PositionsBuffer() {

        function getPositionsBuffer() {
            var _positionsBuffer = $window.localStorage.getItem("sb-taxiride-positions-buffer");
            try {
                _positionsBuffer = JSON.parse(_positionsBuffer);
            } catch(e) {
                if(!(_.isObject(e) && e.name === "SyntaxError" && (e.message.indexOf("JSON") >= 0 || e.message.indexOf("Unexpected end of input") >= 0))) {
                    throw e;
                }
            }

            if(!_.isObject(_positionsBuffer))
                _positionsBuffer = {};

            return _positionsBuffer;
        }

        function setPositionsBuffer(buffer) {
            if(_.isObject(buffer)) {
                $window.localStorage.setItem("sb-taxiride-positions-buffer", JSON.stringify(buffer));
                return buffer;
            }
            return {};
        }

        function removeFromPositionBuffer(driverOrPassenger, request, data) {
            var _positionsBuffer = getPositionsBuffer();

            if(!_.isObject(_positionsBuffer[driverOrPassenger])) {
                _positionsBuffer[driverOrPassenger] = {};
            }

            if(!_.isObject(_positionsBuffer[driverOrPassenger][request])) {
                _positionsBuffer[driverOrPassenger][request] = {};
            }

            _positionsBuffer[driverOrPassenger][request][data.gps_timestamp] = undefined;
            delete _positionsBuffer[driverOrPassenger][request][data.gps_timestamp];

            setPositionsBuffer(_positionsBuffer);
        }

        function sendPosition(driverOrPassenger, request, data) {
            if(!(/^driver|passenger$/.test(driverOrPassenger)))
                return $q.reject();

            if(!_.isObject(data))
                return $q.reject();
			
			if(factory.isOnline){
				return goOnline(driverOrPassenger)().then(function(io) {
					console.log(driverOrPassenger+".updatePosition: " + JSON.stringify(data));
					io.emit(driverOrPassenger+".updatePosition", payload(data), function() {
						removeFromPositionBuffer(driverOrPassenger, request, data);
					});

					return $q.resolve();
				});
			}else{
				return $q.reject();
			}
        }

        this.addPosition = function addToPositionBuffer(driverOrPassenger, request, data) {
            request = +(request || _.get(request, "id") || 0);

            if(!(/^driver|passenger$/.test(driverOrPassenger)))
                return;

            var _positionsBuffer = getPositionsBuffer();

            if(!_.isObject(_positionsBuffer[driverOrPassenger])) {
                _positionsBuffer[driverOrPassenger] = {};
            }

            if(!_.isObject(_positionsBuffer[driverOrPassenger][request])) {
                _positionsBuffer[driverOrPassenger][request] = {};
            }

            _positionsBuffer[driverOrPassenger][request][data.gps_timestamp] = data;

            setPositionsBuffer(_positionsBuffer);
        };

        var _goingOnline = null;
        var _checkInterval = null;

        var sendPositionsInBuffer = function() {
			try{
				console.log("TIMER FIRING");
				if( _.isString(factory.role) && /^driver|passenger$/.test(factory.role) ) {
                    if(_.isObject(_goingOnline) && _.isFunction(_goingOnline.then))
                        return;

                    _goingOnline = goOnline(factory.role)().then(function(io) {

                        var req_id = +_.get(factory, "current_request.id", 0);

                        var _positionsBuffer = getPositionsBuffer();

                        // Clean buffer

                        // Remove not corresponding roles
                        _positionsBuffer[factory.role === "driver" ? "passenger" : "driver"] = undefined;
                        delete _positionsBuffer[factory.role === "driver" ? "passenger" : "driver"];


                        if(req_id !== 0) {
                            // remove not corresponding request
                            _positionsBuffer[factory.role] = _.filter(_positionsBuffer[factory.role], function(value, key) {
                                return +key === +req_id;
                            });
                        }

                        setPositionsBuffer(_positionsBuffer);

                        var positions = _.merge(
                            {},
                            _.get(_positionsBuffer, "["+factory.role+"]["+req_id+"]", {}),
                            _.get(_positionsBuffer, "["+factory.role+"][0]", {})
                        );

                        if(_.size(positions) > 0) {
                            $q.all(
                                _.map(positions, function(value, timestamp) {
                                    return sendPosition(factory.role, req_id, value);
                                })
                            ).finally(function() {
                                _goingOnline = null;
                            });
                        } else {
                            _goingOnline = null;
                        }
                    });
                }
			} catch(e) {
				throw e;
			}
        };

        var executeOnce = $interval(function() {
            if( _.isString(factory.role) && /^driver|passenger$/.test(factory.role) ) {
                sendPositionsInBuffer(); // Execute it once when starting the app
                $interval.cancel(executeOnce);
            }
        }, 1000);

        this.startTimer = function() {
            $interval.cancel(_checkInterval);
            _checkInterval = $interval(sendPositionsInBuffer, 3000);
        };

        this.stopTimer = function() {
			//console.log("Timer stopped attempt");
            $interval.cancel(_checkInterval);
            _checkInterval = _goingOnline = null;
        };

        return this;
    })());

    var CUSTOM_FIELDS = {
        "passenger": [
            {
                label: $translate.instant("Phone"),
                key: "phone",
                type: "tel",
                holder: "Phone in the format 07XXXXXXXX",
                required: true
            },
            {
                label: $translate.instant("ID Number"),
                key: "address",
                type: "text",
                holder: "Identification/Passport No.",
                required: true
            }/**,
            {
                label: $translate.instant("City"),
                key: "city",
                type: "text",
                required: true
            },
            {
                label: $translate.instant("Zip Code"),
                key: "zipcode",
                type: "text",
                required: false
            },
            {
                label: $translate.instant("Country"),
                key: "country",
                type: "select_country",
                required: false
            },
            {
                label: $translate.instant("City"),
                key: "state",
                type: "select_state",
                required: false
            }**/
        ]
    };

    CUSTOM_FIELDS["driver"] = CUSTOM_FIELDS["passenger"].concat(
        [
            {
                label: $translate.instant("Vehicle Type"),
                key: "vehicule_type_id",
                type: "vehicule_type",
                required: false
            },
            {
                label: $translate.instant("Vehicle Model"),
                key: "vehicule_model",
                type: "text",
                holder: "e.g Toyota Allex",
                required: false
            },
            {
                label: $translate.instant("Car Number Plate"),
                key: "license_number",
                type: "text",
                holder: "Car's number plate",
                required: false
            },
            {
                label: $translate.instant("Your Advert"),
                key: "tag_line",
                type: "text",
                holder: "Advertise extra services here",
                required: false
            }
        ]
    );

    var _cf_modal = null;
    var _cf_modal_success = false;
    var _cf_modal_promise = null;

    var _ps_modal = null;
    var _ps_modal_success = false;
    var _ps_modal_promise = null;

    factory.value_id = null;
    factory.role = null;
    factory.current_request = null;
	factory.user_image = null;
	factory.firstName = "Friend";
	factory.user_rate = null;
	factory.ratingDone = false;
	factory.hasNotifiedTripStarted = false;
	factory.chats = null;
	
	//VARIABLES FOR SHOWING REAL TIME RATES
	factory.myPos = null;
    factory.distance = null;
    factory.time = null;
	factory.lastPosition = null;
	factory.thisCustomer = Customer;
	factory.plates = null;
	
	factory.ShowMessages = true;
	factory.hasCar = true;
	factory.showingSettings = false;
	factory.referralBonusAmount = 0;
	factory.max_base = 0;
	factory.max_per_km = 0;
	factory.max_per_min = 0;
	factory.max_waiting = 0;
	
	
	factory.isOnline = false;
	factory.needToUploadDocs = false;
	factory.needToAddVehicle = false;
	factory.firstRegistration = false;
	factory.updateChecked = false;


    $rootScope.$on(AUTH_EVENTS.logoutSuccess, function(){
        factory.role = null;
        factory.current_request = null;
    });

    Object.defineProperty(factory, "custom_fields", {
        get: function() {
            return _.get(CUSTOM_FIELDS, "["+factory.role+"]");
        }
    });

    Object.defineProperty(factory, "custom_fields_data", {
        get: function() {
            var data = _.get(_customers, "["+Customer.id+"].custom_fields", {});
            if(!_.isObject(data))
                data = {};

            return _.extend(
                {},
                _.assign.apply(_,
                               _.map(
                                   factory.custom_fields,
                                   function(f) {
                                       var k = {};
                                       k[f.key] = null;
                                       return k;
                                   }
                               )
                              ),
                data
            );
        }
    });

    factory.areCustomFieldsValid = function() {
        return _.get(_customers, "["+Customer.id+"].valid");
    };

    factory.pay = function(request_id) {
        var q = $q.defer();

        var rideIsFinishedAndPaidCallback = function(success, error_message) {
            $ionicLoading.hide();
            if(success) {
                //we trigg for all an update of request
                factory.broadcastRequest(request_id);
                q.resolve();
            } else {
				/**
                SafePopups.show("alert",{
                    title: $translate.instant('Error'),
                    template: $translate.instant(error_message)
                });**/
                q.reject([error_message]);
            }
        };

        $ionicLoading.show({
            template: $translate.instant("Payment in progress") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });
        $http.postForm(
            Url.get(
                "taxiride/mobile_view/pay",
                {
                    value_id: factory.value_id,
                    customer_id: +Customer.id,
                    request_id: request_id
                }
            ),
            {}
        ).success(function(data) {
            if(_.isObject(data) && !!data.success) {
                rideIsFinishedAndPaidCallback(true);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        }).error(function(data) {
            if(data.message) {
                rideIsFinishedAndPaidCallback(false, data.message);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        });

        return q.promise;
    };
	
	//verify
	var showing_verify_modal = false;
	var verify_modal = null;

	factory.showVerifyModal = function (cId, phone, code) {
		if (showing_verify_modal) {
			return;
		}
		showing_verify_modal = true;
		var scope = $rootScope.$new();
		scope.counter = 60;
		scope.data = {};
		scope.data.phone = phone;
		scope.data.inputCode = "";
		scope.showCodeInvalid = false;
		scope.showResend = false;
		var stv= setInterval(function(){
			if (scope.counter>0) {
				scope.counter=scope.counter-1;
			}else{
				scope.showResend = true;
				scope.stop();
			}
		},1000);
		scope.stop=function(){
			clearInterval(stv);
		}
		scope.update = function(){
		   var m = scope.data.inputCode;
		   factory.updateActivation(cId, m, scope.data.phone, code);
		   scope.$close();
		}
		scope.backModal=function(){
			scope.counter=60;
			scope.showResend=false;
			stv= setInterval(function(){
				if (scope.counter>0) {
					scope.counter=scope.counter-1;
				}else{
					scope.showResend=true;
					scope.stop();
				}
			},1000);
		}
		scope.resendCode=function(){
			scope.$close();
			factory.updateNumber(cId,scope.data.phone); 
		}
		scope.editPhoneNumber = function(){
			scope.$close();
			factory.showCustomFieldsModal();
		}
		
		scope.add = function(value) {
		    if(scope.data.inputCode.length < 4) {
		        scope.data.inputCode = scope.data.inputCode + value;
		        if(scope.data.inputCode.length == 4) {
		            $timeout(function() {
		                //console.log("The four digit code was entered");
		                var m = scope.data.inputCode;
		                if(m == code){
		                	factory.updateActivation(cId, m, scope.data.phone, code);
		                	scope.showCodeInvalid = false;
		                	factory.awardReferrer(scope.data.phone);
		                	scope.$close();
		                }else{
		                	scope.showCodeInvalid = true;
		                	scope.data.inputCode = "";
		                }
		            }, 500);
		        }
		    }
		}
		
		scope.delete = function() {
		    if(scope.data.inputCode.length > 0) {
		        scope.data.inputCode = scope.data.inputCode.substring(0, scope.data.inputCode.length - 1);
		    }
		}

		scope.$close = function () {
			if (_.isObject(verify_modal) && _.isFunction(verify_modal.remove)) {
				verify_modal.remove();
				verify_modal = null;
			}
		};

		scope.$on('modal.hidden', function (e, modal) {
			if (modal === verify_modal) {
				showing_verify_modal = false;
			}
		});

		$ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/verify-modal.html', {
			scope: scope,
			animation: 'slide-in-up',
			backdropClickToClose: false,
			hardwareBackButtonClose: false
		}).then(function (modal) {
			verify_modal = modal;
			verify_modal.show();
		});
	};

	//verify=end

	//nyota-update-phone number
    factory.updateNumber = function(customer_id,number) {
		var q = $q.defer();
		var userRatedCallback = function(success,message,phone) {
			$ionicLoading.hide();
			if(success) {
				factory.updateCodes(Customer.id);
				$ionicPopup.alert({
					title: $translate.instant('success'),
					template: $translate.instant(message+" "+phone)
				});
			   
			   
				q.resolve();
			} else {
				$ionicPopup.alert({
					title: $translate.instant('Error'),
					template: $translate.instant(message)
				});
				q.reject([message]);
			}
		};

		$ionicLoading.show({
		   template: $translate.instant("Reseting number") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
		});
		$http.postForm(
			Url.get(
				"taxiride/mobile_view/setnumber",
				{
					value_id: factory.value_id,                  
					customer_id:customer_id,
					customer_number:number
				}
			),
			{}
		).success(function(data) {
	 
			if(_.isObject(data) && !!data.success) {
				userRatedCallback(true,data.message,data.phone);
			} else {
				userRatedCallback(false, "Server response is not correct","");
			}
		}).error(function(data) {
			alert("failed 1");
			if(data.message) {
				userRatedCallback(false,data.message,data.phone);
			} else {
				userRatedCallback(false, "Server response is not correct");
			}
		});
		return q.promise;
	};
	//end of nyota-change phone number and verify
	
	//nyota-verify-generate the code to send to client
    factory.updateCodes = function(customer_id) {
		if(_ps_modal_promise !== null || _cf_modal_promise !== null){
			return;
		}
		var q = $q.defer();
        var code= Math.floor(1000 + Math.random() * 9000);
        /**if (code.length==4) {
            
        }else{
			code= Math.floor( Math.random()*10000);
        }**/

        var userRatedCallback = function(success, message,phone,vCode) {
            $ionicLoading.hide();
            if(success) {
				if (message==0) {
					factory.Verify(vCode,phone,customer_id);
                }
				q.resolve();
            } else {
				$ionicPopup.alert({
                    title: $translate.instant('Error'),
                    template: $translate.instant(message)
                });
                q.reject([message]);
            }
        };
        $http.postForm(
            Url.get(
                "taxiride/mobile_view/setcode",
                {
                    value_id: factory.value_id,                  
                    customer_id:customer_id,
                    customer_code:code
                }
            ),
            {}
        ).success(function(data) {
     
            if(_.isObject(data) && !!data.success) {
                userRatedCallback(true,data.state,data.phone,code);
            } else {
                userRatedCallback(false, "Server response is not correct","");
            }
        }).error(function(data) {
            alert("failed 1");
            if(data.message) {
                userRatedCallback(false,data.message);
            } else {
                userRatedCallback(false, "Server response is not correct");
            }
        });
        return q.promise;
    };
    //end of nyota-verify-generate the code to send to client
	
	//CODE TO SEND THE GENERATED CODE TO CUSTOMERS PHONE
	factory.Verify=function(code,number,cId){
		if (number.startsWith("0")) {
            var res = number.substring(1);
            number="254"+res;
        }
		//data json 
		var data={message:code,mobile:number,username:'thomas',password:'velo@2016',shortcode:'NYOTA-RIDE'};
		var q = $q.defer();
		var someCondtion=true;
		if (someCondtion) {
			/**$http({
				method: 'POST',
				url: 'http://www.csejaysystems.com/sms/smsout.php?message=Verification-Code%20'+code+'.&mobile='+number+'&username=thomas&password=velo@2016&shortcode=NYOTA-RIDE'
			}).**/
			
			factory.sendSMS(number,"Code: " + code + " - Enter the verification code to validate your phone number").success(function (data) {
				//console.log(data);
				factory.showVerifyModal(cId, number, code); 
                q.resolve();
			}).error(function (data) {
				//console.log(number);
				factory.showVerifyModal(cId, number, code); 
				q.reject(data);
			});
		} else {
			q.reject();
		}
		return q.promise;
	};
	//END OF CODE TO SEND OUT THE CODE TO THE PHONE NUMBER
	
	//CODE TO UPDATE STATUS ONCE THE RIGHT CODE IS ENTERED BY CUSTOMER
	factory.updateActivation = function(customer_id, customer_code, phone, code) {
        var q = $q.defer();
		var userRatedCallback = function(success, message) {
            $ionicLoading.hide();
            if(success) {
                if (message==1) {
                    SafePopups.show("show",{
						title: $translate.instant('Nyota Ride'),
						template: $translate.instant("Your phone number was verified successfully"),
						buttons: [{
							text: $translate.instant("OK")
						}]
					});
                }else{
                    SafePopups.show("show",{
						title: $translate.instant('Nyota Ride'),
						template: $translate.instant("The code you entered does not match the one sent to you. Please rectify."),
						buttons: [{
							text: $translate.instant("OK")
						}]
					});
                    factory.showVerifyModal(customer_id,phone, code);  
                }
                q.resolve();
            } else {
				$ionicPopup.alert({
                    title: $translate.instant('Error'),
                    template: $translate.instant(message)
                });
                q.reject([message]);
            }
        };

        $ionicLoading.show({
            template: $translate.instant("Activating") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });
        $http.postForm(
            Url.get(
                "taxiride/mobile_view/setactivation",
                {
                    value_id: factory.value_id,                  
                    customer_id:customer_id,
                    customer_code:customer_code
                }
            ),
            {}
        ).success(function(data) {
      
            if(_.isObject(data) && !!data.success) {
                userRatedCallback(true,data.match);
            } else {
                userRatedCallback(false, "Server response is not correct");
            }
        }).error(function(data) {
            alert("failed 1");
            if(data.message) {
                userRatedCallback(false,data.message);
            } else {
                userRatedCallback(false, "Server response is not correct");
            }
        });
        return q.promise;
    };
	//END OF CODE TO UPDATE STATUS ONCE THE RIGHT CODE IS ENTERED BY CLIENT
	
	
	//====UPDATE GPS LOCATIONS FROM BACKGROUND/FOREGROUND SERVICE====
	factory.updatePoints = function(request_id, coords) {
		try{
			$ionicLoading.show({
				template: $translate.instant("Processing") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
			})
				var _soc = new io.connect(DOMAIN+":"+factory.SocketIO_Port+"/taxiride", { //new io.connect( 'https://nyotaride.com:2222/taxiride', {
				'reconnection': true,
				'reconnectionDelay': 1000,
				'reconnectionDelayMax': 5000,
				'reconnectionAttempts': 30
			});

			_soc.emit('updateDataPaths',{rId: request_id , points: coords, version:2} ); 
			_soc.on('errorUpdating',function(err){
				$ionicLoading.hide();
				factory.updateStatus(factory.current_request, 'finished');
				SafePopups.show("show",{
					title: $translate.instant('Nyota Ride'),
					template: $translate.instant("There was an error: " + err),
					buttons: [{
						text: $translate.instant("OK")
					}]
				});
			});
			_soc.on('updatingSuccess',function(result){
				$ionicLoading.hide();
				factory.updateStatus(factory.current_request, 'finished');
			});

			/**var userRatedCallback = function(success, error_message) {
				$ionicLoading.hide();
				if(success) {
					if (final_price) {
					 // factory.updateStatus(factory.current_request, 'finished', final_price);
					}else{
					  //  factory.updateStatus(factory.current_request, 'finished');
					}
					q.resolve();
				} else {
					SafePopups.show({
						title: $translate.instant('Error'),
						template: $translate.instant(error_message)
					});
					q.reject([error_message]);
				}
			};
			
			SafePopups.show({
				template: $translate.instant("submitting") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
			});
			
			$http.postForm(Url.get("taxiride/mobile_view/updatepoints",{
				value_id: factory.value_id,
				request_id: request_id,
				coords: coords
			}),{}).success(function(data) {
				if(_.isObject(data) && !!data.success) {
					userRatedCallback(true);
				}else{
					userRatedCallback(false, "Server response is not correct");
				}
			}).error(function(data) {
				alert("Submission wasn't successful");
				if(data.message) {
					userRatedCallback(false,data.message);
				} else {
					userRatedCallback(false, "Server response is not correct");
				}
			});**/
		} catch(e) {
			throw e;
		}
	};
					
	//nyota-p set rating factory
    factory.setReqRating = function(request_id, current_rate, comment) {
        var q = $q.defer();

        var userRatedCallback = function(success, error_message) {
            $ionicLoading.hide();
            if(success) {
                   
                //we trigg for all an update of request
               //factory.broadcastRequest(request_id);
              /**$ionicPopup.alert({
                    title: $translate.instant('Nyota Ride'),
                    template: $translate.instant("Thank for using nyota ride")
                });**/
                q.resolve();
            } else {
                
                /**$ionicPopup.alert({
                    title: $translate.instant('Error'),
                    template: $translate.instant(error_message)
                });**/
                q.reject([error_message]);
            }
        };

        $ionicLoading.show({
            template: $translate.instant("Submitting") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });
        $http.postForm(
            Url.get(
                "taxiride/mobile_view/setratings",
                {
                    value_id: factory.value_id,                  
                    request_id: request_id,
                    request_rating: current_rate,
					request_comment: comment,
					request_role: factory.role
                }
            ),
            {}
        ).success(function(data) {
			var activity_log= factory.role + " rated the ride " + current_rate + ". [rid: "+request_id+"]";
			factory.logData(activity_log);
	   
            if(_.isObject(data) && !!data.success) {
                userRatedCallback(true);
            } else {
                userRatedCallback(false, "Server response is not correct");
            }
        }).error(function(data) {
            alert("failed 1");
            if(data.message) {
                userRatedCallback(false,data.message);
            } else {
                userRatedCallback(false, "Server response is not correct");
            }
        });
        return q.promise;
    };

    //nyota p end ratingse factory

    factory.setRideAsPaid = function(request_id) {
        var q = $q.defer();

        var rideIsFinishedAndPaidCallback = function(success, error_message) {
            $ionicLoading.hide();
            if(success) {
                //we trigg for all an update of request
                factory.broadcastRequest(request_id);
                q.resolve();
            } else {
                SafePopups.show("alert",{
                    title: $translate.instant('Error'),
                    template: $translate.instant(error_message)
                });
                q.reject([error_message]);
            }
        };

        $ionicLoading.show({
            template: $translate.instant("Processing") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });
        $http.postForm(
            Url.get(
                "taxiride/mobile_view/setrideaspaid",
                {
                    value_id: factory.value_id,
                    customer_id: +Customer.id,
                    request_id: request_id
                }
            ),
            {}
        ).success(function(data) {
            if(_.isObject(data) && !!data.success) {
                rideIsFinishedAndPaidCallback(true);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        }).error(function(data) {
            if(data.message) {
                rideIsFinishedAndPaidCallback(false,data.message);
            } else {
                rideIsFinishedAndPaidCallback(false, "Server response is not correct");
            }
        });
        return q.promise;
    };


    factory.showCustomFieldsModal = function(no_escape) {
        if(_cf_modal_promise !== null)
            return _cf_modal_promise;

        var q = $q.defer();
        _cf_modal_promise = q.promise;
        var scope = $rootScope.$new();
        scope.no_escape = !!no_escape;
        _cf_modal_success = false;

        scope.$close = function() {
            if(_.isObject(_cf_modal) && _.isFunction(_cf_modal.remove)) {
                _cf_modal.remove();
            }
            //factory.updateCodes(Customer.id);
        };

        scope.$close();

        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/custom-fields-modal.html', {
            scope: scope,
            animation: 'slide-in-up',
            focusFirstInput: true,
            backdropClickToClose: !no_escape,
            hardwareBackButtonClose: !no_escape
        }).then(function(modal) {
            _cf_modal = modal;
            _cf_modal.show();
            var modalEventListeners = [];
            var modalHidden = function(event, modal) {
                if(modal == _cf_modal) {
                    q[(!!_cf_modal_success) ? "resolve" : "reject"]();
                    _.forEach(modalEventListeners, function(f) {
                        _.isFunction(f) && f();
                    });
                    _cf_modal = _cf_modal_promise = null;
                }
            };
            modalEventListeners.push(scope.$on("modal.hidden", modalHidden));
            /**modalEventListeners.push(scope.$on(factory.CUSTOM_FIELDS_MODAL_STATE_UPDATE, function(e, s) { 
            	_cf_modal_success = (s === true);
            }));**/
        });

        return q.promise;
    };

    var history_modal = null;
    var showing_history_modal = false;

    factory.showHistoryModal = function() {
        if(showing_history_modal)
            return;

        showing_history_modal = true;

        var scope = $rootScope.$new();

        scope.$on("modal.hidden", function(e, modal) {
            if(modal === history_modal) {
                showing_history_modal = false;
            }
        });
        scope.$close = function() {
            if(_.isObject(history_modal) && _.isFunction(history_modal.remove)) {
                history_modal.remove();
                history_modal = null;
            }
        };


        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/history-modal.html', {
            scope: scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            history_modal = modal;
            history_modal.show();
        });
    };

    var showing_estimate_modal = false;
    var estimate_modal = null;

    factory.showEstimateModal = function(ride) {
		if(factory.current_request){
			return;
		}
        if(showing_estimate_modal)
            return;

        showing_estimate_modal = true;

        var scope = $rootScope.$new();
        scope.ride = ride;
		scope.original_scope = scope;

        scope.$close = function() {
            if(_.isObject(estimate_modal) && _.isFunction(estimate_modal.remove)) {
                estimate_modal.remove();
                estimate_modal = null;
            }
        };

        scope.$on("modal.hidden", function(e, modal) {
            if(modal === estimate_modal) {
                showing_estimate_modal = false;
            }
        });


        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/estimate-ride-modal.html', {
            scope: scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            estimate_modal = modal;
            estimate_modal.show();
        });
    };
	
	//nyota -p
  var rating_modal = null;
  var showing_rating_modal = false;
  factory.showRatingsModal = function(request_id, ride_price, paymentMethod) {

      if(showing_rating_modal)
          return;

      showing_rating_modal = true;

      var scope = $rootScope.$new();
	  var strPrice = ride_price;
	  var priceInt = strPrice.match(/\d+/)[0];
	  priceInt = priceInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	  var curr = strPrice.match(/\D+/g,'')[0];
	  
	  scope.rideprice = curr + " " + priceInt;
	  scope.role = factory.role;
	  scope.rate_role = "passenger";
	  scope.pay_status = "Paid with cash.";
	  /**if(factory.stripe_available && (factory.payment_methods == 'all' || factory.payment_methods == 'stripe')) {
		  if(_.isObject(factory.payments_settings_data.card) && _.isString(factory.payments_settings_data.card.last4)) {
			  scope.pay_status = "Paid with Card. Don't take cash";
		  }
	  }
	  if(scope.role == "passenger"){
		  scope.rate_role = "driver";
		  scope.pay_status = "Hope you have had a great ride. Pay via cash or MPESA to the driver."
		  if(factory.stripe_available && (factory.payment_methods == 'all' || factory.payment_methods == 'stripe')) {
			  if(_.isObject(factory.payments_settings_data.card) && _.isString(factory.payments_settings_data.card.last4)) {
				  scope.pay_status = "Hope you have had a great ride. Payment processing with your card ongoing.";
			  }
		  }
	  }**/
	  
	  if(paymentMethod == "Cash"){
		  if(scope.role == "passenger"){
			  scope.pay_status = "Pay above amount to driver.";
			  scope.rate_role = "driver";
		  }else{
			  scope.pay_status = "Cash received from passenger.";
		  }
	  }else{
		  if(scope.role == "passenger"){
			  scope.pay_status = "Hope you have had a great ride. Payment processing with your card ongoing.";
			  scope.rate_role = "driver";
		  }else{
			  scope.pay_status = "Amount charged to passenger's card. Don't take cash!";
		  }
	  }
      scope.rating="";
      scope.isReadonly = true;
	  var stars=[0,1,2,3,4,5];
	  scope.stars =stars;
	  scope.name="dfdf";
	  var arr=[2,4,5,6,7,8,0];
	  scope.rater=arr;
	 
	  //updating stars
	  scope.updateStars=function() {
		  scope.rater = [];
		  for (var i = 0; i <5; i++) {
			  scope.rater.push({
				  filled: i < scope.ratingValue
			  });
		  }
	  }
	  //handle star on click
	  scope.toggle = function(index) {
		  scope.ratingValue = index + 1;
	  };
	  
	  //watch for rating value change
	  scope.$watch('ratingValue', function(oldValue, newValue) {
		  scope.updateStars();
	  });
	  //end of the code that controls the stars

      scope.$on("modal.hidden", function(e, modal) {
          if(modal === rating_modal) {
              showing_rating_modal = false;
          }
		  factory.current_request = null;
      });
      scope.$postRating = function(comment) {
          if(_.isObject(rating_modal) && _.isFunction(rating_modal.remove)) {
              rating_modal.remove();
              rating_modal = null;
          }
		  factory.ratingDone = true;
		  factory.current_request = null;
		  //console.log("Comment value: " + comment);
          //send to db;
          factory.setReqRating(request_id, scope.ratingValue, comment);
     
      };

      $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/rating-modal.html', {
          scope: scope,
          animation: 'slide-in-up'
      }).then(function(modal) {
          rating_modal = modal;
          rating_modal.show();
      });
  };


    //UPLOAD DRIVER DOCUMENTS
	var docs_modal = null;
	var showing_docs_modal = false;
	
	var _docs_modal_success = false;
    var _docs_modal_promise = null;

	factory.driverDocs = function (no_escape) {
		if (showing_docs_modal) {
		  return;
		}
		if(_docs_modal_promise !== null)
            return _docs_modal_promise;

        var q = $q.defer();
        _docs_modal_promise = q.promise;

		var scope = $rootScope.$new();
		
		showing_docs_modal = true;
		scope.no_escape = !!no_escape;
		scope.avatar_url = Customer.getAvatarUrl(+Customer.id);

		scope.data = {};
		scope.sliderDelegate;
		scope.data.progressPercentPS = 0;
		scope.data.progressPercentID = 0;
		scope.data.progressPercentDL = 0;
		scope.data.progressPercentPC = 0;
		scope.data.progressPercentPI = 0;
		scope.data.progressPercentNI = 0;
		scope.data.PS=null;
		scope.data.ID=null;
		scope.data.DL=null;
		scope.data.PC=null;
		scope.data.PI=null;
		scope.data.NI=null;
		
		//CODE FOR PASSPORT PHOTO AVATAR
		scope.show_avatar = true;
		scope.avatar_loaded = false;

		scope.hideAvatar = function() {
			scope.show_avatar = false;
		};
		scope.avatarLoaded = function() {
			scope.avatar_loaded = true;
			scope.show_avatar = true;
		};
		
		scope.takePicture = function(field) {
			var gotImage = function(image_url) {
				// TODO: move all picture taking and cropping modal
				// into a dedicated service for consistence against modules
				scope.cropModal = {original: image_url, result: null};

				// DO NOT REMOVE popupShowing !!!
				// img-crop directive doesn't work if it has been loaded off screen
				// We show the popup, then switch popupShowing to true, to add
				// img-crop in the view.
				scope.popupShowing = false;
				$ionicPopup.show({
					template: '<div style="position: absolute" class="cropper"><img-crop ng-if="popupShowing" image="cropModal.original" result-image="cropModal.result" area-type="square" result-image-size="256" result-image-format="image/jpeg" result-image-quality="0.9"></img-crop></div>',
					cssClass: 'avatar-crop',
					scope: scope,
					buttons: [{
					  text: $translate.instant('Cancel'),
					  type: 'button-default',
					  onTap: function(e) {
						  return false;
					  }
					}, {
					  text: $translate.instant('OK'),
					  type: 'button-positive',
					  onTap: function(e) {
						return true;
					  }
					}]
				}).then(function(result) {
					if(result) {
						scope.cropModalCtrl = null;
						scope.data.avatar_url = scope.avatar_url = scope.cropModal.result;
						scope.customer.avatar = scope.cropModal.result;
						scope.customer.delete_avatar = false;
					}
				});
				scope.popupShowing = true;
			};

			var gotError = function(err) {
				// An error occured. Show a message to the user
			};

			if(Application.is_webview) {
				var input = angular.element("<input type='file' accept='image/*'>");
				var selectedFile = function(evt) {
					var file=evt.currentTarget.files[0];
					var reader = new FileReader();
					reader.onload = function (evt) {
						gotImage(evt.target.result);
						input.off("change", selectedFile);
					};
					reader.onerror = gotError;
					reader.readAsDataURL(file);
				};
				input.on("change", selectedFile);
				input[0].click();
			} else {
				var source_type = Camera.PictureSourceType.CAMERA;

				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [
						{ text: $translate.instant("Take a picture") },
						{ text: $translate.instant("Import from Library") }
					],
					cancelText: $translate.instant("Cancel"),
					cancel: function() {
						hideSheet();
					},
					buttonClicked: function(index) {
						if(index == 0) {
							source_type = Camera.PictureSourceType.CAMERA;
						}
						if(index == 1) {
							source_type = Camera.PictureSourceType.PHOTOLIBRARY;
						}

						var options = {
							quality : 90,
							destinationType : Camera.DestinationType.DATA_URL,
							sourceType : source_type,
							encodingType: Camera.EncodingType.JPEG,
							targetWidth: 256,
							targetHeight: 256,
							correctOrientation: true,
							popoverOptions: CameraPopoverOptions,
							saveToPhotoAlbum: false
						};

						$cordovaCamera.getPicture(options).then(function(imageData) {
							gotImage("data:image/jpeg;base64," + imageData);
						}, gotError);

						return true;
					}
				});
			}
		};

    
		//END CODE FOR PASSPORT PHOTO AVATAR
		
		

		scope.$on('closeDetail',function(){
		  scope.$close();

		})

		scope.slideChanged = function(index) {
			//var slides = scope.data.sliderDelegate.slidesCount();
			console.log(scope.sliderDelegate);
			var increment = document.getElementsByClassName('increment')[0];
			increment.style.width = (1+19*index/(2))*5+'%';
		};
		//take photos code
		//camera code
		scope.data.takePhotos = function(dataHolder,prog) {
			var gotImage = function(image_url) {
				scope.cropModal = {original: image_url, result: null};
				scope.popupShowing = false;
				$ionicPopup.show({
					template: '<div style="position: absolute" class="cropper"><img-crop ng-if="popupShowing" image="cropModal.original" result-image="cropModal.result" area-type="square" result-image-size="256" result-image-format="image/jpeg" result-image-quality="0.9"></img-crop></div>',
					cssClass: 'avatar-crop',
					scope: scope,
					buttons: [{
						text: $translate.instant('Cancel'),
						type: 'button-default',
						onTap: function(e) {
							return false;
						}
					}, {
						text: $translate.instant('OK'),
						type: 'button-positive',
						onTap: function(e) {
							return true;
						}
					}]
				}).then(function(result) {
					if(result) {
						//alert("results are");
						scope.cropModalCtrl = null;
						//console.log(scope.cropModal.result)
						//console.log(Customer.id);
						//factory.uploadFile({fileData:scope.cropModal.result},Customer.id);
					}
				});
				scope.popupShowing = true;
			};

			var gotError = function(err) {
			  // An error occured. Show a message to the user
			};
			
			if(false) {
				// we obtain data from input elwment store the data in a scope
				if (prog=="PS") {
				  var input = angular.element("<input id ='ps' type='file' accept='image/*,application/pdf'>");
				}

				if (prog=="ID") {
				  var input = angular.element("<input id ='id' type='file' accept='image/*,application/pdf'>");
				}
				if (prog=="DL") {
				  var input = angular.element("<input id ='dl' type='file' accept='image/*,application/pdf'>");
				}
				if (prog=="PC") {
				  var input = angular.element("<input id ='pc' type='file' accept='image/*,application/pdf'>");
				}

				if (prog=="PI") {
				  var input = angular.element("<input id ='pi' type='file' accept='image/*,application/pdf'>");
				}
				if (prog=="NI") {
					var input = angular.element("<input id ='ni' type='file' accept='image/*,application/pdf'>");
				}

				var selectedFile = function(evt) {
					var file = evt.currentTarget.files[0];
					var reader = new FileReader();
					reader.onprogress = function (evt) {
						//console.log(evt);
						//evt is an ProgressEvent.
						if (evt.lengthComputable) {
							var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
							// Increase the progress bar length.
							if (prog=="PS") {
							  scope.data.progressPercentPS=percentLoaded;
							}

							if (prog=="ID") {
							  scope.data.progressPercentID=percentLoaded;
							}
							if (prog=="DL") {
							  scope.data.progressPercentDL=percentLoaded;
							}
							if (prog=="PC") {
							  scope.data.progressPercentPC=percentLoaded;
							}

							if (prog=="PI") {
							  scope.data.progressPercentPI=percentLoaded;
							}
							if (prog=="NI") {
							  scope.data.progressPercentNI=percentLoaded;
							}
						}
					};
					reader.onload = function (evt) {
						var  dd=evt.target.result;
						//get extension of the file
						var  ext= dd.split(";")[0].split("/")[1];
						// console.log(dd)
						if (prog=="PS") {
							scope.data.PS = dd;
							scope.data.PSex = ext;
						}

						if (prog=="ID") {
							scope.data.ID=dd;
							scope.data.IDex=ext;
						}
						if (prog=="DL") {
							  scope.data.DL=dd;
							  scope.data.DLex=ext;
						}
						if (prog=="PC") {
							  scope.data.PC=dd;
							  scope.data.PCex=ext;
						}

						if (prog=="PI") {
							  scope.data.PI=dd;
							  scope.data.PIex=ext;
						}
						if (prog=="NI") {
							  scope.data.NI=dd;
							  scope.data.NIex=ext;
						}
						//gotImage(evt.target.result);
						input.off("change", selectedFile);
					};
					reader.onerror = gotError;
					reader.readAsDataURL(file);
				};
				input.on("change", selectedFile);
				input[0].click();
			} else {
				// Show the action sheet
				var hideSheet = $ionicActionSheet.show({
					buttons: [
						{ text: $translate.instant("Take a picture") },
						{ text: $translate.instant("Import from Library") }
					],
					cancelText: $translate.instant("Cancel"),
					cancel: function() {
					  hideSheet();
					},
					buttonClicked: function(index) {
						if(index == 1) {
							if (prog=="PS") {
								var input = angular.element("<input id ='ps' type='file' accept='image/*,application/pdf'>");
							}

							if (prog=="ID") {
								var input = angular.element("<input id ='id' type='file' accept='image/*,application/pdf'>");
							}
							if (prog=="DL") {
								var input = angular.element("<input id ='dl' type='file' accept='image/*,application/pdf'>");
							}
							if (prog=="PC") {
								var input = angular.element("<input id ='pc' type='file' accept='image/*,application/pdf'>");
							}
							if (prog=="PI") {
								var input = angular.element("<input id ='pi' type='file' accept='image/*,application/pdf'>");
							}
							if (prog=="NI") {
								var input = angular.element("<input id ='ni' type='file' accept='image/*,application/pdf'>");
							}

							var selectedFile = function(evt) {
								var file = evt.currentTarget.files[0];
								var reader = new FileReader();
								reader.onprogress = function (evt) {
									//  console.log(evt);
									// evt is an ProgressEvent.'
									if (evt.lengthComputable) {
										var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
										if (prog=="PS") {
											scope.data.progressPercentPS=percentLoaded;
										}
										if (prog=="ID") {
											scope.data.progressPercentID=percentLoaded;
										}
										if (prog=="DL") {
											scope.data.progressPercentDL=percentLoaded;
										}
										if (prog=="PC") {
											scope.data.progressPercentPC=percentLoaded;
										}

										if (prog=="PI") {
											scope.data.progressPercentPI=percentLoaded;
										}
										if (prog=="NI") {
											scope.data.progressPercentNI=percentLoaded;
										}
									}
								};
								reader.onload = function (evt) {
									var  dd = evt.target.result;
									//get extension of the file
									var  ext= dd.split(";")[0].split("/")[1];
									if (prog=="PS") {
										scope.data.PS = dd;
										scope.data.PSex=ext;
									}

									if (prog=="ID") {
										  scope.data.ID=dd;
										  scope.data.IDex=ext;
									}
									if (prog=="DL") {
										  scope.data.DL=dd;
										  scope.data.DLex=ext;
									}
									if (prog=="PC") {
										  scope.data.PC=dd;
										  scope.data.PCex=ext;
									}
									if (prog=="PI") {
										  scope.data.PI=dd;
										  scope.data.PIex=ext;
									}
									if (prog=="NI") {
										  scope.data.NI=dd;
										  scope.data.NIex=ext;
									}
									// gotImage(evt.target.result);
									input.off("change", selectedFile);
								};
								reader.onerror = gotError;
								reader.readAsDataURL(file);
							};
							input.on("change", selectedFile);
							input[0].click();
							return true;
						}
						if(index == 0) {

							var source_type = Camera.PictureSourceType.CAMERA;


							var options = {
								quality : 90,
								destinationType : Camera.DestinationType.DATA_URL,
								sourceType : source_type,
								encodingType: Camera.EncodingType.JPEG,
								targetWidth: 256,
								targetHeight: 512,
								correctOrientation: true,
								popoverOptions: CameraPopoverOptions,
								saveToPhotoAlbum: false
							};
							
							$cordovaCamera.getPicture(options).then(function(imageData) {
								//gotImage("data:image/jpeg;base64," + imageData);
								var dd = "data:image/jpeg;base64," + imageData;
								var  ext = dd.split(";")[0].split("/")[1];
								// console.log(dd)
								if (prog=="PS") {
									scope.data.PS=dd;
									scope.data.PSex=ext;
									scope.data.progressPercentPS=100;
								}
								if (prog=="ID") {
									scope.data.ID = dd;
									scope.data.IDex = ext;
									scope.data.progressPercentID = 100;
								}
								if (prog=="DL") {
									scope.data.DL=dd;
									scope.data.DLex=ext;
									scope.data.progressPercentDL=100;
								}
								if (prog=="PC") {
									scope.data.PC=dd;
									scope.data.PCex=ext;
									scope.data.progressPercentPC=100;
								}
								if (prog=="PI") {
									scope.data.PI=dd;
									scope.data.PIex=ext;
									scope.data.progressPercentPI=100;
								}
								if (prog=="NI") {
									scope.data.NI=dd;
									scope.data.NIex=ext;
									scope.data.progressPercentNI=100;
								}
							}, gotError);
							return true;
						}
					}
				});
			}
		};
		
		//end of take photos code

		scope.data.uploadPS=function(){
			scope.data.takePhotos(scope.data.PS,"PS");
		}
		scope.data.uploadID=function(){
			scope.data.takePhotos(scope.data.ID,"ID");
		}
		scope.data.uploadDL=function(){
			scope.data.takePhotos(scope.data.DL,"DL");
		}
		scope.data.uploadPC=function(){
			scope.data.takePhotos(scope.data.PC,"PC");
		}
		scope.data.uploadPI=function(){
			scope.data.takePhotos(scope.data.PI,"PI");
		}
		scope.data.uploadNI=function(){
			scope.data.takePhotos(scope.data.NI,"NI");
		}
		scope.data.uploadFinal=function(){
			$ionicLoading.show({
				template: $translate.instant("Uploading files") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
			});

			factory.uploadFsx({fileDataPS: scope.data.PS, fileDataID: scope.data.ID, fileDataDL: scope.data.DL, fileDataPC: scope.data.PC, fileDataPI: scope.data.PI, fileDataNI: scope.data.NI, fileDataPSex: scope.data.PSex, fileDataIDex: scope.data.IDex, fileDataDLex: scope.data.DLex, fileDataPCex: scope.data.PCex, fileDataPIex: scope.data.PIex, fileDataNIex: scope.data.NIex, avatar: scope.data.avatar_url},Customer.id);
			//scope.$emit(TaxiRide.CUSTOM_FIELDS_MODAL_STATE_UPDATE, true);
			scope.$close();
		}
		
		_docs_modal_promise.finally(function(){
            //stub
        });
        _docs_modal_success = false;
		
		scope.$close = function () {
			if (_.isObject(docs_modal) && _.isFunction(docs_modal.remove)) {
				docs_modal.remove();
				docs_modal = null;
			}
		};
		scope.$on('carsList', function(event, data) {
			scope.$close();
		});
		scope.$on('modal.hidden', function (e, modal) {
			if (modal === docs_modal) {
				showing_docs_modal = false;
			}
		});

		$ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/driverDetail.html', {
			scope: scope,
			animation: 'slide-in-up',
            focusFirstInput: true,
            backdropClickToClose: !no_escape,
            hardwareBackButtonClose: !no_escape
		}).then(function (modal) {
			docs_modal = modal;
			docs_modal.show();
			var modalEventListeners = [];
            var modalHidden = function(event, modal) {
                if(modal == docs_modal) {
                    q[(!!_ps_modal_success) ? "resolve" : "reject"]();
                    _.forEach(modalEventListeners, function(f) {
                        _.isFunction(f) && f();
                    });
                    docs_modal = _docs_modal_promise = null;

                }
            };
            modalEventListeners.push(scope.$on("modal.hidden", modalHidden));
            modalEventListeners.push(scope.$on(factory.CUSTOM_FIELDS_MODAL_STATE_UPDATE, function(e, s) { 
            	_ps_modal_success = (s === true);
            }));
		});
		
		_docs_modal_promise = q.promise;

        return q.promise;
	};
	//END OF DRIVER UPLOAD DOCUMENTS
	
	//FACTORY TO UPLOAD DOCUMENTS
	factory.uploadFsx = function (data,cId) {
		var q = $q.defer();   
		var customer_id =parseInt(Customer.id);
	  
		$ionicLoading.show($translate.instant($translate.instant('Uploading')+'...') + '<br/><br/><ion-spinner class="spinner-custom"></ion-spinner>', {}, true);

		if (_.isNumber(customer_id) && customer_id > 0) {
			if (_.isObject(data)) {
				$http.postForm(
					Url.get(
						'taxiride/mobile_view/loaddoc',
						{
							value_id: factory.value_id,
							customer_id: customer_id
						}
					),
					{
						file_ps: data.fileDataPS,
						file_id: data.fileDataID,
						file_dl: data.fileDataDL,
						file_pc: data.fileDataPC,
						file_pi: data.fileDataPI,
						file_ni: data.fileDataNI,
						file_ps_ex: data.fileDataPSex,
						file_id_ex: data.fileDataIDex,
						file_dl_ex: data.fileDataDLex,
						file_pc_ex: data.fileDataPCex,
						file_pi_ex: data.fileDataPIex,
						file_ni_ex: data.fileDataNIex,
						file_avatar: data.avatar
					}
				).success(function (data) {
					$ionicLoading.hide();
					if (_.isObject(data)) {
						var upl={id:customer_id,paths:data}
					   
						console.log(upl);
						var confirmPopup = $ionicPopup.confirm({
							title: 'Success',
							template: 'Your documents/photos have been uploaded successfully.'
						  });
					   
						  confirmPopup.then(function(res) {
							if(res) {
								$rootScope.$broadcast('closeDetail', "");
								if(factory.firstRegistration){
									factory.addVehicle(true);
									factory.firstRegistration = false;
								}
							} else {
							  console.log('You are not sure');
							}
						  });
						
						q.resolve(_customers[customer_id]);
					} else {
						console.log("data is not a object")
						q.reject(['Unexcepted response :', data]);
					}
				}).error(function (data) {
					$ionicLoading.hide();
					console.log(data);
					if (_.isArray(_.get(data, 'errors'))) {
				  
						q.reject(data);
					} else {
						console.log('requestFailed');
						q.reject(['Request failed', arguments]);
					}
				});
			} else {
				
				console.log('data is not an object');
				q.reject(['data is not an object', null]);
			}
		} else {
			$ionicLoading.hide();
			console.log('customer id is not a number');
			q.reject(['Customer ID is not a number or not superior to 0 ; ', customer_id]);
		}

		return q.promise;
	};
	//END OF FACTORY TO UPLOAD DOCUMENTS


	//add vehicle
    var vehicle_modal = null;
    var showing_vehicle_modal = false;
	
	var _veh_modal_success = false;
    var _veh_modal_promise = null;

    factory.addVehicle = function (no_escape) {
        if (showing_vehicle_modal) {
            return;
        }
		
		var scope = $rootScope.$new();

		showing_vehicle_modal = true;
		scope.no_escape = !!no_escape;

       
        scope.data={};
        scope.sliderDelegate;
        scope.data.progressPercentVI = 0;
        scope.data.progressPercentIR = 0;
        scope.data.progressPercentVL = 0;
         scope.data.VI=null;
         scope.data.IR=null;
         scope.data.IR=null;




       
        scope.slideChanged = function(index) {
         //   var slides = scope.data.sliderDelegate.slidesCount();
            console.log(scope.sliderDelegate);
            var increment = document.getElementsByClassName('increment')[0];
            increment.style.width = (1+19*index/(2))*5+'%';
          };
       //take photos code

             //camera code
             scope.data.takePhotos= function(dataHolder,prog) {
           
                var gotImage = function(image_url) {
                    // TODO: move all picture taking and cropping modal
                    // into a dedicated service for consistence against modules
                    scope.cropModal = {original: image_url, result: null};
        
                    // DO NOT REMOVE popupShowing !!!
                    // img-crop directive doesn't work if it has been loaded off screen
                    // We show the popup, then switch popupShowing to true, to add
                    // img-crop in the view.
                    scope.popupShowing = false;
                    $ionicPopup.show({
                        template: '<div style="position: absolute" class="cropper"><img-crop ng-if="popupShowing" image="cropModal.original" result-image="cropModal.result" area-type="square" result-image-size="256" result-image-format="image/jpeg" result-image-quality="0.9"></img-crop></div>',
                        cssClass: 'avatar-crop',
                        scope: scope,
                        buttons: [{
                          text: $translate.instant('Cancel'),
                          type: 'button-default',
                          onTap: function(e) {
                              return false;
                          }
                        }, {
                          text: $translate.instant('OK'),
                          type: 'button-positive',
                          onTap: function(e) {
                            return true;
                          }
                        }]
                    }).then(function(result) {
                        if(result) {
                          //  alert("results are");
                            scope.cropModalCtrl = null;
                            console.log(scope.cropModal.result)
                            console.log(Customer.id);
    
                          //  factory.uploadFile({fileData:scope.cropModal.result},Customer.id);
                         
                        }
                    });
                    scope.popupShowing = true;
                };
        
                var gotError = function(err) {
                    // An error occured. Show a message to the user
                };
          
        
                if(Application.is_webview) {
                   
                    // we obtain data from input elwment store the data in a scope 
                    if (prog=="VI") {
                        var input = angular.element("<input id ='vi' type='file' accept='image/*,application/pdf'>");                               
                    }

                    if (prog=="IR") {
                        var input = angular.element("<input id ='ir' type='file' accept='image/*,application/pdf'>");                                 
                    }
                    if (prog=="VL") {
                        var input = angular.element("<input id ='vl' type='file' accept='image/*,application/pdf'>");                                  
                    }
                   
                    var selectedFile = function(evt) {
                        var file=evt.currentTarget.files[0];
                        var reader = new FileReader();
                        reader.onprogress = function (evt) {
                          //  console.log(evt);
                            // evt is an ProgressEvent.
                            if (evt.lengthComputable) {
                              var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
                              // Increase the progress bar length.
                             
                              
                                if (prog=="VI") {
                                    scope.data.progressPercentVI=percentLoaded;                                  
                                }

                                if (prog=="IR") {
                                    scope.data.progressPercentIR=percentLoaded;                                    
                                }
                                if (prog=="VL") {
                                    scope.data.progressPercentVL=percentLoaded;                                    
                                }
                           
                                
                            
                            }
                         };
                        reader.onload = function (evt) {
                           
                         var  dd=evt.target.result;
                         //get extension of the file
                      var  ext= dd.split(";")[0].split("/")[1];                         
                               // console.log(dd)
                           if (prog=="VI") {                               
                            scope.data.VI=dd; 
                            scope.data.VIex=ext;
                                                            
                        }

                        if (prog=="IR") {
                            scope.data.IR=dd;   
                            scope.data.IRex=ext;                                 
                        }
                        if (prog=="VL") {
                            scope.data.VL=dd;
                            scope.data.VLex=ext;                                    
                        }
                           // gotImage(evt.target.result);
                            input.off("change", selectedFile);
                        };
                        reader.onerror = gotError;
                        reader.readAsDataURL(file);
                    };
                    input.on("change", selectedFile);
                    input[0].click();
                } else {
                    
                    
        
                    // Show the action sheet
                    var hideSheet = $ionicActionSheet.show({
                        buttons: [
                            { text: $translate.instant("Take a picture") },
                            { text: $translate.instant("Import from Library") }
                        ],
                        cancelText: $translate.instant("Cancel"),
                        cancel: function() {
                            hideSheet();
                        },
                        buttonClicked: function(index) {
                            if(index == 1) {
                               // we obtain data from input elwment store the data in a scope 
                    if (prog=="VI") {
                        var input = angular.element("<input id ='vi' type='file' accept='image/*,application/pdf'>");                               
                    }

                    if (prog=="IR") {
                        var input = angular.element("<input id ='ir' type='file' accept='image/*,application/pdf'>");                                 
                    }
                    if (prog=="VL") {
                        var input = angular.element("<input id ='vl' type='file' accept='image/*,application/pdf'>");                                  
                    }
                   
                    var selectedFile = function(evt) {
                        var file=evt.currentTarget.files[0];
                        var reader = new FileReader();
                        reader.onprogress = function (evt) {
                          //  console.log(evt);
                            // evt is an ProgressEvent.
                            if (evt.lengthComputable) {
                              var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
                                                           
                                if (prog=="VI") {
                                    scope.data.progressPercentVI=percentLoaded;                                  
                                }

                                if (prog=="IR") {
                                    scope.data.progressPercentIR=percentLoaded;                                    
                                }
                                if (prog=="VL") {
                                    scope.data.progressPercentVL=percentLoaded;                                    
                                }
                           
                            }
                         };
                        reader.onload = function (evt) {
                           
                         var  dd=evt.target.result;
                         //get extension of the file
                      var  ext= dd.split(";")[0].split("/")[1];
                         
                           if (prog=="VI") {
                               
                            scope.data.VI=dd; 
                            scope.data.VIex=ext;
                                                            
                        }

                        if (prog=="IR") {
                            scope.data.IR=dd;   
                            scope.data.IRex=ext;                                 
                        }
                        if (prog=="VL") {
                            scope.data.VL=dd;
                            scope.data.VLex=ext;                                    
                        }
                           // gotImage(evt.target.result);
                            input.off("change", selectedFile);
                        };
                        reader.onerror = gotError;
                        reader.readAsDataURL(file);
                    };
                    input.on("change", selectedFile);
                    input[0].click();
                    return true;
                                
                            }
                            if(index == 0) {
                                var source_type = Camera.PictureSourceType.CAMERA;
                            
        
                            var options = {
                                quality : 90,
                                destinationType : Camera.DestinationType.DATA_URL,
                                sourceType : source_type,
                                encodingType: Camera.EncodingType.JPEG,
                                targetWidth: 256,
                                targetHeight: 256,
                                correctOrientation: true,
                                popoverOptions: CameraPopoverOptions,
                                saveToPhotoAlbum: false
                            };
        
                            $cordovaCamera.getPicture(options).then(function(imageData) {
                               // gotImage("data:image/jpeg;base64," + imageData);
                                        var dd="data:image/jpeg;base64," + imageData;
                                var  ext= dd.split(";")[0].split("/")[1];
                         
                                // console.log(dd)
                            if (prog=="VI") {                                
                             scope.data.VI=dd; 
                             scope.data.VIex=ext;
                             scope.data.progressPercentVI=100;
                         }
 
                         if (prog=="IR") {
                             scope.data.IR=dd;   
                             scope.data.IRex=ext;
                             scope.data.progressPercentIR=100;
                         }
                         if (prog=="VL") {
                             scope.data.VL=dd;
                             scope.data.VLex=ext;
                             scope.data.progressPercentVL=100;
                         }
                            
                            }, gotError);                         
       
                            return true;
                        }
                        }
                    });
                }
            };

    

       //end of take photos code
    
       scope.data.uploadVI=function(){
        scope.data.takePhotos(scope.data.VI,"VI");
    }
    scope.data.uploadIR=function(){
        scope.data.takePhotos(scope.data.IR,"IR");
    }
    scope.data.uploadVL=function(){
        scope.data.takePhotos(scope.data.VL,"VL");
    }
    scope.data.uploadFinal=function(){
   
        factory.uploadFs({fileDataVI: scope.data.VI, fileDataIR: scope.data.IR, fileDataVL: scope.data.VL, fileDataVIex: scope.data.VIex, fileDataIRex: scope.data.IRex, fileDataVLex: scope.data.VLex}, Customer.id, scope.data.plateName, scope.data.colorName, scope.data.modelName);
    }
        
		
		scope.$close = function () {
            if (_.isObject(vehicle_modal) && _.isFunction(vehicle_modal.remove)) {
                vehicle_modal.remove();
                vehicle_modal = null;
            }
        };
        scope.$on('carsList', function(event, data) {

            scope.$close();
        });
        scope.$on('modal.hidden', function (e, modal) {
            if (modal === vehicle_modal) {                
                showing_vehicle_modal = false;
            }
        });

        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/addVehicle.html', {
            scope: scope,
            animation: 'slide-in-up',
            focusFirstInput: true,
            backdropClickToClose: !no_escape,
            hardwareBackButtonClose: !no_escape
        }).then(function (modal) {
            vehicle_modal = modal;
            vehicle_modal.show();
        });
    };
  //end of add vehicle
    
    var driver_modal = null;
    var showing_driver_modal = false;

    factory.showDriverWaitingModal = function(request) {
        if(showing_driver_modal)
            return;

        showing_driver_modal = true;

        var scope = $rootScope.$new();
        scope.request = request;
        scope.original_scope = scope;

        scope.$close = function() {
            if(_.isObject(driver_modal) && _.isFunction(driver_modal.remove)) {
                driver_modal.remove();
                driver_modal = null;
            }
        };

        scope.$on("modal.hidden", function(e, modal) {
            if(modal === driver_modal) {
                if(scope.has_launched_request === false) {
                    factory.updateStatus(request, "cancelled-while-waiting");
                }
                showing_driver_modal = false;
            }
        });

        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/driver-waiting-modal.html', {
            scope: scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            driver_modal = modal;
            driver_modal.show();
        });
    };
	
	factory.checkForUpdate = function() {
		$rootScope.unlockUpdate = 5;
		$rootScope.checkForUpdate();
		factory.updateChecked = true;
	};
	
	//replacer
	String.prototype.replaceAll = function(searchStr, replaceStr) {
		var str = this;
		// no match exists in string?
		if(str.indexOf(searchStr) === -1) {
			// return string
			return str;
		}
		// replace and remove first match, and do another recursirve search/replace
		return (str.replace(searchStr, replaceStr)).replaceAll(searchStr, replaceStr);
	}
	//end replacer

	//CHATS DURING RIDES
	var showing_chats_modal = false;
	var chats_modal = null;

	factory.showChatsModal = function (chats) {
		//console.log("factory.showChatsModal.");
		if (showing_chats_modal) {
			return;
		}

		showing_chats_modal = true;
		var scope = $rootScope.$new();
		/**scope.me = {};
		scope.me.avatar=DOMAIN+'/app/local/modules/TaxiRide/resources/media/images/driverpic.jpg';
		scope.you = {};
		scope.you.avatar=DOMAIN+'/app/local/modules/TaxiRide/resources/media/images/pass.jpg';**/ 
		scope.driverImage = Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: factory.current_request.driver_customer_id})) + ("?" +(+new Date()));
		scope.passengerImage = Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: factory.current_request.customer_id})) + ("?" +(+new Date()));
		scope.isDriver = true;
		if (factory.role == "passenger") {
			scope.isDriver = false;
		}

		// show  input
		scope.data = {};
		scope.data.shownbtn = true;
		scope.showInput = function(){
			scope.data.shownbtn=false;
			/**var myTxt = $window.document.getElementById("mytext");
			if(!_.isNull(myTxt)){
				myTxt.focus();
			}
			var myTxt2 = $window.document.querySelector("#txtData");
			if(!_.isNull(myTxt2)){
				myTxt2.focus();
			}**/
		}    
		function formatAMPM(date) {
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var ampm = hours >= 12 ? 'PM' : 'AM';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
			minutes = minutes < 10 ? '0'+minutes : minutes;
			var strTime = hours + ':' + minutes + ' ' + ampm;
			return strTime;
		}            
		scope.data.message="";
		if (factory.role == "passenger") {
			scope.data.role="Message" ;
			scope.data.alias=factory.current_request.driver_first_name;
		}else{
			scope.data.role="Message" ;
			scope.data.alias=factory.current_request.passenger_first_name;
		}
		
		//chart ui code --end
		if (chats!=='') {
			try{
				scope.data.chats=JSON.parse(chats);
			}catch(err){
				scope.data.chats=[];
				//console.log(err);
			}
		}else{
			scope.data.chats=[];
		}
		
		scope.pushMsger=function(){
			//console.log("PushMsger.");
			goOnline(factory.role)().then(function (io) {
				var hideLoading = $timeout(function () {
					$ionicLoading.hide();
				}, 15000);

				var unregisterListener = $rootScope.$on(factory.REQUEST_CHAT, function () {
					// If we received request updated it's okay we can cancel the auto hide, loading has already been hide
					$timeout.cancel(hideLoading);
					unregisterListener();
				});
				
				io.emit('taxiride.chatNew', payload({
					request: factory.current_request
				}));
			});
			
		}
		scope.pushMsg=function(){
			//console.log("PushMsg");
			if (scope.data.chats==null) {
				scope.data.chats=[];
			}
			var chatArray=scope.data.chats;
			var role = factory.role;
			var date = formatAMPM(new Date());
			if (date==null) {
				date="loading";
			}
			chatArray.push({'origin':role,'message':scope.data.message,'date':date});
			scope.data.chats=chatArray;
			try{
				var chatString = JSON.stringify(chatArray);
			}catch(err){
				var chatString="[]";
			}
			
			scope.data.message="";
			scope.data.shownbtn=true;
			
			var q = $q.defer();
			$http({
				method: 'GET',
				url: Url.get('taxiride/mobile_view/loadchat', {
					value_id: +factory.value_id,
					request_id: factory.current_request.id,
					request_chat:chatString
				}),
				cache: false,
				responseType: 'json'
				}).success(function(data) {
					if (_.isObject(data)) {
						if (data.current_request) {
							scope.pushMsger();
							//console.log(data.current_request);
							return q.resolve(data.current_request);
						}
					}
					return q.reject(null);
				}).error(function (data) {
					console.error(data.message);
					return q.reject(data.message);
				});
		
				return q.promise;
				
		}
		scope.$watch(function(scope) { return factory.chats },
		function(newValue, oldValue) {
			if (newValue!==null) {
				 scope.data.chats=newValue;
			}
		});
		scope.$close = function () {
			if (_.isObject(chats_modal) && _.isFunction(chats_modal.remove)) {
				chats_modal.remove();
				chats_modal = null;
			}
		};

		scope.$on('modal.hidden', function (e, modal) {
			if (modal === chats_modal) {
				showing_chats_modal = false;
			}
		});

		scope.$on('modal.shown', function (e, modal) {
			//scroll to last message
			if(!_.isNull(scope.data.chats)){
				var id= scope.data.chats.length-1;
				$location.hash(id);
				$anchorScroll();// inject this in controller($anchorScroll,$location)
			}
		});

		$ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/chats-modal.html', {
			scope: scope,
			animation: 'slide-in-up',
			backdropClickToClose: true,
			hardwareBackButtonClose: true
		}).then(function (modal) {
			chats_modal = modal;
			chats_modal.show();
	 
		});
	};
	
	//NOTIFY USER
	factory.NotifyUser=function(Title,message){
		var params = {
            id: TAXIRIDE_LOCAL_NOTIFICATION_ID, 
            data: {
                taxiride: true
            }
        };

        if (ionic.Platform.isIOS()) {
            params.title = $translate.instant(Title);
        } else {
            params.title = "Nyota Ride";
            params.text = $translate.instant(message);
        }

        if (ionic.Platform.isAndroid()) {
            params.icon = 'res://icon.png';
        }

        params.data = { taxiride: true };

        // Send Local Notification
        
		if (ionic.Platform.isIOS()) {
			$cordovaLocalNotification.schedule(params);
		}else{
			if (_.isFunction(_.get(window, 'plugins.socialsharing.notify'))) {
				window.plugins.socialsharing.notify({text: message, title: Title, request:"no"},"",function(){
					//console.log('Ride request alert')
				},function(error){
					console.log(error)
				});
			}

		}
      
    }

	//end of chats 
	
	factory.generateUrl = function(req){
		var reqId = parseInt(req.id);
		reqId = (reqId *399) + 23;
		var interim = reqId.toString();
		factory.tokkenId = "NYOTA" + interim;
		var  plates = factory.plates;
		var baseUrl = "https://nyotaride.com/var/apps/browser/card.html";
		baseUrl = baseUrl+"?start="+req.pickup_address+"&stop="+req.dropoff_address+"&startlat="+req.pickup_lat+"&startlng="+req.pickup_long+"&stoplat="+req.dropoff_lat+"&stoplng="+req.dropoff_long+"&driver="+req.passenger_name+"&tokken="+factory.tokkenId+"&plates="+plates;
		
		factory.shortUrl(baseUrl);
	}
	
	factory.shortUrl = function(url){
		var req = {
			method: 'POST',
            url: 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDXJG0eCb1zF6BoCAJB7Wc6mMdsswBol_4',
            headers: {
              'Content-Type':'application/json' 
              // or  'Content-Type':'application/json'
            },
            data: { longUrl: url }
		}
		$http(req).then(function(response){
			console.log(response);
			factory.sendMessage(response.data.id);
		}, function(response){
			alert("Url not found");
		});
	};
	
	factory.sendMessage=function(url){
		$cordovaSocialSharing
			.share("Please track my ride in real-time on board Nyota Ride by clicking on the link: " + url, "Share ride details", null, null)
			.then(function(result) {
				// Success!
			}, function(err) {
				alert(err);
			});

    };
	
	//FOR DRIVERS
	/**factory.tracker = function(){
        goOnline(factory.role)().then(function (io) {
            var hideLoading = $timeout(function () {
                $ionicLoading.hide();
            }, 15000);

            var unregisterListener = $rootScope.$on(factory.REQUEST_DETAILS, function () {
                // If we received request updated it's okay we can cancel the auto hide, loading has already been hide
                $timeout.cancel(hideLoading);
                unregisterListener();
            });
            console.log(factory.current_request);
            io.emit('taxiride.trackPass', payload({
                request: factory.current_request,
                driver: Customer
            }));
        });
       
    }**/
	
	//PASSENGERS
	/**factory.trackMe = function(data){
		console.log("trackMe: " + JSON.stringify(data));
		factory.plates = data.customer.customer.metadatas.taxiride.custom_fields.license_number;
	}**/







    Object.defineProperty(factory, "payments_settings_data", {
        get: function() {
            var data = _.get(_customers, "["+Customer.id+"].payments_settings", {});
            if(!_.isObject(data))
                data = {};

            return data;
        }
    });

    factory.arePaymentsSettingsValid = function() {
        return _.get(_customers, "["+Customer.id+"].payments_valid");
    };

    factory.showPaymentsSettingsModal = function(no_escape) {
        if(_ps_modal_promise !== null)
            return _ps_modal_promise;

        var q = $q.defer();
        _ps_modal_promise = q.promise;
        var scope = $rootScope.$new();
        scope.role = factory.role;
        scope.no_escape = !!no_escape;
		if(scope.no_escape){
			factory.needToUploadDocs = true;
			factory.needToAddVehicle = true;
		}
        _ps_modal_promise.finally(function(){
            //stub
        });
        _ps_modal_success = false;

        scope.$close = function() {
			//factory.showingSettings = false;
            if(_.isObject(_ps_modal) && _.isFunction(_ps_modal.remove)) {
                _ps_modal.remove();
            }
			
        };

        scope.$close();

        $ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/payments-settings-modal.html', {
            scope: scope,
            animation: 'slide-in-up',
            focusFirstInput: true,
            backdropClickToClose: !no_escape,
            hardwareBackButtonClose: !no_escape
        }).then(function(modal) {
            _ps_modal = modal;
            _ps_modal.show();
            var modalEventListeners = [];
            var modalHidden = function(event, modal) {
                if(modal == _ps_modal) {
                    q[(!!_ps_modal_success) ? "resolve" : "reject"]();
                    _.forEach(modalEventListeners, function(f) {
                        _.isFunction(f) && f();
                    });
                    _ps_modal = _ps_modal_promise = null;

                }
            };
            modalEventListeners.push(scope.$on("modal.hidden", modalHidden));
            modalEventListeners.push(scope.$on(factory.CUSTOM_FIELDS_MODAL_STATE_UPDATE, function(e, s) { 
            	_ps_modal_success = (s === true);
            }));
        });

        _ps_modal_promise = q.promise;

        return q.promise;
    };

    factory.infosForCustomer = function(clearCache) {
        var q = $q.defer();

        var customer_id = +Customer.id;
        if(_.isNumber(customer_id) && customer_id  > 0) {
            $http({
                method: 'GET',
                url: Url.get("taxiride/mobile_view/infosforcustomer", {value_id: factory.value_id, customer_id: customer_id}),
                cache: (clearCache !== true),
                responseType:'json'
            }).success(function(data) {
                if(_.isObject(data) && !_.isUndefined(data.role)) {
                    _customers[customer_id] = data;
                    q.resolve(_customers[customer_id]);
                } else {
                    q.reject(["Unexcepted response :", data]);
                }
            }).error(function(data) {
                if(_.isArray(_.get(data, "errors")))
                    q.reject(data);
                else
                    q.reject(["Request failed", arguments]);
            });
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    factory.roleForCustomer = function() {
        var q = $q.defer();

        factory.infosForCustomer().then(function(customer_infos) {
            q.resolve(customer_infos.role);
        }, q.reject);

        return q.promise;
    };

    factory.setRoleForCustomer = function(role) {
        var q = $q.defer();

        var customer_id = +Customer.id;
        if(_.isNumber(customer_id) && customer_id > 0) {
            $http({
                method: 'GET',
                url: Url.get("taxiride/mobile_view/setroleforcustomer", {value_id: factory.value_id, customer_id: customer_id, role: role}),
                responseType:'json'
            }).success(function(data) {
                if(_.isObject(data) && _.isString(data.role)) {
                    _customers[customer_id] = data;
                    q.resolve(_customers[customer_id].role);
                } else {
                    q.reject(["Unexcepted response :", data]);
                }
            }).error(function(data) {
                if(_.isArray(_.get(data, "errors")))
                    q.reject(data);
                else
                    q.reject(["Request failed", arguments]);
            });
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };
    
    //save data in db:
    factory.saveVehicle = function(specs){
    	$ionicLoading.show($translate.instant($translate.instant('Saving')+'...') + '<br/><br/><ion-spinner class="spinner-custom"></ion-spinner>', {}, true);
		var _soc = new io.connect(DOMAIN+":"+factory.SocketIO_Port+"/taxiride", { 
		    'reconnection': true,
		    'reconnectionDelay': 1000,
		    'reconnectionDelayMax': 5000,
		    'reconnectionAttempts': 30
    	});
    		
    	_soc.emit('driver.saveVehicle',{id: Customer.id, specs: specs} );
    	
    	_soc.on('connected',function(res){
    	
    	});
    	
    	_soc.on('driver.carList',function(result){
        	$rootScope.$broadcast('carsList', result);
        	$ionicLoading.hide();
    		_soc.disconnect();
    	});
    	
    	_soc.on('errorUpdating',function(result){
    		$ionicPopup.alert({
            	title: $translate.instant('Something went wrong'),
            	template: $translate.instant(result)
	        });
	        $ionicLoading.hide();
	    	_soc.disconnect();
	    });
    }
    //custom uploadfiles

    //get the cars
    factory.getCars=function(){
        $socket().then(function (io) {
        	io.emit('driver.getCars',payload({
                id: Customer.id               
            }));
        });
    }
    // of get cars
    factory.uploadFs = function (data,cId,name,color,model) {
        var q = $q.defer();
        console.log("data: " + data + ", color: " + color);
		if(color == undefined || color == "" || color == "undefined" || color == null){
			color = "#ffffff";
		}
        var customer_id = parseInt(Customer.id);
        //console.log(data);
        $ionicLoading.show($translate.instant($translate.instant('Uploading')+'...') + '<br/><br/><ion-spinner class="spinner-custom"></ion-spinner>', {}, true);

        if (_.isNumber(customer_id) && customer_id > 0) {
            if (_.isObject(data)) {
                $http.postForm(
                    Url.get(
                        'taxiride/mobile_view/loadfile',
                        {
                            value_id: factory.value_id,
                            customer_id: customer_id
                        }
                    ),
                    {
                        file_vi: data.fileDataVI,
                        file_ir: data.fileDataIR,
                        file_vl: data.fileDataVL,
                        file_vi_ex: data.fileDataVIex,
                        file_ir_ex: data.fileDataIRex,
                        file_vl_ex: data.fileDataVLex,
                        car_name: name
                    }
                ).success(function (data) {
                   
                    if (_.isObject(data)) {
                        var upl={id: customer_id, name: name, color: color, model: model, paths: data}
                        console.log("Success posting. Lets saveVehicle now: " + upl);
                        factory.saveVehicle(upl);
                        
                        q.resolve(_customers[customer_id]);
                    } else {
                        console.log("Success but data is not a object")
                        q.reject(['Unexcepted response :', data]);
                    }
                }).error(function (data) {
                    $ionicLoading.hide();
                    console.log("Error posting: " + data);
                    if (_.isArray(_.get(data, 'errors'))) {
                        q.reject(data);
                    } else {
                        console.log('requestFailed');
                        q.reject(['Request failed', arguments]);
                    }
                });
            } else {
                
                console.log('data is not an object');
                q.reject(['data is not an object', null]);
            }
        } else {
            $ionicLoading.hide();
            console.log('customer id is not a number');
            q.reject(['Customer ID is not a number or not superior to 0 ; ', customer_id]);
        }

        return q.promise;
    };

    factory.saveCustomerCustomFields = function(data) {
        var q = $q.defer();

        var customer_id = +Customer.id;

        if(_.isNumber(customer_id) && customer_id > 0) {
            if(_.isObject(data)) {
                $http.postForm(
                    Url.get(
                        "taxiride/mobile_view/setinfosforcustomer",
                        {
                            value_id: factory.value_id,
                            customer_id: customer_id
                        }
                    ),
                    {custom_fields: data}
                ).success(function(data) {
                    if(_.isObject(data) && !!data.success) {
                        _customers[customer_id] = data.customer;
                        q.resolve(_customers[customer_id]);
						//factory.updateCodes(Customer.id);
                    } else {
                        q.reject(["Unexcepted response :", data]);
                    }
                }).error(function(data) {
                    if(_.isArray(_.get(data, "errors")))
                        q.reject(data);
                    else
                        q.reject(["Request failed", arguments]);
                });
            } else {
                q.reject(["data is not an object", null]);
            }
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    factory.removeCustomerPaymentCard = function() {
        var q = $q.defer();

        var customer_id = +Customer.id;

        if(_.isNumber(customer_id) && customer_id > 0) {
            $ionicLoading.show({
                template: $translate.instant("Removing card") + "..." + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
            });
            $http.postForm(
                Url.get(
                    "taxiride/mobile_view/removecustomerpaymentcard",
                    {
                        value_id: factory.value_id,
                        customer_id: customer_id
                    },
                    {}
                )
            ).success(function(data) {
                $ionicLoading.hide();
                if(_.isObject(data) && !!data.success) {
                    q.resolve(_customers[customer_id]);
                } else {
                    q.reject(["Unexcepted response :", data]);
                }
            }).error(function(data) {
                $ionicLoading.hide();
                if(_.isArray(_.get(data, "errors")))
                    q.reject(data);
                else
                    q.reject(["Request failed", arguments]);
            });
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    factory.savePaymentsSettingsFields = function(data) {
        var q = $q.defer();

        var customer_id = +Customer.id;

        if(_.isNumber(customer_id) && customer_id > 0) {
            if(_.isObject(data)) {
                $ionicLoading.show({
                    template: $translate.instant($translate.instant("Saving")+"...") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
                });
                $http.postForm(
                    Url.get(
                        "taxiride/mobile_view/setpaymentssettingsforcustomer",
                        {
                            value_id: factory.value_id,
                            customer_id: customer_id
                        }
                    ),
                    {payments_settings: data}
                ).success(function(data) {
                    $ionicLoading.hide();
                    if(_.isObject(data) && !!data.success) {
                        _customers[customer_id] = data.customer;
                        q.resolve(_customers[customer_id]);
                    } else {
                        q.reject(["Unexcepted response :", data]);
                    }
                }).error(function(data) {
                    $ionicLoading.hide();
                    if(_.isArray(_.get(data, "errors")))
                        q.reject(data);
                    else
                        q.reject(["Request failed", arguments]);
                });
            } else {
                q.reject(["data is not an object", null]);
            }
        } else {
            q.reject(["Customer ID is not a number or not superior to 0 ; ", customer_id]);
        }

        return q.promise;
    };

    var _loaded = false;

    Object.defineProperty(factory, "loaded", {
        get: function() {
            return _loaded;
        }
    });

    var _feature_data = {};

    factory.getVehiculeTypes = function(clear_cache) {
        var q = $q.defer();

        if(_.isArray(_feature_data.vehicule_types) && clear_cache !== true) {
            q.resolve(_feature_data.vehicule_types);
        } else {
            factory.load(clear_cache).then(function(data) {
                q.resolve(data.vehicule_types);
            }, q.reject);
        }

        return q.promise;
    };

    factory.getRequestHistory = function(role) {
        var customer_id = +Customer.id;

        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getrequesthistoryforcustomer", {customer_id: customer_id, role: role}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.getRequestTodayHistory = function(role, day, month, year) {
        var customer_id = +Customer.id;

        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/gettodayrides", {customer_id: customer_id, role: role, day: day, month: month, year: year}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.getStats = function(repType, weekOrDay, month, year) {
        var customer_id = +Customer.id;

        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getstats", {role: factory.role, customer_id: customer_id, rep_type: repType, weekorday: weekOrDay, month: month, year: year}),
            cache: false,
            responseType:'json'
        });
    };
    
    factory.getCustReferrals = function() {
        var customer_id = +Customer.id;
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getcustreferrals", {customer_id: customer_id}),
            cache: false,
            responseType:'json'
        });
    };
    
    factory.awardReferrer = function(phone) {
    	return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/awardreferrer", {phone: phone}),
            cache: false,
            responseType:'json'
        });
    }
	
	factory.getCustMessages = function(locLat, locLng) {
        var customer_id = +Customer.id;
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getcustmessages", {value_id: factory.value_id, customer_id: customer_id, lat: locLat, lng: locLng}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.markMessagesAsRead = function(locLat, locLng) {
        var customer_id = +Customer.id;
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/markasread", {value_id: factory.value_id, customer_id: customer_id, lat: locLat, lng: locLng}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.messageCustomer = function(title, message) {
        var customer_id = +Customer.id;
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/messagecustomer", {value_id: factory.value_id, customer_id: customer_id, message: message, title: title}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.sendSMS = function(phone, message) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/smsme", {value_id: factory.value_id, number: phone, message: message}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.getCity = function(locLat, locLng) {
        var customer_id = +Customer.id;
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getcity", {value_id: factory.value_id, customer_id: customer_id, lat: locLat, lng: locLng}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.storeReferral = function(phone) {
        var customer_id = +Customer.id;
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/storereferral", {customer_id: customer_id, phone: phone}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.getTopDestinations = function() {
        var customer_id = +Customer.id;

        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/gettopdestinations", {customer_id: customer_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.getDriversAroundLocation = function(lat, lng, type_id) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getestimation", {lat: lat, lng: lng, value_id: factory.value_id, type_id: type_id}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.getTopDriversAroundLocation = function(lat, lng, type_id) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/gettopdriversaround", {lat: lat, lng: lng, value_id: factory.value_id, type_id: type_id}),
            cache: false,
            responseType:'json'
        });
    };
	
	factory.getMetaForCustomer = function(customer_id, field){
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getcustomermetadata", {customer_id: customer_id, field: field}),
            cache: false,
            responseType:'json'
        });
	};
	
	factory.getImageUrl = function(customerID) {
        return Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: customerID})) + ("?" +(+new Date()));
    };
	
	factory.formattedNumber = function(number, decimalPlaces) {
        return $filter('number')(number, decimalPlaces);
    };

    factory.load = function(clear_cache) {
		//console.log("7. factory load");
        var q = $q.defer();

        if(_loaded && clear_cache !== true) {
            q.resolve(_feature_data);
        } else {
            if(_.isNumber(+factory.value_id) && +factory.value_id > 0) {
                $http({
                    method: 'GET',
                    url: Url.get("taxiride/mobile_view/load", {
                        'value_id': +factory.value_id,
                        "customer_id":Customer.id,
                    }),
                    cache: clear_cache !== true,
                    responseType:'json'
                }).success(function(data) {
                    if(_.isObject(data) && _.isString(data.page_title)) {
                        _feature_data = data;
                        _loaded = true;
                        q.resolve(_feature_data);
                    } else {
                        q.reject(["Unexcepted response :", data]);
                    }
                }).error(function(data) {
                    if(_.isArray(_.get(data, "errors")))
                        q.reject(data);
                    else
                        q.reject(["Request failed", arguments]);
                });
            } else {
                q.reject(["Value ID is not a number or not superior to 0 ; ", factory.value_id]);
            }
        }

        return q.promise;
    };

    factory.restoreCurrentRequest = function() {
        var q = $q.defer();
		try{

			$http({
				method: 'GET',
				url: Url.get("taxiride/mobile_view/getcurrentrequest", {
					value_id: +factory.value_id,
					customer_id: Customer.id
				}),
				cache: false,
				responseType:'json'
			}).success(function(data) {
				if(_.isObject(data)) {
					if(data.current_request > 0) {
						//driversMap[+data.request.driver_customer_id] = driver;
						factory.requestUpdated(data.current_request);
						return q.resolve(data.current_request);
					}
				}
				return q.reject(null);
			}).error(function(data) {
				console.error(data);
				return q.reject(data);
			});
		} catch(e) {
			throw e;
		}

        return q.promise;
    };


    factory.newChat = function(request_id) {
        $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/getrequest", {value_id: factory.value_id, request_id: request_id}),
            cache: false,
            responseType:'json'
        }).success(function(data) {
            if(_.isObject(data) && _.isObject(data.request)) {
                var isMyRequest = (+data.request.driver_customer_id === +Customer.id) || (+data.request.customer_id === +Customer.id);
				//CHATS
				//console.log("Check if there is a new chat.");
				if(!_.isNull(data.request.taxiride_chat)){
					if (data.request.taxiride_chat !=='') {
						try{
							var chatJson= JSON.parse(data.request.taxiride_chat);
							factory.chats=chatJson;
							var sender=chatJson[chatJson.length-1].origin;
							var message=chatJson[chatJson.length-1].message;
							if (factory.role==='driver') {
								if (sender=='passenger') {
									factory.showChatsModal(data.request.taxiride_chat);
									factory.NotifyUser("New message",message);
								}
							}else{
								if (sender=='driver') {
									factory.showChatsModal(data.request.taxiride_chat);  
									factory.NotifyUser("New message",message);
								}
							}
						}catch(err){
							//console.log(err);
						}
					}
				}
			}
		}).error(function() {
            console.error("failed chat loading");
        }).finally(function() {
            $ionicLoading.hide();

            //$rootScope.$broadcast(factory.REQUEST_CHAT);
        });
	}
	
	var showing_compare_modal = false;
	var compare_modal = null;

	factory.showCompareModal = function (drivers, result) {
		if (showing_compare_modal) {
			return;
		}

		showing_compare_modal = true;

		var scope = $rootScope.$new();
		scope.data={};
		scope.data.drivers = drivers;
		
		scope.data.driver = result.lowestRate;
		scope.data.lowerDrivers = result.numberLower;
		scope.data.switcher = true;
		//scope.data.firstname=Customer.customer.firstname;
	   
	   scope.close=function(){
		   scope.$close();
	   }
	   scope.seeLowest=function(){
		   scope.data.switcher=false;
	   }
	   
		scope.$close = function () {
			if (_.isObject(compare_modal) && _.isFunction(compare_modal.remove)) {
				compare_modal.remove();
				compare_modal = null;
			}
		};

		scope.$on('modal.hidden', function (e, modal) {
			if (modal === compare_modal) {
				showing_compare_modal = false;
			}
		});

		$ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/driver-compare-modal.html', {
			scope: scope,
			animation: 'slide-in-up',
			backdropClickToClose: true,
			hardwareBackButtonClose: true
		}).then(function (modal) {
			compare_modal = modal;
			compare_modal.show();
		});
	};
	
	var showing_invite_modal = false;
	var invite_modal = null;

	factory.showInviteModal = function (result) {
		if (showing_invite_modal) {
			return;
		}

		showing_invite_modal = true;

		var scope = $rootScope.$new();
		scope.data={};
		scope.data.isDriver = (factory.role === 'driver');
		
		scope.data.driverBonus = result.driverBonus;
		scope.data.passBonus = result.passBonus;
		factory.getCustReferrals().success(function(data) {
			scope.data.refferedNumbers = data;
		});
		//scope.data.firstname=Customer.customer.firstname;
	   
	   scope.close=function(){
		   scope.$close();
	   }
	   
	   scope.numberValid = false;
	   scope.showInvitedMessage = false;
	   scope.showAlreadyInvitedMessage = false;
	   scope.theValidNumber = "";
	   scope.checkValidity = function(numberString){
	   	   //This is for Kenya but we need to handle multiple countries
	   	   scope.showInvitedMessage = false;
	   	   scope.showAlreadyInvitedMessage = false
	   	   if (numberString.startsWith("0") && !numberString.match(/[^\d]/) && numberString.length == 10) {
	            var res = numberString.substring(1);
	            scope.theValidNumber = "254" + res;
	            scope.numberValid = true;
	       }else{
	       	   scope.numberValid = false;
	       }
	       ;
	       _.forEach(scope.data.refferedNumbers, function(refNum) {
	       	   console.log("refNum.phone_number: " + refNum.phone_number + ", scope.theValidNumber: " + scope.theValidNumber);
	       	   if(refNum.phone_number == scope.theValidNumber){
	       	   	   scope.numberValid = false;
	       	   	   scope.showAlreadyInvitedMessage = true;
	       	   	   return false;
	       	   }
	       });
	   }
	   scope.sendInvite = function(){ 
	   	   
		   //send out an sms and add to invite adatabase
		   var q = $q.defer();
		   var message = factory.firstName + " has invited you to download Nyota Ride given its advanced features than any other taxi app. Download on Android or Apple store" ; //. Android: https://goo.gl/xRQWFy Apple: https://goo.gl/qbP2AC" 
		   /**$http({
				method: 'POST',
				url: "http://www.csejaysystems.com/sms/smsout.php?message=" + message + ".&mobile=" + scope.theValidNumber + "&username=thomas&password=velo@2016&shortcode=NYOTA-RIDE"
			})**/
			
			factory.sendSMS(scope.theValidNumber,message).success(function (data) {
                q.resolve();
                //scope.phoneNumber = "Invite message sent.";
				console.log("Message sent successfully");
				scope.showInvitedMessage = true;
				factory.storeReferral(scope.theValidNumber).success(function(data) {
					factory.getCustReferrals().success(function(data1) {
						scope.data.refferedNumbers = data1;
					});
				});
				
				scope.numberValid = false;
			}).error(function (data) {
				q.reject(data);
				//scope.phoneNumber = "Try later!";
			});
	   }
	   
		scope.$close = function () {
			if (_.isObject(invite_modal) && _.isFunction(invite_modal.remove)) {
				invite_modal.remove();
				invite_modal = null;
			}
		};

		scope.$on('modal.hidden', function (e, modal) {
			if (modal === invite_modal) {
				showing_invite_modal = false;
			}
		});

		$ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/invite.html', {
			scope: scope,
			animation: 'slide-in-up',
			backdropClickToClose: true,
			hardwareBackButtonClose: true
		}).then(function (modal) {
			invite_modal = modal;
			invite_modal.show();
		});
	};
	
	factory.getDriverStatus = function () {
		var today = new Date();
		var d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
		d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
		var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
		theWeek = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
		theMonth = today.getMonth() + 1;
		theYear = today.getFullYear();
		
		//START WITH GETTING TODAYS STATISTICS
        $http({
            method: 'GET',
            url: Url.get('taxiride/mobile_view/getdriverstatus', {customer_id: Customer.id, rep_type: "today", weekorday: today.getDate(), month: theMonth, year: theYear}),
            cache: false,
            responseType: 'json'
        }).then(function(dataDay){
			$http({
				method: 'GET',
				url: Url.get('taxiride/mobile_view/getdriverstatus', {customer_id: Customer.id, rep_type: "week", weekorday: theWeek, month: theMonth, year: theYear}),
				cache: false,
				responseType: 'json'
			}).then(function(dataWeek){
				factory.showDriverStatus(dataDay, dataWeek);
			});
		});
    };
	
	var showing_status_modal = false;
	var status_modal = null;

	factory.showDriverStatus = function(dataDay, dataWeek) {
		if (showing_status_modal) {
			return;
		}

		showing_status_modal = true;

		var scope = $rootScope.$new();
		scope.dataDay = {};
		scope.dataWeek = {};
		scope.dataDay = dataDay.data[0];
		scope.dataWeek = dataWeek.data[0];
		console.log("scope.dataDay: " + JSON.stringify(scope.dataDay));
		console.log("scope.dataWeek: " + JSON.stringify(scope.dataWeek));
		//console.log("scope.dataWeek.outstanding: " + scope.dataWeek.outstanding + ", scope.dataWeek[0].outstanding: " + scope.dataWeek[0].outstanding );
		scope.driverRating = $filter('number')(parseFloat(scope.dataDay.rating), 2);
		scope.dayCollections = $filter('number')(parseFloat(scope.dataDay.collected), 2);
		scope.weekCollections = $filter('number')(parseFloat(scope.dataWeek.collected), 2);
		scope.bonus = $filter('number')(parseFloat(scope.dataDay.bonus), 2);
		
		if(scope.bonus > 0){
			scope.amountNet = $filter('number')(parseFloat(scope.dataWeek.outstanding) + parseFloat(scope.dataWeek.netamount) - parseFloat(scope.bonus), 2);
			scope.remit = $filter('number')(parseFloat(scope.dataWeek.outstanding) - parseFloat(scope.bonus), 2);
		}else{
			scope.amountNet = $filter('number')(parseFloat(scope.dataWeek.outstanding) + parseFloat(scope.dataWeek.netamount), 2);
			scope.remit = $filter('number')(parseFloat(scope.dataWeek.outstanding), 2);
		}
		
		if(parseFloat(scope.remit) > 0){
			scope.toNyota = true;
		}else{
			scope.toNyota = false;
			scope.remit = scope.remit * -1;
		}
		//scope.data.firstname=Customer.customer.firstname;
	   
	   scope.close=function(){
		   scope.$close();
	   }
	   
		scope.$close = function () {
			if (_.isObject(status_modal) && _.isFunction(status_modal.remove)) {
				status_modal.remove();
				status_modal = null;
			}
		};

		scope.$on('modal.hidden', function (e, modal) {
			if (modal === status_modal) {
				showing_status_modal = false;
			}
		});

		$ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/driver-status-modal.html', {
			scope: scope,
			animation: 'slide-in-up',
			backdropClickToClose: true,
			hardwareBackButtonClose: true
		}).then(function (modal) {
			status_modal = modal;
			status_modal.show();
		});
	};
	
	factory.getAllDriversAroundLocation = function (pos, type_id, taxiride_id) {
        if (!type_id) {
           type_id=1; 
        }
        if (!taxiride_id) {
           taxiride_id=1; 
        }//defaults only
		
		$http({
            method: 'GET',
            url: Url.get('taxiride/mobile_view/getalldriversaround', {
                lat: pos.latitude,
                lng: pos.longitude, 
                value_id: factory.value_id,
                type_id:type_id,
                taxiride_id:taxiride_id
			}),
            cache: false,
            responseType: 'json'
        }).then(function(data){
			//console.log(JSON.stringify(data.data));
			var driverLen = data.data.drivers.length;
            if (data.data && driverLen > 0) {
				//get the current 
				var toRemove = null;
				var currentTaxiRide=null;
				for (var index = 0; index < driverLen; index++) {
					//console.log("Loop to find self: " + index);
					var element = data.data.drivers[index];
					if (element.customer_id == Customer.id) {
						currentTaxiRide = element;
						toRemove = index;
					}					
				}
				if(toRemove !== null){data.data.drivers.splice(toRemove,1);}
				driverLen = data.data.drivers.length;
				//console.log(driverLen);
				var comparativeDifference = 0;
				var lowestTaxiRide = null;
				var numberLower = 0;
				
				var currentRate = (parseFloat(currentTaxiRide.distance_fare) * 5) + (parseFloat(currentTaxiRide.time_fare) * 20) + parseFloat(currentTaxiRide.base_fare); 
				
				//console.log("YOUR rate: " + currentRate + ", drivers length: " + driverLen);
				if (driverLen > 0) {
					//console.log("Here 1");
					for (var index = 0; index < driverLen; index++){
						//console.log("Here 2 - " + index);
						var thisDriver = data.data.drivers[index];
						//simulate 5k and 20 mins
						var taxiRideRate =  (parseFloat(thisDriver.distance_fare) * 5) + (parseFloat(thisDriver.time_fare) * 20) + parseFloat(thisDriver.base_fare);
						//console.log("Driver: " + index + " RATE: " + taxiRideRate);
						var currentDifference = currentRate - taxiRideRate;
						if (currentDifference > comparativeDifference){
							comparativeDifference = currentDifference;
							lowestTaxiRide = thisDriver;
							numberLower++;
						}
					}
				}
				var result={lowestRate: lowestTaxiRide, numberLower: numberLower};
				factory.showCompareModal(data.data.drivers, result);
			}
		});
    };
	
	
	factory.getTollCharges = function (request_id){
		return $http({
			method: 'GET',
			url: Url.get('taxiride/mobile_view/gettollcharges', {
				value_id: factory.value_id,
				requestID: request_id
			}),
			cache: false,
			responseType: 'json'
		});
		
		/**var tollChargeLine = "";
		$http({
			method: 'GET',
			url: Url.get('taxiride/mobile_view/gettollcharges', {
				value_id: factory.value_id,
				requestID: request_id
			}),
			cache: false,
			responseType: 'json'
		}).success(function(data){
			//console.log("Tollcharges data: " + JSON.stringify(data));
			if(_.isObject(data)) {
				for (var index = 0; index < data.length; index++){
					console.log("Toll: " + data[index].description + ", charge: " + parseFloat(data[index].charge));
					tollChargeLine += '<div class="row">';
					tollChargeLine += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> '+ data[index].description +'</div>';
					tollChargeLine += '    <div class="col col-50-right">Ksh '+ $filter('number')(parseFloat(data[index].charge), 2) +'</div>';
					tollChargeLine += '</div>';
				}
			}
			console.log("Success line: " +  tollChargeLine);
			return tollChargeLine;
		}).error(function(data) {
            console.error(data);
            return tollChargeLine;
        });**/
	};
	
	factory.processExtraCharges = function (request_id) {
		var q = $q.defer();
        //GET ALL TOLL STATIONS 40KM AROUND DRIVERS CURRENT LOCATION
		$http({
            method: 'GET',
            url: Url.get('taxiride/mobile_view/gettollstationsnearby', {
                lat: factory.current_request.dropoff_lat,
                lng: factory.current_request.dropoff_long, 
                value_id: factory.value_id
			}),
            cache: false,
            responseType: 'json'
        }).then(function(data){
            //if (data && data.tollstations.length>0) {
			//console.log("Tollstations data: " + JSON.stringify(data.data));
			if(_.isObject(data) && _.isObject(data.data.tollstations)) {
				//console.log(data.data.tollstations);
				//LOOP THROUGH THE TOLL STATIONS AND ESTABLISH IF THEY FALL WITHIN THE CURRENT REQUEST ROUTE. IF SO, ADD TO taxiride_tollcharges. Update final_price
				for (var index = 0; index < data.data.tollstations.length; index++){
					//console.log("Toll: " + data.data.tollstations[index].description + ", Lat: " + parseFloat(data.data.tollstations[index].lat) + ", Lng: " + parseFloat(data.data.tollstations[index].lng));
					//var tollPosition = new google.maps.LatLng(Number(data.data.tollstations[index].lat), Number(data.data.tollstations[index].lng));
					var tollPosition = new google.maps.LatLng({lat: Number(data.data.tollstations[index].lat), lng: Number(data.data.tollstations[index].lng)});
					//console.log("tollPosition: " + JSON.stringify(tollPosition));
					var all_points = JSON.parse(factory.current_request.path_points);
					if(all_points.length >0){
						all_points = _.compact(_.sortBy(all_points, "t").map(function(p) {
							return (_.isObject(p) && _.isArray(p.l) && _.isNumber(p.t)) ?
								p : null;
						}));
						var result = [];
						for(var x = 0; x < all_points.length; x++) {
							var point = all_points[x];
							if(_.isObject(point) && _.isArray(point.l)){
								point = point.l;
							}
							var lat = point[0];
							var lng = point[1];
							result.push({lat: Number(lat), lng: Number(lng) });
						}
						//all_points = result.map(function(p) { return p.l; })
						//console.log("Filtered points: " + JSON.stringify(result));
						//var cascadiaFault = new google.maps.Polyline({path: all_points});
						var decodedPolyline = new google.maps.Polyline({path:result});
						//console.log("DecodedPoly: " + JSON.stringify(decodedPolyline));
						if (google.maps.geometry.poly.isLocationOnEdge(tollPosition, decodedPolyline, Number(data.data.tollstations[index].tolerance))) {
							//THE PATH CROSSED THE TOLL STATION - UPDATE FINAL PRICE, STATUS, INSERT TOLL CHARGE
							//console.log("Adding charge: " + data.data.tollstations[index].charge);
							$http({
								method: 'GET',
								url: Url.get('taxiride/mobile_view/addTollPrice', {
									value_id: factory.value_id,
									request_id: request_id,
									toll_price: parseFloat(data.data.tollstations[index].charge),
									toll_id: data.data.tollstations[index].id
								}),
								cache: false,
								responseType: 'json'
							}).then(function(datar) {
								//console.log("AddTollPrice - " + JSON.stringify(datar));
								
								//return q.reject(null);
							});
							
						}else{
							//console.log("Toll doesn't apply");
						}
					}
				}
			}
			
		}).then(function(){
			//THERE ARE NO TOLL STATIONS APPLICABLE. FINISH THE RIDE
			$http({
				method: 'GET',
				url: Url.get('taxiride/mobile_view/setrideasfinished', {
					value_id: factory.value_id,
					request_id: request_id
				}),
				cache: false,
				responseType: 'json'
			}).success(function(d) {
				//console.log("Success setrideasfinished - " + d);
				factory.requestUpdated(request_id);
				//return q.reject(null);
			}).error(function(e) {
				console.error("Error setrideasfinished - " + e);
				factory.requestUpdated(request_id);
				//return q.reject(e);
			});
		});
		return q.promise;
    };
	
	var showing_meter_modal = false;
	var meter_modal = null;

	factory.showMeterModal = function () {
		try{
			if (showing_meter_modal) {
				return;
			}

			showing_meter_modal = true;

			var scope = $rootScope.$new();
			scope.data = {};
			scope.data.distanceCovered = factory.distance;
			
			var timeStr = "";
			var timeFromDriver = factory.time;
			var duration_h = parseInt(timeFromDriver / (60 * 60), 10);
			timeFromDriver -= duration_h * (60 * 60);

			var duration_m = parseInt(timeFromDriver / (60), 10);
			timeFromDriver -= duration_m * (60);
			duration_m = ((duration_m < 10) ? '0' + duration_m : duration_m);
			//var duration_s = ((duration < 10) ? '0' + duration : duration);
			// var dur = duration_h + 'h' + duration_m + 'm' + duration_s + 's';
			scope.data.timeElapsed = duration_h + ' hrs ' + duration_m + ' mins';
			
			//console.log(factory.current_request);
			if(_.isObject(factory.current_request)) {
				scope.data.driver_time_fare = factory.current_request.driver_time_fare;
				scope.data.driver_distance_fare = factory.current_request.driver_distance_fare;
				scope.data.driver_bare_fare = factory.current_request.driver_base_fare;
			}
			scope.data.totalPrice = 0.00;
		  
			var getTime=function(timeString){
				var ts =  timeString.replaceAll('hrs ',"**").replaceAll('mins',"");
				var arr = ts.split('**');
				var hrs = parseInt(arr[0]);
				var mins = parseInt(arr[1]);
				var totalTime = (hrs*60)+mins;
				//console.log(totalTime);
				return totalTime;
			}
			
			scope.$watch(function(scope) { 
				return factory.time },
				function(newValue, oldValue) {
					if (true) {
						if (newValue!==null && oldValue!==null) {
							var distance=  parseFloat(factory.distance).toFixed(2);
							//console.log(distance);
							scope.data.distanceCovered = distance;
							timeFromDriver = factory.time;
							duration_h = parseInt(timeFromDriver / (60 * 60), 10);
							timeFromDriver -= duration_h * (60 * 60);
							duration_m = parseInt(timeFromDriver / (60), 10);
							timeFromDriver -= duration_m * (60);
							var timeX = parseFloat(duration_m) + parseFloat(duration_h * 60);//getTime(factory.time);
							
							duration_m = ((duration_m < 10) ? '0' + duration_m : duration_m);
							scope.data.timeElapsed = duration_h + ' hrs ' + duration_m + ' mins';
							if(_.isObject(factory.current_request)) {
								var distanceFare = parseFloat(factory.current_request.driver_distance_fare.replaceAll("Ksh","")); 
								//console.log(factory.current_request.driver_distance_fare.replaceAll("Ksh",""));
								var timeFare = parseFloat(factory.current_request.driver_time_fare.replaceAll("Ksh","")); 
								var baseFare = parseFloat(factory.current_request.driver_base_fare.replaceAll("Ksh",""));
							}
							//console.log(timeFare);
							var totalFare = (distance * distanceFare) + (timeX * timeFare) + baseFare;
							//console.log("distance: " + distance + ", distanceFare: " + distanceFare + ", timeX: " + timeX + ", timeFare: " + timeFare + ", baseFare: " + baseFare);
							scope.data.totalPrice = $filter('number')(totalFare,2);
							//console.log("updated");
						}
					}
				}
			);
			
			
			scope.$close = function () {
				if (_.isObject(meter_modal) && _.isFunction(meter_modal.remove)) {
					meter_modal.remove();
					meter_modal = null;
				}
			};

			scope.$on('modal.hidden', function (e, modal) {
				if (modal === meter_modal) {
					showing_meter_modal = false;
				}
			});

			$ionicModal.fromTemplateUrl('modules/taxi_ride/templates/l1/meter-modal.html', {
				scope: scope,
				animation: 'slide-in-up',
				backdropClickToClose: true,
				hardwareBackButtonClose: true
			}).then(function (modal) {
				meter_modal = modal;
				meter_modal.show();
			});
		} catch(e) {
			throw e;
		}
	};
	
	factory.newdetails = function(sendback) {
		try{
			if(_.isObject(factory.current_request)) {
				var request_id = sendback.id;
				var details = sendback.details;
				if (factory.current_request.id === request_id) {
					//if (factory.role === 'passenger') {
						//factory.distance = details.distance;
						//factory.time = details.time;
					//}
				}
			}
		} catch(e) {
			throw e;
		}
	};
	
	
	factory.positionListener = function(tok,rtime){
		factory.time = null;
		factory.distance = 0;
		
		var _soc = new io.connect(DOMAIN+":"+factory.SocketIO_Port+"/taxiride", {
		 'reconnection': true,
		 'reconnectionDelay': 1000,
		 'reconnectionDelayMax': 5000,
		 'reconnectionAttempts': 30
		});
		
		_soc.on(tok, function(data){
			factory.distance = data.l[3]; 
			data.t = Math.floor(data.t/1000);
			var time = data.t-rtime;
			factory.time = time;
		});
	};
	
	factory.sayHello=function(distance, time){
		try{
			goOnline(factory.role)().then(function (io) {
				var hideLoading = $timeout(function () {
					$ionicLoading.hide();
				}, 15000);

				var unregisterListener = $rootScope.$on(factory.REQUEST_DETAILS, function () {
					// If we received request updated it's okay we can cancel the auto hide, loading has already been hide
					$timeout.cancel(hideLoading);
					unregisterListener();
				});
				
				io.emit('taxiride.detailsNew', payload({
					request: factory.current_request,
					details: {distance: distance, time: time}
				}));
			});
		} catch(e) {
			throw e;
		}
    };
	
	factory.logData = function(activity_log){
		/**$socket().then(function(io){
			io.emit('taxiride.log',payload({
				cid: +Customer.id,
				activity: activity_log
			}));
		});**/
		
		var customer_id = +Customer.id;
		return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/logdata", {value_id: factory.value_id, customer_id: customer_id, message: activity_log}),
            cache: false,
            responseType:'json'
        });
	};
	
	factory.distCovered=0;
	var currentPoint = null;
    factory.getPointsTimeDistance=function(point1, point2){
		try{
			//console.log("point1: " + JSON.stringify(point1) + ", point2: " + JSON.stringify(point2));
			if (currentPoint == null){
				currentPoint = point1;
			}else if(_.isEmpty(point1.coords)){
				point1 = currentPoint;
			}
			//console.log("point1 - Rectified: " + JSON.stringify(point1) + ", point2: " + JSON.stringify(point2));
			var time_difference = function(t1,t2){
				var duration = t1 - t2;
				var duration_h = parseInt(duration / (60 * 60), 10);
				duration -= duration_h * (60 * 60);

				var duration_m = parseInt(duration / (60), 10);
				duration -= duration_m * (60);
				duration_m = ((duration_m < 10) ? '0'+duration_m : duration_m);

				var duration_s = ((duration < 10) ? '0'+duration : duration);

				// var dur = duration_h + 'h' + duration_m + 'm' + duration_s + 's';
				var dur = duration_h + 'hrs ' + duration_m + 'mins';
				return dur;
			}
			var deg2rad = function(deg) {
			  return deg * (Math.PI/180);
			}
			
			var distance_between_points = function (point1, point2) {
				var lat1 = point1.coords.latitude, lon1 = point1.coords.longitude,
					lat2 = point2.coords.latitude, lon2 = point2.coords.longitude;
				var R = 6371; // Radius of the earth in km
				  var dLat = deg2rad(lat2-lat1);  // deg2rad below
				  var dLon = deg2rad(lon2-lon1); 
				  var a = 
					Math.sin(dLat/2) * Math.sin(dLat/2) +
					Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
					Math.sin(dLon/2) * Math.sin(dLon/2); 
				  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
				  var d = R * c; // Distance in km
				  return d;
				
				/**var lat1 = point1.coords.latitude, lon1 = point1.coords.longitude,
					lat2 = point2.coords.latitude, lon2 = point2.coords.longitude;
				if(_.isEmpty(point1.coords) || _.isEmpty(point2.coords)){
					//console.log("Point1 empty: " + _.isEmpty(point1.coords) + ", Point2 empty: " + _.isEmpty(point2.coords));
					//return 0;
				}
		
				var p = 0.017453292519943295;    // Math.PI / 180!
				var c = Math.cos;
				var a = 0.5 - c((lat2 - lat1) * p)/2 +
					c(lat1 * p) * c(lat2 * p) *
					(1 - c((lon2 - lon1) * p))/2;
		
				return 12742 * Math.asin(Math.sqrt(a)); **/// 2 * R; R = 6371 km
			};
			
			/**var speed_between_points = function (point1, point2) {
				var distance = distance_between_points(point1, point2); // in meters
				var time = (parseInt(point2.timestamp) - parseInt(factory.current_request.started_at))/1000; // in seconds
				var speed = (distance/time); // speed in m/s
				return speed*3.6; // speed in km/h
			};**/
			
			var MAX_SPEED = 200;
			var INCOHERENCE_AGGRESSIVITY = 2.5;
			//var ia = (5-Math.min(Math.max(INCOHERENCE_AGGRESSIVITY, 0), 5));
			
			var diff = distance_between_points(point1,point2); //Kilometers
			var diffMeters = diff * 1000; //meters
			//var speed = speed_between_points(point1,point2);
			
			
			var started_at = parseInt(factory.current_request.started_at);
			//console.log("point2.timestamp: " + point2.timestamp);
			//var currentTimeStamp=parseInt(point2.timestamp.toString().substring(0,10));
			//var timediff2 = time_difference(currentTimeStamp - started_at);
			//var tdiff = time_difference(currentTimeStamp, started_at);
			var point2TimeInSecs = parseInt(point2.timestamp/1000);
			var timeDiff = point2TimeInSecs - parseFloat(factory.current_request.started_at); //currentTimeStamp - started_at;
			var timeBetweenPoints = point2TimeInSecs - parseFloat(point1.timestamp/1000);  //seconds
			//console.log(tdiff);
			//var timeElapsed = (currentTimeStamp - started_at)/60;
			//var speed = diff/timediff2;
			var speed = (diffMeters/timeBetweenPoints); // speed in m/s
			speed = speed * 3.6; // speed in km/h
			//console.log("diffMeters: " + diffMeters + ", timeDiff: " + timeDiff + ", timeBetweenPoints: " + timeBetweenPoints + ", Speed: " + speed);
			if (diff > 0 && speed <= MAX_SPEED) {// && !_.isEmpty(point2.coords)) {
				factory.distCovered = factory.distCovered + diff;
				currentPoint = point2;
			}
			//console.log("distCovered: " + factory.distCovered.toFixed(3) + ", timeElapsed: " + timeDiff);
			//console.log("____________________________");
			//if(point2.coords !== {}){
				factory.sayHello(factory.distCovered.toFixed(3), timeDiff); //tdiff);
			//}
		} catch(e) {
			throw e;
		}
	};
	
	//upload the total to db:
	factory.setWaiting = function(request_id, waiting_price) {
		$http.postForm(
			Url.get(
			"taxiride/mobile_view/setwaiting",
			{
				value_id: factory.value_id,
				request_id: request_id,
				request_price: waiting_price,
			}
			),
			{}
		).error(function(data) {
			alert("failed to record");
		});
	};

	
	var _finish_popup = null;
    var MAX_RETRY = 3;
    factory.requestUpdated = function(request_id, retry_count) {
		try{
			var retrying = false;
			retry_count = +retry_count || 0;
			//console.log("5. - factory.requestUpdated. request_id: " + request_id + ", retry_count: " + retry_count);

			$http({
				method: 'GET',
				url: Url.get("taxiride/mobile_view/getrequest", {value_id: factory.value_id, request_id: request_id}),
				cache: false,
				responseType:'json'
			}).success(function(data) {
				if(_.isObject(data) && _.isObject(data.request)) {
					var isMyRequest = (+data.request.driver_customer_id === +Customer.id) || (+data.request.customer_id === +Customer.id);
					//console.log("6. Request Status: " + data.request.status + ", Is MyRequest?: " + isMyRequest + ", Request Customer: " + data.request.customer_id + ", Customer: " + Customer.id + ", Driver: " + data.request.driver_customer_id);
					if(data.request.status == 'searching' || data.request.status == 'requesting' || data.request.status == 'accepted' || data.request.status == 'going'){
					//if(/^(searching|requesting|accepted|going)$/.test(data.request.status)) {
						//set request as current request for passenger AND driver
						if (isMyRequest) {
							factory.current_request = data.request;
							//console.log("7. Current Driver - " + data.request.driver_customer_id);
							if(data.request.status == 'accepted' || data.request.status == 'going'){
								// Reset driversMaps for passenger to only show current driver
								
								if(+data.request.customer_id === +Customer.id) {
									driversMap = _.pick(driversMap, +data.request.driver_customer_id);// || {};

									$rootScope.$broadcast(factory.MAP_EVENTS.DRIVERS_MAP_UPDATED, driversMap);
								}
							}
							if(!factory.hasNotifiedTripStarted && data.request.status == 'going' && factory.role === 'passenger'){
								factory.NotifyUser("You are on your way!", "Enjoy your ride. Remember to ask the driver for the extra facilities they might have on board!");
								factory.hasNotifiedTripStarted = true;
							}
						}

						//waiting_confirm_for_request is only for drivers waiting confirmation of request by client
						if(waiting_confirm_for_request) {
							//if we are the chosen one
							var template = "";
							if (+data.request.driver_customer_id === +Customer.id) {
								template = $translate.instant('Passenger selected you as a driver at ' + data.request.driver_base_fare + " base and " + data.request.driver_distance_fare + " per kilometer and " + data.request.driver_time_fare + " per minute rate for this ride.");
							//forever alone...
							} else {
								template = $translate.instant('Passenger accepted another driver whose base price was ' + data.request.driver_base_fare + " and is charging " + data.request.driver_distance_fare + " per kilometer and " + data.request.driver_time_fare + " per minute waiting charge.");
								
								SafePopups.show("alert",{
									title: $translate.instant('Passenger picked another driver'),
									template: template
								});
							}
							/**SafePopups.show("alert",{
								title: $translate.instant('Request'),
								template: template
							});**/
							
							sendLocalOtherNotification(template);
						}
					}

					//if request has been cancelled by passenger OR driver
					//console.log("Check if trip cancelled.");
					if((data.request.status == "driver-cancelled" && factory.role === "passenger") || (data.request.status == "passenger-cancelled" && factory.role === "driver")|| (data.request.status == "cancelled-while-waiting" && factory.role === "driver")) {
						SafePopups.show("alert",{
							title: $translate.instant('Request'),
							template: $translate.instant("Request has been cancelled.")
						});
						factory.current_request = null;
						sendLocalOtherNotification("Ride request has been cancelled");
					}else if(data.request.status == "driver-cancelled" || data.request.status == "passenger-cancelled"|| data.request.status == "cancelled-while-waiting" ){
						factory.current_request = null;
					}
					
					
					if(data.request.status == "finishing-charges" && isMyRequest) {
						if (factory.role === 'driver') {
							factory.processExtraCharges(request_id);
						}else{
							factory.requestUpdated(request_id);
						}
					}
					


					//if driver set request as finised
					//console.log("Check if trip finished.");
					if(data.request.status == "finished" && isMyRequest) {
						//console.log("Payment?: " + data.request.payment_status);
						factory.distance = null;
						factory.time = null;
						if(data.request.payment_status === "unpaid") {
							if (factory.role === 'driver') {
								var buttons = [{
										//text: $translate.instant('No Cash Received')
										text: $translate.instant('Complete'),
										type: 'button-assertive',
										onTap: function(e) {
											factory.setRideAsPaid(request_id);
											var collectAmount = data.request.final_price_num;
											if(data.request.outstanding > 0){
												collectAmount = parseFloat(collectAmount) + parseFloat(data.request.outstanding);
											}
											if(data.request.discount > 0){
												if(collectAmount <= data.request.discount){
													collectAmount = 0;
												}else{
													collectAmount = parseFloat(collectAmount) - parseFloat(data.request.discount);
												}
											}
											if(collectAmount < 0){collectAmount = 0;}
											collectAmount = "Ksh " + collectAmount;
											factory.showRatingsModal(data.request.taxiride_request_id, collectAmount, data.request.payment_method);
											factory.ratingDone == true;
										}
									}];
							}else{
								var buttons = [{
										text: $translate.instant('Ok'),
										type: 'button-assertive',
										onTap: function(e) {
											factory.requestUpdated(request_id);
										}
									}];
							}
							if(factory.role === "driver") {
								/**buttons.push({
									text: $translate.instant('Complete'),
									type: 'button-assertive',
									onTap: function(e) {
										factory.setRideAsPaid(request_id);
										factory.showRatingsModal(data.request.taxiride_request_id, data.request.price, data.request.payment_method);
										/**SafePopups.show("confirm",{
											title: $translate.instant('Confirmation'),
											template: $translate.instant("I confirm that the passenger has paid for the ride by cash or mobile money?")
										}).then(function(res){
											if(res) {
												factory.setRideAsPaid(request_id);
											} else {
												factory.requestUpdated(request_id);
											}
										});
									}
								});**/
							} else if(factory.role === "passenger") {
								if(factory.stripe_available && (factory.payment_methods == 'all' || factory.payment_methods == 'stripe')) {
									if(_.isObject(factory.payments_settings_data.card) && _.isString(factory.payments_settings_data.card.last4)) {
										factory.pay(request_id);
									} else {
										factory.requestUpdated(request_id);
										
									}
									/**buttons.push({
										text: $translate.instant('Pay by card'),
										type: 'button-assertive',
										onTap: function(e) {
											if(_.isObject(factory.payments_settings_data.card) && _.isString(factory.payments_settings_data.card.last4)) {
												SafePopups.show("confirm",{
													title: $translate.instant('Confirmation'),
													template: $translate.instant("Do you confirm you want to pay by card?")
												}).then(function(res){
													if(res) {
														factory.pay(request_id);
													} else {
														factory.requestUpdated(request_id);
													}
												});
												factory.pay(request_id);
											} else {
												SafePopups.show("confirm",{
													title: $translate.instant('No card set'),
													template: $translate.instant("You do not have any card configurated. Go to settings?")
												}).then(function(res){
													if(res) {
														factory.showPaymentsSettingsModal();
													} else {
														factory.requestUpdated(request_id);
													}
												});
												factory.requestUpdated(request_id);
											}
										}
									});**/
								}else{
									//console.log("requestUpdated 1");
									factory.requestUpdated(request_id);
								}
								if(factory.tco_available && (factory.payment_methods == 'all' || factory.payment_methods == '2co')) {
									buttons.push({
										text: $translate.instant('Pay by card'),
										type: 'button-assertive',
										onTap: function (e) {
											$state.go("taxi_ride-tco", {
												"value_id": factory.value_id,
												"request_id": request_id
											});
										}
									});
								}
							}
							if(isFinite(data.request.ended_at - data.request.started_at)) {
								
								var duration = data.request.ended_at - data.request.started_at;
								var duration_h = parseInt(duration / (60 * 60));
								duration -= duration_h * (60 * 60);

								var duration_m = parseInt(duration / (60));
								duration -= duration_m * (60);
								duration_m = ((duration_m < 10) ? "0"+duration_m : duration_m);

								var duration_s = ((duration < 10) ? "0"+duration : duration);

								var dur = duration_h + 'h' + duration_m + 'm' + duration_s + 's';
							} else {
								var duration = $translate.instant('n/a');
							}
							var distance = (data.request.final_distance/1000) * (factory.distance_unit === "km" ? 1 : 0.621371);//$filter('number')(((data.request.final_distance/1000)* (factory.distance_unit === "km" ? 1 : 0.621371)), 2);
							
							var distanceCharged = $filter('number')((data.request.driver_distance_fare_num * distance),2);
							var timeCharged = $filter('number')(data.request.driver_time_fare_num * Math.floor((data.request.ended_at - data.request.started_at) / (60)),2);
							
							var waiting_time = localStorage.getItem('waiting_time');

							if(waiting_time){
								//remove items from storage
								localStorage.removeItem('waiting_time');
								var diffMins = waiting_time;
								var total_waiting = data.request.waiting_charge * diffMins;
							} else {
								var total_waiting = 0;
							}
							
							// set in request:
							factory.setWaiting(data.request.id, total_waiting);
							
							//GET TOLL CHARGES IF ANY
							//if(data.request.final_price_num > data.request.price_num){
								//THERE ARE TOLL CHARGES
								//console.log("Tollcharge RequestID: " + request_id + ", Value ID: " + factory.value_id);
								//factory.getTollCharges(request_id);
							//}
							
							var collectAmount = data.request.final_price_num;
							collectAmount += total_waiting;  //add to final total
							var deniString = "";
							if(data.request.outstanding > 0){
								deniString += '<div class="row">';
								deniString += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> ' + $translate.instant('Previously Unpaid') + '</div>';
								deniString += '    <div class="col col-50-right">' + $filter('number')(parseFloat(data.request.outstanding), 2) + '</div>';
								deniString += '</div>';
								
								collectAmount = parseFloat(collectAmount) + parseFloat(data.request.outstanding);
							}
							
							var discountString = "";
							if(data.request.discount > 0){
								discountString += '<div class="row">';
								discountString += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> ' + data.request.discount_description + '</div>';
								discountString += '    <div class="col col-50-right">' + $filter('number')(parseFloat(data.request.discount), 2) + '</div>';
								discountString += '</div>';
								if(collectAmount <= data.request.discount){
									collectAmount = 0;
								}else{
									collectAmount = parseFloat(collectAmount) - parseFloat(data.request.discount);
								}
							}

							var template = '<div textAlign="center">';
							template += '<p style="color:red;font-size: 34px;font-weight: 500;padding: 10px;" align="center"> Ksh '+ $filter('number')(parseFloat(collectAmount), 2) + '</p>';
							if(data.request.payment_method == "Cash"){
								template += '<p style="color:red;font-size: 16px;padding: 10px;" align="center">Collect above amount from passenger.</p>';
							}else{
								template += '<p style="color:red;font-size: 16px;padding: 10px;" align="center">DO NOT COLLECT CASH. Card Charged!</p>';
							}
							template += '</div>';
							template += '<hr />';
							if(data.request.final_path_points !== null || data.request.final_path_points !== ""){
								//var escPathPoints = data.request.final_path_points.replace(/\\/g, "\\\\");  str_replace("\\", "\\\\", 
								var escPathPoints = data.request.final_path_points;//.replace("\\", "\\\\");
								template += '<img width="100%" src="https://maps.googleapis.com/maps/api/staticmap?size=500x200&path=weight:2%7Ccolor:red%7Cenc:' + escPathPoints + '" border="0">';
								//console.log('<img width="100%" src="https://maps.googleapis.com/maps/api/staticmap?size=500x200&path=weight:5%7Ccolor:red%7Cenc:' + escPathPoints + '" border="0">');
							}
							template += '<hr />';
							template += '<div class="row">';
							template += '    <div class="col col-50"><i class="icon ion-ios-time-outline"></i> '+$translate.instant('Date')+'</div>';
							template += '    <div class="col col-50-right">'+data.request.created_at_formatted+'</div>';
							template += '</div>';
							template += '<div class="row">';
							template += '    <div class="col col-50"><i class="icon ion-ios-stopwatch-outline"></i> '+$translate.instant('Duration')+'</div>';
							template += '    <div class="col col-50-right">'+dur+'</div>';
							template += '</div>';
							template += '<div class="row">';
							template += '    <div class="col col-50"><i class="icon ion-ios-navigate-outline"></i> '+$translate.instant('Distance')+'</div>';
							template += '    <div class="col col-50-right">'+distance+' '+factory.distance_unit+'</div>';
							template += '</div>';
							template += '<hr />';
							template += '<div class="row">';
							template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> '+$translate.instant('Base Fare')+'</div>';
							template += '    <div class="col col-50-right">'+data.request.driver_base_fare+'</div>';
							template += '</div>';

							if(_.isString(data.request.driver_time_fare) && data.request.driver_time_fare.trim().length > 0)
							{
								template += '<div class="row">';
								template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> '+$translate.instant('Time Charge')+'</div>';
								template += '    <div class="col col-50-right">Ksh ' + timeCharged +'</div>'; // +data.request.driver_time_fare+'</div>';
								template += '</div>';
							} //else {
							
							if(_.isString(data.request.driver_distance_fare) && data.request.driver_distance_fare.trim().length > 0)
							{
								template += '<div class="row">';
								template += '    <div class="col col-50"><i class = "icon ion-social-usd-outline"></i> '+$translate.instant('Distance Fare')+'</div>';
								template += '    <div class="col col-50-right">Ksh ' + distanceCharged  +'</div>';// +data.request.driver_distance_fare+'</div>';
								template += '</div>';
							}
							
							if(_.isString(data.request.waiting_charge) && data.request.driver_time_fare.trim().length > 0)
							{
								template += '<div class="row">';
								template += '    <div class="col col-50"><i class = "icon ion-social-usd-outline"></i> '+$translate.instant('Waiting Charge')+'</div>';
								template += '    <div class="col col-50-right">Ksh '+ total_waiting +'</div>'; // +data.request.driver_time_fare+'</div>';
								template += '</div>';
							}
							template += deniString;
							template += discountString;
							 
							//template += '<hr />'; 
							
							//if(tollChargeLine !== ""){
							//	template += tollChargeLine;
							//}

							var lastLine = '<hr /><div class="row">';
							lastLine += '    <strong class="col col-50"><i class="icon ion-ios-calculator-outline"></i> '+$translate.instant('Total Ride Price')+'</strong>';
							lastLine += '    <strong class="col col-50-right">'+data.request.price+'</strong>';
							lastLine += '</div>';
							
							

							var totalTollAmount = 0;
							if(factory.role === "driver") {
								factory.getTollCharges(request_id).success(function(dataToll) {
									if(_.isObject(dataToll)) {
										if(dataToll.length > 0){ template += '<hr />';}
										for (var index = 0; index < dataToll.length; index++){
											//console.log("Toll: " + dataToll[index].description + ", charge: " + parseFloat(dataToll[index].charge));
											template += '<div class="row">';
											template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> '+ dataToll[index].description +'</div>';
											template += '    <div class="col col-50-right">Ksh '+ $filter('number')(parseFloat(dataToll[index].charge), 2) +'</div>';
											template += '</div>';
											totalTollAmount = totalTollAmount + parseFloat(dataToll[index].charge);
										}
									}
									totalTollAmount = parseFloat(totalTollAmount) + parseFloat(data.request.driver_base_fare.replaceAll("Ksh","")) + parseFloat(distanceCharged) + parseFloat(timeCharged);// + parseFloat(data.request.price_num);
									//console.log("totalTollAmount: " + totalTollAmount + ", price_num: " + data.request.price_num + ", final_price_num: " + data.request.final_price_num);
									if (parseFloat(totalTollAmount) > parseFloat(data.request.final_price_num)){
										totalTollAmount = $filter('number')(parseFloat(parseFloat(totalTollAmount) - parseFloat(data.request.final_price_num)), 2);
										template += '<div class="row">';
										template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> Round Off</div>';
										template += '    <div class="col col-50-right">Ksh '+ totalTollAmount +'</div>';
										template += '</div>';
									}
									_finish_popup = SafePopups.show("show",{
										title: $translate.instant('Ride finished'),
										cssClass: "taxiride",
										template: template + lastLine,
										buttons: buttons
									});
									factory.current_request = data.request;
								}).error(function(dataError) {
									if (parseFloat(data.request.price_num) > parseFloat(data.request.final_price_num)){
										var disc = $filter('number')((parseFloat(data.request.price_num) - parseFloat(data.request.final_price_num)), 2);
										template += '<div class="row">';
										template += '    <div class="col col-50"><i class="icon ion-social-usd-outline"></i> Round Off</div>';
										template += '    <div class="col col-50-right">Ksh '+ disc +'</div>';
										template += '</div>';
									}
									_finish_popup = SafePopups.show("show",{
										title: $translate.instant('Ride finished'),
										cssClass: "taxiride",
										template: template + lastLine,
										buttons: buttons
									});
									factory.current_request = data.request;
								});
							}else{
								//console.log("factory.ratingDone: " + factory.ratingDone);
								var collectAmount = data.request.final_price_num;
								if(data.request.outstanding > 0){
									collectAmount = parseFloat(collectAmount) + parseFloat(data.request.outstanding);
								}
								if(data.request.discount > 0){
									if(collectAmount <= data.request.discount){
										collectAmount = 0;
									}else{
										collectAmount = parseFloat(collectAmount) - parseFloat(data.request.discount);
									}
								}
								if(collectAmount < 0){collectAmount = 0;}
								//collectAmount = "Ksh " + $filter('number')(parseFloat(collectAmount), 2);
								collectAmount = "Ksh " + collectAmount;
								if(factory.ratingDone == false){
									factory.showRatingsModal(data.request.taxiride_request_id, collectAmount, data.request.payment_method);
									factory.ratingDone = true;
									factory.NotifyUser("Ride ended! Pay " + collectAmount + " to the driver", "You ride ended. Pay " + collectAmount + " to the driver. Please remember to rate your driver so we can retain only the best in our fleet");
								}
								factory.current_request = null;
							}
							
							
						} else if (data.request.payment_status === "paid"){
							/**if (_.isObject(_finish_popup) && _.isFunction(_finish_popup.close)) {
								_finish_popup.close();
								_finish_popup = null;
							}**/
							if(_.isObject(estimate_modal) && _.isFunction(estimate_modal.remove)) {
								estimate_modal.remove();
								estimate_modal = null;
							}

							//if(factory.role === "passenger") {
								/**SafePopups.show("show",{
									title: $translate.instant('Arrived safely!'),
									template: $translate.instant("Hope you enjoyed your ride. Choose Nyota Ride again!"),
									buttons: [{
										text: $translate.instant("OK")
									}]
								});
								if(factory.role === "driver") {
									factory.showRatingsModal(data.request.taxiride_request_id, data.request.price, data.request.payment_method);
								}**/
							//}
							factory.current_request = null;
						}
					}
				}
			}).error(function() {
				if(retry_count >= MAX_RETRY) {
					SafePopups.show("alert",{
						title: $translate.instant('Error'),
						template: $translate.instant("An error occured. Restart app or manage request from history panel.")
					});
					factory.current_request = null;
				} else {
					retrying = true;
					factory.requestUpdated(request_id, retry_count+1);
				}
			}).finally(function() {
				if(retrying)
					return;

				waiting_confirm_for_request = false;
				$ionicLoading.hide();

				$rootScope.$broadcast(factory.REQUEST_UPDATED);
			});
		} catch(e) {
			throw e;
		}	
    }

    _.forEach([
        "page_title", "distance_unit", "payment_methods",
        "search_radius", "search_timeout", "stripe_key",
        "vehicules_types", "SocketIO_Port", "currency_symbol", "countries_list", "states_list", "stripe_available", "tco_available", "allow_manual_prices", "prices_disclamer"
    ], function(key) {
        Object.defineProperty(factory, key, {
            get: function() {
                return _.get(_feature_data, key);
            }
        });
    });

    var _socket = null;
    var _socket_listeners = {};

    function addSocketListener(name, func) {
        if(!_.isArray(_socket_listeners[name]))
            _socket_listeners[name] = [];

        if(!_.includes(_socket_listeners[name], func)) {
            _socket_listeners[name].push(func);
            if(_.isObject(_socket))
                _socket.on(name, func);
        }
    }

    function removeSocketListener(name, func) {
        if(_.isObject(_socket))
            _socket.removeListener(name, func);

        if(_.isArray(_socket_listeners[name])) {
            var index = _socket_listeners[name].indexOf(func);
            if(index >= 0) {
                _socket_listeners[name].splice(index, 1);
            }
            if(_socket_listeners[name].length < 1) {
                delete _socket_listeners[name];
            }
        }
    }

    function bindSocketListeners() {
        _.forEach(_socket_listeners, function(listeners, name) {
            _.forEach(listeners, function(func) {
                _socket.on(name, func);
            });
        });
    }

    var _$socket_connected = $q.defer();

    var $socket = function() {
        if(angular.isObject(_socket) && _socket.disconnected === true && !(_socket.reconnecting || _socket.connecting)) {
            try {
                _socket.disconnect();
            } catch (e) {
                console.error(e);
            }
            _socket = null;
            if(_$socket_connected === null) {
                _$socket_connected = $q.defer();
            }
        }

        if(_socket === null) {
            _socket = new io.connect(DOMAIN+":"+factory.SocketIO_Port+"/taxiride", {
                'reconnection': true,
                'reconnectionDelay': 1000,
                'reconnectionDelayMax' : 10000,
                'reconnectionAttempts': 400
            });

            var original_emit = _socket.emit;
            _socket.emit = function(message, data, callback) {
                if(_.isString(message) && _.isObject(data)) {
                    original_emit.call(_socket, "***", _.merge({socket_event_name: message}, data));
                    return original_emit.call(_socket, message, data, callback);
                } else {
                    return original_emit.apply(_socket, arguments);
                }
            };

            bindSocketListeners();

        }

        if(!_socket.connected) {
            if(_$socket_connected === null) {
                _$socket_connected = $q.defer();
            }

            _socket.on("connected", function () {
                console.log("socket connected");
                if(_$socket_connected) {
                    _$socket_connected.resolve(_socket);
                    _$socket_connected = null;
                }
            });
        } else {
            if(_$socket_connected) {
                _$socket_connected.resolve(_socket);
                _$socket_connected = null;
            }
            return $q.resolve(_socket);
        }

        return _$socket_connected.promise;
    };

    var payload = function(payload) {
        if(!angular.isObject(payload))
            payload = {};

        return angular.extend({}, {
			custID: Customer.id,
            sessionID: $window.localStorage.getItem("sb-auth-token"),
            appID: Application.app_id,
            valueID: factory.value_id,
            search_radius: factory.search_radius,
            search_timeout: factory.search_timeout,
            distance_unit: factory.distance_unit
        }, payload);
    };

    function goOnline(role) {
		return function() {
			if(factory.isOnline){
				return $socket().then(function(io) {
					console.log(role + " Last Passenger Pos: " + JSON.stringify(lastPassengerPos) + ", Last Driver Pos: " + JSON.stringify(lastDriverPosition));
					io.emit(role+".online", payload(_.pick((role === "passenger" ? lastPassengerPos : role === "driver" ? lastDriverPosition : {}), ["latitude", "longitude", "heading"])));
					return $q.resolve(io);
				});
			}else{
				return $q.reject();
			}
		};
    }

    function sendLocalNotification() {
    	var params = {
            id: TAXIRIDE_LOCAL_NOTIFICATION_ID, 
            data: {
                taxiride: true
            }
        };

        if (ionic.Platform.isIOS()) {
            params.title = $translate.instant("Nyota Ride Request");
        } else {
            params.title = $translate.instant("Nyota Ride");
            params.text = $translate.instant("New ride request incoming");
            params.sound = "file://audio/ride.wav";
        }

        if (ionic.Platform.isAndroid()) {
            params.icon = 'res://icon.png';
        }

        params.data = { taxiride: true };

        // Send Local Notification
        //$cordovaLocalNotification.schedule(params);
    	if (ionic.Platform.isIOS()) {
			$cordovaLocalNotification.schedule(params).then(function () {
				navigator.vibrate([500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100]);
			}); 
		}else{
			if (_.isFunction(_.get(window, 'plugins.socialsharing.notify'))) {
				window.plugins.socialsharing.notify({text:"New ride request incoming",title:"Nyota Ride",request:"request"},"",function(){
					//console.log('Ride request alert')
				},function(error){
					console.log(error)
				});
			}

		}
    	/**var params = {
            id: TAXIRIDE_LOCAL_NOTIFICATION_ID, // why not
            data: {
                taxiride: true
            }
        };

        var timeNow = new Date();
        if(ionic.Platform.isIOS()) {
            params.title = $translate.instant("New ride request incoming");
        } else {
            params.title = $translate.instant("Nyota Ride Request"); //factory.page_title;
            params.message = $translate.instant("New ride request incoming");
			params.sound = "file://audio/ride.wav";
			//params.led = "FF0000";
			//params.date = timeNow;
        }

        if(ionic.Platform.isAndroid())
            params.icon = "res://icon.png";

		//params.data = { taxiride: true };

        // Send Local Notification
        $cordovaLocalNotification.schedule(params).then(function () {
			navigator.vibrate([500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100,500,100,100,100,100,100]);
		}); 
		var now = new Date().getTime();
        $cordovaLocalNotification.schedule({
    		id: "72589014",
	        message: "New ride request incoming",
	        title: "Nyota Ride Request",
	        autoCancel: false,
	        sound: "file://audio/ride.wav"
		}).then(function () {
			navigator.vibrate(1500);
		}); **/
		
		
    }
	
	function sendLocalOtherNotification(message) {
        var params = {
            id: TAXIRIDE_LOCAL_NOTIFICATION_ID, // why not
            data: {
                taxiride: true
            }
        };

        if(ionic.Platform.isIOS()) {
            params.title = $translate.instant(message);
        } else {
            params.title = "Nyota Ride";
            params.text = $translate.instant(message);
        }

        if(ionic.Platform.isAndroid())
            params.icon = "res://icon.png";

        params.data = { taxiride: true };

        // Send Local Notification
        
		if (ionic.Platform.isIOS()) {
			$cordovaLocalNotification.schedule(params);
		}else{
			if (_.isFunction(_.get(window, 'plugins.socialsharing.notify'))) {
				window.plugins.socialsharing.notify({text: message, title:"Nyota Ride", request:"no"},"",function(){
					//console.log('Ride request alert')
				},function(error){
					console.log(error)
				});
			}

		}
    }
    
    function getFormattedDateTimeNow() {
    	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		var d = new Date();
		var day = days[d.getDay()];
		var hr = d.getHours();
		var min = d.getMinutes();
		if (min < 10) {
		    min = "0" + min;
		}
		var ampm = "am";
		if( hr > 12 ) {
		    hr -= 12;
		    ampm = "pm";
		}
		if(hr == 12){
			ampm = "pm";
		}else if (hr == 0){
			hr = 12;
			ampm = "am";
		}
		var date = d.getDate();
		var month = months[d.getMonth()];
		var year = d.getFullYear();
		return  day + " " + date + " " + month  + " at " + hr + ":" + min + ampm; //  + " " + year;
    }

    var waiting_confirm_for_request = false;
    function rideRequest(data) {
		console.log("NEW REQUEST: " + JSON.stringify(data) + ", waiting_confirm_for_request: " + waiting_confirm_for_request + ", isObject Request: " + _.isObject(factory.current_request));
        if(waiting_confirm_for_request || _.isObject(factory.current_request))
            return;

        var timestamp = (+new Date());

        var driver = {
            base_fare: factory.payments_settings_data.base_fare,
            distance_fare: factory.payments_settings_data.distance_fare,
            time_fare: factory.payments_settings_data.time_fare,
            position: {
                lat: lastDriverPosition.latitude,
                lng: lastDriverPosition.longitude
            }
        };

        if(factory.distance_unit !== "km")
            driver.distance_fare *= 0.621371; // convert it to price by km

        var showRideRequest = function(request) {
        	try {
                sendLocalNotification();
                //factory.NotifyUser("New Request", "There is an oncoming ride request");
            } catch(e) {
                alert("Error while notifying rideRequest: " + e);
                console.error(e);
            }

            var payment_label = $translate.instant("Credit Card");
			//switch(payments_settings.cash)
            switch(request.payment_method) {
                case "stripe":
                    payment_label = $translate.instant("Credit Card");
                    break;
                case "2co":
                    payment_label = $translate.instant("Credit Card (via 2Checkout)");
                    break;
                case "cash":
                    payment_label = $translate.instant("Cash");
                    break;
            }

            var template = '<div class="bar-timer"><div class="bar-inner"></div></div>';
				template += '<div class="list">';
				template += '<div class="item item-divider">' +
                $translate.instant("Passenger Name") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.passenger_name +
                '</div>';
				template += '<div class="item item-divider">' +
                $translate.instant("Pick Passenger From") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.pickup_address +
                '</div>';
                template += '<div class="item item-divider">' +
                $translate.instant("Drop off Address") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.dropoff_address +
                '</div>' +
				'<div class="item item-divider">' +
                $translate.instant("Ride Distance after Pickup") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.to_dropoff.eta.text + "<br />" +
                    request.to_dropoff.distance.text +
                '</div>'+
                '<div class="item item-divider">' +
                $translate.instant("Ride Distance to Passenger") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                request.to_pickup.eta.text + "<br/>" +
                request.to_pickup.distance.text +
                '</div>';
                template += '<div class="item item-divider">' +
                $translate.instant("Your Estimated Total Price") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                $filter('number')(request.price,2) +
                '</div>'+
                '<div class="item item-divider">' +
                $translate.instant("Payment Method") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                payment_label +
                '</div>' +
                '   </div>';

            var dialog_data = {
                title: $translate.instant("Request") + ' #' + request.taxiride_request_id,
                cssClass: "taxiride",
                template: template,
                okText: $translate.instant('Accept'),
                cancelText: $translate.instant('Decline')
            };

            var time_to_show = function() {
                return Math.max((((+factory.search_timeout || 60)*1000) - ((+new Date())-timestamp)), 0);
            };

            if(time_to_show() > 5000) {
                var popup = SafePopups.show("confirm", dialog_data);
                popup.then(function(res) {
					console.log("RES: " + res);
                    if(res) {
						waiting_confirm_for_request = true;
                        factory.driver.acceptRequest(request);
						factory.NotifyUser("Ride accepted!", "You have accepted a ride request. Passenger has been notified! Be on your way.");
						navigator.vibrate([]);
                        /**$ionicLoading.show({
                            template: $translate.instant("Waiting for client confirmation...") + "<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
                        });
                        $timeout(function() {
                            $ionicLoading.hide();
                        }, time_to_show()+(factory.search_timeout*1000));**/
                    }else{
						factory.driver.rejectRequest(request);
						navigator.vibrate([]);
						if(res !== false){
							//console.log("messageCustomer");
							//factory.messageCustomer("Missed a ride", "Missed missed missed");
							factory.NotifyUser("Ride Missed!", "You missed out on a customer who had requested for a ride!");
							factory.messageCustomer("Missed a customer!", "Hello, you missed out on a customer who was travelling to " + request.dropoff_address + " on " + getFormattedDateTimeNow()  + ". The potential income you missed is " + $filter('number')(request.price,2) + ". Ensure your notifications alert is good enough. Alternatively, keep offline when you dont intend to pick a request. That way, you will be contributing in ensuring Nyota Ride is most reliable.  Thanks for your continued support.").success(function(data) {
								//console.log("success.....get messages");
								factory.ShowMessages = true;
							}).error(function(data) {
								console.error("Error messageCustomer - " + JSON.stringify(data));
							});
						}else{
							factory.NotifyUser("Ride declined!", "You declined a ride request. Passenger has been notified!");
						}
					}
					cancelTaxiRideNotification();
                    
                });

                $timeout(function() {
                    cancelTaxiRideNotification();
                    if(_.isObject(popup) && _.isFunction(popup.close))
                        popup.close();
                }, time_to_show());


                $timeout(function() {
                    cancelTaxiRideNotification();
                    $ionicLoading.hide();

                    if(waiting_confirm_for_request) {
                        /**SafePopups.show("alert",{
                            title: $translate.instant('Request'),
                            template: $translate.instant("Sorry Passenger didn't choose you!")
                        });**/
                        waiting_confirm_for_request = false;
                    }
                }, time_to_show()+(factory.search_timeout*1000));

            } else {
                waiting_confirm_for_request = false;
    		}

        };


        factory.calculateRoute(
            {lat: data.pickup_lat, lng: data.pickup_long},
            {lat: data.dropoff_lat, lng: data.dropoff_long},
            driver
        ).then(function(total_route) {
            var price = +driver.base_fare || 0;
            var duration = parseInt(_.get(total_route, "routes[0].legs[1].duration.value"));
            var distance = parseInt(_.get(total_route, "routes[0].legs[1].distance.value"));

            if(+driver.time_fare > 0){
                price += Math.floor(duration/60) * driver.time_fare;
			}
            if(+driver.distance_fare > 0) {
                price += (distance / 1000) * driver.distance_fare;
			}

            factory.calculateRoute(
                driver.position,
                {lat: data.pickup_lat, lng: data.pickup_long}
            ).then(function(route_to_pickup) {
                showRideRequest(_.merge(data, {
                    price: price,
                    to_pickup: {
                        eta: _.get(route_to_pickup, "routes[0].legs[0].duration"),
                        distance: _.get(route_to_pickup, "routes[0].legs[0].distance")
                    },
                    to_dropoff: {
                        eta: _.get(total_route, "routes[0].legs[1].duration"),
                        distance: _.get(total_route, "routes[0].legs[1].distance")
                    }
                }));
            }, function() {
                showRideRequest(_.merge(data, {
                    price: price,
                    to_pickup: {
                        eta: {text: "N/A", value: -1},
                        distance: {text: "N/A", value: -1}
                    },
                    to_dropoff: {
                        eta: _.get(total_route, "routes[0].legs[1].duration"),
                        distance: _.get(total_route, "routes[0].legs[1].distance")
                    }
                }));
            });
        }, function() {
            showRideRequest(_.merge(data, {
                price: "N/A",
                to_pickup: {
                    eta: {text: "N/A", value: -1},
                    distance: {text: "N/A", value: -1}
                },
                to_dropoff: {
                    eta: {text: "N/A", value: -1},
                    distance: {text: "N/A", value: -1}
                }
            }));
        });

    }

    var driver_goOnline = goOnline("driver");
    var passenger_goOnline = goOnline("passenger");

    factory.driver = {};

    factory.driver.goOnline = function() {
        addSocketListener("connected", driver_goOnline);
        addSocketListener("rideRequest", rideRequest);
        addSocketListener("requestUpdated", factory.requestUpdated);
		addSocketListener("newChat", factory.newChat);
		addSocketListener("driversUpdateForDrivers-" + Customer.id, updateDrivers)
        addSocketListener("disconnect", resetDriversMap);
        addSocketListener("reconnecting", resetDriversMap);
        addSocketListener("reconnect_failed", resetDriversMap);
		addSocketListener("newdetails", factory.newdetails);
		addSocketListener("passPointRequest", factory.passPointRequest);
		driver_goOnline();
        positionBuffer.startTimer();
		factory.isOnline = true;
    };

    var lastDriverPosition = null;
    factory.driver.updatePosition = function (timestamp, position) {
		try{
			console.log("Driver UPDATE POSITION - position: " + JSON.stringify(position) + ", lastDriverPosition: " + JSON.stringify(lastDriverPosition));
			if(_.isObject(lastDriverPosition) && _.isObject(position) &&
			   (+lastDriverPosition.latitude).toFixed(5) === (+position.latitude).toFixed(5) &&
			   (+lastDriverPosition.longitude).toFixed(5) === (+position.longitude).toFixed(5)
			  )
				return;
			
			//CALCULATE THE DIRECTION GIVEN THE DIFFERENCE BETWEEN THE TWO POSITIONS
			/**var bearing = 0;
			if(_.isObject(lastDriverPosition)){
				var myRadian = function(latlong) {
					var TAU = 2 * Math.PI;
					return latlong * TAU / 360;
				}
				var startLat = myRadian(lastDriverPosition.latitude);
				var startLong = myRadian(lastDriverPosition.longitude);
				var endLat = myRadian(position.latitude);
				var endLong = myRadian(position.longitude);
				
				//CALCULATE DISTANCE BETWEEN THE POINTS
				var R = 6378137; // Earthâ€™s mean radius in meters
				var dLat = myRadian(lastDriverPosition.latitude - position.latitude);
				var dLong = myRadian(lastDriverPosition.longitude - position.longitude);
				var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(endLat) * Math.cos(startLat) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
				var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				var distanceMoved = R * c; //IN METERS
				
				//var R = 6371e3;
				if(distanceMoved > 5){
					var y = Math.sin(endLong-startLong) * Math.cos(endLat);
					var x = Math.cos(startLat)*Math.sin(endLat) - Math.sin(startLat)*Math.cos(endLat)*Math.cos(endLong-startLong);
					bearing = Math.atan2(y, x) * (180/Math.PI);
					if (bearing < 0) {
						bearing = 360 + bearing;
					}
				}else{
					bearing = lastDriverPosition.heading;
				}
			   
			}**/
			var bearing = 0;
			if(position.heading > 0){
				bearing = position.heading;
			}else{
				if(_.isObject(lastDriverPosition)){
					bearing = lastDriverPosition.heading;
				} 
			}
				
			var positionObject = {};
			
			if ('latitude' in position) {
				positionObject.latitude = position.latitude;
			}
			if ('longitude' in position) {
				positionObject.longitude = position.longitude;
			}
			if ('accuracy' in position) {
				positionObject.accuracy = position.accuracy;
			}
			if ('altitude' in position) {
				positionObject.altitude = position.altitude;
			}
			if ('altitudeAccuracy' in position) {
				positionObject.altitudeAccuracy = position.altitudeAccuracy;
			}
			if ('heading' in position) {
				positionObject.heading = bearing;
			}
			if ('speed' in position) {
				positionObject.speed = position.speed;
			}
			
			
		   
			lastDriverPosition = positionObject; //position;
			if(factory.isOnline){
				goOnline("driver")().then(function (io) {
					io.emit('driver.updatePosition',payload({
						gps_timestamp: timestamp,
						latitude: position.latitude,
						longitude: position.longitude,
						heading: position.heading,
						custID: +Customer.id            
					}));
				});
			}

			/* positionBuffer.addPosition("driver", _.get(factory, "current_request.id", 0), {
				gps_timestamp: timestamp,
				latitude: position.latitude,
				longitude: position.longitude,
				heading: bearing
			}); */
		} catch(e) {
			throw e;
		}
    };

    factory.driver.acceptRequest = function(request) {
        driver_goOnline().then(function(io) {
            io.emit("driver.acceptRequest", payload({
                request: request
            }));
        });
    };

	factory.driver.rejectRequest = function(request) {
        driver_goOnline().then(function(io) {
            io.emit("driver.rejectRequest", payload({
                request: request,
				driver_customer_id: Customer.id
            }));
        });
    };

    factory.driver.goOffline = function() {
        $socket().then(function(io){
            io.emit("driver.offline", payload());
            io.disconnect();
        });
        removeSocketListener("connected", driver_goOnline);
        removeSocketListener("driversUpdateForDrivers-" + Customer.id, updateDrivers);
        removeSocketListener("disconnect", resetDriversMap);
        removeSocketListener("reconnecting", resetDriversMap);
        removeSocketListener("reconnect_failed", resetDriversMap);
		removeSocketListener("rideRequest", rideRequest);
        removeSocketListener("requestUpdated", factory.requestUpdated);
		removeSocketListener("newChat", factory.newChat);
        removeSocketListener("newdetails", factory.newdetails);
		removeSocketListener("passPointRequest", factory.passPointRequest);
		//removeSocketListener("online-" + Customer.id, driver_goOnline);
        positionBuffer.stopTimer();
		factory.isOnline = false;
    };
	
	factory.passPointRequest=function(data){
		// loop through the points and show the circle div
		//console.log("passenger points: " + JSON.stringify(data));
        data = _.values(data);
		_.forEach(data, function(element, index) {
			if (element !== null) {
				var mm = index.toString();
				factory.showPass(element,mm);
            }
		});
		
        /**data.forEach(function(element,index) {
            if (element !== null) {
				var mm = index.toString();
				factory.showPass(element,mm);
            }
		});**/
		
		//clear map
		var timeToClear = 1000*30;
		setTimeout(function(){
			_.forEach(data, function(element, index) {
				if (element !== null) {
					var mm = index.toString();
					console.log("index lodash forEach: " + index);
                    document.getElementById(mm).parentElement.removeChild(document.getElementById(mm));
                }
			});
			
			/**data.forEach(function(element,index) {
				if (element !== null) {
					var mm = index.toString();
                    document.getElementById(mm).parentElement.removeChild(document.getElementById(mm));
                }
			});**/
			
			//just incase some remain further clearance
			var arr = document.getElementsByClassName("liveMarker");
			if (arr) {
				_.forEach(arr, function(element) {
					if (element!==null) {
						element.parentElement.removeChild(element);
					}
				});
				
				/**arr.forEach(function(element,index) {
					if (element!==null) {
						element.parentElement.removeChild(element);
					}
				});**/
			}
		}, timeToClear);
    };
	
	factory.rmPoints=[];
    factory.showPass=function(pos,index){
		function definePopupClass() {
            /**
             * A customized popup on the map.
             * @param {!google.maps.LatLng} position
             * @param {!Element} content
             * @constructor
             * @extends {google.maps.OverlayView}
             */
            Popup = function(position, content) {
				this.position = position;
				var pixelOffset = document.createElement('div');
				// pixelOffset.classList.add('popup-bubble-anchor');
				pixelOffset.appendChild(content);
				this.anchor = document.createElement('div');
				// this.anchor.classList.add('popup-tip-anchor');
				this.anchor.appendChild(pixelOffset);
				// Optionally stop clicks, etc., from bubbling up to the map.
				this.stopEventPropagation();
            };
			
            // NOTE: google.maps.OverlayView is only defined once the Maps API has
            // loaded. That is why Popup is defined inside initMap().
            Popup.prototype = Object.create(google.maps.OverlayView.prototype);
          
            /** Called when the popup is added to the map. */
            Popup.prototype.onAdd = function() {
				this.getPanes().floatPane.appendChild(this.anchor);
            };
          
            /** Called when the popup is removed from the map. */
            Popup.prototype.onRemove = function() {
				if (this.anchor.parentElement) {
					this.anchor.parentElement.removeChild(this.anchor);
				}
				
				if (document.getElementById(index).parentElement) {
					document.getElementById(index).parentElement.removeChild(document.getElementById(index));
				}
            };
          
            /** Called when the popup needs to draw itself. */
            Popup.prototype.draw = function() {
				//console.log("drawing");
				var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
				//console.log("Index: " + index);
				if (!document.getElementById(index) && false) {
					var pa = document.createElement("div");
					pa.setAttribute("class", "liveMarker");
					pa.setAttribute("id", index);
					document.getElementById('liveMarker').parentElement.appendChild(pa);
				}
				
				var dds = document.getElementById(index);
				// Hide the popup when it is far out of view.
				var display = 
					Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
					'block' :
					'none';
					
				if (display === 'block' && dds) {
					//console.log();
					var x = (divPosition.x); //-40);
					var y = (divPosition.y); //-31);
					dds.style.left = x + 'px';
					dds.style.top = y + 'px';
					// this.anchor.style.left = divPosition.x + 'px';
					// this.anchor.style.top = divPosition.y + 'px';
				}
				//console.log("divPosition.y: " + divPosition.y)
            };
          
            /** Stops clicks/drags from bubbling up to the map. */
            Popup.prototype.stopEventPropagation = function() {
				var anchor = this.anchor;
				anchor.style.cursor = 'auto';
				
				['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'mouseup','touchstart','touchstop',
               'pointerdown','drag','dragend','dragstart'].forEach(function(event) {
                    anchor.addEventListener(event, function(e) {
                        e.preventDefault();
                    });
				});
            };
		}
		
		var pa = document.createElement("div");
		pa.setAttribute("class", "liveMarker");
		pa.setAttribute("id", index);
		
		definePopupClass();
		
		document.getElementById('liveMarker').parentElement.appendChild(pa);
		
		popup = new Popup(
			new google.maps.LatLng(pos.lat, pos.lng),
			document.getElementById(index)
		);
			
		factory.rmPoints.push(popup);
        
        if (factory.map) {
			popup.setMap(factory.map);
		}else{
            //console.log("sorry can't find map")
        }
	}



    factory.passenger = {};

    var driversMap = {};
    Object.defineProperty(factory.passenger, "drivers", {
        get: function() {
            return _.values(driversMap);
        }
    });
	
	Object.defineProperty(factory.driver, "drivers", {
        get: function() {
            return _.values(driversMap);
        }
    });

    function updateDrivers(driver) {
        if(_.isArray(driver)) {
			console.log("DRIVER IS ARRAY");
            _.forEach(driver, updateDrivers);
        } else if(_.isObject(driver) && _.isNumber(+driver.id)) {
			console.log("MAP_EVENTS - factory.current_request: " + factory.current_request + ", Driver: " + JSON.stringify(driver));
			if(factory.role === "passenger"){
				if(_.isNull(factory.current_request) || +driver.id == +factory.current_request.driver_customer_id ) {
					if(driver.removed === true) {
						//console.log("MAP_EVENTS - Driver removed0 - " + driver.id);
						delete driversMap[+driver.id];
						$rootScope.$broadcast(factory.MAP_EVENTS.DRIVER_DISAPPEARED, driver);
					} else {
						//console.log("We are updating drivers - MAP_EVENTS - " + driver.id);
						var event = (_.isObject(driversMap[+driver.id])) ? factory.MAP_EVENTS.DRIVER_UPDATED : factory.MAP_EVENTS.DRIVER_APPEARED;
						driversMap[+driver.id] = driver;

						$rootScope.$broadcast(event, driver);
					}
				}
			}else{
				if(_.isNull(factory.current_request) ) {
					if(driver.removed === true) {
						//console.log("MAP_EVENTS - Driver removed1 - " + driver.id);
						delete driversMap[+driver.id];
						$rootScope.$broadcast(factory.MAP_EVENTS.DRIVER_DISAPPEARED, driver);
					} else {
						//console.log("We are updating drivers - MAP_EVENTS - Driver: " + driver.id + " Customer.id: " + Customer.id);
						if(+driver.id !== +Customer.id){
							var event = (_.isObject(driversMap[+driver.id])) ? factory.MAP_EVENTS.DRIVER_UPDATED : factory.MAP_EVENTS.DRIVER_APPEARED;
							driversMap[+driver.id] = driver;

							$rootScope.$broadcast(event, driver);
						}
					}
				}
			}
        }
    }


    var lastPassengerPos = null; // used when reconnecting
    function resendLastPos() {
        if(lastPassengerPos !== null) {
            factory.passenger.updatePosition((+new Date()), lastPassengerPos);
        }
    }
	
	function driverRejected(data) {
		//console.log("0. - driverRejected - " + JSON.stringify(data));
		
		$rootScope.$broadcast(
			factory.DRIVER_REJECTED_REQUEST
		);
	}

    function driverAccepted(data) {
		//console.log("0. - driverAccepted" + JSON.stringify(data));
		
		factory.passenger.acceptRequest(data.request, data.driver);
		$rootScope.$broadcast(
			factory.DRIVER_ACCEPTED_REQUEST,
			data.driver,
			data.request
		);
        /**
		$rootScope.$broadcast(
			factory.DRIVER_ACCEPTED_REQUEST,
			data.driver,
			data.request
		);
		factory.calculateRoute(
            {lat: data.request.pickup_lat, lng: data.request.pickup_long},
            {lat: data.request.dropoff_lat, lng: data.request.dropoff_long},
            data.driver
        ).then(function(total_route) {
            factory.calculateRoute(
                data.driver.position,
                {lat: data.request.pickup_lat, lng: data.request.pickup_long}
            ).then(function(route_to_pickup) {
                var price = +data.driver.base_fare || 0;
                var duration = parseInt(_.get(total_route, "routes[0].legs[1].duration.value"));
                var distance = parseInt(_.get(total_route, "routes[0].legs[1].distance.value"));

                if(+data.driver.time_fare > 0) {
                    price += Math.floor(duration/60) * data.driver.time_fare;
                } //else {
				if(+data.driver.distance_fare > 0) {
                    price += (distance / 1000) * data.driver.distance_fare;
                }
				var user_image = Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: data.driver.driver_customer_id})) + ("?" +(+new Date()));
				if(_.isNull(data.driver.userRate) == false){
					data.driver.userRate = Math.round(data.driver.userRate * 100) / 100; 
				}

                $rootScope.$broadcast(
                    factory.DRIVER_ACCEPTED_REQUEST,
                    _.merge(
                        data.driver,
                        {
                            eta: _.get(route_to_pickup, "routes[0].legs[0].duration"),
                            price: $filter('number')(price,2),
							userImage: user_image,
							userRate: data.driver.userRate
                        }
                    ),
                    data.request
                );
            });
        });**/
    }

    function resetDriversMap() {
        driversMap = {};
        $rootScope.$broadcast(factory.MAP_EVENTS.DRIVERS_MAP_UPDATED, {});
    }

    factory.passenger.goOnline = function(position) {
        addSocketListener("connected", passenger_goOnline);
        addSocketListener("driversUpdate-" + Customer.id, updateDrivers);
        addSocketListener("driverAccepted", driverAccepted);
        addSocketListener("driverRejected", driverRejected);
        addSocketListener("requestUpdated", factory.requestUpdated);
		addSocketListener("newChat", factory.newChat);
        addSocketListener("disconnect", resetDriversMap);
        addSocketListener("reconnecting", resetDriversMap);
        addSocketListener("reconnect_failed", resetDriversMap);
        addSocketListener("connected", resendLastPos);
		addSocketListener("newdetails", factory.newdetails);
		addSocketListener("trackMe", factory.trackMe);
        positionBuffer.startTimer();
        passenger_goOnline();
		factory.isOnline = true;
    };

    factory.passenger.updatePosition = function(timestamp, position) {
		if(!_.isNull(lastPassengerPos)){
			console.log("IsObject: lastPassengerPos: " + _.isObject(lastPassengerPos) + ", position: " + _.isObject(position) + ", last lat: " + (lastPassengerPos.latitude).toFixed(5) + ", current lat: " + (position.latitude).toFixed(5) + ", last long: " + (lastPassengerPos.longitude).toFixed(5) + ", current long: " + (position.longitude).toFixed(5));
			if(_.isObject(lastPassengerPos) && _.isObject(position) &&
			   (+lastPassengerPos.latitude).toFixed(5) === (+position.latitude).toFixed(5) &&
			   (+lastPassengerPos.longitude).toFixed(5) === (+position.longitude).toFixed(5)
			  )
				return;
		}
		
		if(_.isNull(position)){
			return;
		}

        lastPassengerPos = position;
		if(factory.isOnline){
			goOnline("passenger")().then(function (io) {
			//$socket().then(function (io) {
				io.emit('passenger.updatePosition',payload({
					gps_timestamp: timestamp,
					latitude: position.latitude,
					longitude: position.longitude,
					heading: 0, //position.heading,
					custID: +Customer.id            
				}));
			});
		}
        /* positionBuffer.addPosition("passenger", _.get(factory, "current_request.id", 0), {
            gps_timestamp: timestamp,
            latitude: position.latitude,
            longitude: position.longitude,
			heading: position.heading,
			custID: +Customer.id
        }); */
    };

    factory.passenger.goOffline = function() {
        lastPassengerPos = null;
        $socket().then(function(io){
            //io.emit("passenger.offline");
			io.emit('passenger.offline',payload({
                passId: Customer.id,
                
            }));
            io.disconnect();
        });
        removeSocketListener("driversUpdate-" + Customer.id, updateDrivers);
        removeSocketListener("disconnect", resetDriversMap);
        removeSocketListener("reconnecting", resetDriversMap);
        removeSocketListener("reconnect_failed", resetDriversMap);
        removeSocketListener("connected", passenger_goOnline);
        removeSocketListener("connected", resendLastPos);
		removeSocketListener("driverAccepted", driverAccepted);
        removeSocketListener("driverRejected", driverRejected);
        removeSocketListener("requestUpdated", factory.requestUpdated);
		removeSocketListener("newChat", factory.newChat);
		removeSocketListener("newdetails", factory.newdetails);
		removeSocketListener("trackMe", factory.trackMe);
		
        positionBuffer.stopTimer();
		factory.isOnline = false;
    };
	
	factory.map = null;
    factory.getPassPoints = function(map){
        factory.map = map;
        //$socket().
		driver_goOnline().then(function (io) {
            $ionicLoading.show();
            io.emit("driver.getPass");
            var hideLoading = $timeout(function () {
                $ionicLoading.hide();
            }, 2000);
        });
    }


    var current_make_request_promise = null;
    factory.passenger.makeRequest = function(request, vehicule_type_id) {
        if(_.isObject(current_make_request_promise))
            return current_make_request_promise;

        var q = $q.defer();
        current_make_request_promise = q.promise;

        var error = function(data) {
            q.reject(data);
        };

        $http.postForm(
            Url.get("taxiride/mobile_view/makerequest", {
                value_id: factory.value_id, customer_id: +Customer.id
            }),
            {request: request}
        ).success(function(data) {
            if(_.isObject(data) && _.isObject(data.request) && !_.isUndefined(data.request.taxiride_request_id)) {
                passenger_goOnline().then(function(io) {
                    io.emit("passenger.sendRequest", payload({
                        request: data.request,
                        vehicule_type_id: vehicule_type_id
                    }));
                });
                q.resolve(data);
            } else {
                error(data);
            }
        }).error(error).finally(function() { current_make_request_promise = null; });

        return current_make_request_promise;
    };

    factory.passenger.acceptRequest = function(request, driver) {
		console.log("1. - passenger.acceptRequest");
		factory.ratingDone = false;
        passenger_goOnline().then(function(io) {
			
            io.emit("passenger.acceptRequest", payload({
                driver: driver,
                request: request
            }));
        });
    };

    factory.updateStatus = function(request, status, final_price) {
		try{
			//console.log("factory.updateStatus.");
			goOnline(factory.role)().then(function(io) {
				var hideLoading = $timeout(function() {
					$ionicLoading.hide();
				}, 15000);

				var unregisterListener = $rootScope.$on(factory.REQUEST_UPDATED, function() {
					// If we received request updated it's okay we can cancel the auto hide, loading has already been hide
					$timeout.cancel(hideLoading);
					unregisterListener();
				});

				$ionicLoading.show("<ion-spinner class=\"spinner-custom\"></ion-spinner>");

				io.emit("taxiride.updateRequest", payload({
					request: request,
					status: status,
					final_price: final_price
				}));
			});
		} catch(e) {
			throw e;
		}
    };

    factory.driver.setRidePrice = function(request_id) {
        var q = $q.defer();

        if(factory.allow_manual_prices) {
            var scope = $rootScope.$new();
            scope.final_popup = {final_price: null};

            SafePopups.show(
                "show", // Cannot use prompt because OF REASONS. IONIC REASONS
                {
                    title: $translate.instant("Please enter final price :"),
                    template: "<input autofocus type=\"number\" ng-model=\"final_popup.final_price\">",
                    scope: scope,
                    buttons: [{
                        text: $translate.instant("Close"),
                        onTap: function() {
                            q.reject();
                        }
                    }, {
                        text: $translate.instant("Set price"),
                        type: 'button-balanced',
                        onTap: function() {
                            var final_price =  parseFloat(scope.final_popup.final_price);
                            if(isNaN(final_price) || final_price < 0) {
                                SafePopups.show("alert", {
                                    title: $translate.instant("Incorrect price"),
                                    template: ($translate.instant("Final price can't be negative and format should use only dot and numbers. e.g. : 1234.56"))
                                }).then(function() { factory.driver.setRidePrice(request_id); });
                            } else {
                                $http.postForm(
                                    Url.get(
                                        "taxiride/mobile_view/setrequestfinalprice",
                                        {
                                            value_id: factory.value_id,
                                            request_id: request_id
                                        }
                                    ),
                                    {
                                        final_price: final_price
                                    }
                                ).success(function(data) {
                                    q.resolve();
                                }).error(q.reject);
                            }
                        }
                    }]
                }
            );
        } else {
            q.reject();
        }

        return q.promise;
    };

    factory.broadcastRequest = function(request_id) {
        goOnline(factory.role)().then(function(io) {
            io.emit("taxiride.broadcastRequest", request_id);
        });
    };


    factory.calculateRoute = function(from, to, driver, params) {
		try{
			params = _.merge({
				mode: google.maps.DirectionsTravelMode.DRIVING,
				unitSystem: factory.distance_unit === "km" ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL,
				request: {}
			}, _.isObject(params) ? params : {});

			var start = {latitude: from.lat, longitude: from.lng};

			if(_.isObject(driver) && _.isObject(driver.position) && _.isNumber(+driver.position.lat+(+driver.position.lng))) {
				params.request.waypoints = [{location: new google.maps.LatLng(start.latitude, start.longitude), stopover: true}];
				start = {latitude: +driver.position.lat, longitude: +driver.position.lng};
			}

			var dest = {latitude: to.lat, longitude: to.lng};
			//console.log("start: " + start + ", dest: " + dest)
		} catch(e) {
			throw e;
		}
        return GoogleMaps.calculateRoute(start, dest, params, true);
    };

    factory.tco = {};

    factory.tco.getConfig = function(request_id) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/tcoconfig", {value_id: factory.value_id, "request_id": request_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.tco.processTransaction = function(token, total, request_id) {
        return $http({
            method: 'GET',
            url: Url.get("taxiride/mobile_view/tcoprocess", {value_id: factory.value_id, token: token, total: total, request_id: request_id}),
            cache: false,
            responseType:'json'
        });
    };

    return factory;
});
