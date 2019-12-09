App.factory('Customer', function($sbhttp, $ionicModal, $rootScope, $templateCache, $window, $state, httpCache, Application, Url, AUTH_EVENTS, CACHE_EVENTS) {
    var factory = {};

    var _id = null;

    Object.defineProperty(factory, "id", {
        get: function() {
            return _id;
        },
        set: function(value) {
            var _broadcast_events = (value != _id);
            _id = value;
            if(_broadcast_events) {
                var loggedIn = factory.isLoggedIn();
                $rootScope.$broadcast(AUTH_EVENTS.loginStatusChanged, loggedIn);
                $rootScope.$broadcast(AUTH_EVENTS[loggedIn ? "loginSuccess" : "logoutSuccess"]);
            }
            return _id;
        }
    });

    Object.defineProperty($rootScope, "customer_id", {
        get: function() {
            return factory.id;
        }
    }); // symbolic link to bypass dependency injection for Application service


    factory.can_access_locked_features = false;
    factory.events = [];
    factory.modal = null;
    factory.display_account_form = false;
	factory.showingLogin = false;
	factory.fromLogout = false;

    factory.onStatusChange = function(id, urls) {
        factory.events[id] = urls;
    };
	
	factory.logData=function(customer_id, message){
		return $sbhttp({
			method: 'GET',
			url: Url.get("taxiride/mobile_view/logdata", {customer_id: customer_id, message: message}),
			cache: false,
			responseType:'json'
		});
	};

    factory.flushData = function() {

        for(var i in factory.events) {

            if(angular.isArray(factory.events[i])) {
                var data = factory.events[i];
                for(var j = 0; j < data.length; j++) {
                    if (typeof data[j] != "undefined") {
                        httpCache.remove(data[j]);
                    }
                }
            }

        }

    };

    factory.loginModal = function(scope) {
		console.log("CUSTOMER loginModal: showingLogin?: " + factory.showingLogin + ", _.isObject(factory.modal): " + _.isObject(factory.modal));
        if(factory.showingLogin || _.isObject(factory.modal)){
    		return;
    	}
    	factory.showingLogin = true;
		
		if(factory.fromLogout){
			factory.flushData();
			factory.clearCredentials();
		}
		
		if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        if(typeof scope == "undefined") {
            scope = $rootScope;
        }
        scope.privacy_policy = Application.privacy_policy;

        $ionicModal.fromTemplateUrl('templates/customer/account/l1/login.html', {
            scope: scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            factory.modal = modal;
            factory.modal.show();
        });
    };

    factory.login = function(data) {
        data.device_uid = device.uuid;
		console.log("CUSTOMER login start");

        return $sbhttp({
            method: 'POST',
            url: Url.get("customer/mobile_account_login/post"),
            data: data,
            responseType:'json'
        }).success(function(data) {
			console.log("CUSTOMER login SUCCESS: " + JSON.stringify(data));
			factory.flushData();
            factory.saveCredentials(data.token); //setTimeout(function(){ factory.saveCredentials(data.token); }, 2000); //
			//factory.showingLogin = false;

            factory.can_access_locked_features = data.can_access_locked_features;
            factory.id = data.customer_id;
			if(factory.fromLogout){
				$state.go("home");
				factory.fromLogout = false;
			}
			
			//LOG
			factory.logData(factory.id, "User signed in");
            
        }).error(function(data) {
			console.log("CUSTOMER login FAILED: " + JSON.stringify(data));
			factory.flushData();
            factory.saveCredentials(data.token); //setTimeout(function(){ factory.saveCredentials(data.token); }, 2000); //
			//factory.showingLogin = false;

            factory.can_access_locked_features = data.can_access_locked_features;
            factory.id = data.customer_id;
		});
    };

    factory.loginWithFacebook = function(token) {
        var data = {
            device_id: device.uuid,
            token: token
        };

        return $sbhttp({
            method: 'POST',
            url: Url.get("customer/mobile_account_login/loginwithfacebook"),
            data: data,
            responseType:'json'
        }).success(function(data) {
            factory.saveCredentials(data.token);

            factory.can_access_locked_features = data.can_access_locked_features;
            factory.id = data.customer_id;
            factory.flushData();
        });
    };

    factory.register = function(data) {
        data.device_uid = device.uuid;

        return $sbhttp({
            method: 'POST',
            url: Url.get("customer/mobile_account_register/post"),
            data: data,
            responseType:'json'
        }).success(function(data) {
            factory.saveCredentials(data.token);

            factory.can_access_locked_features = data.can_access_locked_features;
            factory.id = data.customer_id;
            factory.flushData();
			
			//LOG
			factory.logData(factory.id, "New user registration");
        });
    };

    factory.getAvatarUrl = function(customer_id, options) {
        options = angular.isObject(options) ? options : {};
        var url = Url.get("/customer/mobile_account/avatar", angular.extend({}, options, {customer: customer_id})) + ($rootScope.isOffline ? "" : "?" +(+new Date()));
        return url;
    };

    factory.save = function(data) {

        if(!factory.isLoggedIn()) {
            return factory.register(data);
        }

        return $sbhttp({
            method: 'POST',
            url: Url.get("customer/mobile_account_edit/post"),
            data: data,
            responseType:'json'
        }).success(function(data) {
            if(data.clearCache) {
                $rootScope.$broadcast(CACHE_EVENTS.clearSocialGaming);
            }
        });
    };

    factory.forgottenpassword = function(email) {

        return $sbhttp({
            method: 'POST',
            url: Url.get("customer/mobile_account_forgottenpassword/post"),
            data: {email: email},
            responseType:'json'
        });
    };

    factory.logout = function() {

        return $sbhttp({
            method: 'GET',
            url: Url.get("customer/mobile_account_login/logout"),
            responseType:'json'
        }).success(function() {
            factory.clearCredentials();
            factory.showingLogin = false;

            factory.can_access_locked_features = false;
            factory.id = null;
            factory.flushData();
            //$window.location.reload();
			factory.fromLogout = true;
        });
    };

    factory.removeCard = function() {

        return $sbhttp({
            method: 'POST',
            url: Url.get("mcommerce/mobile_sales_stripe/removecard"),
            data: {customer_id: factory.id},
            responseType:'json'
        });
    };

    factory.find = function() {
        return $sbhttp({
            method: 'GET',
            url: Url.get("customer/mobile_account_edit/find"),
            responseType:'json'
        });
    };

    factory.isLoggedIn = function() {
        return !!this.id;
    };

    factory.saveCredentials = function (token) {
		if(token){
			$window.localStorage.setItem("sb-auth-token", token);
		}
    };

    factory.clearCredentials = function () {
        $window.localStorage.removeItem('sb-auth-token');
    };

    return factory;
});
