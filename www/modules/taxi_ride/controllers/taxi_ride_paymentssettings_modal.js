App.controller('TaxiRidePaymentsSettingsModalController', function(_, $ionicPopup, $ionicLoading, $scope, $timeout, $translate, SafePopups, TaxiRide,Customer) {
    $scope.distance_unit = TaxiRide.distance_unit;
    $scope.payments_settings = TaxiRide.payments_settings_data;
    $scope.show_card_form = false;
    $scope.removing = false;
    $scope.payment_methods = TaxiRide.payment_methods;
    
    //START CUSTOM FIELDS DATA
    $scope.states_list = TaxiRide.states_list;
    $scope.shown_states = {};
	
	$scope.custom_fields = TaxiRide.custom_fields;
    $scope.custom_fields_data = TaxiRide.custom_fields_data;
    $scope.countries_list = TaxiRide.countries_list;
	
	//MAXIMUM VALUES
	$scope.max_base = TaxiRide.max_base;
	$scope.max_per_km = TaxiRide.max_per_km;
	$scope.max_per_min = TaxiRide.max_per_min;
	$scope.max_waiting = TaxiRide.max_waiting;
	
	$scope.cars=[];
	$scope.data={};
	
	
	$scope.checkBasePrice = function(){
		if($scope.payments_settings.base_fare > $scope.max_base){
			$scope.payments_settings.base_fare = $scope.max_base;
		}
	}
	
	$scope.checkKmPrice = function(){
		if($scope.payments_settings.distance_fare > $scope.max_per_km){
			$scope.payments_settings.distance_fare = $scope.max_per_km;
		}
	}
	
	$scope.checkMinPrice = function(){
		if($scope.payments_settings.time_fare > $scope.max_per_min){
			$scope.payments_settings.time_fare = $scope.max_per_min;
		}
	}
	
	$scope.checkWaitingPrice = function(){
		if($scope.payments_settings.waiting_charge > $scope.max_waiting){
			$scope.payments_settings.waiting_charge = $scope.max_waiting;
		}
	}
	
	$scope.getDataList = function(){
		var _soc = new io.connect(DOMAIN + ":"+ TaxiRide.SocketIO_Port + "/taxiride", {
			'reconnection': true,
			'reconnectionDelay': 1000,
			'reconnectionDelayMax': 5000,
			'reconnectionAttempts': 30
		});

		//console.log(Customer.id);
		_soc.emit('driver.getCars',{id: Customer.id} );
		_soc.on('connected',function(res){
			
		}); 
		_soc.on('driver.carList',function(result){
			$scope.cars = result;
			//document.getElementById('cars').addEventListener("change",$scope.getMe);
			_soc.disconnect();
		});

		_soc.on('driver.carGetError',function(res){

		});
	}
	
	$scope.selectChange = function(data){
		//console.log($scope.cars);
		//console.log($scope.data.model);
		if(!$scope.data.model != "Add New") {
			if ($scope.data.model != "AddNew") {
				var car = $scope.cars[$scope.data.model];
				if(car.vehicle_approved == 'approved'){
					$scope.custom_fields_data["license_number"] = car.vehicle_plate;
					$scope.custom_fields_data["vehicule_model"] = car.vehicle_model;
					TaxiRide.hasCar = true;
				}else if($scope.custom_fields_data["vehicule_model"] == "" || $scope.custom_fields_data["vehicule_model"] == null || $scope.custom_fields_data["vehicule_model"] == undefined){
					TaxiRide.hasCar = false;
				}
			}else{
				$scope.data.model ="Add New";
				//console.log("adding ne")
				TaxiRide.addVehicle(false);
				//$scope.getDataList();
			}  
		}
	}
	
	//pop over car list
	$scope.getMe = function(){
		if (!$scope.data.model != "Add New") {
			if ($scope.data.model != "AddNew") {
				var car = $scope.cars[$scope.data.model];
				if(car.vehicle_approved == 'approved'){
					$scope.custom_fields_data["license_number"] = car.vehicle_plate;
					$scope.custom_fields_data["vehicule_model"] = car.vehicle_model;
					TaxiRide.hasCar = true;
				}else if($scope.custom_fields_data["vehicule_model"] == "" || $scope.custom_fields_data["vehicule_model"] == null || $scope.custom_fields_data["vehicule_model"] == undefined){
					TaxiRide.hasCar = false;
				}
			}else{
				$scope.data.model ="Add New";
				//console.log("adding ne");
				TaxiRide.addVehicle(false); 
				//$scope.getDataList();
			}  
		}
		//console.log($scope.data.model);
	}
   
	$scope.$on('carsList', function(event, data) {
		$scope.cars = data;
	});
	
	$scope.AddDriverDocs=function(){
		TaxiRide.driverDocs(false);
    }

	
    if(TaxiRide.role === "driver") {
        $scope.is_loading = true;
		
		$scope.carsInList = function(event){
          
        }
		
		$scope.getDataList();

        TaxiRide.getVehiculeTypes().then(function(vehicule_types) {
            $scope.vehicule_types = _.map(vehicule_types, function(vt) {
                return _.extend(
                    {},
                    vt,
                    {
                        picture: ((_.isString(_.get(vt, "picture")) && vt.picture.length > 0) ? (DOMAIN+"/"+vt.picture) : null)
                    }
                );
            });
        }, function() {
            console.error("[TaxiRide] Error while fetching vehicle types");
        }).finally(function() {
            $scope.is_loading = false;
        });
        //$scope.custom_fields_data[vehicule_type_id] = 1;
    }
    
    
    

    if(!_.isObject($scope.payments_settings))
        $scope.payments_settings = {};

    if($scope.role === "driver") {
        $scope.payments_settings.charge_mode = _.isNumber($scope.payments_settings.time_fare) && $scope.payments_settings.time_fare > 0 ? "time" : "distance";
    } else {
        $scope.card = {};
        $scope.payments_settings.cash = true; //!!$scope.payments_settings.cash ? "cash" : null;
        if(_.isObject($scope.payments_settings.card)) {
            var exp_text = $translate.instant("%MONTH%/%YEAR%");
            exp_text = exp_text.replace("%MONTH%", $scope.payments_settings.card.exp_month);
            exp_text = exp_text.replace("%YEAR%", $scope.payments_settings.card.exp_year);
            $scope.payments_settings.card.exp_text = exp_text;
        }
    }

    $scope.payments_settings_charge_modes = [{
        label: $translate.instant("Distance"),
        id: "distance"
    }, {
        label: $translate.instant("Duration"),
        id: "time"
    }];

    $scope.close = function() {
        $scope.$emit(TaxiRide.PAYMENTS_SETTINGS_MODAL_STATE_UPDATE, false);
        $scope.$emit(TaxiRide.CUSTOM_FIELDS_MODAL_STATE_UPDATE, false);
        $scope.$close();
    };

    $scope.removepaymentcard = function() {
        // A confirm dialog
        var confirmPopup = SafePopups.show("confirm",{
            title: 'Confirmation',
            template: 'Do you really want to remove this credit card?'
        });

        confirmPopup.then(function(res) {
            if(res) {
                TaxiRide.removeCustomerPaymentCard().then(function() {
                    $scope.payments_settings.card = false;
                    TaxiRide.payments_settings_data.card = false;
                    $scope.$close()
                }, function(resp) {
                    if(_.isObject(resp) && _.isArray(resp.errors) && resp.errors.length > 0) {
                        SafePopups.show("alert", {
                            title: $translate.instant("An error occured while saving!"),
                            template: "<ul>" +
                                _.map(
                                    resp.errors,
                                    function(i) {
                                        return "<li>" +
                                            i.replace(
                                                    /[\u00A0-\u9999<>\&]/gim,
                                                function(i) {
                                                    return '&#'+i.charCodeAt(0)+';';
                                                }
                                            ) +
                                            "</li>";
                                    }
                                ).join("") +
                                "</ul>",
                            okText: $translate.instant("OK")
                        });
                    } else {
                        $ionicPopup.alert({
                            title: $translate.instant("An error occured while saving!"),
                            template: $translate.instant("Please try again later."),
                            okText: $translate.instant("OK")
                        });
                    }
                });
            }
        });
    }

    $scope.save = function(force) {
        if($scope.is_loading && force !== true)
            return;

        $scope.is_loading = true;
        var data = angular.copy($scope.payments_settings);

        if($scope.role === "driver") {
			$scope.custom_fields_data.vehicule_type_id = 1;
            /**if(data.charge_mode === "distance") {
                data.time_fare = undefined;
                delete data.time_fare;
            } else {
                data.distance_fare = undefined;
                delete data.distance_fare;
            }**/
            data.charge_mode = undefined;
            delete data.charge_mode;
        } else if ($scope.role === "passenger") {
			data.cash = 'cash';
            if (_.isObject($scope.card_token) && $scope.card_token.token.length > 0) {
                data.card = angular.copy($scope.card_token);
            } else if(_.isObject($scope.card) &&
                      _([+$scope.card.number, +$scope.card.exp_month, +$scope.card.exp_year, +$scope.card.cvc]).reject(_.isNaN).max() > 0) {
                $timeout(function() {

                    if($scope.card.exp_year > 0 && $scope.card.exp_year < 100)
                        $scope.card.exp_year += 2000;

                    var error_messages = [];

                    if(!($scope.card.number > 0))
                        error_messages.push($translate.instant("Please enter a credit card number"));

                    if(!($scope.card.exp_month > 0))
                        error_messages.push($translate.instant("Please enter the credit card expiration month"));

                    if(!($scope.card.exp_year > 0))
                        error_messages.push($translate.instant("Please enter the credit card expiration year"));

                    if(error_messages.length > 0) {
                        SafePopups.show('show', {
                            subTitle: error_messages.shift(),
                            buttons: [{
                                text: $translate.instant("OK")
                            }]
                        });

                        $scope.is_loading = false;
                        return;
                    }

                    Stripe.setPublishableKey(TaxiRide.stripe_key);
                    $ionicLoading.show({
                        template: $translate.instant("Checking information") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
                    });
                    try {
                        Stripe.card.createToken($scope.card, function (status, response) {
                            $ionicLoading.hide();
                            if (response.error) {
                                SafePopups.show("show", {
                                    subTitle: response.error.message,
                                    buttons: [{
                                        text: $translate.instant("OK")
                                    }]
                                });
                                $scope.is_loading = false;
                            } else {
                                $scope.card_token = {
                                    token: response.id,
                                    last4: response.card.last4,
                                    brand: response.card.brand,
                                    exp_month: response.card.exp_month,
                                    exp_year: response.card.exp_year,
                                    exp: Math.round(+(new Date((new Date(response.card.exp_year, response.card.exp_month, 1)) - 1)) / 1000) | 0
                                };
                                $scope.save(true);
                            }
                        });
                    } catch (e) {
                        $ionicLoading.hide();
                        SafePopups.show("show", {
                            subTitle: e+"",
                            buttons: [{
                                text: $translate.instant("OK")
                            }]
                        });
                        $scope.is_loading = false;
                    }
                });
                return;
            }
        }
		
		//SAVE CUSTOM FIELDS
		console.log("CUSTOM_FIELDS_DATA: " + JSON.stringify($scope.custom_fields_data));
		TaxiRide.saveCustomerCustomFields($scope.custom_fields_data).then(function() {
			console.log("TaxiRide.saveCustomerCustomFields SUCCESS");
			//$scope.$emit(TaxiRide.CUSTOM_FIELDS_MODAL_STATE_UPDATE, true);
			
			TaxiRide.savePaymentsSettingsFields(data).then(function() {
				console.log("TaxiRide.savePaymentsSettingsFields SUCCESS");
				$scope.$emit(TaxiRide.CUSTOM_FIELDS_MODAL_STATE_UPDATE, true);
			}, function(resp) {
				if(_.isObject(resp) && _.isArray(resp.errors) && resp.errors.length > 0) {
					SafePopups.show("alert", {
						title: $translate.instant("An error occured while saving payment settings!"),
						template: "<ul>" +
							_.map(
								resp.errors,
								function(i) {
									return "<li>" +
										i.replace(
												/[\u00A0-\u9999<>\&]/gim,
											function(i) {
												return '&#'+i.charCodeAt(0)+';';
											}
										) +
										"</li>";
								}
							).join("") +
							"</ul>",
						okText: $translate.instant("OK")
					});
				} else {
					$ionicPopup.alert({
						title: $translate.instant("An error occured while saving payment settings!"),
						template: $translate.instant("Please try again later."),
						okText: $translate.instant("OK")
					});
				}
			}).finally(function() {
				$scope.is_loading = false;
				$scope.$close();
			});
			
			
		}, function(resp) {
			if(_.isObject(resp) && _.isArray(resp.errors) && resp.errors.length > 0) {
				$ionicPopup.alert({
					title: $translate.instant("An error occured while saving data!"),
					template: "<ul>" +
						_.map(
							resp.errors,
							function(i) {
								return "<li>" +
									i.replace(
											/[\u00A0-\u9999<>\&]/gim,
										function(i) {
											return '&#'+i.charCodeAt(0)+';';
										}
									) +
									"</li>";
							}
						).join("") +
						"</ul>",
					okText: $translate.instant("OK")
				});
			} else {
				$ionicPopup.alert({
					title: $translate.instant("An error occured while saving data!"),
					template: $translate.instant("Please try again later."),
					okText: $translate.instant("OK")
				});
			}
		}).finally(function() {
			//$scope.is_loading = false;
		});

        
        
        
    };

    function loadContent() {
        $scope.page_title = TaxiRide.page_title;
        if($scope.role === "passenger") {
            if(typeof Stripe == "undefined") {
                $scope.is_loading = true;
                var stripeJS = document.createElement('script');
                stripeJS.type = "text/javascript";
                stripeJS.src = "https://js.stripe.com/v2/";
                stripeJS.onload = function() {
                    $timeout(function() {
                        $scope.is_loading = false;
                    });
                };
                document.body.appendChild(stripeJS);
            } else {
                $scope.is_loading = false;
            }
        } else {
            $scope.is_loading = false;
        }
    }

    $scope.is_loading = true;
    if(!TaxiRide.loaded) {
        TaxiRide.load().then(loadContent);
    } else {
        loadContent();
    }

    //$scope.$on("$destroy", console.log.bind(this));

});
