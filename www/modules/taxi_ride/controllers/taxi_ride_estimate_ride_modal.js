App.controller('TaxiRideEstimateRideModalController', function(_, $ionicPopup, $ionicLoading, $ionicScrollDelegate, $scope, $translate, $timeout, SafePopups, TaxiRide) {

    if($scope.ride !== undefined && $scope.ride){
		$scope.currency_symbol = TaxiRide.currency_symbol;

		$scope.info = {
			"step_1": false,
			"step_2": true,
			"type_choice": null,
			"payment_choice": null
		};
		
		$scope.comment = "";
		$scope.drivers = [];
		$scope.showDrivers = false;
		$scope.showDialingMsg = false;
		$scope.showRejectMsg = false;
		$scope.citySupported = true;
		//$scope.original_scope.has_launched_request = false;
		
		TaxiRide.getCity($scope.ride.pickup_lat, $scope.ride.pickup_long).success(function(data) {
			//console.log("city Data: " + data.length + ", Data: " + JSON.stringify(data));
			$scope.citySupported = false;
			if(data.length > 0){
				_.forEach(data, function(city) {
					//console.log("City online: " + city.online);
					if(city.online == 1 || city.online == true){
						$scope.citySupported = true;
					}
				});
			}
		});
		//TaxiRide.getDriversAroundLocation($scope.ride.pickup_lat, $scope.ride.pickup_long, 1).success(function(data) {
		TaxiRide.getTopDriversAroundLocation($scope.ride.pickup_lat, $scope.ride.pickup_long, 1).success(function(data) {
			$scope.available_drivers = data.drivers;
			$scope.no_driver_available = !$scope.available_drivers.length;
			$scope.available_methods = data.payment_method;
			$scope.tco_available = TaxiRide.tco_available;
			$scope.stripe_available = TaxiRide.stripe_available;

			$scope.min_estimate = 9999;
			$scope.max_estimate = 0;

			_.forEach($scope.available_drivers, function(driver) {
				var driver_distance_fare = 0;
				var driver_time_fare = 0;
				if(driver.distance_fare) {
					driver_distance_fare = driver.distance_fare * ($scope.ride.route.legs[0].distance.value/1000);
				}
				
				if(driver.time_fare) {
					driver_time_fare = driver.time_fare * Math.floor($scope.ride.route.legs[0].duration.value/60);
				}
				
				var driver_fare = parseFloat(driver.base_fare) + parseFloat(driver_distance_fare) + parseFloat(driver_time_fare);

				if(driver_fare < $scope.min_estimate) {
					$scope.min_estimate = parseFloat(driver_fare).toFixed(2);
				}

				if(driver_fare > $scope.max_estimate) {
					$scope.max_estimate = parseFloat(driver_fare).toFixed(2);
				}
				
				TaxiRide.calculateRoute(
					{lat: driver.lat, lng: driver.lng},
					{lat: $scope.ride.pickup_lat, lng: $scope.ride.pickup_long}
				).then(function(route_to_pickup) {
					var user_image = TaxiRide.getImageUrl(driver.customer_id);
					if(_.isNull(driver.taxiride_rating) == false){
						driver.taxiride_rating = Math.round(driver.taxiride_rating * 100) / 100; 
					}
					
					var metaForDriver = TaxiRide.getMetaForCustomer(driver.customer_id, "tag_line");
					TaxiRide.getMetaForCustomer(driver.customer_id, "tag_line").success(function(metaData) { 
						console.log("Meta: " + JSON.stringify(metaData) + ", DriverCust: " + driver.customer_id);
						driver = _.merge(
							driver,
							{
								eta: _.get(route_to_pickup, "routes[0].legs[0].duration"),
								price: TaxiRide.formattedNumber(driver_fare,2),
								userImage: user_image,
								userRate: driver.taxiride_rating,
								tagline: metaData.field
							}
						);
						$scope.drivers.push(driver);
						//console.log("Drivers: " + JSON.stringify($scope.drivers));
					});
					
					
				});
			});
			if($scope.no_driver_available){
				TaxiRide.logData("Passenger viewed estimate for a ride FROM: " + $scope.ride.pickup_address + " TO: " + $scope.ride.dropoff_address + ". NO DRIVER AVAILABLE");
			}else{
				TaxiRide.logData("Passenger viewed estimate for a ride FROM: " + $scope.ride.pickup_address + " TO: " + $scope.ride.dropoff_address + ". No. of Drivers: " + $scope.available_drivers.length + ", MIN PRICE: " + $scope.min_estimate);
			}
		});

		TaxiRide.getVehiculeTypes().then(function(data) {

			$scope.vehicule_list = _.map(data, function(vt) {
				return _.extend(
					{},
					vt,
					{
						picture: ((_.isString(_.get(vt, "picture")) && vt.picture.length > 0) ? (DOMAIN + "/" + vt.picture) : null)
					}
				);
			});
		});
	}
	
    $scope.validateVehiculeType = function() {
        //if($scope.info.type_choice) {
            $scope.info.step_1 = false;
            $scope.info.step_2 = true;

            //TaxiRide.getDriversAroundLocation($scope.ride.pickup_lat, $scope.ride.pickup_long, $scope.info.type_choice).success(function(data) {
			/**TaxiRide.getDriversAroundLocation($scope.ride.pickup_lat, $scope.ride.pickup_long, 1).success(function(data) {
                $scope.available_drivers = data.drivers;
                $scope.no_driver_available = !$scope.available_drivers.length;
				$scope.available_methods = data.payment_method;
                $scope.tco_available = TaxiRide.tco_available;
                $scope.stripe_available = TaxiRide.stripe_available;

                $scope.min_estimate = 9999;
                $scope.max_estimate = 0;

                _.forEach($scope.available_drivers, function(driver) {
                    if(driver.distance_fare) {
                        driver_fare = parseFloat(driver.base_fare) + driver.distance_fare * ($scope.ride.route.legs[0].distance.value/1000);
                    } else {
                        driver_fare = parseFloat(driver.base_fare) + driver.time_fare * ($scope.ride.route.legs[0].duration.value/60);
                    }

                    if(driver_fare < $scope.min_estimate) {
                        $scope.min_estimate = parseFloat(driver_fare).toFixed(2);
                    }

                    if(driver_fare > $scope.max_estimate) {
                        $scope.max_estimate = parseFloat(driver_fare).toFixed(2);
                    }

                });
            });
        /**} else {
            SafePopups.show('show', {
                subTitle: $translate.instant("Please choose a vehicle type"),
                buttons: [{
                    text: $translate.instant("OK")
                }]
            });
        }**/
    };
	
	$scope.showDriverFunction = function() {
		$scope.showDrivers = true;
	};
	
	$scope.hideDriverFunction = function() {
		$scope.showDrivers = false;
	};
	
	$scope.selectDriver = function(driver) {
		/**$ionicLoading.show({
            template: $translate.instant("Awaiting driver response") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });**/
		$scope.showRejectMsg = false;
		$scope.showDialingMsg = true;
		$timeout(function() { $scope.showDialingMsg = false; }, 30000);
		if(_.isObject(TaxiRide.payments_settings_data.card) && _.isString(TaxiRide.payments_settings_data.card.last4)) {
			$scope.info.payment_choice = "stripe";
		}else{
			$scope.info.payment_choice = "cash";
		}
		var request = {
			"pickup_address": $scope.ride.pickup_address,
			"pickup_lat": $scope.ride.pickup_lat,
			"pickup_long": $scope.ride.pickup_long,
			"dropoff_address": $scope.ride.dropoff_address,
			"dropoff_lat": $scope.ride.dropoff_lat,
			"dropoff_long": $scope.ride.dropoff_long,
			"payment_method": $scope.info.payment_choice,
			"choosen_driver_custid": driver.customer_id
		};

		TaxiRide.passenger.makeRequest(request, $scope.info.type_choice).then(function(data) {
			if(data.success) {
				
			} else {
				SafePopups.show('show', {
					subTitle: $translate.instant("An error occured while lauching your request. Please try again later."),
					buttons: [{
						text: $translate.instant("OK")
					}]
				});
			}
		});
		
		TaxiRide.ratingDone = false;
        //TaxiRide.passenger.acceptRequest(driver.request, driver);
        //$scope.original_scope.has_launched_request = true;
		//$scope.close();
    };
	
	$scope.$on(TaxiRide.DRIVER_ACCEPTED_REQUEST, function(event, driver, request) {
        //driver.request = request;
		//TaxiRide.passenger.acceptRequest(driver.request, driver);
        //$scope.drivers.push(driver);
		//console.log("Driver accepted");
		//$ionicLoading.hide();
		//$timeout(function() { $ionicLoading.hide(); }, 30000);
		//$scope.close();
		$scope.$close();
    });
	
	$scope.$on(TaxiRide.DRIVER_REJECTED_REQUEST, function(event, driver, request) {
        console.log("Driver REJECTED");
		//$ionicLoading.hide();
		$scope.showDialingMsg = false;
		$scope.showRejectMsg = true;
		//$timeout(function() { $scope.showRejectMsg = false; }, 3000);
		TaxiRide.NotifyUser("Driver Declined", "Driver declined your request. Choose another driver.");
		TaxiRide.current_request = null;
    });

    $scope.validateRequest = function() {
        //if($scope.info.payment_choice) {
			if(_.isObject(TaxiRide.payments_settings_data.card) && _.isString(TaxiRide.payments_settings_data.card.last4)) {
				$scope.info.payment_choice = "stripe";
			}else{
				$scope.info.payment_choice = "cash";
			}
            var request = {
                "pickup_address": $scope.ride.pickup_address,
                "pickup_lat": $scope.ride.pickup_lat,
                "pickup_long": $scope.ride.pickup_long,
                "dropoff_address": $scope.ride.dropoff_address,
                "dropoff_lat": $scope.ride.dropoff_lat,
                "dropoff_long": $scope.ride.dropoff_long,
                "payment_method": $scope.info.payment_choice
            };

            TaxiRide.passenger.makeRequest(request, $scope.info.type_choice).then(function(data) {
                if(data.success) {
                    TaxiRide.showDriverWaitingModal(data.request);
                    //$scope.close();
					$scope.$close();
                } else {
                    SafePopups.show('show', {
                        subTitle: $translate.instant("An error occured while lauching your request. Please try again later."),
                        buttons: [{
                            text: $translate.instant("OK")
                        }]
                    });
                }
            });

        /**} else {
            SafePopups.show('show', {
                subTitle: $translate.instant("Please choose a payment method"),
                buttons: [{
                    text: $translate.instant("OK")
                }]
            });
        }**/
    };

    $scope.close = function(index) {
		if(index == 1){
			TaxiRide.current_request = null;
			//CLEAR DESTINATION ADDRESS
			$scope.ride.dropoff_address = null;
			$scope.ride.dropoff_lat = null;
			$scope.ride.dropoff_long = null;
		}
        $scope.$close();
    };
	
	$scope.postRating = function(comment) {
        $scope.$postRating(comment);
    };

});
