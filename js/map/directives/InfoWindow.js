
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

}(angular));