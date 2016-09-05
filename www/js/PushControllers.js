angular.module('starter.PushControllers', [])
    .controller('PushCtrl', function ($scope, $rootScope, $ionicUser, $ionicPush, $http) {
        $scope.identifyUser = function () {
            var user = $ionicUser.get();
            if (!user.user_id) {
                // Set your user_id here, or generate a random one.
                user.user_id = $ionicUser.generateGUID();
            }
            ;

            // Metadata
            angular.extend(user, {
                name: 'Simon',
                bio: 'Author of Devdactic'
            });

            // Identify your user with the Ionic User Service
            $ionicUser.identify(user).then(function () {
                $scope.identified = true;
                console.log('Identified user ' + user.name + '\n ID ' + user.user_id);
            });
        }
        $scope.pushRegister = function () {
            console.log('Ionic Push: Registering user');

            // Register with the Ionic Push service.  All parameters are optional.
            $ionicPush.register({
                canShowAlert: true, //Can pushes show an alert on your screen?
                canSetBadge: true, //Can pushes update app icon badges?
                canPlaySound: true, //Can notifications play a sound?
                canRunActionsOnWake: true, //Can run actions outside the app,
                onNotification: function (notification) {
                    // Handle new push notifications here
                    return true;
                }
            });
            $rootScope.$on('$cordovaPush:tokenReceived', function (event, data) {
                alert("Successfully registered token " + data.token);
                console.log('Ionic Push: Got token ', data.token, data.platform);
                $scope.token = data.token;
            });


        }

        $scope.sendPush = function () {
            var notification = {
                "tokens": [
                    "92c16e08ed219a1f0f2d2f4f2b715ac4043f7efa209bef4e",
                    "7d9ad69550258b340087cf3438c8fcf1f792eb077d4a1f70"
                ],
                "notification": {
                    "alert": "Hello World!",
                    "android": {
                        "collapseKey": "92c16e08ed219a1f0f2d2f4f2b715ac4043f7efa209bef4e",
                        "delayWhileIdle": true,
                        "timeToLive": 300,
                        "payload": {
                            "key1": "92c16e08ed219a1f0f2d2f4f2b715ac4043f7efa209bef4e",
                            "key2": "7d9ad69550258b340087cf3438c8fcf1f792eb077d4a1f70"
                        }
                    }
                }
            }

            $http({
                method : 'POST',
                url : 'https://push.ionic.io/api/v1/push',
                data : notification,
                headers : { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Ionic-Application-Id': '7adf82e8' },
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            }).success(function(data) {
                console.log(data)
                return true;
            }).error(function(data, status, headers, config) {
                console.log('data', data);
                console.log('status', status);
                console.log('headers', headers);
                console.log('config', config);
                return false;
            });
        }
    });
