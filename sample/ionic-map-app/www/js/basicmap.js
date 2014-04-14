/*
 * angular-phonegap-ready v0.0.1
 * (c) 2013 Brian Ford http://briantford.com
 * License: MIT
 */

'use strict';

angular.module('btford.phonegap.ready', []).
    factory('phonegapReady', ['$window', function ($window) {
        return function (fn) {
            var queue = [];

            var impl = function () {
                queue.push(Array.prototype.slice.call(arguments));
            };

            function onDeviceReady(){
                queue.forEach(function (args) {
                    fn.apply(this, args);
                });
                impl = fn;
            }

            if ($window.cordova) {
                document.addEventListener('deviceready', onDeviceReady, false);
            } else {
                onDeviceReady();
            }

            return function () {
                return impl.apply(this, arguments);
            };
        };
    }]);;/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular, undefined) {

    "use strict";

    /* Services */
    angular.module('basicServices', ['btford.phonegap.ready'])

        /**
         * Generic utilities that can be used by any application.
         */
        .factory('commonUtils', [function() {

            return {

                /**
                 * Wrap any object in an array.  A null object will return an empty array. An object that is
                 * already an array will be returned as-is.  Any other object will become the first item in the returned
                 * array.
                 * @param obj
                 * @returns {Array}
                 */
                makeArray: function(obj) {
                    if (obj == null) {
                        return [];
                    }
                    if (angular.isArray(obj)) {
                        return obj;
                    }
                    return [obj];
                }

            };
        }])

        /**
         * Mobile device specific utilities.
         */
        .factory('deviceUtils', ['$window', 'phonegapReady', function($window, phonegapReady) {

            function isConnected() {
                if ($window.navigator.network) {
                    var networkState = $window.navigator.network.connection.type;
                    return (networkState != Connection.UNKNOWN && networkState != Connection.NONE);
                } else {
                    return true;
                }
            }

            function isiOS() {
                if ($window.device) {
                    return ($window.device.platform == "iOS");
                }
            }

            function isAndroid() {
                if ($window.device) {
                    return ($window.device.platform == "Android");
                }
            }


            /**
             *  Returns a Cordova Position object in success handler.
             *  http://docs.phonegap.com/en/3.3.0/cordova_geolocation_geolocation.md.html#Position
             *
             * @param success
             * @param error
             */
            function getPosition(success, error) {

                var options = {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 10000
                };

                var fail = function(err) {
                    //try again
                    navigator.geolocation.getCurrentPosition(success, error, angular.extend(options, {enableHighAccuracy: false}));
                };

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(success, fail, options);
                    console.log("Requesting device location...");
                }
            }

            return {
                /**
                 *
                 * @returns {boolean} true if the device has any type of network connectivity
                 */
                isConnected: isConnected,

                isiOS: phonegapReady(isiOS),
                isAndroid: phonegapReady(isAndroid),

                /**
                 * Requests the current geo-location of the device.  Resulting coordinates will be returned
                 * in the success callback.
                 * @param success callback
                 * @param error callback
                 */
                getPosition: phonegapReady(getPosition)

            };
        }]);


}(angular));


