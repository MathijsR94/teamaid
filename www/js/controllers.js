angular.module('starter.controllers', [])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});

    })

    .controller('PlayersCtrl', function ($scope) {
        $scope.players = [
            {firstName: 'Koen', lastName: 'Zoon', id: 1},
            {firstName: 'Mathijs', lastName: 'Rutgers', id: 2}

        ];
    })

    .controller('HomeCtrl', function ($scope) {
    });
