angular.module('starter.controllers', ['basicServices'])

.filter('phonenumber', function () {
    function formatPhone(phone) {
        var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
        if (regexObj.test(phone)) {
            var parts = phone.match(regexObj);
            var formatted = "";
            if (parts[1]) {
                formatted += "(" + parts[1] + ") ";
            }
            formatted += parts[2] + "-" + parts[3];
            return formatted;
        } else {
            //invalid phone number
            return phone;
        }
    }

    return function (input) {
        return formatPhone(input);
    }
})

.controller('DashCtrl', ['$scope', 'deviceUtils',
        function ($scope, deviceUtils) {

        $scope.showMap = true;
        $scope.origin = null;
        $scope.location = {
            "name": "Canadian Tire Centre",
            "description": "Home of the Senators",
            "coordinates": {
                "lat": 45.296365,
                "lng": -75.925051
            },
            "address": "1000 Palladium DR , KANATA, ON K2V 1A5",
            "phone": "16135990100",
            "hours": ["Monday|9:00 - 5:00", "Tuesday|9:00 - 5:00", "Wednesday|9:00 - 5:00", "Thursday|9:00 - 5:00", "Friday|9:00 - 5:00", "Saturday|10:00 - 6:00", "Sunday|Closed"]
        };

        deviceUtils.getPosition(function (position) {
            $scope.origin = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
            $scope.$apply();
        });


        }

])

.controller('FriendsCtrl', function ($scope, Friends) {
    $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function ($scope, $stateParams, Friends) {
    $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function ($scope) {});