;
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

}(angular));;
;(function (angular,undefined) {

    "use strict";

    angular.module("basicMap").

    /**
     * Directive controller which is owned by the [maps]{@link module:maps} module
     * and shared among all map directives.
     */
    controller('MapController',
        ['$scope', '$element', '$timeout', 'mapUtils', 'mapDefaults',
            function ($scope, $element, $timeout, mapUtils, mapDefaults) {

                /*
                 * Construct a new controller for the map directive.
                 * @param {angular.Scope} $scope
                 * @param {angular.element} $element
                 * @constructor
                 */
                var constructor = function($scope, $element) {

                    this._markers = {};

                    Object.defineProperties(this, {
                        'precision': {
                            value: mapDefaults.precision,
                            writeable: false
                        },
                        'center': {
                            get: function() {
                                return this._map.getCenter();
                            },
                            set: function(center) {
                                if (mapUtils.hasNaN(center))
                                    throw 'center contains null or NaN';
                                var changed = !mapUtils.latLngEqual(this.center, center);
                                if (changed) {
                                    this._map.panTo(center);
                                }
                            }
                        },
                        'zoom': {
                            get: function() {
                                return this._map.getZoom();
                            },
                            set: function(zoom) {
                                if (!(zoom != null && !isNaN(zoom)))
                                    throw 'zoom was null or NaN';
                                var changed = this.zoom !== zoom;
                                if (changed) {
                                    this._map.setZoom(zoom);
                                }
                            }
                        },
                        'bounds': {
                            get: function() {
                                return this._map.getBounds();
                            },
                            set: function(bounds) {
                                var numbers = !mapUtils.hasNaN(bounds.getSouthWest()) &&
                                    !mapUtils.hasNaN(bounds.getNorthEast());
                                if (!numbers)
                                    throw 'bounds contains null or NaN';

                                var changed = !(mapUtils.boundsEqual(this.bounds, bounds));
                                if (changed) {
                                    this._map.fitBounds(bounds);
                                }
                            }
                        }

                    });

                    $scope.$on('$destroy', angular.bind(this, this._destroy));

                };

                // Retrieve google.maps.MapOptions
                this._getConfig = function(options) {
                    var config = {};
                    angular.extend(config, {
                            zoomControlOptions: {
                                style: google.maps.ZoomControlStyle.SMALL,
                                position: google.maps.ControlPosition.TOP_RIGHT
                            },
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        },
                        mapDefaults.mapOptions,
                        $scope.mapOptions(),
                        options);
                    return config;
                };

                // Create the map
                this.createMap = function(element, options) {
                    options = this._getConfig(options);
                    if (!this._map) {
                        google.maps.visualRefresh = true;
                        this._map = new google.maps.Map(element[0], options);
                    } else {
                        this._map.setOptions(options);
                    }
                };

                this._destroy = function() {

                };

                /**
                 * Alias for google.maps.event.trigger(map, event)
                 * @param {string} event an event defined on google.maps.Map
                 * @ignore
                 */
                this.trigger = function(event) {
                    google.maps.event.trigger(this._map, event);
                };

                /**
                 * Adds a new marker to the map.
                 * @param {number} scope id
                 * @param {number} location
                 */
                this.addMarker = function(scopeId, location, options) {
                    if (!this._map) return;

                    var markerLatLng = mapUtils.toLatLng(location.coordinates || location);
                    var marker = new google.maps.Marker(angular.extend({}, {
                        position: markerLatLng
                    }, options));
                    marker.setMap(this._map);

                    var position = marker.getPosition();
                    var hash = position.toUrlValue(this.precision);
                    if (this._markers[scopeId] == null) {
                        this._markers[scopeId] = {};
                    }
                    this._markers[scopeId][hash] = {marker:marker, location:location};

                    return marker;
                };

                /**
                 * Retrieve marker from map.
                 * @param {number} scope id
                 * @param {number} location
                 * @return {google.maps.Marker} the marker at given location, or null if
                 *   no such marker exists
                 * @ignore
                 */
                this.getMarker = function (scopeId, location) {
                    if (location == null)
                        throw 'location was null';

                    var latLng = new google.maps.LatLng(location.coordinates.lat,location.coordinates.lng);
                    var hash = latLng.toUrlValue(this.precision);
                    if (this._markers[scopeId] != null && hash in this._markers[scopeId]) {
                        return this._markers[scopeId][hash].marker;
                    } else {
                        return null;
                    }
                };

                /**
                 * Clear all markers from map
                 * @param {number} scope id
                 * @ignore
                 */
                this.clearMarkers = function (scopeId) {
                    if (this._markers[scopeId] != null) {
                        angular.forEach(this._markers[scopeId], function(object, i) {
                            if (object) {
                                object.marker.setMap(null);
                            }
                        });
                        this._markers[scopeId] = null;
                        delete this._markers[scopeId];
                    }
                };

                /**
                 * Reposition map to fit within bounds defined by provided positions.
                 * @param {array} list of positions to use
                 * @return {google.maps.LatLngBounds} the resulting bounds
                 */
                this.reposition = function(positions) {
                    if (!angular.isArray(positions))
                        throw 'positions is not an array';

                    if (positions.length > 0) {
                        var zoom = this.zoom;
                        var bounds = new google.maps.LatLngBounds();
                        angular.forEach(positions, function(object, i) {
                            bounds.extend(mapUtils.toLatLng(object));
                        });
                        this.bounds = bounds;
                        if (positions.length == 1) {
                            this.zoom = zoom;
                        }
                        return bounds;
                    }

                    return null;
                };

                /**
                 * Get current map.
                 * @returns {object}
                 * @ignore
                 */
                this.getMap = function() {
                    return this._map;
                };

                /** Instantiate controller */
                angular.bind(this, constructor)($scope, $element);

            }
        ]);


}(angular));;
;(function (angular,undefined) {

    "use strict";

    angular.module("basicMap").

    /**
     * @ngdoc directive
     * @name basicMap.directive:InfoWindow
     * @element ANY
     *
     * @description
     * A directive for creating a google.maps.InfoWindow.
     *
     */
    directive('bInfoWindow',
        ['$parse', '$compile', '$timeout', function ($parse, $compile, $timeout) {

                function link(scope, element, attrs) {
                    var opts = angular.extend({}, scope.$eval(attrs.bInfoWindowOptions));
                    opts.content = element[0];
                    var model = $parse(attrs.bInfoWindow);
                    var infoWindow = model(scope);

                    /**
                     * The info window's contents don't need to be on the dom anymore,
                     * google maps has them stored. So we just replace the infowindow
                     * element with an empty div. (we don't just straight remove it from
                     * the dom because straight removing things from the dom can mess up
                     * angular)
                     */
                    element.replaceWith('<div></div>');

                    scope.$on('basicMapReady', function(event, arg) {
                        if (!infoWindow) {
                            infoWindow = new google.maps.InfoWindow(opts);
                            model.assign(scope, infoWindow);
                        }
                        //Decorate infoWindow.open to $compile contents before opening
                        var _open = infoWindow.open;
                        infoWindow.open = function open(map, anchor) {
                            $compile(element.contents())(scope);
                            _open.call(infoWindow, map, anchor);
                        };
                    });

                }

                return {
                    restrict: 'A',
                    priority: 100,
                    scope: false,
                    link: link
                };

            }]);

}(angular));;
;(function (angular,undefined) {

    "use strict";

    angular.module("basicMap").

    /**
     * @ngdoc directive
     * @name basicMap.directive:bMap
     * @element ANY
     *
     * @description
     * A directive for embedding google maps into an app.
     *
     */
    directive('bMap', ['$window', '$timeout', 'commonUtils', 'mapUtils', function($window, $timeout, commonUtils, mapUtils) {

            var counter = 0,
                prefix = '__basic_gmap_';

            function link(scope, element, attrs, controller) {

                var markerHandlers = mapUtils.getEventHandlers(attrs, "marker"); // map events -> handlers

                if ($window.google && $window.google.maps) {
                    initMap();
                } else {
                    injectGoogleAPI();
                }

                function initMap() {

                    scope.$emit('basicMapReady');

                    var mapOptions = {};

                    //zoom as attribute
                    if(attrs.zoom && parseInt(attrs.zoom)) {
                        mapOptions.zoom = parseInt(attrs.zoom);
                    }
                    //maptype as attribute
                    if(attrs.maptype){
                        switch(attrs.maptype.toLowerCase()){
                            case 'hybrid':
                                mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;
                                break;
                            case 'satellite':
                                mapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE;
                                break;
                            case 'terrain':
                                mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;
                                break;
                            case 'roadmap':
                            default:
                                mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
                                break;
                        }
                    }

                    //Create initial map
                    controller.createMap(element, mapOptions);

                    //
                    // Watches
                    //
                    if (attrs.hasOwnProperty("center")) {
                        updateCenter(scope.center);
                        scope.$watch('center', function (newValue) {
                            updateCenter(newValue);
                        }, true);
                    }

                    if (attrs.hasOwnProperty("markers")) {
                        updateMarkers(scope.markers);
                        scope.$watch("markers", function(newMarkers) {
                            updateMarkers(newMarkers);
                        }, true);
                    }

                    if (attrs.hasOwnProperty("refresh")) {
                        if (scope.refresh) {
                            resizeMap();
                        }
                        scope.$watch("refresh", function(value) {
                            if (value) {
                                resizeMap();
                            }
                        }, true);
                    }
                }

                function updateCenter(latLng) {
                    latLng = mapUtils.toLatLng(latLng);
                    controller.clearMarkers(scope.$id+"-center");
                    if (latLng) {
                        controller.center = latLng;
                        controller.addMarker(scope.$id+"-center", latLng, {
                            icon: {
                                url: 'ng-clientlibsall/img/measle_blue.png'
                            }
                        });
                    }
                }

                function updateMarkers(markers) {
                    controller.clearMarkers(scope.$id);
                    if (markers) {
                        if (!angular.isArray(markers)) {
                            markers = [markers];
                        }
                        //Add new markers to map
                        angular.forEach(markers, function(object, i) {
                            var marker = controller.addMarker(scope.$id, object);
                            // set up marker event handlers
                            angular.forEach(markerHandlers, function(handler, event) {
                                google.maps.event.addListener(marker, event, function() {
                                    $timeout(function() {
                                        handler(scope.$parent, {
                                            object: object,
                                            marker: marker
                                        });
                                    });
                                });
                            });
                        });
                    }
                    controller.reposition(getPositions());
                }

                function resizeMap() {
                    //Trigger a resize event and reposition map based on
                    //current set of positions and markers in scope
                    controller.trigger('resize');
                    controller.reposition(getPositions());
                }

                function getPositions() {
                    var allPositions = commonUtils.makeArray(scope.positions);
                    if (scope.markers && scope.markers.length > 0) {
                        allPositions.push(scope.markers[0].coordinates);
                    }
                    return allPositions;
                }

                function injectGoogleAPI() {
                    //Asynchronously load google api scripts
                    var cbId = prefix + ++counter;
                    $window[cbId] = initMap;

                    var gmap_script = document.createElement('script');
                    gmap_script.src = ('https:' == document.location.protocol ? 'https' : 'http') +
                        '://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' + 'callback=' + cbId;
                    gmap_script.type = 'text/javascript';
                    gmap_script.async = 'true';
                    var doc_script = document.getElementsByTagName('script')[0];
                    doc_script.parentNode.insertBefore(gmap_script, doc_script);
                }
            }

            return {
                restrict: 'E',
                replace: true,
                scope: {
                    center: '=',
                    markers: '=',
                    positions: '=',
                    refresh: '=',
                    mapOptions: '&'
                },
                template: '<div></div>',
                controller: 'MapController',
                link: link
            };
        }]);

}(angular));;
;(function (angular,undefined) {

    "use strict";

    angular.module("basicMap").

    /**
     * Google Maps API Utilities
     */
    factory('mapUtils', ['$parse', function($parse) {

        function floatEqual (f1, f2) {
            return (Math.abs(f1 - f2) < 0.000001);
        }

        /**
         * @ngdoc function
         * @name #latLngEqual
         * @methodOf basicMap.service:mapUtils
         *
         * @param {google.maps.LatLng} l1 first
         * @param {google.maps.LatLng} l2 second
         * @return {boolean} true if l1 and l2 are 'very close'. If either are null
         * or not google.maps.LatLng objects returns false.
         */
        function latLngEqual(l1, l2) {
            if (!(l1 instanceof google.maps.LatLng &&
                l2 instanceof google.maps.LatLng)) {
                return false;
            }
            return floatEqual(l1.lat(), l2.lat()) && floatEqual(l1.lng(), l2.lng());
        }

        /**
         * @ngdoc function
         * @name #boundsEqual
         * @methodOf basicMap.service:mapUtils
         *
         * @param {google.maps.LatLngBounds} b1 first
         * @param {google.maps.LatLngBounds} b2 second
         * @return {boolean} true if b1 and b2 are 'very close'. If either are null
         * or not google.maps.LatLngBounds objects returns false.
         */
        function boundsEqual(b1, b2) {
            if (!(b1 instanceof google.maps.LatLngBounds &&
                b2 instanceof google.maps.LatLngBounds)) {
                return false;
            }
            var sw1 = b1.getSouthWest();
            var sw2 = b2.getSouthWest();
            var ne1 = b1.getNorthEast();
            var ne2 = b2.getNorthEast();

            return latLngEqual(sw1, sw2) && latLngEqual(ne1, ne2);
        }

        /**
         * @ngdoc function
         * @name #hasNaN
         * @methodOf basicMap.service:mapUtils
         *
         * @param {google.maps.LatLng} latLng the LatLng
         * @return {boolean} true if either lat or lng of latLng is null or isNaN
         */
        function hasNaN(latLng) {
            if (!(latLng instanceof google.maps.LatLng))
                throw 'latLng must be a google.maps.LatLng';

            // google.maps.LatLng converts NaN to null, so check for both
            var isNull = (latLng.lat() == null || latLng.lng() == null);
            var isNotaN =  isNaN(latLng.lat()) || isNaN(latLng.lng());
            return isNull || isNotaN;
        }

        /**
         * @ngdoc function
         * @name #objToLatLng
         * @methodOf basicMap.service:mapUtils
         *
         * @param {Object,String,google.maps.LatLng} obj of the form { lat: 40, lng: -120 } or { latitude: 40, longitude: -120 } or
         *                      comma separated string "40,-120"
         * @return {google.maps.LatLng} returns null if problems with obj (null, NaN, etc.)
         */
        function objToLatLng(obj) {
            var lat,lng;
            if (obj instanceof  google.maps.LatLng) {
                return obj;
            }
            if (angular.isObject(obj)) {
                lat = obj.lat || obj.latitude || null;
                lng = obj.lng || obj.longitude || null;
            } else if (angular.isString(obj)) {
                obj = obj.split(",");
                if (angular.isArray(obj) && obj.length == 2) {
                    lat = parseFloat(obj[0]) || null;
                    lng = parseFloat(obj[1]) || null;
                }
            }

            var ok = !(lat == null || lng == null) && !(isNaN(lat) || isNaN(lng));
            if (ok) {
                return new google.maps.LatLng(lat, lng);
            }
            return null;
        }

        /**
         * @ngdoc function
         * @name #latLngToObj
         * @methodOf basicMap.service:mapUtils
         *
         * @param {google.maps.LatLng}
         * @return {Object} returns null if problems with obj (null, NaN, etc.)
         */
        function latLngToObj(obj) {
            if (obj instanceof  google.maps.LatLng) {
                return {lat:obj.lat(),lng:obj.lng()};
            }
            return null;
        }

        /**
         * @ngdoc function
         * @name #getAddressName
         * @methodOf basicMap.service:mapUtils
         *
         * @param {Object}
         * @return {String} the value of the address component name
         */
        function getAddressComponentName(list, type) {
            if (angular.isArray(list)) {
                for (var i=0; i < list.length; i++) {
                    var value = list[i];
                    if (value.types && value.types.indexOf(type) >= 0) {
                        return value.long_name;
                    }
                }
            }
            return null;
        }

        /**
         * @param {Object} attrs directive attributes
         * @return {Object} mapping from event names to handler fns
         */
        function getEventHandlers(attrs, type) {
            var handlers = {};
            type = type || "";
            if (type.length > 0) {
                type = type.charAt(0).toUpperCase() + type.substring(1);
            }
            // retrieve ar-on-... handlers
            angular.forEach(attrs, function(value, key) {
                if (key.lastIndexOf('arOn'+type, 0) === 0) {
                    var event = angular.lowercase(
                        key.substring(4+type.length)
                            .replace(/(?!^)([A-Z])/g, '_$&')
                    );
                    var fn = $parse(value);
                    handlers[event] = fn;
                }
            });

            return handlers;
        }

        return {
            latLngEqual: latLngEqual,
            boundsEqual: boundsEqual,
            hasNaN: hasNaN,
            toLatLng: objToLatLng,
            fromLatLng: latLngToObj,
            getAddressName: getAddressComponentName,
            getEventHandlers: getEventHandlers
        };
    }]);

}(angular));