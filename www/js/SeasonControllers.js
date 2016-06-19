angular.module('starter.SeasonControllers', [])
    .controller('SeasonCtrl', function ($scope, User, Teams,Statistics, localStorageFactory, firebaseRef, Games) {
        var ref = firebaseRef.ref();
        $scope.uid = User.getUID();
        ref.child('Users').child($scope.uid).child('Teams').once('value', function (teams) {
            localStorageFactory.setTeams(teams.val());
            var teamId = localStorageFactory.getTeamId();

        })
    })
