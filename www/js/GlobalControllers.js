angular.module('starter.GlobalControllers', [])

    .controller('AppCtrl', function ($scope, $rootScope, User, $ionicBackdrop, $ionicSideMenuDelegate, localStorageFactory) {


            if( localStorageFactory.getSeasonId() !== null)
                $rootScope.isSeasonSet = true;
            else
                $rootScope.isSeasonSet = false;

            User.getName().then(function (data) {
                $scope.player = data;
            })

            $rootScope.$watch('seasonSet', function() {
                if($rootScope.seasonSet == true)
                    $rootScope.isSeasonSet = $rootScope.seasonSet;
            })

    })





