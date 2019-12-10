App.config(function($stateProvider) {
    $stateProvider.state('taxi_ride-view', {
        url: BASE_PATH+"/taxiride/mobile_view/index/value_id/:value_id",
        controller: 'TaxiRideMapController',
        templateUrl: "modules/taxi_ride/templates/l1/view.html",
        cache: false
    }).state('taxi_ride-map', {
        url: BASE_PATH+"/taxiride/mobile_view/index/value_id/:value_id/map",
        controller: 'TaxiRideMapController',
        templateUrl: "modules/taxi_ride/templates/l1/view.html",
        cache: false
    });
}).controller('TaxiRideMapController', function(_, AUTH_EVENTS, $cordovaGeolocation, $interval, $ionicHistory, $ionicLoading, $http, $q,  $scope, $stateParams, $state, $translate, $timeout, ContextualMenu, Customer, GoogleMaps, SafePopups, TaxiRide, Url) {

    var $value_id = null;
    var controller = {};
    //var Popup;

    var MAP_OPTIONS = {
        zoom: 3,
        //center: {lat: 0.5174851, lng: 35.2763332},
        disableDefaultUI: true,
		styles: [
					{
						"featureType": "administrative",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#d6e2e6"
							}
						]
					},
					{
						"featureType": "administrative",
						"elementType": "geometry.stroke",
						"stylers": [
							{
								"color": "#cfd4d5"
							}
						]
					},
					{
						"featureType": "administrative",
						"elementType": "labels.text.fill",
						"stylers": [
							{
								"color": "#7492a8"
							}
						]
					},
					{
						"featureType": "administrative.neighborhood",
						"elementType": "labels.text.fill",
						"stylers": [
							{
								"lightness": 25
							}
						]
					},
					{
						"featureType": "landscape.man_made",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#dde2e3"
							}
						]
					},
					{
						"featureType": "landscape.man_made",
						"elementType": "geometry.stroke",
						"stylers": [
							{
								"color": "#cfd4d5"
							}
						]
					},
					{
						"featureType": "landscape.natural",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#dde2e3"
							}
						]
					},
					{
						"featureType": "landscape.natural",
						"elementType": "labels.text.fill",
						"stylers": [
							{
								"color": "#7492a8"
							}
						]
					},
					{
						"featureType": "landscape.natural.terrain",
						"elementType": "all",
						"stylers": [
							{
								"visibility": "off"
							}
						]
					},
					{
						"featureType": "poi",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#dde2e3"
							}
						]
					},
					{
						"featureType": "poi",
						"elementType": "labels.text.fill",
						"stylers": [
							{
								"color": "#588ca4"
							}
						]
					},
					{
						"featureType": "poi",
						"elementType": "labels.icon",
						"stylers": [
							{
								"saturation": -100
							}
						]
					},
					{
						"featureType": "poi.park",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#a9de83"
							}
						]
					},
					{
						"featureType": "poi.park",
						"elementType": "geometry.stroke",
						"stylers": [
							{
								"color": "#bae6a1"
							}
						]
					},
					{
						"featureType": "poi.sports_complex",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#c6e8b3"
							}
						]
					},
					{
						"featureType": "poi.sports_complex",
						"elementType": "geometry.stroke",
						"stylers": [
							{
								"color": "#bae6a1"
							}
						]
					},
					{
						"featureType": "road",
						"elementType": "labels.text.fill",
						"stylers": [
							{
								"color": "#41626b"
							}
						]
					},
					{
						"featureType": "road",
						"elementType": "labels.icon",
						"stylers": [
							{
								"saturation": -45
							},
							{
								"lightness": 10
							},
							{
								"visibility": "on"
							}
						]
					},
					{
						"featureType": "road.highway",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#c1d1d6"
							}
						]
					},
					{
						"featureType": "road.highway",
						"elementType": "geometry.stroke",
						"stylers": [
							{
								"color": "#a6b5bb"
							}
						]
					},
					{
						"featureType": "road.highway",
						"elementType": "labels.icon",
						"stylers": [
							{
								"visibility": "on"
							}
						]
					},
					{
						"featureType": "road.highway.controlled_access",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#9fb6bd"
							}
						]
					},
					{
						"featureType": "road.arterial",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#ffffff"
							}
						]
					},
					{
						"featureType": "road.local",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#ffffff"
							}
						]
					},
					{
						"featureType": "transit",
						"elementType": "labels.icon",
						"stylers": [
							{
								"saturation": -70
							}
						]
					},
					{
						"featureType": "transit.line",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#b4cbd4"
							}
						]
					},
					{
						"featureType": "transit.line",
						"elementType": "labels.text.fill",
						"stylers": [
							{
								"color": "#588ca4"
							}
						]
					},
					{
						"featureType": "transit.station",
						"elementType": "all",
						"stylers": [
							{
								"visibility": "off"
							}
						]
					},
					{
						"featureType": "transit.station",
						"elementType": "labels.text.fill",
						"stylers": [
							{
								"color": "#008cb5"
							},
							{
								"visibility": "on"
							}
						]
					},
					{
						"featureType": "transit.station.airport",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"saturation": -100
							},
							{
								"lightness": -5
							}
						]
					},
					{
						"featureType": "water",
						"elementType": "geometry.fill",
						"stylers": [
							{
								"color": "#a6cbe3"
							}
						]
					}
					]
    };
	
	$scope.user_rating = null;
	$scope.user_image = null;
	$scope.show_image = false;
	$scope.isShowingAccount = false;
	$scope.show_rating = false;
	$scope.firstname = "";
	$scope.numberVerifyAlreadyShown=false;
	$scope.slide = false;
	$scope.showSlide = true;
	$scope.arrivalInfo = "Check your trip status here!";
	var minuteDelayOver = true;
	var passengerAlerted = false;
	
	$scope.locationInterval = null;
	$scope.locationIntervalFG = null;
	$scope.tripZoomingInterval = null;
	$scope.positionLoaded=false;
	var updatesStarted = false;
	
	$scope.currentPosition = null;
	$scope.currentPositionRide = null;
	$scope.counter=0;
	
	$scope.registered_phone = null;
	
	var layer = null;
	
	
    /**$scope.$watch('minuteDelayOver', function() {
        if(minuteDelayOver = false){
        	console.log("Changed MinuteDelayOver: " + minuteDelayOver);
        	$timeout(function() {
		        minuteDelayOver = true;
		        console.log("5s over MinuteDelayOver: " + minuteDelayOver);
		    }, 5000);
        }
    });**/
	

    var has_4coords = function () {
        return _([
            $scope.ride.pickup_lat,
            $scope.ride.pickup_long,
            $scope.ride.dropoff_lat,
            $scope.ride.dropoff_long
        ]).filter(function(e) {
            return _.isNumber(e) && !isNaN(e);
        }).value().length == 4;
    };

    controller.common = new (function common() {
        var customer_id = null;
        
        this.checkCustomer = function(passengerInfosNeeded) {
            passengerInfosNeeded = (passengerInfosNeeded === true);
            var showModals = (TaxiRide.role === "driver" || TaxiRide.role === "passenger" || passengerInfosNeeded);
			//var showModals = (passengerInfosNeeded);
			console.log("passengerInfosNeeded: " + passengerInfosNeeded + ", showModals: " + showModals + ", Customer.id: " + Customer.id);

	          if(_.isNumber(+Customer.id) && +Customer.id > 0) {

		            if(customer_id != Customer.id) {
			              controller.common.resetMap();
			              customer_id = Customer.id;
		            }

                $scope.all_valid = false;

		            /**if(TaxiRide.areCustomFieldsValid() === false) {
						console.log("custom fields invalid");
						if(showModals) {
							return $q.resolve(TaxiRide.showCustomFieldsModal(true).then(function() {
								return $q.resolve(controller.common.checkCustomer());
							}, function() {
								if(TaxiRide.role === "driver") {
									  if($ionicHistory.backView()) {
											$ionicHistory.goBack(-999);
									  } else {
											$state.go("home");
									  }
								}
							}));
						}
		            } else**/ if(TaxiRide.arePaymentsSettingsValid() === false && TaxiRide.role === "driver") {
						console.log("Payments invalid");
				            
                    	if(showModals) {
							if(TaxiRide.role === "driver"){
								return $q.resolve(TaxiRide.showPaymentsSettingsModal(true).then(function() {
									//TaxiRide.updateCodes(Customer.id);
									$scope.accepted_waiting = true;
									console.log("PaymentSettingsModal success");
									return $q.resolve(TaxiRide.updateCodes(Customer.id).then(function() {
										TaxiRide.needToUploadDocs = true;
										return $q.resolve(controller.common.checkCustomer());
									}));
									
									/**$scope.accepted_waiting = true;
									return $q.resolve(TaxiRide.driverDocs(true).then(function() {
										console.log("Driver docs added");
										return $q.resolve(controller.common.checkCustomer());
										return $q.resolve(TaxiRide.addVehicle(true).then(function() {
											$scope.all_valid = true;
											TaxiRide.showingSettings = false;
										}));
									}));**/
									
									//return $q.resolve(controller.common.checkCustomer());
								}, function() {
									console.log("PaymentSettingsModal ISSUE DRIVER");
									$scope.accepted_waiting = true;
									return $q.resolve(TaxiRide.updateCodes(Customer.id).then(function() {
										TaxiRide.needToUploadDocs = true;
										return $q.resolve(controller.common.checkCustomer());
									}));
									/**$scope.accepted_waiting = true;
									return $q.resolve(TaxiRide.driverDocs(true).then(function() {
										console.log("Driver docs added");
										return $q.resolve(controller.common.checkCustomer());
									}));
									if(TaxiRide.role === "driver") {
										if($ionicHistory.backView()) {
											$ionicHistory.goBack(-999);
										} else {
											$state.go("home");
										}
									}**/
								}));
							}
                    	}
		            } else if(TaxiRide.needToUploadDocs === true && TaxiRide.role === "driver") {
						console.log("There is need to upload driver documents");
				        $scope.accepted_waiting = true;
						
                    	if(showModals) {
							TaxiRide.firstRegistration = true;
							return $q.resolve(TaxiRide.driverDocs(true).then(function() {
								TaxiRide.needToUploadDocs = false;
								return $q.resolve(controller.common.checkCustomer());
							}, function() {
								TaxiRide.needToUploadDocs = false;
								return $q.resolve(controller.common.checkCustomer());
							}));
                    	}
		            }/** else if(TaxiRide.needToAddVehicle === true && TaxiRide.role === "driver") {
						console.log("There is need to add vehicle and its documents");
				            
                    	if(showModals) {
							return $q.resolve(TaxiRide.addVehicle(true).then(function() {
								return $q.resolve(controller.common.checkCustomer());
							}, function() {
								if(TaxiRide.role === "driver") {
									if($ionicHistory.backView()) {
										$ionicHistory.goBack(-999);
									} else {
										$state.go("home");
									}
								}
							}));
                    	}
		            }**/ else {
		            	console.log("Above 2 satisfied. Go home");
			              $scope.all_valid = true;
						  TaxiRide.showingSettings = false;
		            }
	          } else {
		            controller.common.resetMap();
		            $scope.all_valid = false;
		            TaxiRide.role = null;

		            if($ionicHistory.backView()) {
			              $ionicHistory.goBack(-999);
		            } else {
			              $state.go("home");
		            }
	          }

	          return $scope.all_valid ? $q.resolve() : $q.reject();
        };

        var removeSideMenu = angular.noop;
        var showMenu = null;

        this.addMenu = function() {
            removeSideMenu = ContextualMenu.set("modules/taxi_ride/templates/l1/contextual-menu.html", 120, function() {
                return showMenu;
            });
            showMenu = true;
        };

        this.loadGMap = function() {
            $scope.is_loading = false; // Not showing the map div could interfere with map tile rendering

            if($scope.loadedGMap && !$scope.map && _.isObject(google) && _.isObject(google.maps)) {
                // If scope has been destroyed but everything is loaded
                controller.common.initMap();
            } else {
                GoogleMaps.addCallback(controller.common.initMap);
                $scope.loadedGMap = true;
            }
			if ($scope.numberVerifyAlreadyShown==false) {
                TaxiRide.updateCodes(Customer.id);
                $scope.numberVerifyAlreadyShown=true;
            }
        };

        this.redrawMap = function() {
            try { google.maps.event.trigger($scope.map,'resize'); } catch(e) { }
        };

        var resetMapListeners = [];

        this.resetMap = function() {
            _.forEach(resetMapListeners, function(f) {
                if(_.isFunction(f)) { f(); }
            });

            $scope.map = null;
            $scope.dropOffMarker = null;
            $scope.driverMarker = null;
            $scope.pickUpMarker = null;
			//$scope.showPickupPoint = true;
			//$scope.dragMapToPoint = true;
			$scope.userTyping = false;
			console.log("RESET MAP: Location set off");
			$scope.location_is_off = true;
			$scope.time_to_pickup = "";
        };
        
        var smoothZoom = function(map, max, cnt) {
		    if (cnt >= max) {
		        return;
		    }
		    else {
		        z = GoogleMaps.map.addListener(map, 'zoom_changed', function(event){
		            GoogleMaps.map.removeListener(z);
		            smoothZoom(map, max, cnt + 1);
		        });
		        setTimeout(function(){map.setZoom(cnt)}, 5); // 80ms is what I found to work well on my system -- it might not work well on all systems
		    }
		}  

        this.zoomIfNeeded = function() {
			console.log("zoomed");
        	if($scope.map) {
                if($scope.map.getZoom() < (($scope.has_request) ? 17 : 14)) {
                    $scope.map.setZoom(($scope.has_request) ? 20 : 16);
                }
            }
            /**var zoomTo;
            var currentZoom = $scope.map.getZoom();
            if($scope.map) {
                if(currentZoom < (($scope.has_request) ? 17 : 14)) {
                    zoomTo = (($scope.has_request) ? 20 : 16);
                }
            }
            smoothZoom($scope.map, zoomTo, currentZoom);**/
        };
		
		$scope.showMessages = false;
		$scope.checkedForMessages = false;
		$scope.messages = [];
		TaxiRide.ShowMessages = true;
		
		this.checkForMessages = function(result) {
			//console.log("showMessages: " + $scope.showMessages);
			/**TaxiRide.getCustMessages(result.coords.latitude, result.coords.longitude).success(function(data) {
				console.log("Message data: " + JSON.stringify(data));
				$scope.showMessages = true;
				$scope.checkedForMessages = true;
				$scope.messages = data;
			});**/
			$interval(function() {
				if(TaxiRide.ShowMessages && _.isObject(result)){
					TaxiRide.getCustMessages(result.coords.latitude, result.coords.longitude).success(function(data) {
						$scope.showMessages = true;
						$scope.checkedForMessages = true;
						TaxiRide.ShowMessages = false;
						$scope.messages = data;
						
						//UPDATE CUSTOMER LOCATION INFO AND CITY
						TaxiRide.getCity(result.coords.latitude, result.coords.longitude).success(function(dataCity) {
							//DON'T DO ANYTHING
							console.log("DATACITY: " + JSON.stringify(dataCity));
							if(dataCity.length > 0){
								_.forEach(dataCity, function(city) {
									console.log("SET pass_referral_bonus: " + city.pass_referral_bonus);
									TaxiRide.referralBonusAmount = city.pass_referral_bonus;
									TaxiRide.max_base = city.max_base;
									TaxiRide.max_per_km = city.max_per_km;
									TaxiRide.max_per_min = city.max_per_min;
									TaxiRide.max_waiting = city.max_waiting;
								});
							}
						});
					});
				}
			}, 10000);
		}

        var lastLocationUpdate = 0;
        var lastLocationCoords = {};
		var startCoords = {};
		var gpsTime = null;
		var justCoords = {};
		
		var numDeltas = 250;
		var delay = 5; //milliseconds
		var i = 0;
		var x = 0;
		var deltaLat;
		var deltaLng;
		var position = [0, 0];
		var delayForRotation = false;
		var delayDuration = 0;
		var rotationActive = false;
		var movingActive = false;
		var turnClockwise;
		var degreeDifference;
		var positionPrev = [0,0];
		var img = null;
		
        this.updateLocation = function(result) {
        	try{
        		console.log("UPDATELOCATION: 1");
				//alert("coords: " + JSON.stringify(result.coords));
				if($scope.checkedForMessages == false && _.isObject(result)){
					controller.common.checkForMessages(result);
				}
				console.log("UPDATELOCATION: $scope.isDriverOnline: " + $scope.isDriverOnline + " lastLocationUpdate: " + lastLocationUpdate + ", result.timestamp: " +  result.timestamp);
				//SPECIAL CODE TO CHECK ON THE RESULT OBJECT. STRINGIFY ON ITS ON DOESN'T WORK
				//if(lastLocationUpdate < result.timestamp) {
				if(($scope.passenger || $scope.isDriverOnline) && lastLocationUpdate < result.timestamp) {
	                //console.log("UPDATELOCATION: 3");
	                //GET THE ICON TO USE FOR DRIVER BASED ON BEARING
					var bearing = 0;
					if(result.coords.heading > 0){
						bearing = result.coords.heading;
					}else{
						if(_.isObject(lastLocationCoords)){
							/**var myRadian = function(latlong) {
								var TAU = 2 * Math.PI;
								return latlong * TAU / 360;
							}
							
							//var R = 6371e3;
							var startLat = myRadian(lastLocationCoords.latitude);
							var startLong = myRadian(lastLocationCoords.longitude);
							var endLat = myRadian(result.coords.latitude);
							var endLong = myRadian(result.coords.longitude);
							
							//CALCULATE DISTANCE BETWEEN THE POINTS
							var R = 6378137; // Earth’s mean radius in meters
							var dLat = myRadian(lastLocationCoords.latitude - result.coords.latitude);
							var dLong = myRadian(lastLocationCoords.longitude - result.coords.longitude);
							var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(endLat) * Math.cos(startLat) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
							var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
							var distanceMoved = R * c; //IN METERS
							if(distanceMoved > 3){
								var y = Math.sin(endLong-startLong) * Math.cos(endLat);
								var x = Math.cos(startLat)*Math.sin(endLat) - Math.sin(startLat)*Math.cos(endLat)*Math.cos(endLong-startLong);
								bearing = Math.atan2(y, x) * (180/Math.PI);
								if (bearing < 0) {
									bearing = 360 + bearing;
								}
							}else{
								bearing = lastLocationCoords.heading;
							}**/
							bearing = lastLocationCoords.heading;
						}
					}
					//console.log("UPDATELOCATION: 4");
					var positionObject = {};
					if ('coords' in result) {
						positionObject.coords = {};
						if ('latitude' in result.coords) {
							positionObject.latitude = result.coords.latitude;
						}
						if ('longitude' in result.coords) {
							positionObject.longitude = result.coords.longitude;
						}
						/* if($scope.passenger && $scope.ride.pickup_lat !== null && $scope.ride.pickup_long != null){
							positionObject.latitude = $scope.ride.pickup_lat;
							positionObject.longitude = $scope.ride.pickup_long;
						} */
						if ('accuracy' in result.coords) {
							positionObject.accuracy = result.coords.accuracy;
						}
						if ('altitude' in result.coords) {
							positionObject.altitude = result.coords.altitude;
						}
						if ('altitudeAccuracy' in result.coords) {
							positionObject.altitudeAccuracy = result.coords.altitudeAccuracy;
						}
						if ('heading' in result.coords) {
							positionObject.heading = bearing;
						}
						if ('speed' in result.coords) {
							positionObject.speed = result.coords.speed;
						}
					}
					if(_.isNumber(positionObject.latitude)) {
						if($scope.location_is_off == true){
							TaxiRide.logData("User is back ONLINE");
						}
						$scope.location_is_off = false;
						
						if($scope.all_valid && !TaxiRide.updateChecked){
							TaxiRide.checkForUpdate();
						}
					}else{
						
						$scope.location_is_off = true;
					}
					console.log("Location data: " + JSON.stringify(positionObject) + ", LOCATION OFF: " + $scope.location_is_off);
					//result.coords.heading = bearing;
					//startCoords = lastLocationCoords;
					//console.log("UPDATELOCATION: 5");
	                lastLocationCoords = positionObject;
					if($scope.driver) {
						$scope.isDriverOnline = true;
	                    // We update position of driver via GPS, but passenger is update via the pickup pinpoint
	                    $scope.currentPositionRide = {timestamp: result.timestamp, coords: positionObject };
						console.log("Driver - Sending Location: " + JSON.stringify(positionObject));
						TaxiRide.driver.updatePosition(result.timestamp, positionObject); //result.coords);
	                    /**if (!(TaxiRide.current_request == null)) {
							if (TaxiRide.current_request.status == 'going') {
								$scope.currentPositionRide = {timestamp: result.timestamp, coords: result.coords };
							}
						}**/

	                } else {
						//////console.log("has_request: " + $scope.has_request + ", time: " + result.timestamp + ", Lat: " + result.coords.latitude +  ", Long: " + result.coords.longitude);
	                    if($scope.has_request) {
	                        TaxiRide.passenger.updatePosition(result.timestamp, positionObject);
	                    } else {
	                        if(
	                            (+_.get(lastLocationCoords, "latitude")).toFixed(5) !== (+_.get(result, "coords.latitude")).toFixed(5) || (+_.get(lastLocationCoords, "longitude")).toFixed(5) !== (+_.get(result, "coords.longitude")).toFixed(5)
	                        ) {
	                            controller.passenger.updatePickupInfos();
	                        }
	                    }
	                }

	                var pos = new google.maps.LatLng(positionObject.latitude, positionObject.longitude);
					//var pos = new google.maps.LatLng(result.coords.latitude, result.coords.longitude);

	                

	                lastLocationUpdate = result.timestamp;
					//console.log("UPDATELOCATION: 6");
					//var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";
					//var car = "M744 3931 c-51 -23 -90 -72 -147 -186 -54 -109 -99 -246 -131 -403 -13 -64 -25 -103 -25 -87 -1 42 52 265 84 355 32 87 81 186 124 250 17 25 26 46 21 48 -16 6 -122 -28 -172 -55 -69 -38 -82 -57 -116 -178 -69 -249 -100 -479 -104 -772 -1 -83 -5 -143 -11 -143 -14 0 1 339 24 520 20 156 53 320 89 440 l19 65 -59 -62 c-66 -70 -124 -168 -135 -228 -19 -108 -23 -276 -13 -500 l11 -239 -23 -15 c-12 -8 -43 -16 -68 -17 -37 -1 -50 -7 -69 -30 -25 -32 -30 -71 -11 -97 12 -16 17 -14 68 16 30 18 59 43 65 55 5 12 18 22 27 22 17 0 18 -23 18 -357 -1 -286 -4 -366 -15 -398 -19 -51 -19 -148 -1 -183 11 -21 14 -115 17 -457 2 -236 2 -484 1 -551 -2 -90 1 -129 13 -157 8 -20 15 -48 15 -63 0 -55 128 -286 184 -333 14 -12 15 -4 10 80 -6 98 13 231 37 253 9 8 10 3 4 -19 -38 -159 -41 -224 -15 -316 8 -30 19 -41 58 -59 145 -69 260 -85 551 -77 169 4 219 9 279 26 112 33 171 66 188 106 19 45 18 194 -1 265 -21 80 -16 106 7 35 23 -73 34 -205 20 -262 -5 -24 -6 -43 -1 -43 34 0 181 253 194 335 4 22 14 59 22 82 13 34 14 70 9 180 -12 290 1 933 21 980 17 43 17 131 -2 167 -13 24 -15 89 -15 397 0 355 1 369 19 369 11 0 21 -9 25 -22 6 -26 99 -83 120 -75 9 4 13 21 11 52 -1 35 -8 53 -28 73 -25 24 -30 25 -58 15 -26 -10 -36 -10 -53 3 -21 14 -21 19 -21 377 0 410 1 406 -78 524 -40 60 -127 157 -127 141 0 -3 7 -25 15 -48 29 -83 65 -250 90 -419 20 -134 37 -476 26 -521 -6 -24 -9 12 -10 118 -2 266 -46 581 -112 795 l-30 98 -62 39 c-56 36 -181 80 -192 68 -3 -3 11 -29 31 -59 70 -104 134 -265 174 -437 28 -123 50 -289 48 -358 -1 -35 -3 -45 -5 -24 -33 345 -81 541 -175 723 -100 193 -108 197 -398 197 -188 0 -220 -3 -256 -19z m-313 -850 c-6 -66 -11 -164 -11 -219 l0 -100 38 8 c62 14 308 30 468 30 l151 0 7 -49 c14 -104 108 -179 211 -168 29 3 67 13 84 22 42 21 88 86 96 135 4 22 10 40 13 40 4 -1 26 -5 50 -9 l42 -8 2 111 2 111 3 -113 c3 -90 8 -119 23 -145 24 -39 25 -65 4 -154 -8 -37 -26 -129 -38 -203 -26 -153 -20 -147 -116 -112 -117 43 -196 52 -460 52 -268 0 -330 -7 -479 -56 -41 -13 -75 -23 -76 -22 -1 2 -8 44 -15 93 -7 50 -23 142 -36 205 -29 138 -30 170 -5 201 15 21 19 50 24 209 7 186 17 296 24 272 3 -7 0 -66 -6 -131z m-100 -412 c10 -21 19 -42 19 -46 -1 -4 -12 13 -26 40 -28 53 -48 60 -59 20 -7 -27 -20 -1023 -13 -1023 1 0 43 -14 92 -30 49 -17 95 -30 102 -30 9 0 14 19 17 58 2 36 3 24 4 -33 0 -49 -2 -78 -4 -62 -3 21 -10 27 -29 27 -14 0 -59 12 -101 26 -41 14 -76 24 -79 22 -2 -3 0 -130 6 -284 5 -153 9 -317 8 -364 0 -47 -7 52 -14 220 -18 413 -21 1332 -5 1425 19 108 39 117 82 34z m-18 -11 c26 -57 48 -131 66 -234 12 -65 20 -90 23 -74 3 14 4 4 1 -22 -2 -30 1 -48 8 -50 9 -3 12 -39 13 -114 0 -67 3 -98 8 -79 4 17 5 0 2 -37 -3 -37 -2 -73 3 -80 4 -7 8 -79 8 -160 0 -125 -2 -148 -15 -148 -8 0 -46 17 -85 38 l-70 37 -3 315 c-3 336 5 640 18 640 4 0 15 -15 23 -32z m1410 -454 l2 -467 -60 -33 c-33 -18 -72 -36 -87 -39 -26 -7 -27 -5 -31 37 -2 29 -4 20 -5 -29 -2 -54 1 -73 11 -73 7 0 46 11 87 26 41 14 83 28 92 31 17 5 18 37 21 442 l2 436 1 -475 c1 -261 -1 -463 -3 -447 -2 15 -7 27 -11 27 -4 0 -42 -11 -85 -25 -43 -14 -86 -25 -97 -25 -10 0 -21 -6 -23 -12 -8 -20 -8 106 1 217 7 97 7 98 14 45 3 -32 5 -2 3 70 -2 69 0 109 3 90 5 -21 7 14 8 87 0 80 4 126 12 136 7 8 9 22 6 31 -4 9 -1 61 7 114 10 76 14 91 20 67 4 -19 7 -23 8 -10 2 37 41 176 61 223 15 32 24 42 31 35 7 -7 11 -161 12 -479z m-1243 -29 c28 -34 60 -522 60 -912 0 -253 -4 -297 -24 -290 -8 3 -13 119 -18 393 -5 336 -22 630 -44 782 -7 44 3 54 26 27z m1060 -63 c-22 -154 -40 -531 -40 -823 0 -303 -6 -357 -31 -292 -17 42 -5 732 16 958 14 146 21 185 37 208 11 15 22 26 24 24 3 -2 0 -36 -6 -75z m-1150 -575 l60 -12 0 -175 c0 -201 -13 -305 -65 -505 -60 -236 -70 -257 -79 -164 -6 67 -36 770 -36 851 l0 46 30 -15 c17 -8 58 -20 90 -26z m1329 -247 c-5 -157 -14 -364 -19 -460 -5 -96 -10 -184 -10 -195 -1 -84 -87 213 -125 429 -10 58 -15 152 -15 276 l0 188 48 7 c26 3 65 14 87 24 22 10 41 18 42 17 1 -1 -2 -130 -8 -286z";
					//var car = "M 125.00,6.25 C 161.25,6.25 162.25,6.75 174.75,30.87 186.50,53.62 192.50,78.12 196.63,121.25 196.88,123.87 197.13,122.62 197.25,118.25 197.50,109.62 194.75,88.87 191.25,73.50 186.25,52.00 178.25,31.87 169.50,18.87 167.00,15.12 165.25,11.87 165.63,11.50 167.00,10.00 182.63,15.50 189.63,20.00 189.63,20.00 197.38,24.87 197.38,24.87 197.38,24.87 201.13,37.12 201.13,37.12 209.38,63.87 214.88,103.25 215.13,136.50 215.25,149.75 215.63,154.25 216.38,151.25 217.75,145.62 215.63,102.87 213.13,86.12 210.00,65.00 205.50,44.12 201.88,33.75 200.88,30.87 200.00,28.12 200.00,27.75 200.00,25.75 210.88,37.87 215.88,45.37 225.75,60.12 225.63,59.62 225.63,110.87 225.63,155.62 225.63,156.25 228.25,158.00 230.38,159.63 231.63,159.63 234.88,158.38 238.38,157.13 239.00,157.25 242.13,160.25 244.63,162.75 245.50,165.00 245.63,169.37 245.88,173.25 245.38,175.37 244.25,175.88 241.63,176.87 230.00,169.75 229.25,166.50 228.75,164.87 227.50,163.75 226.13,163.75 223.88,163.75 223.75,165.50 223.75,209.87 223.75,248.38 224.00,256.50 225.63,259.50 228.00,264.00 228.00,275.00 225.88,280.38 223.38,286.25 221.75,366.63 223.25,402.88 223.88,416.63 223.75,421.13 222.13,425.38 221.13,428.25 219.88,432.88 219.38,435.63 217.75,445.88 199.38,477.50 195.13,477.50 194.50,477.50 194.63,475.13 195.25,472.13 197.00,465.00 195.63,448.50 192.75,439.38 189.88,430.50 189.25,433.75 191.88,443.75 194.25,452.63 194.38,471.25 192.00,476.88 189.88,481.88 182.50,486.00 168.50,490.13 161.00,492.25 154.75,492.88 133.63,493.38 97.25,494.38 82.88,492.38 64.75,483.75 59.88,481.50 58.50,480.13 57.50,476.38 54.25,464.88 54.63,456.75 59.38,436.88 60.13,434.13 60.00,433.50 58.88,434.50 55.88,437.25 53.50,453.88 54.25,466.13 54.88,476.63 54.75,477.63 53.00,476.13 46.00,470.25 30.00,441.38 30.00,434.50 30.00,432.63 29.13,429.13 28.13,426.63 26.63,423.13 26.25,418.25 26.50,407.00 26.63,398.63 26.63,367.62 26.38,338.13 26.00,295.38 25.63,283.63 24.25,281.00 22.00,276.63 22.00,264.50 24.38,258.13 25.75,254.12 26.13,244.12 26.25,208.38 26.25,166.62 26.13,163.75 24.00,163.75 22.88,163.75 21.25,165.00 20.63,166.50 19.88,168.00 16.25,171.12 12.50,173.38 6.13,177.13 5.50,177.37 4.00,175.37 1.63,172.13 2.25,167.25 5.38,163.25 7.75,160.37 9.38,159.63 14.00,159.50 17.13,159.37 21.00,158.38 22.50,157.38 22.50,157.38 25.38,155.50 25.38,155.50 25.38,155.50 24.00,125.62 24.00,125.62 22.75,97.62 23.25,76.62 25.63,63.12 27.00,55.62 34.25,43.37 42.50,34.62 42.50,34.62 49.88,26.87 49.88,26.87 49.88,26.87 47.50,35.00 47.50,35.00 43.00,50.00 38.88,70.50 36.38,90.00 33.50,112.62 31.63,155.00 33.38,155.00 34.13,155.00 34.63,147.50 34.75,137.13 35.25,100.50 39.13,71.75 47.75,40.62 52.00,25.50 53.63,23.12 62.25,18.37 68.50,15.00 81.75,10.75 83.75,11.50 84.38,11.75 83.25,14.37 81.13,17.50 75.75,25.50 69.63,37.87 65.63,48.75 61.63,60.00 55.00,87.87 55.13,93.12 55.13,95.12 56.63,90.25 58.25,82.25 62.25,62.62 67.88,45.50 74.63,31.87 81.75,17.62 86.63,11.50 93.00,8.62 97.50,6.62 101.50,6.25 125.00,6.25 Z M 54.63,98.50 C 53.75,95.50 52.50,109.25 51.63,132.50 51.00,152.38 50.50,156.00 48.63,158.63 45.50,162.50 45.63,166.50 49.25,183.75 50.88,191.62 52.88,203.13 53.75,209.38 54.63,215.50 55.50,220.75 55.63,221.00 55.75,221.12 60.00,219.87 65.13,218.25 83.75,212.13 91.50,211.25 125.00,211.25 158.00,211.25 167.88,212.37 182.50,217.75 194.50,222.13 193.75,222.87 197.00,203.75 198.50,194.50 200.75,183.00 201.75,178.38 204.38,167.25 204.25,164.00 201.25,159.12 199.38,155.88 198.75,152.25 198.38,141.00 198.38,141.00 198.00,126.87 198.00,126.87 198.00,126.87 197.75,140.75 197.75,140.75 197.75,140.75 197.50,154.63 197.50,154.63 197.50,154.63 192.25,153.63 192.25,153.63 189.25,153.12 186.50,152.62 186.00,152.50 185.63,152.50 184.88,154.75 184.38,157.50 183.38,163.62 177.63,171.75 172.38,174.37 170.25,175.50 165.50,176.75 161.88,177.13 149.00,178.50 137.25,169.12 135.50,156.13 135.50,156.13 134.63,150.00 134.63,150.00 134.63,150.00 115.75,150.00 115.75,150.00 95.75,150.00 65.00,152.00 57.25,153.75 57.25,153.75 52.50,154.75 52.50,154.75 52.50,154.75 52.50,142.25 52.50,142.25 52.50,135.37 53.13,123.12 53.88,114.87 54.63,106.75 55.00,99.37 54.63,98.50 Z M 31.13,170.62 C 29.13,182.25 29.50,297.13 31.75,348.75 32.63,369.75 33.50,382.13 33.50,376.25 33.63,370.38 33.13,349.88 32.50,330.75 31.75,311.50 31.50,295.63 31.75,295.25 32.13,295.00 36.50,296.25 41.63,298.00 46.88,299.75 52.50,301.25 54.25,301.25 56.63,301.25 57.50,302.00 57.88,304.63 58.13,306.63 58.38,303.00 58.38,296.88 58.25,289.75 58.13,288.25 57.88,292.75 57.50,297.63 56.88,300.00 55.75,300.00 54.88,300.00 49.13,298.38 43.00,296.25 36.88,294.25 31.63,292.50 31.50,292.50 30.63,292.50 32.25,168.00 33.13,164.63 34.50,159.63 37.00,160.50 40.50,167.13 42.25,170.50 43.63,172.63 43.75,172.13 43.75,171.62 42.63,169.00 41.38,166.38 36.00,156.00 33.50,157.13 31.13,170.62 Z M 36.25,163.75 C 34.63,163.75 33.63,201.75 34.00,243.75 34.00,243.75 34.38,283.13 34.38,283.13 34.38,283.13 43.13,287.75 43.13,287.75 48.00,290.38 52.75,292.50 53.75,292.50 55.38,292.50 55.63,289.63 55.63,274.00 55.63,263.88 55.13,254.87 54.63,254.00 54.00,253.13 53.88,248.62 54.25,244.00 54.63,239.38 54.50,237.25 54.00,239.38 53.38,241.75 53.00,237.87 53.00,229.50 52.88,220.13 52.50,215.63 51.38,215.25 50.50,215.00 50.13,212.75 50.38,209.00 50.75,205.75 50.63,204.50 50.25,206.25 49.88,208.25 48.88,205.13 47.38,197.00 45.13,184.12 42.38,174.87 39.13,167.75 38.13,165.62 36.75,163.75 36.25,163.75 Z M 213.88,164.63 C 213.00,163.75 211.88,165.00 210.00,169.00 207.50,174.87 202.63,192.25 202.38,196.88 202.25,198.50 201.88,198.00 201.38,195.63 200.63,192.63 200.13,194.50 198.88,204.00 197.88,210.63 197.50,217.13 198.00,218.25 198.38,219.38 198.13,221.12 197.25,222.13 196.25,223.38 195.75,229.12 195.75,239.12 195.63,248.25 195.38,252.63 194.75,250.00 194.38,247.63 194.13,252.63 194.38,261.25 194.63,270.25 194.38,274.00 194.00,270.00 193.13,263.38 193.13,263.50 192.25,275.63 191.13,289.50 191.13,305.25 192.13,302.75 192.38,302.00 193.75,301.25 195.00,301.25 196.38,301.25 201.75,299.88 207.13,298.13 212.50,296.38 217.25,295.00 217.75,295.00 218.25,295.00 218.88,296.50 219.13,298.38 219.38,300.38 219.63,275.13 219.50,242.50 219.50,242.50 219.38,183.13 219.38,183.13 219.38,183.13 219.13,237.63 219.13,237.63 218.75,288.25 218.63,292.25 216.50,292.88 215.38,293.25 210.13,295.00 205.00,296.75 199.88,298.63 195.00,300.00 194.13,300.00 192.88,300.00 192.50,297.63 192.75,290.88 192.88,284.75 193.13,283.63 193.38,287.25 193.88,292.50 194.00,292.75 197.25,291.88 199.13,291.50 204.00,289.25 208.13,287.00 208.13,287.00 215.63,282.88 215.63,282.88 215.63,282.88 215.38,224.50 215.38,224.50 215.25,184.75 214.75,165.50 213.88,164.63 Z M 56.75,231.50 C 59.50,250.50 61.63,287.25 62.25,329.25 62.88,363.50 63.50,378.00 64.50,378.38 67.00,379.25 67.50,373.75 67.50,342.13 67.50,293.38 63.50,232.37 60.00,228.13 57.13,224.75 55.88,226.00 56.75,231.50 Z M 193.25,226.62 C 193.00,226.38 191.63,227.75 190.25,229.63 188.25,232.50 187.38,237.37 185.63,255.63 183.00,283.88 181.50,370.12 183.63,375.38 186.75,383.50 187.50,376.75 187.50,338.87 187.50,302.38 189.75,255.25 192.50,236.00 193.25,231.12 193.63,226.88 193.25,226.62 Z M 37.50,304.63 C 37.50,304.63 33.75,302.75 33.75,302.75 33.75,302.75 33.75,308.50 33.75,308.50 33.75,318.63 37.50,406.50 38.25,414.88 39.38,426.50 40.63,423.88 48.13,394.38 54.63,369.38 56.25,356.37 56.25,331.25 56.25,331.25 56.25,309.38 56.25,309.38 56.25,309.38 48.75,307.88 48.75,307.88 44.75,307.13 39.63,305.63 37.50,304.63 Z M 215.88,303.00 C 215.75,302.88 213.38,303.88 210.63,305.13 207.88,306.38 203.00,307.75 199.75,308.13 199.75,308.13 193.75,309.00 193.75,309.00 193.75,309.00 193.75,332.50 193.75,332.50 193.75,348.00 194.38,359.75 195.63,367.00 200.38,394.00 211.13,431.13 211.25,420.63 211.25,419.25 211.88,408.25 212.50,396.25 213.13,384.25 214.25,358.38 214.88,338.75 215.63,319.25 216.00,303.13 215.88,303.00 Z";
					/**var icon = {
					    path: car,
					    scale: .6, //.7,
					    strokeColor: '#404040',
					    strokeWeight: 2,
					    fillOpacity: 1,
					    fillColor: '#aaaaaa',
					    offset: '5%',
					    rotation: bearing,
					    anchor: new google.maps.Point(10, 25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
					};**/
					var ddx = 100001 ;
					layer = document.querySelectorAll('#markerLayer div');
					_.forEach(layer, function(element) {
						if (element.style) {
							if (element.style.zIndex==ddx) {
								//console.log(element);
								img = element.querySelector("img");
								// img.style.transform = 'rotate(' + data.heading + 'deg)';
							}
						}
					});
					/**layer.forEach(function(element) {
						if (element.style) {
							if (element.style.zIndex == ddx) {
								//console.log(element);
								img = element.querySelector("img");
								// img.style.transform = 'rotate(' + data.heading + 'deg)';
							}
						}
					});**/
					var icon = {
						url: $scope.taxi_marker,
						scaledSize: new google.maps.Size(40, 40),
						//rotation: data.heading,
						origin: new google.maps.Point(0, 0),
						anchor: new google.maps.Point(20, 20) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
					};
					/**var panToMarker = function(){
						positionPrev[0] += deltaLat;
			        	positionPrev[1] += deltaLng;
		        		if(i % 2 == 0){
							var panlatlng = new google.maps.LatLng(positionPrev[0], positionPrev[1]);
							$scope.map.panTo(panlatlng);
							//console.log("PAN TO: " + positionPrev[0] + ", " + positionPrev[1] + " - " + i);
						}
			        	
			        	if(i < numDeltas){
							i++;
				            setTimeout(function(){
								panToMarker();
							},delay);
				        }
					}**/
				    var moveMarker = function(marker){
				    	/**position[0] += deltaLat;
				        position[1] += deltaLng;
						//console.log("Moving i: " + i);
				        var translatlng = new google.maps.LatLng(position[0], position[1]);
						if(position[0] !== null){
							if(i % 2 == 0){
						        marker.setPosition(translatlng);
						    }
					        if(!$scope.map_moved_by_user || lastLocationUpdate === 0) {
			                    if($scope.passenger && $scope.ride.pickup_lat !== null && $scope.ride.pickup_long != null){
			                        movingActive = false;
			                        return;
			                    }

			                    //$scope.map.panTo(translatlng);
			                    //controller.common.zoomIfNeeded();
			                }
					    }else{
				        if(i < numDeltas){
							movingActive = true;
				            i++;
				            setTimeout(function(){
								moveMarker(marker);
							},delay);
				        }else{
				        	movingActive = false;
				        	i = 0;
				        	var panCenter = GoogleMaps.map.center;
				        	positionPrev = [panCenter.lat(), panCenter.lng()];
				        	deltaLat = (parseFloat(marker.getPosition().lat()) - parseFloat(panCenter.lat()))/numDeltas;
							deltaLng = (parseFloat(marker.getPosition().lng()) - parseFloat(panCenter.lng()))/numDeltas;
							panToMarker();
				        	//console.log("RETURN on moving = false");
				        	return;
				        }**/
				        //console.log("UPDATELOCATION: 30");
				        position[0] += deltaLat;
				        position[1] += deltaLng;
				        var translatlng = new google.maps.LatLng(position[0], position[1]);
						if(translatlng.lat !== null){
					        marker.setPosition(translatlng);
					    }
				        if(i < numDeltas){
				        	movingActive = true;
				            i++;
				            setTimeout(function(){
								moveMarker(marker);
								return;
							},delay);
				        }else{
				        	movingActive = false;
				        }
				        //console.log("UPDATELOCATION: 31");
				        //marker.setPosition(pos);
				        movingActive = false;
				        
				        if($scope.has_request) {
				        	if(movingActive == false && rotationActive == false){
								/**if($scope.map_moved_by_user == false){
									var bounds = new google.maps.LatLngBounds();
									bounds.extend(pos);
									var destination = new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long);
									if(!$scope.request_is_ongoing) {
										destination = new google.maps.LatLng($scope.current_request.pickup_lat, $scope.current_request.pickup_long);
									}
									bounds.extend(destination);
									$scope.map.fitBounds(bounds);
								}**/
								/**var origin = {latitude: pos.lat(), longitude: pos.lng()};
								var dest = {latitude: destination.lat(), longitude: destination.lng()};
								var params = {
						            mode: google.maps.DirectionsTravelMode.DRIVING,
						            unitSystem: TaxiRide.distance_unit === "km" ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL,
						            request: {}
						        };
					        	var route = GoogleMaps.calculateRoute(origin, dest, params, true);
					        	// Clear past routes
		                        if (_.isObject($scope.directionsRenderer)) {
		                            $scope.directionsRenderer.setMap(null);
		                            $scope.directionsRenderer = null;
		                        }
		                        $scope.directionsRenderer = new google.maps.DirectionsRenderer({
		                            suppressMarkers: true,
		                            suppressInfoWindows: true,
		                            suppressBicyclingLayer: true
		                        });
		                        GoogleMaps.addRoute(route, $scope.directionsRenderer);**/
		                        //$scope.map.fitBounds(bounds);
		                    }
				        }
				        
				    }
				    
				    var rotateMarker = function(marker, rotateTo){
				    	console.log("ROTATE: " + rotateTo);
				    	var curRotation = parseInt(marker.icon.rotation);
				        if(isNaN(curRotation)){
				        	curRotation = 0; //bearing;
				        }
				        var newRotation = parseInt(rotateTo);
				        if(isNaN(newRotation)){
				        	//console.log("UPDATELOCATION: 21");
				        	var token_icon = marker.getIcon();
							marker.setIcon(_.merge(token_icon, icon));
							deltaLat = (parseFloat(pos.lat()) - parseFloat(marker.getPosition().lat()))/numDeltas;
					        deltaLng = (parseFloat(pos.lng()) - parseFloat(marker.getPosition().lng()))/numDeltas;
					        position = [marker.getPosition().lat(), marker.getPosition().lng()];
					        positionPrev = position;
					        i = 0;
					        rotationActive = false;
					        moveMarker(marker);
				        	return;
				        }
						
						if(rotationActive == undefined || isNaN(rotationActive)){
				        	rotationActive = false;
				        }
				        if(rotationActive == false){
				        	//console.log("UPDATELOCATION: 22");
				        	x = 0;
				        	turnClockwise = true;
				        	degreeDifference = Math.abs(newRotation - curRotation);
				        	delayDuration = 5 * degreeDifference;
				        	if(newRotation > curRotation){
				        		turnClockwise = true;
				        	}else{
				        		turnClockwise = false;
				        	}
				        	if(degreeDifference > 180){
				        		degreeDifference = 360 - degreeDifference;
				        		if(turnClockwise == false){
				        			turnClockwise = true;
				        		}else{
				        			turnClockwise = false
				        		}
				        	}
				        	
				        }
						//console.log("curRotationD: " + curRotation + ", newRotationD: " + newRotation + ", rotationActive: " + rotationActive);
				        if(curRotation == newRotation){
				        	//console.log("UPDATELOCATION: 23");
				        	//console.log("Rotate: 5 - " + newRotation);
							img.style.transform = 'rotate(' + newRotation + 'deg)';
							icon.rotation = newRotation;
				        	marker.setIcon(_.merge(marker.getIcon(), icon));
				        	rotationActive = false;
				        	deltaLat = (parseFloat(pos.lat()) - parseFloat(marker.getPosition().lat()))/numDeltas;
					        deltaLng = (parseFloat(pos.lng()) - parseFloat(marker.getPosition().lng()))/numDeltas;
					        position = [marker.getPosition().lat(), marker.getPosition().lng()];
					        positionPrev = position;
					        i = 0;
							moveMarker(marker);
				        	return;
				        }else{
				        	//console.log("UPDATELOCATION: 24");
				        	delayForRotation = true;
							rotationActive = true;
				        	
							if(turnClockwise){
								//console.log("UPDATELOCATION: 25");
				        		if(curRotation == 360){curRotation = 0;}
				        		curRotation = curRotation + 1;
				        		//console.log("Rotate: 6 - " + curRotation);
								img.style.transform = 'rotate(' + curRotation + 'deg)';
								icon.rotation = curRotation;
				        		marker.setIcon(icon);
				        		//console.log("Positive rotationD: " + curRotation);
				        		if(x < degreeDifference){
						            x++;
						            setTimeout(function(){
										rotateMarker(marker, parseInt(rotateTo));
									},5);
						        }else{
						        	//console.log("Rotate: 7 - " + newRotation);
									img.style.transform = 'rotate(' + newRotation + 'deg)';
									icon.rotation = newRotation;
						        	marker.setIcon(icon); //marker.setIcon(_.merge(marker.getIcon(), icon));
						        	rotationActive = false;
						        	deltaLat = (parseFloat(pos.lat()) - parseFloat(marker.getPosition().lat()))/numDeltas;
							        deltaLng = (parseFloat(pos.lng()) - parseFloat(marker.getPosition().lng()))/numDeltas;
							        position = [marker.getPosition().lat(), marker.getPosition().lng()];
							        positionPrev = position;
					        		i = 0;
									moveMarker(marker);
						        	return;
						        }
				        	}else{
				        		//console.log("UPDATELOCATION: 26");
				        		if(curRotation == 0){curRotation = 360;}
				        		curRotation = curRotation - 1;
				        		//console.log("Rotate: 8 - " + newRotation);
								img.style.transform = 'rotate(' + newRotation + 'deg)';
								icon.rotation = curRotation;
				        		marker.setIcon(icon);
				        		//console.log("Negative rotationD: " + curRotation);
				        		if(x < degreeDifference){
						            x++;
						            setTimeout(function(){
										rotateMarker(marker, parseInt(rotateTo));
									},5);
						        }else{
						        	//console.log("Rotate: 9 - " + newRotation);
									img.style.transform = 'rotate(' + newRotation + 'deg)';
									icon.rotation = newRotation;
						        	marker.setIcon(icon); //marker.setIcon(_.merge(marker.getIcon(), icon));
						        	rotationActive = false;
						        	deltaLat = (parseFloat(pos.lat()) - parseFloat(marker.getPosition().lat()))/numDeltas;
							        deltaLng = (parseFloat(pos.lng()) - parseFloat(marker.getPosition().lng()))/numDeltas;
							        position = [marker.getPosition().lat(), marker.getPosition().lng()];
							        positionPrev = position;
					        		i = 0;
									moveMarker(marker);
						        	return;
						        }
				        		
				        	}
				        	
				        }
				        if(rotationActive == false){
				        	//console.log("RETURN on rotation = false");
						    return;
						}
				    }
				    
				    var transition = function(result, marker){
						console.log("TRANSITION");
				    	var resultLat = Math.round(parseFloat((result.lat() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
				    	var resultLng = Math.round(parseFloat((result.lng() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
				    	var markerLat = Math.round(parseFloat((marker.getPosition().lat() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
				    	var markerLng = Math.round(parseFloat((marker.getPosition().lng() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
				    	//console.log("UPDATELOCATION: 10");
				    	
						//console.log("UPDATELOCATION: 11");
				        //console.log("NEW MOVE TO: " + resultLat + ", " + resultLng +", marker.getPosition(): " +  markerLat + ", " +  markerLng + ", movingActive: " + movingActive + ", rotationActive: " + rotationActive);
				        if((resultLat == markerLat && resultLng == markerLng) || movingActive == true){
				        	//console.log("Rotate: 10 - " + bearing);
							if(img !== null){
								img.style.transform = 'rotate(' + bearing + 'deg)';
								icon.rotation = bearing;
								marker.setIcon(icon);
							}
				        	//console.log("UPDATELOCATION: 12");
				        	return;
				        }else if (rotationActive == true){	
							//console.log("Return back");
							//console.log("UPDATELOCATION: 13");
				        	return;
				        }
						
						//i = 0;
					    //x = 0;
					    delayForRotation = false;
					    delayDuration = 0;
					    rotationActive = false;
					    movingActive = false;
					    turnClockwise = true;
						
						if($scope.has_request){
							//console.log("UPDATELOCATION: 14");
							if($scope.request_is_ongoing){
								TaxiRide.calculateRoute(
									{
										lat: parseFloat(resultLat),
										lng: parseFloat(resultLng)
									},
									{
										lat: parseFloat($scope.current_request.dropoff_lat),
										lng: parseFloat($scope.current_request.dropoff_long)
									}
								).then(function(route) {
									var duration = _.get(route, "routes[0].legs[0].duration.text");
									var distance = _.get(route, "routes[0].legs[0].distance.text");  
									//var arrivalTime =  _.get(route, "routes[0].legs[0].arrival_time.text");
									if(duration=='1 min'){
										$scope.arrivalInfo = "You are arriving now";
									}else{
										$scope.arrivalInfo = "Arrival: " + duration + " (" + distance + ")";
									}
								});
								
								/**if($scope.tripZoomingInterval == null && $scope.driver){
									console.log("tripZoomingInterval is null....start timer")
									$scope.tripZoomingInterval = $interval(function() {
										if($scope.map_moved_by_user == false){
											console.log("Zoom - " + data.position.lat + ", dropOff: " + $scope.current_request.dropoff_lat);
											var bounds = new google.maps.LatLngBounds();
											var curPosition = new google.maps.LatLng(resultLat, resultLng);
											bounds.extend(curPosition);
											var destination = new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long);
											bounds.extend(destination);
											$scope.map.fitBounds(bounds);
											//$scope.map.panTo(result); 
										}
									}, 20000);
								}**/
							}else{
								TaxiRide.calculateRoute(
									{
										lat: parseFloat(resultLat),
										lng: parseFloat(resultLng)
									},
									{
										lat: parseFloat($scope.current_request.pickup_lat),
										lng: parseFloat($scope.current_request.pickup_long)
									}
								).then(function(route) {
									var passengerAlerted;
									var duration = _.get(route, "routes[0].legs[0].duration.text");
									var distance = _.get(route, "routes[0].legs[0].distance.text");  
									//var arrivalTime =  _.get(route, "routes[0].legs[0].arrival_time.text");
									if(duration=='1 min'){
										$scope.arrivalInfo = "Arriving now. PASSENGER ALERTED!";
									}else{
										$scope.arrivalInfo = "Arriving at pickup point in " + duration;
										passengerAlerted = false;
									}
								});
							}
							
							/**var popup = new Popup(
								new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long), document.getElementById('content')
							); 
							popup.setMap($scope.map);**/
						}
						/**if($scope.driver) {
							if($scope.tripZoomingInterval == null){
								$scope.tripZoomingInterval = $interval(function() {
									if($scope.map_moved_by_user == false){
										var bounds = new google.maps.LatLngBounds();
										var curPosition = new google.maps.LatLng($scope.currentPosition.latitude, $scope.currentPosition.longitude);
										bounds.extend(curPosition);
										var destination = new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long);
										bounds.extend(destination);
										$scope.map.fitBounds(bounds);
										//$scope.map.panTo(result); 
									}
								}, 20000);
							}
						}**/
						
						//console.log("UPDATELOCATION: 15");
						//icon.rotation = bearing;
				        //marker.setIcon(icon);
				        //moveMarker(marker);
				        
				        rotateMarker(marker, bearing);
						
						/**var mToken_icon = mToken.getIcon();
						if($scope.driver){
							marker.setIcon(_.merge(mToken_icon, icon));
						}
						if(delayForRotation){
							setTimeout(function(){
								moveMarker(marker);
							},delayDuration);
						}else{**/
						//moveMarker(marker);
						//}
					}
					
					
					
	                var mToken = $scope.myLocationMarker;
					if(_.isObject(mToken) && _.isFunction(mToken.setPosition)) {
						if($scope.driver){
							//console.log("UPDATELOCATION: 8");
							transition(pos, mToken);
						}else{
							//token.setIcon(_.merge(token_icon, { url: $scope.my_driver_token }));
							mToken.setPosition(pos);
						}
						if($scope.map_moved_by_user == false && !$scope.has_request){
							$scope.map.panTo($scope.myLocationMarker.getPosition());
						}
					} else {
						if($scope.driver){
							//console.log("UPDATELOCATION: 9");
							var ddx = 100001 ;
							//alert("Marker2: " + pos.lat());
							mToken = $scope.myLocationMarker = new google.maps.Marker({
						        position: pos,
						        map: $scope.map,
						        //optimized: false,
						        icon: icon,
								zIndex:ddx
						    });
							
							if (_.isFunction(_.get(window, 'plugins.socialsharing.loopLoc')) && pos != null) {
								//alert("latitude: " + pos.lat());
								window.plugins.socialsharing.loopLoc({lat: pos.lat(), lng: pos.lng(), bearing: 0},"",function(){
									//NOTHING TO DO
								},function(error){
									console.log(error)
								});
							}
						}else{
							var ddx = 100001 ;
							mToken = $scope.myLocationMarker = GoogleMaps.addMarker({
								latitude: positionObject.latitude,
								longitude: positionObject.longitude,
								zIndex: ddx,
								icon: {
									url: $scope.user_token,
									height: 60,
									width: 60
								},
								markerOptions: {
									icon: {
										origin: new google.maps.Point(0, 0),
										anchor: new google.maps.Point(30, 30)
									}
								}
							});
						}
						
					}
				}
			} catch (e) {
                console.error(e);
            }	
        };
        
        var xInterval = function(func, wait, times){
		    var interv = function(w, t){
		        return function(){
		            if(typeof t === "undefined" || t-- > 0){
		                setTimeout(interv, w);
		                try{
		                    func.call(null);
		                }
		                catch(e){
		                    t = 0;
		                    throw e.toString();
		                }
		            }
		        };
		    }(wait, times);

		    setTimeout(interv, wait);
		};
		
		
		this.startLocationUpdates = function() {
			console.log("updatesStarted: " + updatesStarted);
			if(!updatesStarted){
				updatesStarted = true;
	            lastLocationUpdate = 0;
				//alert(_.isFunction(_.get(window, 'plugins.socialsharing.getLocation')));
				if($scope.driver) {
					console.log("Send location 0");
					if (_.isFunction(_.get(window, 'plugins.socialsharing.getLocation'))) {
						console.log("Send location 0a");
						
						//HAVE PARALLEL WATCHERS
						/**$cordovaGeolocation.getCurrentPosition(controller.common.updateLocation, console.error.bind(console));
						$scope.locationWatcher = $cordovaGeolocation.watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
						$scope.locationWatcher.then(null, console.error.bind(console), function() {
							console.log("locationWatcher FIRES");
							controller.common.updateLocation
							
						});**/
						
						//first two params may contain input into the plugin, the last two contain success and error callbacks which can be modified
						$scope.locationIntervalFG = xInterval(function() {
					        var thisCustomer = "{\"id\"" + ":\"" + Customer.id + "\"}";
							thisCustomer = JSON.parse(thisCustomer);
							
							console.log("LOCATION TIMER FIRING");
							
							window.plugins.socialsharing.getLocation(thisCustomer,"",function(result){
								var cLoc = JSON.parse(result);
								var coordObject = {};
								coordObject.latitude = parseFloat(cLoc.coords.latitude);
								coordObject.longitude = parseFloat(cLoc.coords.longitude);
								coordObject.heading = parseFloat(cLoc.coords.bearing);
								var now = (+new Date());
								if(_.isNumber(cLoc.coords.latitude)) {
									console.log("Send location 2: " + JSON.stringify(coordObject)); 
									controller.common.updateLocation({timestamp: now, coords: coordObject});
									$scope.currentPosition = coordObject;
								}else if(_.isNumber(lastLocationCoords.latitude)) {
									if(lastLocationUpdate+5000 < now) { // If we have no new coordinates before 5 seconds, send old coordinates
										console.log("Send location 3: " + JSON.stringify(lastLocationCoords));
										controller.common.updateLocation({timestamp: now, coords: lastLocationCoords});
										$scope.currentPosition = lastLocationCoords;
									}
									
								}
								$scope.positionLoaded = true;
							},function(e){ 
								alert("error location: " + e);
							});
					    }, 3000);
						
						//$scope.locationWatcher = $cordovaGeolocation.watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
						//$scope.locationWatcher.then(null, console.error.bind(console), controller.common.updateLocation);
						/**$scope.locationWatcher.then(null, console.error.bind(console), function(data) {
							alert(JSON.stringify(data));
							var now = (+new Date());
							controller.common.updateLocation({timestamp: now, coords: data});
						});**/
						
						
						
						/**$scope.locationIntervalFG = $interval(function() {
							//alert("Start");
							var thisCustomer = "{\"id\"" + ":\"" + Customer.id + "\"}";
							thisCustomer = JSON.parse(thisCustomer);
							
							window.plugins.socialsharing.getLocation(thisCustomer,"",function(result){
								//alert(result);
								var cLoc = JSON.parse(result);
								//console.log("RESULTS LOCATION: " + JSON.stringify(result));							
								//alert(cLoc.lat+"---"+cLoc.lng);
								var coordObject = {};
								//coordObject.coords = {};
								coordObject.latitude = parseFloat(cLoc.coords.latitude);
								coordObject.longitude = parseFloat(cLoc.coords.longitude);
								//coordObject.accuracy = parseFloat(cLoc.accuracy);
								//alert("2");
								//coordObject.altitude = parseFloat(cLoc.altitude);
								//coordObject.altitudeAccuracy = parseFloat(cLoc.altitudeAccuracy);
								//alert("3");
								coordObject.heading = parseFloat(cLoc.coords.bearing);
								//coordObject.speed = parseFloat(cLoc.speed);
								//alert("Position: " + JSON.stringify(coordObject));
								//controller.common.updateLocation(coordObject);
								//console.log("lastLocationCoords: " + JSON.stringify(lastLocationCoords) + ", coordObject: " + JSON.stringify(coordObject));
								var now = (+new Date());
								console.log("Send location 1");
								controller.common.updateLocation({timestamp: now, coords: coordObject});
							},function(e){ 
								alert("error location: " + e);
							});
						}, 5000);**/
					}else{
						console.log("Send location 2: " + JSON.stringify(lastLocationCoords)); 
						//$cordovaGeolocation.getCurrentPosition(controller.common.updateLocation, console.error.bind(console));
						$scope.locationWatcher = $cordovaGeolocation.watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
						$scope.locationWatcher.then(null, console.error.bind(console), controller.common.updateLocation);
						$scope.locationInterval = $interval(function() {
							console.log("Send location interval: " + JSON.stringify(lastLocationCoords) + ", lastLocationUpdate: " + lastLocationUpdate);
			                if(_.isNumber(lastLocationCoords.latitude)) {
			                    var now = (+new Date());
			                    if(lastLocationUpdate+5000 < now) { // If we have no new coordinates before 5 seconds, send old coordinates
			                    	console.log("Send location 3");
			                        controller.common.updateLocation({timestamp: now, coords: lastLocationCoords});
									$scope.currentPosition = lastLocationCoords;
			                    }
			                }
							//if (TaxiRide.current_request === null) {
							
							//}
							$scope.positionLoaded = true;
			            }, 5000);
					}
					
					/**if (_.isFunction(_.get(window, 'plugins.socialsharing.loopLoc')) && $scope.currentPosition != null) {
						alert("latitude: " + $scope.currentPosition.latitude + ", heading: " + $scope.currentPosition.heading);
						window.plugins.socialsharing.loopLoc({lat: $scope.currentPosition.latitude, lng: $scope.currentPosition.longitude, bearing: Math.round($scope.currentPosition.heading)},"",function(){
							//NOTHING TO DO
						},function(error){
							console.log(error)
						});
					}else{
						alert("Not function loopLoc or currentPosition: " + $scope.currentPosition);
					}**/ 
					
				}else{
					//$cordovaGeolocation.getCurrentPosition(controller.common.updateLocation, console.error.bind(console));
					$scope.locationWatcher = $cordovaGeolocation.watchPosition({ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
					$scope.locationWatcher.then(null, console.error.bind(console), controller.common.updateLocation);
					$scope.locationInterval = $interval(function() {
		                if(_.isNumber(lastLocationCoords.latitude)) {
		                    var now = (+new Date());
		                    if(lastLocationUpdate+5000 < now) { // If we have no new coordinates before 5 seconds, send old coordinates
		                    	console.log("Send location 4");
		                        controller.common.updateLocation({timestamp: now, coords: lastLocationCoords});
								$scope.currentPosition = lastLocationCoords;
		                    }
		                }
						//if (TaxiRide.current_request === null) {
						
						//}
						$scope.positionLoaded = true;
		            }, 5000);
				}
			}
        };


        this.stopLocationUpdates = function() {
			console.log("LOCATION UPDATES STOPPED!!");
			updatesStarted = false;
            if(_.isObject($scope.locationWatcher) && _.isFunction($scope.locationWatcher.clearWatch))
                $scope.locationWatcher.clearWatch();
            $scope.locationWatcher = null;

            if(_.isObject($scope.myLocationMarker)) {
                if(_.isFunction($scope.myLocationMarker.setMap))
                    $scope.myLocationMarker.setMap(null);
                $scope.myLocationMarker = null;
            }

            if($scope.locationInterval !== null)
                $interval.cancel($scope.locationInterval);
			
			if($scope.locationIntervalFG !== null)
                $interval.cancel($scope.locationIntervalFG);
        };

        this.initMap = function() {
            resetMapListeners.push(
                $scope.$on("$ionicView.loaded", controller.common.redrawMap)
            );
            resetMapListeners.push(
                $scope.$on("$ionicView.afterEnter", controller.common.redrawMap)
            );

            $scope.map = GoogleMaps.createMap('map', MAP_OPTIONS);
			
			//OVERLAY FOR DRIVERS
			var overlay = new google.maps.OverlayView();
			overlay.draw = function() {
				this.getPanes().markerLayer.id = 'markerLayer';
			}
			overlay.setMap($scope.map);
			
			//OVERLAY FOR MY CAR
			/**var overlayMe = new google.maps.OverlayView();
			overlayMe.draw = function() {
				this.getPanes().markerLayer.id = 'markerLayerMe';
			}
			overlayMe.setMap($scope.map);
			**/
			var trafficLayer = new google.maps.TrafficLayer();
			trafficLayer.setMap($scope.map);

            var mapMovedByUser = function() {
                $timeout(function() {
                    $scope.map_moved_by_user = true;
                });
            };

            $scope.$on(GoogleMaps.USER_INTERACTED_EVENT, mapMovedByUser);

            if(/^(passenger|driver)$/.test($scope.role)) {
                if(_.isFunction(controller[$scope.role].initMap)) {
                    controller[$scope.role].initMap();
                }
            }

            $ionicLoading.show({
                template: "<ion-spinner class=\"spinner-custom\"></ion-spinner>"
            });

            $scope.restoreTimeout = $timeout(function() {
                $ionicLoading.hide();
            }, 10000);

            $timeout(function() {
                controller.common.redrawMap();
                $scope.initedGmap = true;

                //reload current request
				if($scope.driver) {
					$scope.goOnline();
					TaxiRide.restoreCurrentRequest().then(null, function() {
						if(_.isObject($scope.restoreTimeout)) {
							$timeout.cancel($scope.restoreTimeout);
						}
						$ionicLoading.hide();
						$scope.isRecordingPoints = false;
					});
					
				} else {
					//////console.log("Passenger wait 5 seconds to go Online");
					
					$timeout(function() {
						//////console.log("Go online and reload current request");
						try {
							TaxiRide.passenger.goOnline();
							//////console.log("Passenger online");
						} catch (e) {
							//////console.log("failed 1 time");
							try {
								TaxiRide.passenger.goOnline();
								//////console.log("Passenger online");
							} catch (e) {
								//////console.log("failed 2 times");
								try {
									TaxiRide.passenger.goOnline();
									//////console.log("Passenger online");
								} catch (e) {
									//////console.log("failed 3 times");
								}
							}
						}
						TaxiRide.restoreCurrentRequest().then(null, function() {
							if(_.isObject($scope.restoreTimeout)) {
								$timeout.cancel($scope.restoreTimeout);
							}
							$ionicLoading.hide();
						});
					}, 5000);
				}
                
            }, 1001);
            
            /** Defines the Popup class. */
            
			/**var definePopupClass = function() {
				/**
				* A customized popup on the map.
				* @param {!google.maps.LatLng} position
				* @param {!Element} content
				* @constructor
				* @extends {google.maps.OverlayView}
				*/
				/**Popup = function(position, content) {
					this.position = position;

					content.classList.add('popup-bubble-content');

					var pixelOffset = document.createElement('div');
					pixelOffset.classList.add('popup-bubble-anchor');
					pixelOffset.appendChild(content);

					this.anchor = document.createElement('div');
					this.anchor.classList.add('popup-tip-anchor');
					this.anchor.appendChild(pixelOffset);

					// Optionally stop clicks, etc., from bubbling up to the map.
					this.stopEventPropagation();
				};
				
				// NOTE: google.maps.OverlayView is only defined once the Maps API has
				// loaded. That is why Popup is defined inside initMap().
				Popup.prototype = Object.create(google.maps.OverlayView.prototype);

				//Called when the popup is added to the map.
				Popup.prototype.onAdd = function() {
					this.getPanes().floatPane.appendChild(this.anchor);
				};

				//Called when the popup is removed from the map.
				Popup.prototype.onRemove = function() {
					if (this.anchor.parentElement) {
						this.anchor.parentElement.removeChild(this.anchor);
					}
				};

				// Called when the popup needs to draw itself.
				Popup.prototype.draw = function() {
					var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
					// Hide the popup when it is far out of view.
					var display =
						Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000 ?
						'block' :
						'none';

					if (display === 'block') {
						this.anchor.style.left = divPosition.x + 'px';
						this.anchor.style.top = divPosition.y + 'px';
					}
					if (this.anchor.style.display !== display) {
						this.anchor.style.display = display;
					}
				};

				Stops clicks/drags from bubbling up to the map.
				Popup.prototype.stopEventPropagation = function() {
					var anchor = this.anchor;
					anchor.style.cursor = 'auto';

					['click', 'dblclick', 'contextmenu', 'wheel', 'mousedown', 'touchstart',
					 'pointerdown']
						.forEach(function(event) {
						  anchor.addEventListener(event, function(e) {
							  e.stopPropagation();
						  });
						});
				};
			}
			definePopupClass();**/

        };

        this.loadContent = function() {
            $scope.page_title = TaxiRide.page_title;

            controller.common.addMenu();

            TaxiRide.infosForCustomer(true).then(function(data) {
				console.log("customerINFOS: " + JSON.stringify(data));				
                $scope.user = data;
				$scope.role = data.role;
                $scope.driver = $scope.role == "driver";
                $scope.passenger = $scope.role == "passenger";
				$scope.registered_phone = data.registered_phone;
				//console.log("customerINFOS: " + JSON.stringify(data) + ", data.license_number: " + data.license_number);
				if(data.custom_fields !== null){
					if((data.custom_fields.license_number == null || data.custom_fields.license_number == undefined || data.custom_fields.license_number == "") && $scope.role == "driver"){
						console.log("No car");
						TaxiRide.hasCar = false;
					}
				}
				
				if(_.isNull(data.custom_fields) && !_.isNull(data.registered_phone)){
					var customData = "{\"phone\"" + ":\"" + data.registered_phone + "\", \"address\"" + ":\"12345678\"}";
					customData = JSON.parse(customData);
					TaxiRide.saveCustomerCustomFields(customData).then(function() {
						console.log("TaxiRide.saveCustomerCustomFields SUCCESS");
						if($scope.role == "passenger"){
							var payData = "{\"cash\":\"cash\"}";
							payData = JSON.parse(payData);
							TaxiRide.savePaymentsSettingsFields(payData).then(function() {
								console.log("TaxiRide.savePaymentsSettingsFields SUCCESS");
							});
						}
					}, function(resp) {
						if(_.isObject(resp) && _.isArray(resp.errors) && resp.errors.length > 0) {
							SafePopups.show('show', {
								subTitle: $translate.instant("An error occured while saving data!"),
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
								buttons: [{
									text: $translate.instant("OK")
								}]
							});
							
							
						} else {
							SafePopups.show('show', {
								title: $translate.instant("An error occured while saving data!"),
								template: $translate.instant("Please try again later."),
								buttons: [{
									text: $translate.instant("OK")
								}]
							});
						}
					}).finally(function() {
						//$scope.is_loading = false;
					});
				}
				$scope.user_image_url = data.image;
				$scope.user_image = Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: data.userID})) + ("?" +(+new Date()));
				$scope.user_rating = data.user_rating;
				if(_.isNull($scope.user_image) == false){
					$scope.show_image = true;
				}
				if(_.isNull($scope.user_rating) == false){
					$scope.show_rating = true;
					$scope.user_rating = Math.round($scope.user_rating * 100) / 100; 
				}
				$scope.firstname = data.user_fistname;
				TaxiRide.firstName = data.user_fistname;
				TaxiRide.user_image = $scope.user_image;
				TaxiRide.user_rate = $scope.user_rating;
				$scope.destinations = [];
				if($scope.role == 'passenger'){
					TaxiRide.getTopDestinations().success(function(dests) {
						_.forEach(dests, function(dest) {
							$scope.destinations.push(dest);
						});
						//console.log("Destinations: " + JSON.stringify($scope.destinations) + "role: " + $scope.role);
					});
				}
				
                controller.common.checkCustomer();
            }, function() {
                // console.error.apply(this, arguments);
            }).finally(function() {
                controller.common.loadGMap();

                if(_.isFunction(controller.passenger.loadContent))
                    controller.passenger.loadContent();

                if(_.isFunction(controller.driver.loadContent))
                    controller.driver.loadContent();

                $scope.is_loading = false;
            });
			
			
        };

        var postInit = function() {
            // We can't use $ionicView events : unreliable
            $scope.$on("$stateChangeSuccess", function(event, toState) {
                if(_.get(toState, "name") == "taxi_ride-map") {
                    controller.common.loadContent();
                    if(_.isFunction(_.get(window, "plugins.insomnia.keepAwake"))) {
                        window.plugins.insomnia.keepAwake();
                    }
                } else {
                    removeSideMenu();
                    showMenu = false;
                    if(_.isFunction(_.get(window, "plugins.insomnia.allowSleepAgain"))) {
                        window.plugins.insomnia.allowSleepAgain();
                    }
                }
            });
            $scope.$on(AUTH_EVENTS.loginSuccess, controller.common.checkCustomer);
            $scope.$on(AUTH_EVENTS.logoutSuccess, controller.common.checkCustomer);
            $scope.$on(TaxiRide.RECHECK_CUSTOMER, controller.common.checkCustomer);

            $scope.showSideMenu = function() {
                controller.common.addMenu(); // Just in case
                ContextualMenu.open();
            };	

            if(_.isFunction(_.get(window, "plugins.insomnia.keepAwake"))) {
                window.plugins.insomnia.keepAwake();
            }

            $scope.is_loading = false;
        };

        this.init = function() {
			//Lets check for any new updates and update our interface and functionality to the latest
			$scope.is_loading = true;
            $scope.is_loading = true;
            $scope.preInit = false;

            $scope.pickup_pin = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/pulse.gif";
            $scope.dropoff_pin = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/pulse-end.gif";
            $scope.user_token = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/user.png";
            //$scope.driver_token = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/driver.png";
            //$scope.my_driver_token = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/my_driver.png";
            //$scope.driver_pin = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/driver_pin.png";
			$scope.taxi_marker = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/nyota-car.png";

            $scope.myLocationMarker = null;
            $scope.myDriverMarker = null;
            $scope.all_valid = false;

            $scope.map_moved_by_user = true;
			
			$scope.showChat=function(){
				TaxiRide.showChatsModal(TaxiRide.current_request.taxiride_chat);
            }
			
			$scope.sendUrl = function(){
				TaxiRide.logData("Passenger SHARED their ride");
				TaxiRide.generateUrl(TaxiRide.current_request)
			}
			
			$scope.invite = function(){
				TaxiRide.showInviteModal({driverBonus: TaxiRide.referralBonusAmount, passBonus: TaxiRide.referralBonusAmount});
				TaxiRide.logData("User opened INVITE dialog");
			}

            
            $scope.showNav=function(){
				//console.log("Start Nav");
				if($scope.latNav){
					var navString="google.navigation:q="+$scope.latNav+","+$scope.lngNav;
					if (_.isFunction(_.get(window, 'plugins.socialsharing.startNavigation'))) {
						window.plugins.socialsharing.startNavigation("",navString,function(){ 
							console.log('google navigation..')
						},function(){ alert("erro location")});
					}
				}
			}
			
			$scope.call = function(telphoneNum){
				window.location.href = 'tel:'+ telphoneNum;
			}
			
			$scope.compareRates = function(){
				if ($scope.currentPosition !== null) {
					$scope.is_loading=false;
					TaxiRide.logData("Driver checked PRICE comparison with other drivers");
					TaxiRide.getAllDriversAroundLocation($scope.currentPosition, 1, 1);
				}/**else{
					$scope.is_loading = true;
					setTimeout(function(){
						$scope.compareRates();
					},3000);
				}**/
			}
			
			$scope.driverStatus = function(){
				$scope.is_loading=false;
				TaxiRide.logData("Driver checked their driver status PERFORMANCE");
				TaxiRide.getDriverStatus();
			}
			
			$scope.showMeter=function(){
				TaxiRide.logData("Opened live meter DIALOG");
				TaxiRide.showMeterModal();
			}
			
			$scope.markMessagesAsRead = function(){
				document.getElementById("messageDIV").style.display = "none";
				TaxiRide.markMessagesAsRead(lastLocationCoords.latitude, lastLocationCoords.longitude).success(function(data) {
					console.log("Message marked as read: " + JSON.stringify(data));
					TaxiRide.logData("User marked their messages as READ");
				});
			}
			
			$scope.hideMessages = function(){
				//setTimeout(function(){document.getElementById("messageDIV").style.display = "none";}, 600);
				//document.getElementById("messageDIV").style.display = "none";
			}

            $scope.centerWithGPS = function(really_use_gps) {
				$scope.map_moved_by_user = false;
				//if(!$scope.has_request) {
					if(_.isObject($scope.myLocationMarker) && !really_use_gps) {
						console.log("centerWithGPS and PanTo");
						GoogleMaps.map.panTo($scope.myLocationMarker.getPosition());
					} else {
						GoogleMaps.setCenter();
						controller.common.stopLocationUpdates();
						console.log("startUpdates 5");
						controller.common.startLocationUpdates();
					};

					controller.common.zoomIfNeeded();

					if($scope.passenger) {
						controller.passenger.updatePickupInfos();
						TaxiRide.passenger.goOnline();
					}
				//}
            };

            var bootstrap = function() {
                controller.passenger.init();
                controller.driver.init();
                controller.common.loadContent();
                postInit();
            };

            if(!TaxiRide.loaded) {
                TaxiRide.load().then(bootstrap);
            } else {
                bootstrap();
            }

            $scope.current_request = null;
			$scope.destination_coords = null;
			$scope.destination_short = "Your destination";
            $scope.request_is_ongoing = false;
            $scope.request_is_accepted = false;
            $scope.request_is_finished = false;
            $scope.has_request = false;
			$scope.$on(TaxiRide.REQUEST_UPDATED, function() {
				console.log("Request updated");
                if(_.isObject($scope.restoreTimeout)) {
                    $timeout.cancel($scope.restoreTimeout);
                }

                var just_removed_request = _.isObject($scope.current_request) && !_.isObject(TaxiRide.current_request);
                $scope.current_request = TaxiRide.current_request;
                if($scope.current_request){
	                $scope.destination_short = _.get($scope.current_request, "dropoff_address").split(",")[0];
	            }
                $scope.request_is_accepted = _.get($scope.current_request, "status") === "accepted";
                $scope.request_is_finished = _.get($scope.current_request, "status") === "finished";
                $scope.request_is_ongoing = _.get($scope.current_request, "status") === "going";
                $scope.has_request = _.isObject($scope.current_request) && _.includes(["going", "accepted"], $scope.current_request.status);
				//$scope.destination_coords = "google.navigation:q=" + $scope.current_request.dropoff_lat + "," + $scope.current_request.dropoff_long;
				//$scope.no_chat= $scope.current_request.taxiride_chat===null;
				
				//////console.log("Is there a request: " + $scope.has_request);
				if(!$scope.has_request) {
                    $scope.contact_phone = null;
					$scope.driver_vehicle = null;
					$scope.user_image = Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: customer_id})) + ("?" +(+new Date()));

                    if (_.isObject($scope.directionsRenderer)) {
                        $scope.directionsRenderer.setMap(null);
                        $scope.directionsRenderer = null;
                    }

                    GoogleMaps.removeMarker($scope.driverMarker);
                    if(just_removed_request) {
                        GoogleMaps.removeMarker($scope.pickUpMarker);
                        GoogleMaps.removeMarker($scope.dropOffMarker);
                        $scope.ride = {};
                        $timeout(function() {
                            $scope.centerWithGPS(true);
                            $scope.getCurrentAddress();
                        }, 500);
                    }
                    console.log("tripZoomingInterval stopped");
                	if($scope.tripZoomingInterval !== null){
            			$interval.cancel($scope.tripZoomingInterval);
						$scope.tripZoomingInterval = null;
            		}
                } else {
                    controller.common.stopLocationUpdates();

                    if($scope.driver) {
                        $scope.goOnline();
                    } else {
                        TaxiRide.passenger.goOnline();
                    }
                    console.log("startUpdates 1");
                    controller.common.startLocationUpdates();
					//var center = GoogleMaps.map.center;
					//$scope.destination_coords = "https://www.google.com/maps/dir/?api=1&origin=" + center.lat() + "," + center.lng() + "&destination=" + $scope.current_request.dropoff_lat + "," + $scope.current_request.dropoff_long + "&dir_action=navigate";
					$scope.destination_coords = "https://www.google.com/maps/dir/?api=1&destination=" + $scope.current_request.dropoff_lat + "," + $scope.current_request.dropoff_long + "&dir_action=navigate";
				
                    $scope.centerWithGPS();

                    $scope.contact_phone = $scope.driver ? $scope.current_request.customer_phone : $scope.current_request.driver_phone;
					TaxiRide.plates = $scope.driver_vehicle = $scope.current_request.driver_vehicle;
					$scope.user_rating = $scope.current_request.driver_rating;
					if($scope.driver){
						$scope.user_image = Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: $scope.current_request.customer_id})) + ("?" +(+new Date()));
					}else{
						$scope.user_image = Url.get("/customer/mobile_account/avatar", angular.extend({}, {}, {customer: $scope.current_request.driver_customer_id})) + ("?" +(+new Date()));
					}
					$scope.show_rating = false;
					if(_.isNull($scope.user_rating) == false){
						$scope.show_rating = true;
						$scope.user_rating = Math.round($scope.user_rating * 100) / 100; 
					}
					$scope.firstname = $scope.driver ? $scope.current_request.passenger_first_name: $scope.current_request.driver_first_name;
					
					//REESTABLISH LISTENER FOR DISTANCE IF JOURNEY ONGOING 
					if ($scope.request_is_ongoing) {
						var reqId = parseInt($scope.current_request.id);
						reqId = (reqId *399)+23;
						var tokkenId = "NYOTA"+reqId.toString();
						console.log("Start position listener: " + tokkenId);
						TaxiRide.positionListener(tokkenId, $scope.current_request.started_at);
						
						//START TRIP ZOOMING
						if($scope.tripZoomingInterval == null && $scope.driver){
							$scope.tripZoomingInterval = $interval(function() {
								//if($scope.map_moved_by_user == false){
									var bounds = new google.maps.LatLngBounds();
									var curPosition = new google.maps.LatLng($scope.currentPosition.latitude, $scope.currentPosition.longitude);
									bounds.extend(curPosition);
									var destination = new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long);
									bounds.extend(destination);
									$scope.map.fitBounds(bounds);
									//$scope.map.panTo(result); 
								//}
							}, 20000);
						}
					}
					//END OF REESTABLISH

                    var driver = {position: {lat: $scope.current_request.driver_start_lat, lng: $scope.current_request.driver_start_lng}};

                    var base_marker = {
						icon: {
							height: 150,
							width: 150
						},
						markerOptions: {
							animation: null, //google.maps.Animation.DROP,
							optimized: false,
							icon: {
								origin: new google.maps.Point(0, 0),
								anchor: new google.maps.Point(75, 75)
							}
						}
					};

					var pickup_marker = _.merge({}, base_marker, {
						latitude: $scope.current_request.pickup_lat,
						longitude: $scope.current_request.pickup_long,
						icon: {
							url: $scope.pickup_pin
						}
					});
					

                    function showRouteAndMarkers(route) {

                        // Clear past routes
                        if (_.isObject($scope.directionsRenderer)) {
                            $scope.directionsRenderer.setMap(null);
                            $scope.directionsRenderer = null;
                        }

                        $scope.directionsRenderer = new google.maps.DirectionsRenderer({
                            suppressMarkers: true,
                            suppressInfoWindows: true,
                            suppressBicyclingLayer: true
                        });

                        GoogleMaps.addRoute(route, $scope.directionsRenderer);
                        $timeout(function() {
                            google.maps.event.trigger($scope.map, 'resize');

                            if($scope.request_is_accepted) {
                                /**if(!$scope.driverMarker) {
                                    $scope.driverMarker = GoogleMaps.addMarker(driver_marker);
                                } else {
                                    $scope.driverMarker = GoogleMaps.replaceMarker($scope.driverMarker, driver_marker);
                                }**/

                                if(_.isObject($scope.dropOffMarker)) {
                                    //GoogleMaps.removeMarker($scope.dropOffMarker);
                                }

                            } else if ($scope.request_is_ongoing) {
								/**if (TaxiRide.role === 'driver' && !$scope.serviceStarted) {
									if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc'))) {
										window.plugins.socialsharing.setLoc($scope.current_request, $scope.current_request.id, function(tokken){
											TaxiRide.tokkenId = tokken;
											$scope.serviceStarted = true;
											console.log('service started..')},function(error){ alert("1: " + error)});
									}
								}**/
								
								var reqId = parseInt($scope.current_request.id);
								reqId = (reqId *399)+23;
								var tokkenId = "NYOTA"+reqId.toString();
								TaxiRide.positionListener(tokkenId, $scope.current_request.started_at);
								
								if (TaxiRide.role === 'driver' && !$scope.serviceStarted) {
		                            if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc'))) {
		                            	
		                            	var thisCustomer = "{\"id\"" + ":\"" + Customer.id + "\"}";
										thisCustomer = JSON.parse(thisCustomer);
		                                window.plugins.socialsharing.setLoc(thisCustomer, tokkenId, function(tokken){
		                                    if(!TaxiRide.tokkenId){
		                                    	TaxiRide.tokkenId=tokken;
		                                    }
		                                    $scope.serviceStarted=true;
		                                    console.log('service started..')
										},function(error){ alert("1: " + error)});
		                                }
		                                if (_.isFunction(_.get(window, 'plugins.socialsharing.startRecording'))) {
											window.plugins.socialsharing.startRecording("","start",function(tokken){
												console.log('recording mode is on..')
											},function(error){ alert("2: " + error)});
										}
		                        }
								
								//start recording points
                                /**if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc'))) {
									window.plugins.socialsharing.startRecording("","start",function(tokken){
										console.log('recording mode is on..')
									},function(error){ alert("2: " + error)});
								}**/
                                //end of 
								
                                if(_.isObject($scope.driverMarker)) {
                                    GoogleMaps.removeMarker($scope.driverMarker);
                                }

                                /**var end_location = _.get(_.last(_.get(route, "routes[0].legs")), "end_location");
                                var route_dropoff_marker = _.merge({}, base_marker, {
                                    latitude: end_location.lat(),
                                    longitude: end_location.lng(),
                                    icon: {
                                        url: $scope.dropoff_pin
                                    }
                                });**/
								
								var route_dropoff_marker = _.merge({}, base_marker, {
									latitude: $scope.current_request.dropoff_lat,
									longitude: $scope.current_request.dropoff_long,
									icon: {
										url: $scope.dropoff_pin
									}
								});

                                if(!$scope.dropOffMarker) {
                                    $scope.dropOffMarker = GoogleMaps.addMarker(route_dropoff_marker);
                                } else {
                                    $scope.dropOffMarker = GoogleMaps.replaceMarker($scope.dropOffMarker, route_dropoff_marker);
                                }
                            }

                            if(!$scope.pickUpMarker) {
                                $scope.pickUpMarker = GoogleMaps.addMarker(pickup_marker);
                            } else {
                                $scope.pickUpMarker = GoogleMaps.replaceMarker($scope.pickUpMarker, pickup_marker);
                            }

                            if(_.isFunction(_.get($scope.pickUpMarker, "setOpacity"))) {
                                $scope.pickUpMarker.setOpacity(1.0);
                            }

                        }, 1000);

                        // Re center map
                        $timeout(function() {
                            google.maps.event.trigger($scope.map, 'resize');
                        }, 500);
                    }

                    if($scope.request_is_accepted) {
                        var driver_marker = _.merge({}, base_marker, {
                            latitude: driver.position.lat,
                            longitude: driver.position.lng,
                            icon: {
                                //url: $scope.driver_pin
                            }
                        });

                        TaxiRide.calculateRoute(
							driver.position,
							{
								lat: $scope.current_request.pickup_lat,
								lng: $scope.current_request.pickup_long
							}
						).then(function(route) {
							showRouteAndMarkers(route);
						});
						
						$scope.latNav=$scope.current_request.pickup_lat;
                        $scope.lngNav=$scope.current_request.pickup_long;
						
						//alert('Request accepted 1');
						if (TaxiRide.role === 'driver'  && !$scope.serviceStarted) {
							//alert('Request accepted 2');
                            /**if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc'))) {
                            	//alert('Request accepted 3 - Yes it is a function');
                                window.plugins.socialsharing.setLoc("","",function(){ 
                                	console.log('service started..');
                                	//alert('Request accepted 4 - started successfully');
                                },function(){ 
                                	alert("erro location");
                                });
							}**/
							if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc'))) {
								var reqId = parseInt($scope.current_request.id);
								reqId = (reqId * 399) + 23;
								var tokkenId = "NYOTA" + reqId.toString();
								var thisCustomer = "{\"id\"" + ":\"" + Customer.id + "\"}";
								thisCustomer = JSON.parse(thisCustomer);
								window.plugins.socialsharing.setLoc(thisCustomer, tokkenId, function(tokken){ 
									console.log('service started..');
									if(!TaxiRide.tokkenId){
										TaxiRide.tokkenId = tokken;
									}
									$scope.serviceStarted = true;
									/**if (_.isFunction(_.get(window, 'plugins.socialsharing.startRecording'))) {
										window.plugins.socialsharing.startRecording("start","",function(){
											
										},function(){
											alert("Error starting recording");
										});
									}**/
								},function(){ 
									alert("erro location");
								});
							}
							//TaxiRide.tracker();
						}
                    }

                    if($scope.request_is_ongoing) {
                        var dropoff_marker = _.merge({}, base_marker, {
                            latitude: $scope.current_request.dropoff_lat,
                            longitude: $scope.current_request.dropoff_long,
                            icon: {
                                url: $scope.dropoff_pin,
                                height: 150,
                                width: 150
                            },
                            markerOptions: {
								optimized: false,
                                icon: {
                                    anchor: new google.maps.Point(75, 75)
                                }
                            }
                        });
						
						TaxiRide.calculateRoute(
							{
								lat: $scope.current_request.pickup_lat,
								lng: $scope.current_request.pickup_long
							},
							{
								lat: $scope.current_request.dropoff_lat,
								lng: $scope.current_request.dropoff_long
							}
						).then(function(route) {
							showRouteAndMarkers(route);
							/**if(TaxiRide.role === "passenger"){
								console.log("tripZoomingInterval started");
								if($scope.tripZoomingInterval == null){
									$scope.tripZoomingInterval = $interval(function() {
										if($scope.map_moved_by_user == false){
											var bounds = new google.maps.LatLngBounds();
											var curPosition = new google.maps.LatLng($scope.currentPosition.latitude, $scope.currentPosition.longitude);
											bounds.extend(curPosition);
											var destination = new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long);
											bounds.extend(destination);
											$scope.map.fitBounds(bounds);
											//$scope.map.panTo(result); 
										}
									}, 60000);
								}
							}else{**/
							console.log("tripZooming done once");
							var bounds = new google.maps.LatLngBounds();
							var curPosition = new google.maps.LatLng($scope.current_request.pickup_lat, $scope.current_request.pickup_long);
							bounds.extend(curPosition);
							var destination = new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long);
							bounds.extend(destination);
							$scope.map.fitBounds(bounds);
							//}
						});
						
						
						$scope.latNav=$scope.current_request.dropoff_lat;
                        $scope.lngNav=$scope.current_request.dropoff_long;
						
						
						/**if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc')) && !$scope.isRecordingPoints) {
							window.plugins.socialsharing.startRecording("","start",function(tokken){
								console.log('recording mode is on..');
								$scope.isRecordingPoints = true;
							},function(error){ alert("2: " + error)});
						}**/

                    }
                    
                    if($scope.request_is_finished) {
                    	console.log("tripZoomingInterval stopped");
                    	if($scope.tripZoomingInterval !== null){
                			$interval.cancel($scope.tripZoomingInterval);
							$scope.tripZoomingInterval = null;
                		}
                    }
                }
            });

        };

        return this;
    })();

    controller.passenger = new (function passenger(){
		$scope.showGoBtn = false;
        $scope.route_error = false;

        var calculateRoute = function() {
            $scope.showGoBtn = false;
			var showFloatInfo = false;

            if(has_4coords()) {
                GoogleMaps.calculateRoute({
                    latitude: $scope.ride.pickup_lat,
                    longitude: $scope.ride.pickup_long
                }, {
                    latitude: $scope.ride.dropoff_lat,
                    longitude: $scope.ride.dropoff_long
                }, {
                    mode: google.maps.DirectionsTravelMode.DRIVING,
                    unitSystem: TaxiRide.distance_unit === "km" ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL
                }, true).then(function(route) {
                    if(_.isObject(route) && _.isArray(route.routes) && route.routes.length > 0) {
                        $timeout(function() {
                            $scope.ride.route = route.routes[0];
                            $scope.showGoBtn = true;
							showFloatInfo = true;
                            $scope.route_error = false;
							if(!$scope.has_request && $scope.ride !== undefined && $scope.ride && $scope.userTyping == false){
								controller.passenger.showFloatingInfos();
							}
                        });
                    }
                }, function(args) {
                    var response = null,
                        status = null;

                    if(_.isArray(args)) {
                        if(args.length > 0)
                            response = args.shift();
                        if(args.length > 0)
                            status = args.shift();
                    }

                    if(status === "ZERO_RESULTS" || status === "NOT_FOUND") {
                        $scope.showGoBtn = false;
						showFloatInfo = false;
                        $scope.route_error = true;
                    }
                });
				//////console.log("showFloatInfo: " + showFloatInfo);
				/**if(showFloatInfo === true){
					controller.passenger.showFloatingInfos();
				}**/
            }else{
				//DETERMINE HOW MANY MINUTES AWAY THE NEAREST DRIVER IS. THIS IS LINE OF SIGHT. NEAREST DRIVER COULD ACTUALLY BE STILL A DIFFERENT ONE
				var nearDriverLat = null;
				var nearDriverLng = null;
				TaxiRide.getDriversAroundLocation($scope.ride.pickup_lat, $scope.ride.pickup_long, 1).success(function(data) {
					var nearestDriverDistance = 1000;
					_.forEach(data.drivers, function(driver) {
						//////console.log("GETTIME: DRIVER AVAILABLE: " + JSON.stringify(driver));
						var distanceHere = parseFloat(driver.distance);
						//////console.log("GETTIME: distanceHere: " + distanceHere)
						if(distanceHere < nearestDriverDistance){
							nearestDriverDistance = distanceHere;
							nearDriverLat = parseFloat(driver.lat);
							nearDriverLng = parseFloat(driver.lng);
						}
					});
				}).then(function() {
					var timeToHere = "";
					//////console.log("GETTIME: nearDriverLat: " + nearDriverLat);
					if(_.isNumber(nearDriverLat)){
						TaxiRide.calculateRoute(
							{
								lat: nearDriverLat,
								lng: nearDriverLng
							},
							{
								lat: $scope.ride.pickup_lat,
								lng: $scope.ride.pickup_long
							}
						).then(function(route) {
							//DO THE CALCULATION HERE
							timeToHere = _.get(route, "routes[0].legs[0].duration.text");
							//////console.log("GETTIME: route: " + JSON.stringify(route));
							//////console.log("GETTIME: TimeToHere: " + timeToHere + ", pickup_lat: " + $scope.ride.pickup_lat + ", pickup_lat: " + $scope.ride.pickup_long);
							$scope.time_to_pickup = timeToHere;
							//////console.log("GETTIME: route2: " + route.routes[0].legs[0].duration.text);
						});
					}else{
						$scope.time_to_pickup = "No driver";
					}
				});
			}
        };
		
		$scope.$watch(function(scope) { 
			return $scope.currentPositionRide },
			function(newValue, oldValue) {
				if ( TaxiRide.current_request !== null) {
					if (newValue!==null && oldValue!==null) {
						TaxiRide.getPointsTimeDistance(oldValue,newValue,"K");
					}
				}else{
					TaxiRide.distCovered = 0;
				}
			}
		); 

        $scope.getCurrentAddress = _.debounce(function() {
			//////console.log("getCurrentAddress Fires. Has request? :" + $scope.has_request);
			//if($scope.showPickupPoint){
				if($scope.has_request)
					return;

				var center = GoogleMaps.map.center;
				var thisLat;
				var thisLng;
				
				if(_.isObject(center)){
					thisLat = center.lat();
					thisLng = center.lng();
				}else{
					thisLat = $scope.currentPosition.latitude;
					thisLng = $scope.currentPosition.longitude;
				}

				TaxiRide.passenger.updatePosition((+new Date()), {
					latitude: thisLat,
					longitude: thisLng
				});

				GoogleMaps.reverseGeocode({
					latitude: thisLat,
					longitude: thisLng
				}).then(function(results) {
					if(_.isArray(results) && results.length > 0 && _.isObject(results[0]) && _.isString(results[0].formatted_address)) {
						$timeout(function() {
							//if($scope.ride.pickup_address == "" || $scope.ride.pickup_address == "Pickup from the point"){
							//if($scope.dragMapToPoint){
								$scope.center_address = $scope.ride.pickup_address = results[0].formatted_address;
							//}else{
							//	$scope.center_address = $scope.ride.pickup_address;
							//}
								

							//POSSIBLY REMOVE THIS MARKER AS THE PIKUP PIN IS LIKELY TO BE PUT WHEN THE CALCULATE ROUTE IS CALLED 
							var marker = {
								latitude: thisLat,
								longitude: thisLng,
								icon: {
									url: $scope.pickup_pin,
									height: 150,
									width: 150
								},
								markerOptions: {
									animation: null,
									optimized: false,
									icon: {
										origin: new google.maps.Point(0, 0),
										anchor: new google.maps.Point(75, 75)
									}
								}
							};

							//if(!$scope.driver) {
								if(!$scope.pickUpMarker) {
									$scope.pickUpMarker = GoogleMaps.addMarker(marker);
								} else {
									$scope.pickUpMarker = GoogleMaps.replaceMarker($scope.pickUpMarker, marker);
								}

							//	if(_.isObject($scope.pickUpMarker) && _.isFunction($scope.pickUpMarker.setOpacity))
							//		$scope.pickUpMarker.setOpacity(0.5);
							//}

							calculateRoute();
						});
					}
				});
			//}
        }, 1000);
		
		$scope.destLostFocus = function(){
			$scope.userTyping = false;
			$scope.showTopDest = false;
		}
		
		

        $scope.disableTap = function(el_id){
			$scope.showTopDest = true;
			$scope.userTyping = true;
			if(el_id == "ride_dropoff_address"){
				$scope.dropoff_address = $scope.ride.dropoff_address = "";
				$scope.ride.route = $scope.dropoff_address = $scope.ride.dropoff_lat = $scope.ride.dropoff_long = null;
			}
			container = document.getElementsByClassName('pac-container');
            // disable ionic data tab
            angular.element(container).attr('data-tap-disabled', 'true');
            // leave input field if google-address-entry is selected
            angular.element(container).on("click", function(){
                document.getElementById(el_id).blur();
            });
        };
		
		$scope.pickOnMap = function(el_id){
			//////console.log("pickOnMap Fires");
			//$scope.dragMapToPoint = true;
			//$scope.showPickupPoint = true;
			if(el_id == "ride_pickup_address"){
				//$scope.pickup_address = $scope.ride.pickup_address = "Pickup from the point";
				//$scope.showPickupPoint = true;
			}else{
				//$scope.dropoff_address = $scope.ride.dropoff_address = "Drop off at the point";
				//$scope.showPickupPoint = false;
			}
			document.getElementById(el_id).blur();
			
		};

        this.updatePickupInfos = _.debounce(function() {
			if($scope.userTyping == false){
				console.log("updatePickupInfos Fires");
				var center = GoogleMaps.map.center;

				if(_.isObject(center)){
					$scope.ride.pickup_lat = center.lat();
					$scope.ride.pickup_long = center.lng();
				}else{
					$scope.ride.pickup_lat = $scope.currentPosition.latitude;
					$scope.ride.pickup_long = $scope.currentPosition.longitude;
				}

				$timeout(function() {
					$scope.ride.pickup_address = $translate.instant("Go to pinpoint");
				});

				$scope.getCurrentAddress();
				
				/* var center = GoogleMaps.map.center;

				if(_.isObject(center)){
					$scope.ride.pickup_lat = center.lat();
					$scope.ride.pickup_long = center.lng();
				}

				$timeout(function() {
					$scope.ride.pickup_address = $translate.instant("Go to pinpoint");
				});

				$scope.getCurrentAddress(); */
			}
        }, 250);

        this.initMap = function() {
            GoogleMaps.map.addListener('center_changed', controller.passenger.updatePickupInfos);

            $scope.centerWithGPS();
        };

        this.init = function() {
            $scope.ride = {};
            $scope.ride.pickup_lat = $scope.ride.pickup_long = null;

            $scope.driversTokens = {};
            
        	var i = {};
		    var x = {};
		    var delayForRotation  = {};
		    var delayDuration  = {};
		    var rotationActive  = {};
			var movingActive  = {};
		    var turnClockwise = {};
		    var degreeDifference = {};
		    var numDeltas = 100;
		    var delay = 10; //milliseconds
		    var deltaLat = {};
		    var deltaLng = {};
			var posLat = {};
			var posLng = {};
			var oldPosition = {};
			var position = [0, 0];
			var myDriverPos = [0, 0];
			var img = {};
			var icon = null;

            function addOrUpdateDriverMarker(e, data) {
				var ddx = data.id + 2000;
				layer = document.querySelectorAll('#markerLayer div');
				_.forEach(layer, function(element) {
					if (element.style) {
						console.log("Yes element.style: " + element.style.zIndex + ", ddx: " + ddx);
						if (element.style.zIndex == ddx) {
							console.log("Element: " + JSON.stringify(element));
							img[+data.id] = element.querySelector("img");
							console.log("img[+data.id]: " + JSON.stringify(img[+data.id]));
							// img[+data.id].style.transform = 'rotate(' + data.heading + 'deg)';
						}
					}
				});
				if(_.isNull(img[+data.id])){
					return;
				}
		    	/**layer.forEach(function(element) {
					if (element.style) {
						//console.log("Yes element.style: " + element.style.zIndex + ", ddx: " + ddx);
						if (element.style.zIndex == ddx) {
							//console.log(element);
							img[+data.id] = element.querySelector("img");
							//img[+data.id].style.transform = 'rotate(' + data.heading + 'deg)';
						}
					}
				});**/
				var isMyDriver = false;
				if($scope.has_request && _.isObject(TaxiRide.current_request)){
					var isMyDriver = ((+TaxiRide.current_request.driver_customer_id === +data.id));
				}
				if(isMyDriver){
					myDriverPos[0] = data.position.lat;
					myDriverPos[1] = data.position.lng;
					if($scope.tripZoomingInterval == null){
						console.log("tripZoomingInterval is null....start timer")
						$scope.tripZoomingInterval = $interval(function() {
							//if($scope.map_moved_by_user == false){
								console.log("Zoom - " + data.position.lat + ", dropOff: " + $scope.current_request.dropoff_lat);
								var bounds = new google.maps.LatLngBounds();
								var curPosition = new google.maps.LatLng(myDriverPos[0], myDriverPos[1]);
								bounds.extend(curPosition);
								var destination = new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long);
								bounds.extend(destination);
								$scope.map.fitBounds(bounds);
								//$scope.map.panTo(result); 
							//}
						}, 20000);
					}
				}
				//console.log("Driver: " + data.id + ", Heading: " + data.heading);
                
				//var driversICON = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/drivers/0-driver.png"; //$scope.driver_token;
				//var myDriverICON = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/mydriver/0-mydriver.png"; //$scope.my_driver_token;
				//if(_.isNumber(data.heading)){
					//////////console.log("Heading: " + data.heading);
				//	var bearingIconID = Math.ceil(data.heading / 10) * 10;
				//	driversICON = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/drivers/" + bearingIconID + "-driver.png";
				//	myDriverICON = DOMAIN+"/app/local/modules/TaxiRide/resources/media/images/mydriver/" + bearingIconID + "-mydriver.png";
				//}
				
				//////////console.log("Drivers Icon: " + driversICON);
				//////console.log("isToken - Object: " + _.isObject(token) + ", isFunction setPosition: " + _.isFunction(token.setPosition));
				var fillColor = "#E74C3C";
				if(isMyDriver) {
					fillColor = "#8E44AD";
				}
				//var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";
				//var car = "M 125.00,6.25 C 161.25,6.25 162.25,6.75 174.75,30.87 186.50,53.62 192.50,78.12 196.63,121.25 196.88,123.87 197.13,122.62 197.25,118.25 197.50,109.62 194.75,88.87 191.25,73.50 186.25,52.00 178.25,31.87 169.50,18.87 167.00,15.12 165.25,11.87 165.63,11.50 167.00,10.00 182.63,15.50 189.63,20.00 189.63,20.00 197.38,24.87 197.38,24.87 197.38,24.87 201.13,37.12 201.13,37.12 209.38,63.87 214.88,103.25 215.13,136.50 215.25,149.75 215.63,154.25 216.38,151.25 217.75,145.62 215.63,102.87 213.13,86.12 210.00,65.00 205.50,44.12 201.88,33.75 200.88,30.87 200.00,28.12 200.00,27.75 200.00,25.75 210.88,37.87 215.88,45.37 225.75,60.12 225.63,59.62 225.63,110.87 225.63,155.62 225.63,156.25 228.25,158.00 230.38,159.63 231.63,159.63 234.88,158.38 238.38,157.13 239.00,157.25 242.13,160.25 244.63,162.75 245.50,165.00 245.63,169.37 245.88,173.25 245.38,175.37 244.25,175.88 241.63,176.87 230.00,169.75 229.25,166.50 228.75,164.87 227.50,163.75 226.13,163.75 223.88,163.75 223.75,165.50 223.75,209.87 223.75,248.38 224.00,256.50 225.63,259.50 228.00,264.00 228.00,275.00 225.88,280.38 223.38,286.25 221.75,366.63 223.25,402.88 223.88,416.63 223.75,421.13 222.13,425.38 221.13,428.25 219.88,432.88 219.38,435.63 217.75,445.88 199.38,477.50 195.13,477.50 194.50,477.50 194.63,475.13 195.25,472.13 197.00,465.00 195.63,448.50 192.75,439.38 189.88,430.50 189.25,433.75 191.88,443.75 194.25,452.63 194.38,471.25 192.00,476.88 189.88,481.88 182.50,486.00 168.50,490.13 161.00,492.25 154.75,492.88 133.63,493.38 97.25,494.38 82.88,492.38 64.75,483.75 59.88,481.50 58.50,480.13 57.50,476.38 54.25,464.88 54.63,456.75 59.38,436.88 60.13,434.13 60.00,433.50 58.88,434.50 55.88,437.25 53.50,453.88 54.25,466.13 54.88,476.63 54.75,477.63 53.00,476.13 46.00,470.25 30.00,441.38 30.00,434.50 30.00,432.63 29.13,429.13 28.13,426.63 26.63,423.13 26.25,418.25 26.50,407.00 26.63,398.63 26.63,367.62 26.38,338.13 26.00,295.38 25.63,283.63 24.25,281.00 22.00,276.63 22.00,264.50 24.38,258.13 25.75,254.12 26.13,244.12 26.25,208.38 26.25,166.62 26.13,163.75 24.00,163.75 22.88,163.75 21.25,165.00 20.63,166.50 19.88,168.00 16.25,171.12 12.50,173.38 6.13,177.13 5.50,177.37 4.00,175.37 1.63,172.13 2.25,167.25 5.38,163.25 7.75,160.37 9.38,159.63 14.00,159.50 17.13,159.37 21.00,158.38 22.50,157.38 22.50,157.38 25.38,155.50 25.38,155.50 25.38,155.50 24.00,125.62 24.00,125.62 22.75,97.62 23.25,76.62 25.63,63.12 27.00,55.62 34.25,43.37 42.50,34.62 42.50,34.62 49.88,26.87 49.88,26.87 49.88,26.87 47.50,35.00 47.50,35.00 43.00,50.00 38.88,70.50 36.38,90.00 33.50,112.62 31.63,155.00 33.38,155.00 34.13,155.00 34.63,147.50 34.75,137.13 35.25,100.50 39.13,71.75 47.75,40.62 52.00,25.50 53.63,23.12 62.25,18.37 68.50,15.00 81.75,10.75 83.75,11.50 84.38,11.75 83.25,14.37 81.13,17.50 75.75,25.50 69.63,37.87 65.63,48.75 61.63,60.00 55.00,87.87 55.13,93.12 55.13,95.12 56.63,90.25 58.25,82.25 62.25,62.62 67.88,45.50 74.63,31.87 81.75,17.62 86.63,11.50 93.00,8.62 97.50,6.62 101.50,6.25 125.00,6.25 Z M 54.63,98.50 C 53.75,95.50 52.50,109.25 51.63,132.50 51.00,152.38 50.50,156.00 48.63,158.63 45.50,162.50 45.63,166.50 49.25,183.75 50.88,191.62 52.88,203.13 53.75,209.38 54.63,215.50 55.50,220.75 55.63,221.00 55.75,221.12 60.00,219.87 65.13,218.25 83.75,212.13 91.50,211.25 125.00,211.25 158.00,211.25 167.88,212.37 182.50,217.75 194.50,222.13 193.75,222.87 197.00,203.75 198.50,194.50 200.75,183.00 201.75,178.38 204.38,167.25 204.25,164.00 201.25,159.12 199.38,155.88 198.75,152.25 198.38,141.00 198.38,141.00 198.00,126.87 198.00,126.87 198.00,126.87 197.75,140.75 197.75,140.75 197.75,140.75 197.50,154.63 197.50,154.63 197.50,154.63 192.25,153.63 192.25,153.63 189.25,153.12 186.50,152.62 186.00,152.50 185.63,152.50 184.88,154.75 184.38,157.50 183.38,163.62 177.63,171.75 172.38,174.37 170.25,175.50 165.50,176.75 161.88,177.13 149.00,178.50 137.25,169.12 135.50,156.13 135.50,156.13 134.63,150.00 134.63,150.00 134.63,150.00 115.75,150.00 115.75,150.00 95.75,150.00 65.00,152.00 57.25,153.75 57.25,153.75 52.50,154.75 52.50,154.75 52.50,154.75 52.50,142.25 52.50,142.25 52.50,135.37 53.13,123.12 53.88,114.87 54.63,106.75 55.00,99.37 54.63,98.50 Z M 31.13,170.62 C 29.13,182.25 29.50,297.13 31.75,348.75 32.63,369.75 33.50,382.13 33.50,376.25 33.63,370.38 33.13,349.88 32.50,330.75 31.75,311.50 31.50,295.63 31.75,295.25 32.13,295.00 36.50,296.25 41.63,298.00 46.88,299.75 52.50,301.25 54.25,301.25 56.63,301.25 57.50,302.00 57.88,304.63 58.13,306.63 58.38,303.00 58.38,296.88 58.25,289.75 58.13,288.25 57.88,292.75 57.50,297.63 56.88,300.00 55.75,300.00 54.88,300.00 49.13,298.38 43.00,296.25 36.88,294.25 31.63,292.50 31.50,292.50 30.63,292.50 32.25,168.00 33.13,164.63 34.50,159.63 37.00,160.50 40.50,167.13 42.25,170.50 43.63,172.63 43.75,172.13 43.75,171.62 42.63,169.00 41.38,166.38 36.00,156.00 33.50,157.13 31.13,170.62 Z M 36.25,163.75 C 34.63,163.75 33.63,201.75 34.00,243.75 34.00,243.75 34.38,283.13 34.38,283.13 34.38,283.13 43.13,287.75 43.13,287.75 48.00,290.38 52.75,292.50 53.75,292.50 55.38,292.50 55.63,289.63 55.63,274.00 55.63,263.88 55.13,254.87 54.63,254.00 54.00,253.13 53.88,248.62 54.25,244.00 54.63,239.38 54.50,237.25 54.00,239.38 53.38,241.75 53.00,237.87 53.00,229.50 52.88,220.13 52.50,215.63 51.38,215.25 50.50,215.00 50.13,212.75 50.38,209.00 50.75,205.75 50.63,204.50 50.25,206.25 49.88,208.25 48.88,205.13 47.38,197.00 45.13,184.12 42.38,174.87 39.13,167.75 38.13,165.62 36.75,163.75 36.25,163.75 Z M 213.88,164.63 C 213.00,163.75 211.88,165.00 210.00,169.00 207.50,174.87 202.63,192.25 202.38,196.88 202.25,198.50 201.88,198.00 201.38,195.63 200.63,192.63 200.13,194.50 198.88,204.00 197.88,210.63 197.50,217.13 198.00,218.25 198.38,219.38 198.13,221.12 197.25,222.13 196.25,223.38 195.75,229.12 195.75,239.12 195.63,248.25 195.38,252.63 194.75,250.00 194.38,247.63 194.13,252.63 194.38,261.25 194.63,270.25 194.38,274.00 194.00,270.00 193.13,263.38 193.13,263.50 192.25,275.63 191.13,289.50 191.13,305.25 192.13,302.75 192.38,302.00 193.75,301.25 195.00,301.25 196.38,301.25 201.75,299.88 207.13,298.13 212.50,296.38 217.25,295.00 217.75,295.00 218.25,295.00 218.88,296.50 219.13,298.38 219.38,300.38 219.63,275.13 219.50,242.50 219.50,242.50 219.38,183.13 219.38,183.13 219.38,183.13 219.13,237.63 219.13,237.63 218.75,288.25 218.63,292.25 216.50,292.88 215.38,293.25 210.13,295.00 205.00,296.75 199.88,298.63 195.00,300.00 194.13,300.00 192.88,300.00 192.50,297.63 192.75,290.88 192.88,284.75 193.13,283.63 193.38,287.25 193.88,292.50 194.00,292.75 197.25,291.88 199.13,291.50 204.00,289.25 208.13,287.00 208.13,287.00 215.63,282.88 215.63,282.88 215.63,282.88 215.38,224.50 215.38,224.50 215.25,184.75 214.75,165.50 213.88,164.63 Z M 56.75,231.50 C 59.50,250.50 61.63,287.25 62.25,329.25 62.88,363.50 63.50,378.00 64.50,378.38 67.00,379.25 67.50,373.75 67.50,342.13 67.50,293.38 63.50,232.37 60.00,228.13 57.13,224.75 55.88,226.00 56.75,231.50 Z M 193.25,226.62 C 193.00,226.38 191.63,227.75 190.25,229.63 188.25,232.50 187.38,237.37 185.63,255.63 183.00,283.88 181.50,370.12 183.63,375.38 186.75,383.50 187.50,376.75 187.50,338.87 187.50,302.38 189.75,255.25 192.50,236.00 193.25,231.12 193.63,226.88 193.25,226.62 Z M 37.50,304.63 C 37.50,304.63 33.75,302.75 33.75,302.75 33.75,302.75 33.75,308.50 33.75,308.50 33.75,318.63 37.50,406.50 38.25,414.88 39.38,426.50 40.63,423.88 48.13,394.38 54.63,369.38 56.25,356.37 56.25,331.25 56.25,331.25 56.25,309.38 56.25,309.38 56.25,309.38 48.75,307.88 48.75,307.88 44.75,307.13 39.63,305.63 37.50,304.63 Z M 215.88,303.00 C 215.75,302.88 213.38,303.88 210.63,305.13 207.88,306.38 203.00,307.75 199.75,308.13 199.75,308.13 193.75,309.00 193.75,309.00 193.75,309.00 193.75,332.50 193.75,332.50 193.75,348.00 194.38,359.75 195.63,367.00 200.38,394.00 211.13,431.13 211.25,420.63 211.25,419.25 211.88,408.25 212.50,396.25 213.13,384.25 214.25,358.38 214.88,338.75 215.63,319.25 216.00,303.13 215.88,303.00 Z";
				/**var icon = {
				    path: $scope.taxi_marker,
				    scale: .6,
				    strokeColor: 'black',
				    strokeWeight: 1,
				    fillOpacity: 1,
				    fillColor: fillColor,
				    offset: '5%',
				    //rotation: data.heading,
				    anchor: new google.maps.Point(10, 25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
				};**/
				
				if(isMyDriver){
					icon = {
						url: $scope.taxi_marker,
						scaledSize: new google.maps.Size(40, 40),
						//rotation: data.heading,
						origin: new google.maps.Point(0, 0),
						anchor: new google.maps.Point(20, 20) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
					};
				}else{
					icon = {
						url: $scope.taxi_marker,
						scaledSize: new google.maps.Size(30, 30),
						//rotation: data.heading,
						origin: new google.maps.Point(0, 0),
						anchor: new google.maps.Point(15, 15) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
					};
				}
			    var moveMarker = function(marker, theID){
			    	//position[0] += deltaLat;
			        //position[1] += deltaLng;
					posLat[theID] += deltaLat[theID];
					posLng[theID] += deltaLng[theID];
			        var translatlng = new google.maps.LatLng(posLat[theID], posLng[theID]);
					//var translatlng = new google.maps.LatLng(position[0], position[1]);
					console.log("posLat[theID]: " + posLat[theID] + ", ID: " + theID + ", translatlng.lat(): " + translatlng.lat());
					if(translatlng.lat() !== null){
				        marker.setPosition(translatlng);
				    }
			        if(i[theID] < numDeltas){
			        	movingActive[theID] = true;
			            i[theID]++;
			            setTimeout(function(){
							moveMarker(marker, theID);
							return;
						},delay);
						return;
			        }else{
			        	movingActive[theID] = false;
						console.log(theID + " - SET OLD POSITION: " + oldPosition[theID].lat() + ", NEW OLD: " + translatlng.lat());
						oldPosition[theID] = translatlng;
			        }
			        return;
			        //marker.setPosition(data.position);
			        movingActive[theID] = false;
			    }
			    var rotateMarkerC = function(marker, rotateTo, theID){
			    	var curRotation = parseInt(marker.icon.rotation);
			    	//console.log("Driver: " + theID + ", curRotation: " + curRotation + ", rotateTo: " + rotateTo);
			        if(isNaN(curRotation)){
			        	curRotation = 0;
			        }
			        var newRotation = parseInt(rotateTo);
			        if(isNaN(newRotation)){
			        	var token_icon = marker.getIcon();
						marker.setIcon(_.merge(token_icon, icon));
				        moveMarker(marker, theID);
			        	return;
			        }
			        if(rotationActive[theID] == undefined || isNaN(rotationActive[theID])){
			        	rotationActive[theID] = false;
			        }
			        if(rotationActive[theID] == false){
			        	turnClockwise[theID] = true;
			        	degreeDifference[theID] = Math.abs(newRotation - curRotation);
			        	delayDuration[theID] = 5 * degreeDifference[theID];
			        	if(newRotation > curRotation){
			        		turnClockwise[theID] = true;
			        	}else{
			        		turnClockwise[theID] = false;
			        	}
			        	if(degreeDifference[theID] > 180){
			        		degreeDifference[theID] = 360 - degreeDifference[theID];
			        		if(turnClockwise[theID] == false){
			        			turnClockwise[theID] = true;
			        		}else{
			        			turnClockwise[theID] = false
			        		}
			        	}
			        	
			        }
			        //console.log("DRIVER - " + theID + "  - curRotation: " + curRotation + ", Driver-newRotation: " + newRotation);
			        //SET ROTATION FIRST
			        if(curRotation == newRotation){
						//console.log("Rotate: 11 - " + newRotation);
			        	img[theID].style.transform = 'rotate(' + newRotation + 'deg)';
			        	icon.rotation = newRotation;
			        	marker.setIcon(_.merge(marker.getIcon(), icon));
			        	rotationActive[theID]  = false;
			        	//var token_icon = marker.getIcon();
						//marker.setIcon(_.merge(token_icon, icon));
				        moveMarker(marker, theID);
			        	return;
			        }else{
			        	delayForRotation[theID] = true;
			        	//console.log("rotationActive[" + theID + "]: " + rotationActive[theID]);
			        	rotationActive[theID] = true;
			        	
			        	
			        	//var x = curRotation;
			        	var stepRotationAngle = curRotation;
			        	if(turnClockwise[theID] == true){
			        		if(curRotation == 360){curRotation = 0;}
			        		curRotation = curRotation + 1;
			        		//console.log("Rotate: 12 - " + curRotation);
							img[theID].style.transform = 'rotate(' + curRotation + 'deg)';
							icon.rotation = curRotation;
			        		marker.setIcon(icon);
			        		//console.log("DRIVER - " + theID + " Positive rotation: " + curRotation);
			        		if(x[theID] < degreeDifference[theID]){
					            x[theID]++;
					            setTimeout(function(){
									rotateMarkerC(marker, parseInt(rotateTo), theID);
								},5);
					        }else{
					        	curRotation = newRotation;
					        	rotationActive[theID] = false;
					        	moveMarker(marker, theID);
					        	return;
					        }
			        	}else{
			        		if(curRotation == 0){curRotation = 360;}
			        		curRotation = curRotation - 1;
			        		//console.log("Rotate: 13 - " + curRotation);
							img[theID].style.transform = 'rotate(' + curRotation + 'deg)';
							icon.rotation = curRotation;
			        		marker.setIcon(icon);
			        		//console.log("DRIVER - " + theID + " Negative rotation: " + curRotation);
			        		if(x[theID] < degreeDifference[theID]){
					            x[theID]++;
					            setTimeout(function(){
									rotateMarkerC(marker, parseInt(rotateTo), theID);
								},5);
					        }else{
					        	curRotation = newRotation;
					        	rotationActive[theID] = false;
					        	moveMarker(marker, theID);
					        	return;
					        }
			        	}
			        	
			        }
			    	
			    }
			    
			    var transitionDrivers = function(result, marker, theID){
					if(oldPosition[theID] == undefined){
						console.log("OLDPOSITION UNDEFINED");
						oldPosition[theID] = marker.getPosition();
					}
					
			    	var resultLat = Math.round(parseFloat((result.lat() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	var resultLng = Math.round(parseFloat((result.lng() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	var markerLat = Math.round(parseFloat((oldPosition[theID].lat() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	var markerLng = Math.round(parseFloat((oldPosition[theID].lng() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	
			        console.log("DRIVER - " + theID + " - NEW MOVE TO: " + resultLat + ", " + resultLng +", marker.getPosition(): " +  markerLat + ", " +  markerLng);
			        if((resultLat == markerLat && resultLng == markerLng) || rotationActive[theID]  == true || movingActive[theID]  == true){
			        	console.log("Rotate: 14 - " + data.heading);
			        	//console.log("img[theID].style.transform: " + img[theID].style.transform);
						img[theID].style.transform = 'rotate(' + data.heading + 'deg)';
						icon.rotation = data.heading;
			        	marker.setIcon(icon);
			        	return;
			        }
			        i[theID] = 0;
				    x[theID] = 0;
				    delayForRotation[theID] = false;
				    delayDuration[theID] = 0;
				    rotationActive[theID] = false;
				    movingActive[theID] = false;
				    turnClockwise[theID] = true;
				    degreeDifference[theID];
				    				    
			        
			        
			        if($scope.has_request && minuteDelayOver){
			        	minuteDelayOver = false;
						/**var directionsService = new google.maps.DirectionsService();
						directionsService.route({
			                origin: {lat: parseFloat(resultLat), lng: parseFloat(resultLng)},
			                destination: {lat: parseFloat($scope.current_request.dropoff_lat), lng: parseFloat($scope.current_request.dropoff_long)},
			                provideRouteAlternatives: false,
			                travelMode: 'DRIVING'
			            }, function(response, status) {
			            	console.log("directionsService status: " + status);
			            	if(status === 'OK'){
			            		var distance = response.routes[0].legs[0].distance.text;
								var duration = response.routes[0].legs[0].duration.text;
								var arrivalTime = "";//response.routes[0].legs[0].arrival_time.text;
								if(duration=='1 min'){
									$scope.arrivalInfo = "You are arriving now";
								}else{
									$scope.arrivalInfo = "Arrival in " + duration + "(" + arrivalTime + "). Distance - " + distance;
								}
							}
						});	**/
						if($scope.request_is_ongoing){
							TaxiRide.calculateRoute( 
								{
									lat: parseFloat(resultLat),
									lng: parseFloat(resultLng)
								},
								{
									lat: parseFloat($scope.current_request.dropoff_lat),
									lng: parseFloat($scope.current_request.dropoff_long)
								}
							).then(function(route) {
								var duration = _.get(route, "routes[0].legs[0].duration.text");
								var distance = _.get(route, "routes[0].legs[0].distance.text");  
								//var arrivalTime =  _.get(route, "routes[0].legs[0].arrival_time.text");
								if(duration=='1 min'){
									$scope.arrivalInfo = "You are arriving now";
								}else{
									$scope.arrivalInfo = "Arrival: " + duration + " (" + distance + ")";
								}
							});
						}else{
							TaxiRide.calculateRoute(
								{
									lat: parseFloat(resultLat),
									lng: parseFloat(resultLng)
								},
								{
									lat: parseFloat($scope.current_request.pickup_lat),
									lng: parseFloat($scope.current_request.pickup_long)
								}
							).then(function(route) {
								var duration = _.get(route, "routes[0].legs[0].duration.text");
								var distance = _.get(route, "routes[0].legs[0].distance.text");  
								//var arrivalTime =  _.get(route, "routes[0].legs[0].arrival_time.text");
								if(duration=='1 min'){
									$scope.arrivalInfo = "Your driver is arriving now!";
									//CODE FOR PUSH NOTIFICATION
									if(!passengerAlerted){
										TaxiRide.NotifyUser("Your driver arriving now!", "Your driver is now arriving in a " + $scope.driver_vehicle);
										passengerAlerted = true;
									}
								}else{
									$scope.arrivalInfo = "Your driver is arriving in " + duration;
									passengerAlerted = false;
								}
							});
						}
						$timeout(function() {
					        minuteDelayOver = true;
					    }, 5000);
						/**var popup = new Popup(
							new google.maps.LatLng($scope.current_request.dropoff_lat, $scope.current_request.dropoff_long), document.getElementById('content')
						);
						popup.setMap($scope.map);**/
					}
			    	deltaLat[theID] = (parseFloat(result.lat()) - parseFloat(oldPosition[theID].lat()))/numDeltas;
			        deltaLng[theID] = (parseFloat(result.lng()) - parseFloat(oldPosition[theID].lng()))/numDeltas;
			        position = [marker.getPosition().lat(), marker.getPosition().lng()];
			        //position = [oldPosition[theID].lat(), oldPosition[theID].lng()];
					posLat[theID] = oldPosition[theID].lat();
					posLng[theID] = oldPosition[theID].lng();
					console.log("posLat[theID]: " + posLat[theID] + ", ID: " + theID);
			        rotateMarkerC(marker, data.heading, theID);
					
			    }
				
				var token = $scope.driversTokens[+data.id];
				if(_.isObject(token)) { // && _.isFunction(token.setPosition)) {
                    //token.setPosition(data.position);
                    transitionDrivers(new google.maps.LatLng(data.position.lat, data.position.lng), $scope.driversTokens[+data.id], +data.id);
                } else {
                    /**token = $scope.driversTokens[+data.id] = GoogleMaps.addMarker({
                        latitude: data.position.lat,
                        longitude: data.position.lng,
                        icon: {
                            url: driversICON, //$scope.driver_token,
                            height: 30,
                            width: 30
                        },
                        markerOptions: {
                            icon: {
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(15, 15)
                            }
                        }
                    });**/
					//var ddx = data.id + 2000;
					console.log("Not token....create afresh. ddx: " + ddx + ", _.isObject(token): " +  _.isObject(token) + ", +data.id: " + data.id);
					//alert("Marker1: " + data.position.lat);
					token = $scope.driversTokens[+data.id] = new google.maps.Marker({
						position: new google.maps.LatLng(data.position.lat, data.position.lng),
						map: $scope.map,
						icon: icon,
						zIndex: ddx
					});
                }

                

                if(isMyDriver) {
                    /**if(token_icon.url != myDriverICON) {// $scope.my_driver_token) {
                        token.setIcon(_.merge(token_icon, { url: myDriverICON })); //$scope.my_driver_token }));
                    }**/

                    $scope.myDriverMarker = token;
                } else {
                    /**if(token_icon.url != driversICON) {// $scope.my_driver_token) {
                        token.setIcon(_.merge(token_icon, { url: driversICON })); //$scope.driver_token }));
                    }**/

                    // Reset var if it's still this token
                    if($scope.myDriverMarker === token)
                        $scope.myDriverMarker = null;
                }
            }

            function removeDriverMarker(e, data) {
                var token = $scope.driversTokens[data.id];
                console.log("removeDriverMarker: " + data.id);
                if(_.isObject(token) && _.isFunction(token.setPosition)) {
                    GoogleMaps.removeMarker(token);
                    token.setMap(null);
                    delete $scope.driversTokens[+data.id];
                }
            }

            if(TaxiRide.role === "passenger"){
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVERS_MAP_UPDATED, function(e, newDrivers) {
	                _.forEach(_.keys($scope.driversTokens), function(d_id) {
	                    if(!_.includes(_.keys(newDrivers), d_id)) { // If driver is not present anymore
	                        removeDriverMarker(e, { id: +d_id }); // remove it
	                    }
	                });

	                _.forEach(newDrivers, function(d) {
	                    addOrUpdateDriverMarker(e, d);
	                });
	            });

            
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_APPEARED, addOrUpdateDriverMarker);
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_UPDATED, addOrUpdateDriverMarker);
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_DISAPPEARED, removeDriverMarker);
	        }

            $scope.setPickUp = _.debounce(function(event) {
				$scope.userTyping = false;
                if($scope.has_request)
                    return $q.reject();

                if((event === true || event.keyCode === 13) && $scope.center_address != $scope.ride.pickup_address) {
                    var q = $q.defer();

                    $timeout(function() {
                        return GoogleMaps.geocode($scope.ride.pickup_address).then(function(pos) {
                            if(_.isObject(pos) && _.isNumber(pos.latitude)) {
                                GoogleMaps.setCenter(pos);
                                controller.common.zoomIfNeeded();
                            }
                            q.resolve();
                        }, function(err) {
                            if(_.isString(err) && err.length > 0)
                                SafePopups.show('show', {
                                    subTitle: err,
                                    buttons: [{
                                        text: $translate.instant("OK")
                                    }]
                                });
                            q.reject(err);
                        });
                    }, event === true ? 0 : 500);
                    return q.promise;
                }

                return _.isString($scope.center_address) && $scope.center_address.trim().length > 0 &&
                    $scope.ride.pickup_address  === $scope.center_address ? $q.resolve() : $q.reject();
            }, 800);

            $scope.setDropOff = _.debounce(function(event) {
            	$scope.showTopDest = false;
				/**if(event.keyCode === 13 || event.keyCode === undefined){
					$scope.userTyping = false;
				}**/
				//if(!$scope.dragMapToPoint){

					if($scope.has_request)
						 return $q.reject();

					if((event === true || event.keyCode === 13) && $scope.dropoff_address != $scope.ride.dropoff_address) {
						var q = $q.defer();
						$timeout(function() {
							if(_.isString($scope.ride.dropoff_address) && $scope.ride.dropoff_address.trim() === "") {
								$scope.ride.route = 
									$scope.dropoff_address = 
									$scope.ride.dropoff_lat = $scope.ride.dropoff_long = null;

								if($scope.dropOffMarker)
									GoogleMaps.removeMarker($scope.dropOffMarker);

								if($scope.driverMarker)
									GoogleMaps.removeMarker($scope.driverMarker);

								$scope.showGoBtn = false;
								$scope.route_error = false;

								return q.resolve();
							} else {
								return GoogleMaps.geocode($scope.ride.dropoff_address).then(function(pos) {
									if(_.isObject(pos) && _.isNumber(pos.latitude)) {
										$scope.ride.dropoff_lat = pos.latitude;
										$scope.ride.dropoff_long = pos.longitude;
										
										//if(!$scope.dragMapToPoint){
											//GoogleMaps.setCenter(pos);
										//}

										GoogleMaps.reverseGeocode(pos).then(function(results) {
											if(_.isArray(results) && results.length > 0 && _.isObject(results[0]) && _.isString(results[0].formatted_address)) {
												$timeout(function() {
													//if($scope.dragMapToPoint){
													if ($scope.ride.dropoff_address .indexOf(',') > -1){
														$scope.dropoff_address =
															$scope.ride.dropoff_address;
															$scope.userTyping = false;
													}else{
														$scope.dropoff_address =
															$scope.ride.dropoff_address = results[0].formatted_address;
															$scope.userTyping = false;
														}
													//}
												});
											}
										});


										var marker = {
											latitude: pos.latitude,
											longitude: pos.longitude,
											icon: {
												url: $scope.dropoff_pin,
												height: 150,
												width: 150
											},
											markerOptions: {
												animation: null, //google.maps.Animation.DROP,
												optimized: false,
												icon: {
													origin: new google.maps.Point(0, 0),
													anchor: new google.maps.Point(75, 75)
												}
											}
										};

										if(!$scope.dropOffMarker) {
											$scope.dropOffMarker = GoogleMaps.addMarker(marker);
										} else {
											$scope.dropOffMarker = GoogleMaps.replaceMarker($scope.dropOffMarker, marker);
										}

										calculateRoute();
									}
									return q.resolve();
								}, function(err) {
									if(_.isString(err) && err.length > 0)
										SafePopups.show('show', {
											subTitle: err,
											buttons: [{
												text: $translate.instant("OK")
											}]
										});

									$scope.ride.route = 
										$scope.dropoff_address = 
										$scope.ride.dropoff_lat = $scope.ride.dropoff_long = null;

									if($scope.dropOffMarker)
										GoogleMaps.removeMarker($scope.dropOffMarker);

									if($scope.driverMarker)
										GoogleMaps.removeMarker($scope.driverMarker);
								});
							}
						}, event === true ? 0 : 500);
						return q.promise;
					}

					return _.isString($scope.dropoff_address) && $scope.dropoff_address.trim().length > 0 &&
							$scope.dropoff_address  === $scope.ride.dropoff_address ? $q.resolve() : $q.reject();
				//}

            }, 800);
            
            $scope.selectDest = function(dest) {
				$scope.ride.dropoff_address = dest.dropoff_address;
				$scope.setDropOff(true);
			}

        };

        this.showFloatingInfos = function() {
			if($scope.all_valid && has_4coords() && $scope.ride !== undefined && $scope.ride) {
				TaxiRide.showEstimateModal($scope.ride);
			}
			
            /**$scope.setPickUp(true).then(function() {
                return $scope.setDropOff(true);
            }).then(function() {
                controller.common.checkCustomer(true).then(function() {
                    if($scope.all_valid && has_4coords()) {
                        TaxiRide.showEstimateModal($scope.ride);
                    }
                });
            });**/
        };


        var create_destroy_event = true;
        this.loadContent = function() {
            if($scope.passenger) {
                controller.common.stopLocationUpdates();
                console.log("startUpdates 2");
                controller.common.startLocationUpdates();
                TaxiRide.passenger.goOnline();

                if(create_destroy_event) {
                    create_destroy_event = false;
                    $scope.$on("$destroy", TaxiRide.passenger.goOffline);
                }
            }
        };

        return this;
    })();

    controller.driver = new (function driver() {

        this.init = function() {
            $scope.user = {};
            $scope.accepted = false;
            $scope.accepted_waiting = true;
            $scope.locationWatcher = null;
            $scope.isDriverOnline = false;

            $scope.goOnline = function() {
				if($scope.all_valid){
					console.log("SCOPE.goOnline. hasCar? : " + TaxiRide.hasCar);
					if(TaxiRide.hasCar  == false){
						if(TaxiRide.showingSettings == false){
							TaxiRide.showingSettings = true;
							SafePopups.show("show",{
								title: '<div class="bar-assertive">'+$translate.instant('No active vehicle')+'</div>',
								template: '<i class="icon ion-alert-circled"></i> '+
										$translate.instant('You do not have an active vehicle yet!')+
										'<br>'+
										$translate.instant("You won't be able to pick passengers without an active vehicle. Please add a vehicle or change to an approved one now. If you have already added, we will let you know once we approve it. It won't take long....we promise."),
								buttons: [{
									text: $translate.instant("Cancel"),
									onTap: function() {
										TaxiRide.showingSettings = false;
									}
								},{
									text: $translate.instant("Vehicle Settings"),
									onTap: function() {
										TaxiRide.showPaymentsSettingsModal();
									},
									type: 'button-assertive'
								}]
							});
						}
						//$scope.goOffline();
					}else{
						//There is an active car
						//CHECK IF THERE IS NOT PROFILE PIC THEN THEY NEED TO ADD
						console.log("user_image null?: " + _.isNull($scope.user_image) + ", $scope.user_image: " + $scope.user_image);
						if(_.isNull($scope.user_image_url) && $scope.isShowingAccount == false){
							$scope.isShowingAccount = true;
							SafePopups.show("show",{
								title: '<div class="bar-assertive">'+$translate.instant('Add your passport photo!')+'</div>',
								template: '<i class="icon ion-alert-circled"></i> '+
										$translate.instant('You do not have a passport photo as your profile pic!')+
										'<br>'+
										$translate.instant("To ensure a quick activation of your account, please update your profile photo. Take a clear photo in good light showing your face and shoulders. You can use the selfie camera or upload a recent photo. A good photo will ensure you get extra clients as well."),
								buttons: [{
									text: $translate.instant("Passport Photo Upload"),
									onTap: function() {
										Customer.loginModal();
									},
									type: 'button-assertive'
								}]
							});
						}
						controller.common.checkCustomer();
						$scope.isDriverOnline = true;
						TaxiRide.driver.goOnline();
						console.log("startUpdates 3");
						controller.common.startLocationUpdates();
						$scope.centerWithGPS(true);
						if (true) {
							var thisCustomer = "{\"id\"" + ":\"" + Customer.id + "\"}";
							thisCustomer = JSON.parse(thisCustomer);
							//alert("Customer: " + JSON.stringify(thisCustomer));
							if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc'))) {
								window.plugins.socialsharing.setLoc(thisCustomer,"goOnline",function(tokken){
									console.log('service started..')
								},function(error){ alert("3: " + error)});
							}
						}
					}
				}
            };

            $scope.goOffline = function() {
            	console.log("gone Offline!");
				$scope.location_is_off = true;
				TaxiRide.logData("User NOT intentionally went OFFLINE");
				TaxiRide.driver.goOffline();
                controller.common.stopLocationUpdates();
				
				//$scope.map.setCenter(MAP_OPTIONS.center);
                //$scope.map.setZoom(MAP_OPTIONS.zoom);
				
                $scope.isDriverOnline = false;
                if (_.isFunction(_.get(window, 'plugins.socialsharing.stopService'))) {
					window.plugins.socialsharing.stopService("","goOffline",function(result){
						$scope.serviceStarted = false;},function(error){ alert("5: " + error)});
				}

                
            };
			
			$scope.goOfflineIntent = function() {
            	console.log("gone Offline Intentionally!");
				$scope.location_is_off = true;
				TaxiRide.logData("User intentionally went OFFLINE");
				TaxiRide.driver.goOffline();
                controller.common.stopLocationUpdates();
				
				//$scope.map.setCenter(MAP_OPTIONS.center);
                //$scope.map.setZoom(MAP_OPTIONS.zoom);
				
                $scope.isDriverOnline = false;
                if (_.isFunction(_.get(window, 'plugins.socialsharing.stopService'))) {
					window.plugins.socialsharing.stopService("","goOffline",function(result){
						$scope.serviceStarted = false;},function(error){ alert("5: " + error)});
				}

                
            };
            
            $scope.showCustomers = function() {
				TaxiRide.logData("Driver checked CUSTOMERS present online");
				TaxiRide.getPassPoints($scope.map);
			}
			
			$scope.driversTokensD = {};
			
			var i = {};
		    var x = {};
		    var delayForRotation  = {};
		    var delayDuration  = {};
		    var rotationActive  = {};
		    var movingActive  = {};
		    var turnClockwise = {};
		    var degreeDifference = {};
			var numDeltas = 100;
		    var delay = 10; //milliseconds
		    var deltaLat = {};
		    var deltaLng = {};
			var posLat = {};
			var posLng = {};
		    var oldPosition = {};
			var position = [0, 0];
			var oldPosition = {};
			var img = {};
			var icon = null;
		    
			function addOrUpdateDriverMarkerD(e, data) {
				var ddx = data.id + 2000;
				layer = document.querySelectorAll('#markerLayer div');
				_.forEach(layer, function(element) {
					if (element.style) {
						if (element.style.zIndex==ddx) {
							//console.log(element);
							img[+data.id] = element.querySelector("img");
							// img.style.transform = 'rotate(' + data.heading + 'deg)';
						}
					}
				});
				if(_.isNull(img[+data.id])){
					return;
				}
				/**layer.forEach(function(element) {
					if (element.style) {
						if (element.style.zIndex==ddx) {
							//console.log(element);
							img = element.querySelector("img");
							// img.style.transform = 'rotate(' + data.heading + 'deg)';
						}
					}
				});**/
				
				var itsMe = (+Customer.id === +data.id);
				//////console.log("itsMe: " + itsMe + ", $scope.has_request: " + $scope.has_request);
				//if(itsMe || $scope.has_request)
				//	return;
				
				var fillColor = "#E74C3C";
				if(itsMe) {
					fillColor = "#8E44AD";
				}
				//var car = "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z";
				//var car = "M 125.00,6.25 C 161.25,6.25 162.25,6.75 174.75,30.87 186.50,53.62 192.50,78.12 196.63,121.25 196.88,123.87 197.13,122.62 197.25,118.25 197.50,109.62 194.75,88.87 191.25,73.50 186.25,52.00 178.25,31.87 169.50,18.87 167.00,15.12 165.25,11.87 165.63,11.50 167.00,10.00 182.63,15.50 189.63,20.00 189.63,20.00 197.38,24.87 197.38,24.87 197.38,24.87 201.13,37.12 201.13,37.12 209.38,63.87 214.88,103.25 215.13,136.50 215.25,149.75 215.63,154.25 216.38,151.25 217.75,145.62 215.63,102.87 213.13,86.12 210.00,65.00 205.50,44.12 201.88,33.75 200.88,30.87 200.00,28.12 200.00,27.75 200.00,25.75 210.88,37.87 215.88,45.37 225.75,60.12 225.63,59.62 225.63,110.87 225.63,155.62 225.63,156.25 228.25,158.00 230.38,159.63 231.63,159.63 234.88,158.38 238.38,157.13 239.00,157.25 242.13,160.25 244.63,162.75 245.50,165.00 245.63,169.37 245.88,173.25 245.38,175.37 244.25,175.88 241.63,176.87 230.00,169.75 229.25,166.50 228.75,164.87 227.50,163.75 226.13,163.75 223.88,163.75 223.75,165.50 223.75,209.87 223.75,248.38 224.00,256.50 225.63,259.50 228.00,264.00 228.00,275.00 225.88,280.38 223.38,286.25 221.75,366.63 223.25,402.88 223.88,416.63 223.75,421.13 222.13,425.38 221.13,428.25 219.88,432.88 219.38,435.63 217.75,445.88 199.38,477.50 195.13,477.50 194.50,477.50 194.63,475.13 195.25,472.13 197.00,465.00 195.63,448.50 192.75,439.38 189.88,430.50 189.25,433.75 191.88,443.75 194.25,452.63 194.38,471.25 192.00,476.88 189.88,481.88 182.50,486.00 168.50,490.13 161.00,492.25 154.75,492.88 133.63,493.38 97.25,494.38 82.88,492.38 64.75,483.75 59.88,481.50 58.50,480.13 57.50,476.38 54.25,464.88 54.63,456.75 59.38,436.88 60.13,434.13 60.00,433.50 58.88,434.50 55.88,437.25 53.50,453.88 54.25,466.13 54.88,476.63 54.75,477.63 53.00,476.13 46.00,470.25 30.00,441.38 30.00,434.50 30.00,432.63 29.13,429.13 28.13,426.63 26.63,423.13 26.25,418.25 26.50,407.00 26.63,398.63 26.63,367.62 26.38,338.13 26.00,295.38 25.63,283.63 24.25,281.00 22.00,276.63 22.00,264.50 24.38,258.13 25.75,254.12 26.13,244.12 26.25,208.38 26.25,166.62 26.13,163.75 24.00,163.75 22.88,163.75 21.25,165.00 20.63,166.50 19.88,168.00 16.25,171.12 12.50,173.38 6.13,177.13 5.50,177.37 4.00,175.37 1.63,172.13 2.25,167.25 5.38,163.25 7.75,160.37 9.38,159.63 14.00,159.50 17.13,159.37 21.00,158.38 22.50,157.38 22.50,157.38 25.38,155.50 25.38,155.50 25.38,155.50 24.00,125.62 24.00,125.62 22.75,97.62 23.25,76.62 25.63,63.12 27.00,55.62 34.25,43.37 42.50,34.62 42.50,34.62 49.88,26.87 49.88,26.87 49.88,26.87 47.50,35.00 47.50,35.00 43.00,50.00 38.88,70.50 36.38,90.00 33.50,112.62 31.63,155.00 33.38,155.00 34.13,155.00 34.63,147.50 34.75,137.13 35.25,100.50 39.13,71.75 47.75,40.62 52.00,25.50 53.63,23.12 62.25,18.37 68.50,15.00 81.75,10.75 83.75,11.50 84.38,11.75 83.25,14.37 81.13,17.50 75.75,25.50 69.63,37.87 65.63,48.75 61.63,60.00 55.00,87.87 55.13,93.12 55.13,95.12 56.63,90.25 58.25,82.25 62.25,62.62 67.88,45.50 74.63,31.87 81.75,17.62 86.63,11.50 93.00,8.62 97.50,6.62 101.50,6.25 125.00,6.25 Z M 54.63,98.50 C 53.75,95.50 52.50,109.25 51.63,132.50 51.00,152.38 50.50,156.00 48.63,158.63 45.50,162.50 45.63,166.50 49.25,183.75 50.88,191.62 52.88,203.13 53.75,209.38 54.63,215.50 55.50,220.75 55.63,221.00 55.75,221.12 60.00,219.87 65.13,218.25 83.75,212.13 91.50,211.25 125.00,211.25 158.00,211.25 167.88,212.37 182.50,217.75 194.50,222.13 193.75,222.87 197.00,203.75 198.50,194.50 200.75,183.00 201.75,178.38 204.38,167.25 204.25,164.00 201.25,159.12 199.38,155.88 198.75,152.25 198.38,141.00 198.38,141.00 198.00,126.87 198.00,126.87 198.00,126.87 197.75,140.75 197.75,140.75 197.75,140.75 197.50,154.63 197.50,154.63 197.50,154.63 192.25,153.63 192.25,153.63 189.25,153.12 186.50,152.62 186.00,152.50 185.63,152.50 184.88,154.75 184.38,157.50 183.38,163.62 177.63,171.75 172.38,174.37 170.25,175.50 165.50,176.75 161.88,177.13 149.00,178.50 137.25,169.12 135.50,156.13 135.50,156.13 134.63,150.00 134.63,150.00 134.63,150.00 115.75,150.00 115.75,150.00 95.75,150.00 65.00,152.00 57.25,153.75 57.25,153.75 52.50,154.75 52.50,154.75 52.50,154.75 52.50,142.25 52.50,142.25 52.50,135.37 53.13,123.12 53.88,114.87 54.63,106.75 55.00,99.37 54.63,98.50 Z M 31.13,170.62 C 29.13,182.25 29.50,297.13 31.75,348.75 32.63,369.75 33.50,382.13 33.50,376.25 33.63,370.38 33.13,349.88 32.50,330.75 31.75,311.50 31.50,295.63 31.75,295.25 32.13,295.00 36.50,296.25 41.63,298.00 46.88,299.75 52.50,301.25 54.25,301.25 56.63,301.25 57.50,302.00 57.88,304.63 58.13,306.63 58.38,303.00 58.38,296.88 58.25,289.75 58.13,288.25 57.88,292.75 57.50,297.63 56.88,300.00 55.75,300.00 54.88,300.00 49.13,298.38 43.00,296.25 36.88,294.25 31.63,292.50 31.50,292.50 30.63,292.50 32.25,168.00 33.13,164.63 34.50,159.63 37.00,160.50 40.50,167.13 42.25,170.50 43.63,172.63 43.75,172.13 43.75,171.62 42.63,169.00 41.38,166.38 36.00,156.00 33.50,157.13 31.13,170.62 Z M 36.25,163.75 C 34.63,163.75 33.63,201.75 34.00,243.75 34.00,243.75 34.38,283.13 34.38,283.13 34.38,283.13 43.13,287.75 43.13,287.75 48.00,290.38 52.75,292.50 53.75,292.50 55.38,292.50 55.63,289.63 55.63,274.00 55.63,263.88 55.13,254.87 54.63,254.00 54.00,253.13 53.88,248.62 54.25,244.00 54.63,239.38 54.50,237.25 54.00,239.38 53.38,241.75 53.00,237.87 53.00,229.50 52.88,220.13 52.50,215.63 51.38,215.25 50.50,215.00 50.13,212.75 50.38,209.00 50.75,205.75 50.63,204.50 50.25,206.25 49.88,208.25 48.88,205.13 47.38,197.00 45.13,184.12 42.38,174.87 39.13,167.75 38.13,165.62 36.75,163.75 36.25,163.75 Z M 213.88,164.63 C 213.00,163.75 211.88,165.00 210.00,169.00 207.50,174.87 202.63,192.25 202.38,196.88 202.25,198.50 201.88,198.00 201.38,195.63 200.63,192.63 200.13,194.50 198.88,204.00 197.88,210.63 197.50,217.13 198.00,218.25 198.38,219.38 198.13,221.12 197.25,222.13 196.25,223.38 195.75,229.12 195.75,239.12 195.63,248.25 195.38,252.63 194.75,250.00 194.38,247.63 194.13,252.63 194.38,261.25 194.63,270.25 194.38,274.00 194.00,270.00 193.13,263.38 193.13,263.50 192.25,275.63 191.13,289.50 191.13,305.25 192.13,302.75 192.38,302.00 193.75,301.25 195.00,301.25 196.38,301.25 201.75,299.88 207.13,298.13 212.50,296.38 217.25,295.00 217.75,295.00 218.25,295.00 218.88,296.50 219.13,298.38 219.38,300.38 219.63,275.13 219.50,242.50 219.50,242.50 219.38,183.13 219.38,183.13 219.38,183.13 219.13,237.63 219.13,237.63 218.75,288.25 218.63,292.25 216.50,292.88 215.38,293.25 210.13,295.00 205.00,296.75 199.88,298.63 195.00,300.00 194.13,300.00 192.88,300.00 192.50,297.63 192.75,290.88 192.88,284.75 193.13,283.63 193.38,287.25 193.88,292.50 194.00,292.75 197.25,291.88 199.13,291.50 204.00,289.25 208.13,287.00 208.13,287.00 215.63,282.88 215.63,282.88 215.63,282.88 215.38,224.50 215.38,224.50 215.25,184.75 214.75,165.50 213.88,164.63 Z M 56.75,231.50 C 59.50,250.50 61.63,287.25 62.25,329.25 62.88,363.50 63.50,378.00 64.50,378.38 67.00,379.25 67.50,373.75 67.50,342.13 67.50,293.38 63.50,232.37 60.00,228.13 57.13,224.75 55.88,226.00 56.75,231.50 Z M 193.25,226.62 C 193.00,226.38 191.63,227.75 190.25,229.63 188.25,232.50 187.38,237.37 185.63,255.63 183.00,283.88 181.50,370.12 183.63,375.38 186.75,383.50 187.50,376.75 187.50,338.87 187.50,302.38 189.75,255.25 192.50,236.00 193.25,231.12 193.63,226.88 193.25,226.62 Z M 37.50,304.63 C 37.50,304.63 33.75,302.75 33.75,302.75 33.75,302.75 33.75,308.50 33.75,308.50 33.75,318.63 37.50,406.50 38.25,414.88 39.38,426.50 40.63,423.88 48.13,394.38 54.63,369.38 56.25,356.37 56.25,331.25 56.25,331.25 56.25,309.38 56.25,309.38 56.25,309.38 48.75,307.88 48.75,307.88 44.75,307.13 39.63,305.63 37.50,304.63 Z M 215.88,303.00 C 215.75,302.88 213.38,303.88 210.63,305.13 207.88,306.38 203.00,307.75 199.75,308.13 199.75,308.13 193.75,309.00 193.75,309.00 193.75,309.00 193.75,332.50 193.75,332.50 193.75,348.00 194.38,359.75 195.63,367.00 200.38,394.00 211.13,431.13 211.25,420.63 211.25,419.25 211.88,408.25 212.50,396.25 213.13,384.25 214.25,358.38 214.88,338.75 215.63,319.25 216.00,303.13 215.88,303.00 Z";
				/**var icon = {
				    path: car,
				    scale: .6,
				    strokeColor: 'black',
				    strokeWeight: 1,
				    fillOpacity: 1,
				    fillColor: fillColor,
				    offset: '5%',
				    //rotation: data.heading,
				    anchor: new google.maps.Point(10, 25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
				};**/
				var icon;
				if(itsMe) {
					icon = {
						url: $scope.taxi_marker,
						scaledSize: new google.maps.Size(40, 40),
						//rotation: data.heading,
						origin: new google.maps.Point(0, 0),
						anchor: new google.maps.Point(20, 20) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
					};
			    }else{
					icon = {
						url: $scope.taxi_marker,
						scaledSize: new google.maps.Size(30, 30),
						//rotation: data.heading,
						origin: new google.maps.Point(0, 0),
						anchor: new google.maps.Point(15, 15) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
					};
				}
			    var moveMarker = function(marker, theID){
			    	//position[0] += deltaLat;
			        //position[1] += deltaLng;
					posLat[theID] += deltaLat[theID];
					posLng[theID] += deltaLng[theID];
			        var translatlng = new google.maps.LatLng(posLat[theID], posLng[theID]);
					if(translatlng.lat() !== null){
				        marker.setPosition(translatlng);
				    }
			        if(i[theID] < numDeltas){
			        	movingActive[theID] = true;
			            i[theID]++;
			            setTimeout(function(){
							moveMarker(marker, theID);
							return;
						},delay);
						return;
			        }else{
			        	movingActive[theID] = false;
						oldPosition[theID] = translatlng;
			        }
					return;
			        //marker.setPosition(data.position);
			        movingActive[theID] = false;
			    }
			    
			    var rotateMarkerD = function(marker, rotateTo, theID){
			    	var curRotation = parseInt(marker.icon.rotation);
			        if(isNaN(curRotation)){
			        	curRotation = 0;
			        }
			        var newRotation = parseInt(rotateTo);
			        if(isNaN(newRotation)){
			        	var token_icon = marker.getIcon();
						marker.setIcon(_.merge(token_icon, icon));
				        moveMarker(marker, theID);
			        	return;
			        }
			        if(rotationActive[theID] == undefined || isNaN(rotationActive[theID])){
			        	rotationActive[theID] = false;
			        }
			        if(rotationActive[theID] == false){
			        	turnClockwise[theID] = true;
			        	degreeDifference[theID] = Math.abs(newRotation - curRotation);
			        	delayDuration[theID] = 5 * degreeDifference[theID];
			        	if(newRotation > curRotation){
			        		turnClockwise[theID] = true;
			        	}else{
			        		turnClockwise[theID] = false;
			        	}
			        	if(degreeDifference[theID] > 180){
			        		degreeDifference[theID] = 360 - degreeDifference[theID];
			        		if(turnClockwise[theID] == false){
			        			turnClockwise[theID] = true;
			        		}else{
			        			turnClockwise[theID] = false
			        		}
			        	}
			        	
			        }
			        //console.log("DRIVER - " + data.id + "  - curRotation: " + curRotation + ", Driver-newRotation: " + newRotation);
					//if(newRotation == 0) { newRotation = curRotation;}
			        //SET ROTATION FIRST
			        if(curRotation == newRotation){
			        	//console.log("Rotate: 1 - " + newRotation);
						img[theID].style.transform = 'rotate(' + newRotation + 'deg)';
						icon.rotation = newRotation;
			        	marker.setIcon(_.merge(marker.getIcon(), icon));
			        	rotationActive[theID]  = false;
			        	//var token_icon = marker.getIcon();
						//marker.setIcon(_.merge(token_icon, icon));
				        moveMarker(marker, theID);
			        	return;
			        }else{
			        	delayForRotation[theID] = true;
			        	//console.log("rotationActive[" + data.id + "]: " + rotationActive[theID]);
			        	rotationActive[theID] = true;
			        	
			        	
			        	//var x = curRotation;
			        	var stepRotationAngle = curRotation;
			        	if(turnClockwise[theID] == true){
			        		if(curRotation == 360){curRotation = 0;}
			        		curRotation = curRotation + 1;
			        		//console.log("Rotate: 2 - " + curRotation);
							img[theID].style.transform = 'rotate(' + curRotation + 'deg)';
							icon.rotation = curRotation;
			        		marker.setIcon(icon);
			        		//console.log("DRIVER - " + data.id + " Positive rotation: " + curRotation);
			        		if(x[theID] < degreeDifference[theID]){
					            x[theID]++;
					            setTimeout(function(){
									rotateMarkerD(marker, parseInt(rotateTo), theID);
								},5);
					        }else{
					        	curRotation = newRotation;
					        	rotationActive[theID] = false;
					        	moveMarker(marker, theID);
					        	return;
					        }
			        	}else{
			        		if(curRotation == 0){curRotation = 360;}
			        		curRotation = curRotation - 1;
			        		//console.log("Rotate: 3 - " + curRotation);
							img[theID].style.transform = 'rotate(' + curRotation + 'deg)';
							icon.rotation = curRotation;
			        		marker.setIcon(icon);
			        		//console.log("DRIVER - " + data.id + " Negative rotation: " + curRotation);
			        		if(x[theID] < degreeDifference[theID]){
					            x[theID]++;
					            setTimeout(function(){
									rotateMarkerD(marker, parseInt(rotateTo), theID);
								},5);
					        }else{
					        	curRotation = newRotation;
					        	rotationActive[theID] = false;
					        	moveMarker(marker, theID);
					        	return;
					        }
			        	}
			        	
			        }
			    }
			    
			    var transitionDrivers = function(result, marker, theID){
			    	if(oldPosition[theID] == undefined){
						console.log("OLDPOSITION UNDEFINED");
						oldPosition[theID] = marker.getPosition();
					}
					
					var resultLat = Math.round(parseFloat((result.lat() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	var resultLng = Math.round(parseFloat((result.lng() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	var markerLat = Math.round(parseFloat((oldPosition[theID].lat() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	var markerLng = Math.round(parseFloat((oldPosition[theID].lng() * Math.pow(10, 5)).toFixed(5))) / Math.pow(10, 5);
			    	
			        //console.log("DRIVER2 - " + data.id + " - NEW MOVE TO: " + resultLat + ", " + resultLng +", marker.getPosition(): " +  markerLat + ", " +  markerLng);
			        if((resultLat == markerLat && resultLng == markerLng) || rotationActive[theID]  == true || movingActive[theID]  == true){
			        	//console.log("Rotate: 4 - " + data.heading);
						img[theID].style.transform = 'rotate(' + data.heading + 'deg)';
						icon.rotation = data.heading;
			        	marker.setIcon(icon);
			        	return;
			        }
			        i[theID] = 0;
				    x[theID] = 0;
				    delayForRotation[theID] = false;
				    delayDuration[theID] = 0;
				    rotationActive[theID] = false;
				    movingActive[theID] = false;
				    turnClockwise[theID] = true;
				    degreeDifference[theID];
				    				    
			        deltaLat[theID] = (parseFloat(result.lat()) - parseFloat(oldPosition[theID].lat()))/numDeltas;
			        deltaLng[theID] = (parseFloat(result.lng()) - parseFloat(oldPosition[theID].lng()))/numDeltas;
			        position = [marker.getPosition().lat(), marker.getPosition().lng()];
			        //position = [oldPosition[theID].lat(), oldPosition[theID].lng()];
					posLat[theID] = oldPosition[theID].lat();
					posLng[theID] = oldPosition[theID].lng();
			        rotateMarkerD(marker, data.heading, theID);
			    	
					/**var token_icon = marker.getIcon();
					marker.setIcon(_.merge(token_icon, icon));
			        moveMarker(marker, theID);**/
			    }
			    
				var token = $scope.driversTokensD[+data.id];
				if(_.isObject(token) && _.isFunction(token.setPosition)) {
                    //token.setPosition(data.position);
					transitionDrivers(new google.maps.LatLng(data.position.lat, data.position.lng), $scope.driversTokensD[+data.id], +data.id);
                } else {
                    /**token = $scope.driversTokensD[+data.id] = GoogleMaps.addMarker({
                        latitude: data.position.lat,
                        longitude: data.position.lng,
                        icon: {
                            url: driversICON, 
                            height: 30,
                            width: 30
                        },
                        markerOptions: {
                            icon: {
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(15, 15)
                            }
                        }
                    });**/
                    //var ddx=data.id + 2000;
					//alert("Marker3: " + data.position.lat);
					token = $scope.driversTokensD[+data.id] = new google.maps.Marker({
						position: new google.maps.LatLng(data.position.lat, data.position.lng),
						map: $scope.map,
						icon: icon,
						zIndex: ddx
					});
                }

                /**var token_icon = token.getIcon();
				if(token_icon.url != driversICON) {
					token.setIcon(_.merge(token_icon, { url: driversICON })); 
				}**/
                
            }

            function removeDriverMarkerD(e, data) {
				//////console.log("Driver remove - Event: " + e);
                //var itsMe = (+Customer.id === +data.id);
				//if(itsMe || $scope.has_request){
					//return;
				//}
				var token = $scope.driversTokensD[+data.id];
                if(_.isObject(token) && _.isFunction(token.setPosition)) {
                    GoogleMaps.removeMarker(token);
                    token.setMap(null);
                    delete $scope.driversTokensD[+data.id];
                }
            }

            if(TaxiRide.role === "driver"){
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVERS_MAP_UPDATED, function(e, newDrivers) {
	                _.forEach(_.keys($scope.driversTokensD), function(d_id) {
	                    if(!_.includes(_.keys(newDrivers), d_id)) { // If driver is not present anymore
	                        removeDriverMarkerD(e, { id: +d_id }); // remove it
	                    }
	                });

	                _.forEach(newDrivers, function(d) {
	                    addOrUpdateDriverMarkerD(e, d);
	                });
	            });

            
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_APPEARED, addOrUpdateDriverMarkerD);
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_UPDATED, addOrUpdateDriverMarkerD);
	            $scope.$on(TaxiRide.MAP_EVENTS.DRIVER_DISAPPEARED, removeDriverMarkerD);
	        }

        };

        var create_destroy_event = true;
        this.loadContent = function() {
            if($scope.driver) {
                $scope.accepted_waiting = $scope.user.driver_accepted_waiting;
                $scope.accepted = $scope.user.driver_accepted;
                if(create_destroy_event) {
                    create_destroy_event = false;
                    $scope.$on("$destroy", function() {
						$scope.goOffline;
						$scope.isDriverOnline = false;
						if (_.isFunction(_.get(window, 'plugins.socialsharing.stopService'))) {
							window.plugins.socialsharing.stopService("","goOffline",function(result){
								$scope.serviceStarted = false;},function(error){ alert("5: " + error)});
						}
						
					});
                }
				
    			controller.common.stopLocationUpdates();
				//console.log("LOADCONTENT hasCar? : " + TaxiRide.hasCar);
				if(TaxiRide.hasCar  == true){
					$scope.goOnline();
					console.log("startUpdates 4");
					controller.common.startLocationUpdates();
					$scope.centerWithGPS();
				}/**else{
					SafePopups.show("show",{
						title: '<div class="bar-assertive">'+$translate.instant('No active vehicle')+'</div>',
						template: '<i class="icon ion-alert-circled"></i> '+
								$translate.instant('You do not have an active vehicle yet!')+
								'<br>'+
								$translate.instant("You won't be able to pick passengers without an active vehicle. Please add a vehicle or change to an approved one now."),
						buttons: [{
							text: $translate.instant("Cancel")
						},{
							text: $translate.instant("Vehicle Settings"),
							onTap: function() {
								ContextualMenu.close();
								TaxiRide.showCustomFieldsModal();
							},
							type: 'button-assertive'
						}]
					});
					$scope.goOffline();
				}**/
            }
        };

        this.initMap = function() {
            var autoResetMap = false;
            if(autoResetMap) {
                var resetMapCenterAfterMove = _.debounce(function() {
                    $timeout(function() {
                        if(_.isObject($scope.myLocationMarker)) {
                            $scope.map_moved_by_user = false;
                            $scope.map.panTo($scope.myLocationMarker.getPosition());
                            controller.common.zoomIfNeeded();
                        }
                    });
                }, 5000);

                $scope.$on(GoogleMaps.USER_INTERACTED_EVENT, resetMapCenterAfterMove);
            }
        };

        return this;

    })();


    /* TODO: CLEAN. This should be inside subobjects driver or passenger for clarity */
    $scope.cancelStatus = function() {
        SafePopups.show("show",{
            title: '<div class="bar-assertive">'+$translate.instant('Are you sure?')+'</div>',
            template: '<i class="icon ion-alert-circled"></i> '+
                    $translate.instant('This action cannot be reversed!')+
                    '<br>'+
                    $translate.instant("Are you sure you want to cancel the ride?"),
            buttons: [{
                text: $translate.instant("Close")
            },{
                text: $translate.instant("Cancel ride"),
                onTap: function() {
					if(TaxiRide.role === "driver") {
						TaxiRide.logData("Driver cancelled RIDE");
						TaxiRide.updateStatus(TaxiRide.current_request, 'driver-cancelled');
						if (_.isFunction(_.get(window, 'plugins.socialsharing.stopService'))) {
							window.plugins.socialsharing.stopService("","",function(result){
								
							},function(error){ alert("6: " + error)});
                        }
					}else{
						TaxiRide.logData("Passenger cancelled RIDE");
						TaxiRide.updateStatus(TaxiRide.current_request, 'passenger-cancelled');
					}
                },
                type: 'button-assertive'
            }]
        });
    };

    $scope.finishStatus = function() {
		TaxiRide.logData("Driver finished RIDE");
		$scope.request_is_ongoing = false;
        var options = {
            title: '<div class="bar-assertive">'+$translate.instant('Are you sure?')+'</div>',
            template: $translate.instant("Are you sure to finish ride?"),
            buttons: [{
                text: $translate.instant("Close")
            }]
        };

        if(TaxiRide.allow_manual_prices) {
            $scope.final_popup = {final_price: null};
            options.template = $translate.instant("Please enter final price to finish ride :") + "<br>" +
                "<input autofocus type=\"number\" ng-model=\"final_popup.final_price\">";
            options.scope = $scope;
            options.buttons.push({
                text: $translate.instant("Set price and finish ride"),
                type: 'button-balanced',
                onTap: function() {
                    var final_price =  parseFloat($scope.final_popup.final_price);
                    if(isNaN(final_price) || final_price < 0) {
                        SafePopups.show("alert", {
                            title: $translate.instant("Incorrect price"),
                            template: ($translate.instant("Final price can't be negative and format should use only dot and numbers. e.g. : 1234.56"))
                        }).then($scope.finishStatus);
                    } else {
                        TaxiRide.updateStatus(TaxiRide.current_request, 'finished', final_price);
                    }
                }
            });
			var popup = SafePopups.show(
				"show", // Cannot use prompt because OF REASONS. IONIC REASONS
				options
			);
        } else {
            /**options.buttons.push({
                text: $translate.instant("Finish ride"),
                onTap: function() {
                    TaxiRide.updateStatus(TaxiRide.current_request, 'finished');
                },
                type: 'button-balanced'
            });**/
        }

        /**var popup = SafePopups.show(
            "show", // Cannot use prompt because OF REASONS. IONIC REASONS
            options
        );**/
		if (_.isFunction(_.get(window, 'plugins.socialsharing.stopService'))) {
			window.plugins.socialsharing.stopService("","",function(result){
				//alert("Coord: " + JSON.stringify(result));
				if (result && result !== "[]") {
					TaxiRide.updatePoints(TaxiRide.current_request.id,result);
				}
			},function(error){
				alert(error);
				TaxiRide.updatePoints(TaxiRide.current_request.id,"[]");
			});
		}
		

    };
	
	$scope.driverArrived=function(){
		$scope.driver_arrived = true;
		$scope.driver_arrival_time = new Date().getTime();
		
	}

    $scope.startRide = function() {
        /**SafePopups.show("show",{
            title: '<div class="bar-assertive">'+$translate.instant('Are you sure?')+'</div>',
            template: $translate.instant("Please confirm that passenger has boarded vehicle. Start ride?"),
            buttons: [{
                text: $translate.instant("Close")
            },{
                text: $translate.instant("Start ride"),
                onTap: function() {
                    TaxiRide.updateStatus(TaxiRide.current_request, 'going');
                },
                type: 'button-balanced'
            }]
        });
		if (_.isFunction(_.get(window, 'plugins.socialsharing.setLoc'))) {
			window.plugins.socialsharing.setLoc("","",function(){ 
				console.log('service started..');
				if (_.isFunction(_.get(window, 'plugins.socialsharing.startRecording'))) {
					window.plugins.socialsharing.startRecording("start","",function(){
						
					},function(){
						alert("Error starting recording");
					});
				}
			},function(){ 
				alert("erro location");
			});
		}**/
		minuteDelayOver = true; 
		$scope.serviceStarted = false;
		TaxiRide.hasNotifiedTripStarted = false;
		$scope.arrivalInfo = "Your trip has started. Track it here";
		if (_.isFunction(_.get(window, 'plugins.socialsharing.startRecording'))) {
			window.plugins.socialsharing.startRecording("","start",function(tokken){
				console.log('recording mode is on..')
			},function(error){ alert("6: " + error)});
		}
		
		//REMOVE AUTOMATIC NAVIGATION START - LET DRIVER USE IT
		/**if($scope.current_request.dropoff_lat){
			var navString="google.navigation:q=" + $scope.current_request.dropoff_lat + "," + $scope.current_request.dropoff_long;
			if (_.isFunction(_.get(window, 'plugins.socialsharing.startNavigation'))) {
				window.plugins.socialsharing.startNavigation("",navString,function(){ 
					console.log('google navigation..');
				},function(){ alert("erro location")});
			}
		}**/
		var arrival_time = $scope.driver_arrival_time;
		var departure_time = new Date().getTime();
		if(arrival_time && departure_time){
			var diffMs = departure_time - arrival_time;
			var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
			if(diffMins > 5){ 
				localStorage.setItem('waiting_time',diffMins)
			}else{
				localStorage.setItem('waiting_time',0);
			}                
		} else {
			localStorage.setItem('waiting_time',0);
		}
		
		TaxiRide.logData("Driver started RIDE");
		TaxiRide.updateStatus(TaxiRide.current_request, 'going');
    };

    /* END TODO: CLEAN */

    (function preInit() {
        $scope.preInit = true;
        $value_id = TaxiRide.value_id = $stateParams.value_id;

        $scope.login = function() { Customer.loginModal(); };
		
		$scope.newCodes=function(){
            TaxiRide.updatePoints(147,"you are working");
        }

        $scope.selected_role = null;
        $scope.selectRole = function(role) { $scope.selected_role = role; $scope.continue(); };

        $scope.continue = function() {
            if($scope.must_login) {
				////console.log("1. login");
                Customer.loginModal();
            } else {
                if($scope.selected_role === null) {
					////console.log("2. loading true");
                    $scope.is_loading = true;
                    return TaxiRide.roleForCustomer().then(function(role) {
                        TaxiRide.role = $scope.selected_role = role;
                    }, function(args) {
                        if(_.isArray(args)) {
                            console.error.apply(this, ["[Error from TaxiRide.roleForCustomer]"].concat(args));
                        } else {
                            console.error("[Error from TaxiRide.roleForCustomer]", args);
                        }
                    }).finally(function(){
                        $scope.is_loading = false;
                        if($scope.selected_role !== null) {
                            $scope.continue();
                        }
                    });
                } else if(/driver|passenger/i.test($scope.selected_role)) {
                    if (TaxiRide.role != $scope.selected_role) {
                        $scope.is_loading = true;
                        return TaxiRide.setRoleForCustomer($scope.selected_role).then(function(role) {
                            TaxiRide.role = $scope.selected_role = role;
							////console.log("3. selected role");
                            $scope.continue();
                        }, function() { //////console.log("error"); 
						}).finally(function() {
                            $scope.is_loading = false;
                        });
                    } else {
                        controller.common.init();
                    }
                }
            }
        };

        var firstLoad = function() {
			////console.log("4. first load");
            $scope.page_title = TaxiRide.page_title;
            $scope.must_login = true;

            var checkLoginStatus = function(event, loggedIn) {
                if(!$scope.must_login && !loggedIn) {
                    // We just logged out, we need to reload
					////console.log("5. we logged out....we need to reload");
                    $state.reload();
                } else {
                    $scope.is_loading = false;
                    $scope.selected_role = TaxiRide.role;
                    $scope.must_login = !loggedIn;
					////console.log("6. loggedIn: " + loggedIn);
                    //if(loggedIn) {
                        $scope.continue();
                    //}
                }
            };

            $scope.$on(AUTH_EVENTS.loginStatusChanged, checkLoginStatus);
            $scope.$on("$ionicView.enter", function() {
                checkLoginStatus(null, Customer.isLoggedIn());
            });

            checkLoginStatus(null, Customer.isLoggedIn());
        };

        $scope.is_loading = true;
        if(!TaxiRide.loaded) {
            TaxiRide.load().then(firstLoad);
        } else {
            firstLoad();
        }

    }());

}).controller("TaxiRideMapSideMenuController", function(_, $scope, ContextualMenu, Customer, TaxiRide, HomepageLayout) {

    HomepageLayout.getFeatures().then(function (features) {
        $scope.my_account_icon = _.get(_.find(_.get(features, "options"), {code: "tabbar_account"}), "icon_url");
    });

    $scope.showPaymentsSettings = function() {
        ContextualMenu.close();
        TaxiRide.showPaymentsSettingsModal();
    };

    $scope.showSettings = function() {
        ContextualMenu.close();
        TaxiRide.showCustomFieldsModal();
    };

    $scope.showMyAccount = function() {
        ContextualMenu.close();
        Customer.loginModal();
    };

    $scope.showHistorySettings = function() {
        ContextualMenu.close();
        TaxiRide.showHistoryModal();
    }
});
