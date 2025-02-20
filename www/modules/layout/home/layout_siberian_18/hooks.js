/**
 *
 * Layout_Skeleton example
 *
 * All the following functions are required in order for the Layout to work
 */
App.service('layout_siberian_18', function ($rootScope, $timeout, HomepageLayout) {

    var service = {};

    /**
     * Swiper instance
     *
     * @type {null}
     */
    var swipe_instance = null;

    /**
     * features array
     *
     * @type {null}
     */
    var _features = null;

    /**
     * Last clicked index
     *
     * @type {number}
     */
    var last_index = 0;

    /**
     * Must return a valid template
     *
     * @returns {string}
     */
    service.getTemplate = function() {
        return "modules/layout/home/layout_siberian_18/view.html";
    };

    /**
     * Must return a valid template
     *
     * @returns {string}
     */
    service.getModalTemplate = function() {
        return "modules/layout/home/modal/view.html";
    };

    /**
     * onResize is used for css/js callbacks when orientation change
     */
    service.onResize = function() {
    };

    /**
     * Manipulate the features objects
     *
     * Examples:
     * - you can re-order features
     * - you can push/place the "more_button"
     *
     * @param features
     * @param more_button
     * @returns {*}
     */
    service.features = function(features, more_button) {
        /** Place more button at the end */
        _features = features;

        return features;
    };

    return service;

});
