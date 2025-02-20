App.config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider.state('job-list', {
        url: BASE_PATH+"/job/mobile_list/index/value_id/:value_id",
        controller: 'JobListController',
        templateUrl: "modules/job/templates/l1/list.html"
    }).state('job-view', {
        url: BASE_PATH+"/job/mobile_view/index/value_id/:value_id/place_id/:place_id",
        controller: 'JobViewController',
        templateUrl: "modules/job/templates/l1/view.html"
    }).state('company-view', {
        url: BASE_PATH+"/job/mobile_view/index/value_id/:value_id/company_id/:company_id",
        controller: 'CompanyViewController',
        templateUrl: "modules/job/templates/l1/view-company.html"
    });

}).controller('JobListController', function($cordovaGeolocation, $cordovaSocialSharing, $ionicModal, $rootScope, $scope, $state, $stateParams, $timeout, $translate, $window, Application, Customer, Dialog, Job) {

    $scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline == true) {
            $scope.loadContent();
        }
    });

    $scope.collection = new Array();
    $scope.categories = new Array();

    $scope.can_load_older_places = false;
    $scope.social_sharing_active = false;
    $scope.is_loading = true;
    $scope.value_id = Job.value_id = $stateParams.value_id;
    $scope.offset = null;
    $scope.time = null;
    $scope.modal = null;
    $scope.admin_modal = null;

    $scope.distance_range = new Array(1, 5, 10, 20, 50, 75, 100, 150, 200, 500, 1000);
    $scope.Math = window.Math;

    $scope.filters = {
        time: 0,
        pull_to_refresh: false,
        count: 0,
        fulltext: "",
        locality: null,
        position: null,
        keywords: null,
        radius: 4,
        distance: 0,
        categories: null,
        more_search: false
    };

    $scope.filterPlaces = function(place) {
        var concat = place.title+place.subtitle+place.location+place.contract_type+place.company_name;
        var result = true;

        var parts = $scope.filters.fulltext.split(" ");
        for(var i = 0; i < parts.length; i++) {
            var filtered = parts[i].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            var regexp = new RegExp(parts[i], "gi");

            result = result && concat.match(regexp);
        }

        return result;
    };

    /** Re-run findAll with new options */
    $scope.validateFilters = function() {
        $scope.filters.position = false;
        $scope.filters.more_search = true;

        $scope.closeFilterModal();

        $scope.collection = new Array();
        $scope.loadContent();
    };

    /** Reset filters */
    $scope.clearFilters = function() {
        angular.forEach($scope.categories, function(value, key) {
            $scope.filter.categories[key].is_checked = false;
        });

        $scope.filters.fulltext = "";
        $scope.filters.locality = null;
        $scope.filters.more_search = false;
        $scope.filters.position = false;
        $scope.filters.keywords = null;
        $scope.filters.radius = 4;
        $scope.filters.distance = 0;

        $scope.closeFilterModal();

        $scope.collection = new Array();
        $scope.loadContent();
    };

    $scope.filterModal = function() {
        $ionicModal.fromTemplateUrl('modules/job/templates/l1/more.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    };

    $scope.closeFilterModal = function() {
        $scope.modal.hide();
    };

    $scope.adminModal = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        $ionicModal.fromTemplateUrl('modules/job/templates/l1/admin-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.admin_modal = modal;
            $scope.admin_modal.show();
        });
    };

    $scope.closeAdminModal = function() {
        $scope.admin_modal.hide();
    };

    $scope.loadContent = function(type) {

        $scope.filters.time = 0;
        $scope.filters.pull_to_refresh = false;
        $scope.filters.count = 0;

        Job.findAll($scope.filters).success(function(data) {

            $scope.options = Job.options = data.options;
            $scope.collection = $scope.collection.concat(data.collection);
            if($scope.filters.categories == null) {
                $scope.filters.categories = data.categories;
            }
            $scope.filters.locality = data.locality;
            $scope.page_title = data.page_title;
            $scope.can_load_older_places = data.more;
            Job.admin_companies = $scope.admin_companies = data.admin_companies;

            $scope.social_sharing_active = !!(data.social_sharing_is_active == 1 && $scope.collection.length > 0 && !Application.is_webview);

            $scope.page_title = data.page_title;
        }).finally(function() {
            $scope.is_loading = false;
        });
    };

    $scope.loadMore = function() {
        if($scope.filters.more_search) {
            return;
        }

        var time = 0;
        var distance = 0;
        if($scope.collection.length > 0) {
            time = $scope.collection[$scope.collection.length-1].time;
            distance = $scope.collection[$scope.collection.length-1].distance;
        }

        $scope.filters.time = time;
        $scope.filters.distance = distance;
        $scope.filters.pull_to_refresh = false;
        $scope.filters.count = $scope.collection.length;

        Job.findAll($scope.filters).success(function(data) {

            $scope.collection = $scope.collection.concat(data.collection);
            $scope.page_title = data.page_title;
            $scope.can_load_older_places = data.more;

            $scope.social_sharing_active = !!(data.social_sharing_is_active == 1 && $scope.collection.length > 0 && !Application.is_webview);

            $scope.page_title = data.page_title;
        }).finally(function() {
            $scope.is_loading = false;
            $scope.$broadcast('scroll.infiniteScrollComplete');
        });
    };

    $scope.pullToRefresh = function() {
        if($scope.filters.more_search) {
            return;
        }

        var time = 0;
        var distance = 0;
        if($scope.collection.length > 0) {
            time = $scope.collection[0].time;
            distance = $scope.collection[0].distance;
        }

        $scope.filters.time = time;
        $scope.filters.distance = distance;
        $scope.filters.pull_to_refresh = true;
        $scope.filters.count = $scope.collection.length;

        Job.findAll($scope.filters).success(function(data) {

            $scope.collection = data.collection.concat($scope.collection);

            $scope.page_title = data.page_title;

            $scope.social_sharing_active = !!(data.social_sharing_is_active == 1 && $scope.collection.length > 0 && !Application.is_webview);

            $scope.page_title = data.page_title;
        }).finally(function() {
            $scope.is_loading = false;
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    $scope.showCompany = function(company_id) {
        $scope.closeAdminModal();
        $state.go("company-view", {value_id: $scope.value_id, company_id: company_id});
    };

    $scope.showItem = function(item) {
        $state.go("job-view", {value_id: $scope.value_id, place_id: item.id});
    };

    $cordovaGeolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }).then(function(position) {
        $scope.filters.position = position.coords;
        $scope.loadContent();
    }, function() {
        $scope.filters.position = false;
        $scope.loadContent();
    });

}).controller('JobViewController', function($cordovaSocialSharing, $ionicHistory, $ionicModal, $ionicPopup, $location, $rootScope, $scope, $state, $stateParams, $timeout, $translate, $window, Application, Customer, Dialog, Job, Social) {

    $scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline == true) {
            $scope.loadContent();
        }
    });

    $scope.social_sharing_active = false;
    $scope.is_loading = true;
    $scope.value_id = Job.value_id = $stateParams.value_id;
    $scope.modal = null;
    $scope.manage_modal = null;
    $scope.is_admin = false;

    $scope.options = Job.options;

    $scope.form = {
        fullname: "",
        email: "",
        message: ""
    };

    $scope.loadContent = function() {

        Job.find($stateParams.place_id).success(function(data) {

            $scope.place_edit = $scope.place = data.place;
            $scope.page_title = data.page_title;
            $scope.is_admin = data.is_admin;

            $scope.social_sharing_active = !!(data.social_sharing_is_active == 1 && !Application.is_webview);

        }).finally(function() {
            $scope.is_loading = false;
        });
    };

    $scope.contactAction = function() {
        switch($scope.place.display_contact) {
            case "contactform": case "both":
                $scope.contactModal();
                break;
            case "email":
                $window.open("mailto:"+ $scope.place.email + "?subject=" + $translate.instant("New contact for: ")+$scope.place.title,"_self");
                break;
            default:
        }
    };

    $scope.contactModal = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        $ionicModal.fromTemplateUrl('modules/job/templates/l1/contact.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    };

    $scope.closeContactModal = function() {
        /** Clear form */
        $scope.form.fullname = "";
        $scope.form.email = "";
        $scope.form.message = "";

        $scope.modal.hide();
    };

    $scope.submitContact = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        if($scope.form.fullname == "" || $scope.form.email == "" || $scope.form.message == "") {
            Dialog.alert($translate.instant("Form error"), $translate.instant("All fields are required !"), $translate.instant("OK"));
            return;
        }

        var options = angular.extend($scope.form, {
            place_id: $stateParams.place_id,
            value_id: $scope.value_id
        });

        Job.contactForm(options).success(function(data) {
            $scope.closeContactModal();
                Dialog.alert($translate.instant("Thank you"), $translate.instant(data.message), $translate.instant("OK"));
            }).finally(function() {
        });
    };

    $scope.submitManage = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        if($scope.place_edit.title == "" || $scope.place_edit.subtitle == "") {
            Dialog.alert($translate.instant("Form error"), $translate.instant("All fields are required !"), $translate.instant("OK"));
            return;
        }

        var options = angular.extend($scope.place_edit, {
            place_id: $stateParams.place_id,
            value_id: $scope.value_id
        });

        Job.editPlace(options).success(function(data) {
            $scope.closeManageModal();
            Dialog.alert($translate.instant("Thank you"), $translate.instant(data.message), $translate.instant("OK"));

            $scope.loadContent();
        }).error(function(data) {
            Dialog.alert($translate.instant("Error"), $translate.instant(data.message), $translate.instant("OK"));
        }).finally(function() {});
    };

    $scope.manageModal = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        $ionicModal.fromTemplateUrl('modules/job/templates/l1/manage-place.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.manage_modal = modal;
            $scope.manage_modal.show();
        });
    };

    $scope.closeManageModal = function() {
        $scope.manage_modal.hide();
    };

    $scope.showCompany = function(company_id) {
        $state.go("company-view", {value_id: $scope.value_id, company_id: company_id});
    };

    $scope.goHome = function(item) {
        $state.go("job-list", {value_id: $scope.value_id});
    };

    $scope.share =  function() {
        Social.share($translate.instant("Hi, I just found this job: $1 in the App $2").replace("$1", $scope.place.title).replace("$2", Application.app_name));
    };

    $scope.loadContent();

}).controller('CompanyViewController', function($cordovaSocialSharing, $ionicHistory, $ionicModal, $ionicPopup, $ionicScrollDelegate, $rootScope, $scope, $state, $stateParams, $timeout, $translate, $window, Application, Customer, Dialog, Job) {

    $scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline == true) {
            $scope.loadContent();
        }
    });

    $scope.social_sharing_active = false;
    $scope.is_loading = true;
    $scope.value_id = Job.value_id = $stateParams.value_id;
    $scope.is_admin = false;
    $scope.manage_modal = null;
    $scope.create_modal = null;
    $scope.place_create = {
        name: null,
        description: null,
        location: null,
        email: null,
        contract_type: null,
        income_from: null,
        income_to: null,
        category_id: null,
        keywords: null,
        is_active: null
    };

    $scope.loadContent = function() {

        Job.findCompany($stateParams.company_id).success(function(data) {

            $scope.company_edit = $scope.company = data.company;
            $scope.categories = data.categories;
            $scope.page_title = data.page_title;
            $scope.is_admin = data.is_admin;

            $scope.social_sharing_active = !!(data.social_sharing_is_active == 1 && !Application.is_webview);


        }).finally(function() {
            $scope.is_loading = false;
            $ionicScrollDelegate.scrollTop();
        });
    };

    $scope.submitManage = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        if($scope.company_edit.title == "" || $scope.company_edit.location == "" || $scope.company_edit.email == "") {
            Dialog.alert($translate.instant("Form error"), $translate.instant("Required fields are missing !"), $translate.instant("OK"));
            return;
        }

        var options = angular.extend($scope.company_edit, {
            company_id: $stateParams.company_id,
            value_id: $scope.value_id
        });

        Job.editCompany(options).success(function(data) {
            $scope.closeManageModal();
            Dialog.alert($translate.instant("Thank you"), $translate.instant(data.message), $translate.instant("OK"));
            $scope.loadContent();
        }).error(function(data) {
            Dialog.alert($translate.instant("Form error"), $translate.instant(data.message), $translate.instant("OK"));
        }).finally(function() {});
    };

    $scope.manageModal = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        $ionicModal.fromTemplateUrl('modules/job/templates/l1/manage-company.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.manage_modal = modal;
            $scope.manage_modal.show();
        });
    };

    $scope.closeManageModal = function() {
        $scope.manage_modal.hide();
    };

    $scope.submitCreate = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        var options = angular.extend($scope.place_create, {
            company_id: $stateParams.company_id,
            value_id: $scope.value_id
        });

        Job.createPlace(options).success(function(data) {
            $scope.closeCreateModal();
            Dialog.alert($translate.instant("Thank you"), $translate.instant(data.message), $translate.instant("OK"));
            $scope.loadContent();
        }).error(function(data) {
            Dialog.alert($translate.instant("Form error"), $translate.instant(data.message), $translate.instant("OK"));
        }).finally(function() {

        });
    };

    $scope.createModal = function() {
        if($rootScope.isOffline) {
            $rootScope.onlineOnly();
            return;
        }

        $ionicModal.fromTemplateUrl('modules/job/templates/l1/create-place.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.create_modal = modal;
            $scope.create_modal.show();
        });
    };

    $scope.closeCreateModal = function() {
        $scope.place_create = {
            name: null,
            description: null,
            location: null,
            email: null,
            contract_type: null,
            income_from: null,
            income_to: null,
            category_id: null,
            keywords: null,
            is_active: null
        };

        $scope.create_modal.hide();
    };

    $scope.showPlace = function(place_id) {
        $state.go("job-view", {value_id: $scope.value_id, place_id: place_id});
    };

    $scope.goHome = function(item) {
        $state.go("job-list", {value_id: $scope.value_id});
    };

    $scope.loadContent();

});
