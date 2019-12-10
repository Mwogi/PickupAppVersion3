App.controller('TaxiRideHistoryModalController', function(_, $ionicPopup, $ionicLoading, $scope, $state, $translate, TaxiRide, SafePopups) {

    $scope.role = TaxiRide.role;
	$scope.requests = {};
	$scope.stats = {};
	$scope.tabToShow = 1;
	var today = new Date();
	var theDay = today.getDate();
	var theMonth = today.getMonth() + 1;
	var theYear = today.getFullYear();
	var dayorweek = theDay;
	var income = 0;
	var rides = 0;
	var declines = 0;
	var prePend = "today";

    var drawChart = function(){
		$ionicLoading.show({
            template: $translate.instant("Loading") + "...<br/><br/><ion-spinner class=\"spinner-custom\"></ion-spinner>"
        });

        console.log("getStats - prePend: " + prePend + ", dayorweek: " + dayorweek + ", theMonth: " + theMonth + ", theYear: " + theYear);
		TaxiRide.getStats(prePend, dayorweek, theMonth, theYear).success(function(dataStats) {
			console.log("dataStats: " + JSON.stringify(dataStats));
            $ionicLoading.hide();
            $scope.loading = false;
            $scope.stats = dataStats;
			income = 0;
			rides = 0;
			declines = 0;
			var maxIncomeChart = 50000;
			var maxRidesChart = 100;
			var maxDeclinesChart = 100;
			
			for(var index = 0; index < $scope.stats.length; index++) {
				var incStr = $scope.stats[index].income.toString();
				income = parseFloat(income) + parseFloat(incStr.replace(',', ''));
				rides = parseFloat(rides) + parseFloat($scope.stats[index].ridesNumber);
				declines = parseFloat(declines) + parseFloat($scope.stats[index].cancelledNum);
			}
			
			if(rides>0){
				declines = (declines/(rides+declines)) * 100;
			}else{
				if(declines>0){
					declines = 100;
				}
			}
			console.log("Income: " + income + ", rides: " + rides + ", declines: " + declines);
			if(prePend == "today"){
				TaxiRide.getRequestTodayHistory(TaxiRide.role, dayorweek, theMonth, theYear).success(function(data) {
					console.log("data: " + JSON.stringify(data));
					$ionicLoading.hide();
					$scope.loading = false;
					$scope.requests = data;
				});
			} else if(prePend == "week"){
				if(TaxiRide.role == "driver"){
					maxIncomeChart = 350000;
					maxRidesChart = 500;
					maxDeclinesChart = 100;
				
					var weekData =[];
					var theDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
					for (var i = 1; i <8; i++) {
						var amount = 0;
						for(var x = 0; x < $scope.stats.length; x++){
							if (parseInt($scope.stats[x].dayofweek) == i){
								amount = parseFloat($scope.stats[x].income);
								break;
							}
						}
						
						weekData.push(amount);
					}
					console.log("weekData: " + JSON.stringify(weekData));
					
					var dataChart = new google.visualization.DataTable();
					dataChart.addColumn('string', 'Day');
					dataChart.addColumn('number', 'Income');
					dataChart.addRows([
						['Mon', weekData[1]],
						['Tue', weekData[2]],
						['Wed', weekData[3]],
						['Thu', weekData[4]],
						['Fri', weekData[5]],
						['Sat', weekData[6]],
						['Sun', weekData[0]]
					]);
					  
					  var optionsWeek = {
						  chart: {
							  title: 'Income for the week' 
						  }, 
						  legend: {
							  position: 'none' 
						  },
						  backgroundColor: {
							  fill:'transparent'
						  },
						  chartArea:{
							  width:'100%',
							  left: 30
						  }
					  };
					  var chartWeek = new google.visualization.ColumnChart(document.getElementById('week_rides'));
					  chartWeek.draw(dataChart, optionsWeek);
				}

			}
			if(TaxiRide.role == "driver"){
				$scope.dataRides = [
				  ['Label', 'Value'],
				  ['Rides', 0]
				];
				$scope.dataIncome = [
				  ['Label', 'Value'],
				  ['Income', 0]
				];
				$scope.dataDeclines = [
				  ['Label', 'Value'],
				  ['Rejection Rate', 0]
				];
				
				var dataRides = google.visualization.arrayToDataTable([
				  ['Label', 'Value'],
				  ['Rides', parseFloat(rides)]
				]);
				var dataIncome = google.visualization.arrayToDataTable([
				  ['Label', 'Value'],
				  ['Income', parseFloat(income)]
				]);
				var dataDeclines = google.visualization.arrayToDataTable([
				  ['Label', 'Value'],
				  ['Rejection Rate', parseFloat(declines)]
				]);
				
				
				
				var redMaxRides = (20/100) * maxRidesChart;
				var yellowMaxRides = (40/100) * maxRidesChart;
				var greenMinRides = (80/100) * maxRidesChart;
				var optionsRides = {
				  redFrom: 0, redTo: redMaxRides,
				  yellowFrom: redMaxRides, yellowTo: yellowMaxRides,
				  greenFrom: greenMinRides, greenTo: maxRidesChart,
				  minorTicks: 5,
				  animation:{
					duration: 3000,
					easing: 'out',
					startup: true
				  },
				  max: maxRidesChart
				};
				
				var redMaxIncome = (20/100) * maxIncomeChart;
				var yellowMaxIncome = (40/100) * maxIncomeChart;
				var greenMinIncome = (80/100) * maxIncomeChart;
				var optionsIncome = {
				  redFrom: 0, redTo: redMaxIncome,
				  yellowFrom: redMaxIncome, yellowTo: yellowMaxIncome,
				  greenFrom: greenMinIncome, greenTo: maxIncomeChart,
				  minorTicks: 5,
				  animation:{
					duration: 3000,
					easing: 'out',
					startup: true
				  },
				  max: maxIncomeChart
				};
				var optionsDeclines = {
				  greenFrom: 0, greenTo: 20,
				  yellowFrom:20, yellowTo: 50,
				  redFrom:50, redTo: 100,
				  minorTicks: 5,
				  animation:{
					duration: 3000,
					easing: 'out',
					startup: true
				  },
				  max: maxDeclinesChart
				};
				var chartRides = new google.visualization.Gauge(document.getElementById(prePend + '_div_rides'));
				chartRides.draw(dataRides, optionsRides);
				
				var chartIncome = new google.visualization.Gauge(document.getElementById(prePend + '_div_income'));
				chartIncome.draw(dataIncome, optionsIncome);
				
				var chartDeclines = new google.visualization.Gauge(document.getElementById(prePend + '_div_declines'));
				chartDeclines.draw(dataDeclines, optionsDeclines);
			}
        });
		
		
		
	}
	
	$scope.load = function() {
		if(TaxiRide.role == "driver"){
			//google.charts.load('current', {'packages':['gauge']});
			//google.charts.load('current', {'packages':['corechart']});
			google.charts.setOnLoadCallback(drawChart);
		}
    };
	
	$scope.load();
	
	setTimeout(function(){ $scope.openTab(1); }, 3000);

    $scope.close = function() {
        $scope.$close();
    };
	
	$scope.openTabToday = function(tabNum) {
		today = new Date();
		$scope.openTab(1);
	}
	
	$scope.openTabWeek = function(tabNum) {
		today = new Date();
		$scope.openTab(2);
	}
	
	$scope.openTab = function(tabNum) {
		$scope.tabToShow = tabNum;
		
		if(tabNum == 1){
			$scope.title = "Rides for " + today.toDateString();
			prePend = "today";
			dayorweek = today.getDate();
		}else if(tabNum == 2){
			prePend = "week";
			d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
			d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
			var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
			dayorweek = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
			theMonth = today.getMonth() + 1;
			theYear = today.getFullYear();
			$scope.title = "Rides for week " + dayorweek + " of " + theYear;
			
		}else if(tabNum == 3){
			$scope.title = "Your last 52 weeks on Nyota Ride";
			prePend = "year";
			dayorweek = 0;
			theYear = today.getFullYear();
		}
		drawChart();
		
		
    };

    $scope.showStatDetsWeek = function(thisWeekDate, thisWeek) {
		today = new Date(thisWeekDate);
		theDay = thisWeek;
		theMonth = today.getMonth() + 1;
		theYear = today.getFullYear();
		$scope.openTab(2);
	}
	$scope.showStatDets = function(thisDay) {
		today = new Date(thisDay);
		theDay = today.getDate();
		theMonth = today.getMonth() + 1;
		theYear = today.getFullYear();
		$scope.openTab(1);
	};
	$scope.showDetails = function(request) {
        //Showing details
        var template = '<div class="list">';
        template += '<div class="item item-divider">' +
                    $translate.instant("Date") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                    request.date +
                '</div>' +
                '<div class="item item-divider">' +
                    $translate.instant("Price") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                    request.price +
                '</div>';
				template+='<div class="item item-divider">' +
                    $translate.instant("Destination") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                    request.dropoff_address +
                '</div>';
				
				if(request.final_path_points !== null || request.final_path_points !== ""){
					var escPathPoints = request.final_path_points;
					template += '<hr />';
					template += '<img width="100%" src="https://maps.googleapis.com/maps/api/staticmap?size=500x200&path=weight:5%7Ccolor:red%7Cenc:' + escPathPoints + '" border="0">';
					template += '<hr />';
					console.log('<img width="100%" src="https://maps.googleapis.com/maps/api/staticmap?size=500x200&path=weight:5%7Ccolor:red%7Cenc:' + escPathPoints + '" border="0">');
				}	
						

                if(TaxiRide.role == "passenger") {
                    template += '<div class="item item-divider">' +
                        $translate.instant("Driver Name") +
                        '</div>' +
                        '<div class="item item-text-wrap">' +
                        request.driver_name +
                        '</div>';
                } else {
                    template += '<div class="item item-divider">' +
                    $translate.instant("Passenger Name") +
                    '</div>' +
                    '<div class="item item-text-wrap">' +
                    request.passenger_name +
                    '</div>';
                }

                template +=
                '<div class="item item-divider">' +
                    $translate.instant("Status") +
                '</div>' +
                '<div class="item item-text-wrap ucfirst">' +
                    $translate.instant(request.status) +
                '</div>' +
                '<div class="item item-divider">' +
                    $translate.instant("Payment method") +
                '</div>' +
                '<div class="item item-text-wrap">' +
                    $translate.instant(request.payment_method) +
                '</div>' +
                '<div class="item item-divider">' +
                    $translate.instant("Payment status") +
                '</div>' +
                '<div class="item item-text-wrap ucfirst">' +
                    $translate.instant(request.payment_status) +
                '</div>' +
            '</div>';

        //Button to permit customer to pay ride
        var popupButtons = [];
        if(TaxiRide.stripe_available && (TaxiRide.payment_methods == 'all' || TaxiRide.payment_methods == 'stripe') && TaxiRide.role == "passenger" && request.payment_status === "unpaid" && request.status === "finished") {
            popupButtons.push({
                text: $translate.instant('Pay by card'),
                type: 'button-assertive',
                onTap: function(e) {
                    if(_.isObject(TaxiRide.payments_settings_data.card) && _.isString(TaxiRide.payments_settings_data.card.last4)) {
                        SafePopups.show("confirm",{
                            title: $translate.instant('Confirmation'),
                            template: $translate.instant("Do you confirm you want to pay by card?")
                        }).then(function(res){
                            if(res) {
                                TaxiRide.pay(request.id).then(function(request){
                                    $scope.load();
                                });
                            } else {
                                $scope.showDetails(request);
                            }
                        });
                    } else {
                        SafePopups.show("confirm",{
                            title: $translate.instant('No card set'),
                            template: $translate.instant("You do not have any card configurated. Go to settings?")
                        }).then(function(res){
                            if(res) {
                                TaxiRide.showPaymentsSettingsModal();
                            } else {
                                $scope.showDetails(request);
                            }
                        });
                    }
                }
            });
        }

        //Button to allow customer to pay with 2CO
        if(TaxiRide.tco_available && (TaxiRide.payment_methods == 'all' || TaxiRide.payment_methods == '2co') && TaxiRide.role == "passenger" && request.payment_status === "unpaid" && request.status === "finished") {
            popupButtons.push({
                text: $translate.instant('Pay by card'),
                type: 'button-assertive',
                onTap: function(e) {
                    $scope.$close();
                    $state.go("taxi_ride-tco", {"value_id": TaxiRide.value_id, "request_id": request.id});
                }
            });
        }

        //Button to permit driver to set ride as paid
        if(TaxiRide.role == "driver" && request.payment_status === "unpaid" && request.status === "finished") {
            popupButtons.push({
                text: $translate.instant('Mark as paid'),
                type: 'button-assertive',
                onTap: function(e) {
                    SafePopups.show("confirm",{
                        title: $translate.instant('Confirmation'),
                        template: $translate.instant("Do you confirm that ride is paid?")
                    }).then(function(res){
                        if(res) {
                            TaxiRide.setRideAsPaid(request.id).finally($scope.load);
                        } else {
                            $scope.showDetails(request);
                        }
                    });
                }
            });
            popupButtons.push({
                text: $translate.instant('Change price'),
                type: 'button-assertive',
                onTap: function(e) {
                    TaxiRide.driver.setRidePrice(request.id).then(
                        $scope.load,
                        function() {
                            $scope.showDetails(request);
                        }
                    );
                }
            });
        }

        popupButtons.push({
            text: $translate.instant('Ok'),
            type: 'button-positive'
        });

        var dialog_data = {
            title: $translate.instant("Request") + ' ' + request.id,
            cssClass: "taxiride",
            scope: $scope,
            template: template,
            buttons: popupButtons
        };

        SafePopups.show("show",dialog_data);
    };

});
