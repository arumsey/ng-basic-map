
;(function (angular,undefined) {

    "use strict";

    /**
     * @doc module
     * @name basicMap
     *
     * @description
     * Module for embedding Google Maps into mobile apps.
     *
     */
    angular.module("basicMap", ['basicServices']).

        factory('mapDefaults', function() {
            return {
                'precision': 3,
                'mapOptions': {
                    zoom : 8,
                    disableDefaultUI: true,
                    mapTypeControl: false,
                    panControl: false,
                    zoomControl: true,
                    scrollwheel: true
                }
            };
        })

}(angular));