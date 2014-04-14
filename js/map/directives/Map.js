
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

}(angular));