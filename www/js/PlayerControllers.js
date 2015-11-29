angular.module('starter.PlayerControllers', [])
    .controller('PlayersCtrl', function ($scope, Teams, User, $state, $stateParams, localStorageFactory, $firebaseArray) {

    $scope.isAdmin = localStorageFactory.getAdmin();
    $scope.teamId = localStorageFactory.getTeamId();
    $scope.players = localStorageFactory.getPlayers();


    Teams.ref().child($scope.teamId).orderByChild("lastName").on('value', function (teamSnap) {
        $scope.players = teamSnap.val().Players;
        $scope.inactivePlayers = teamSnap.val().InActive;
    });

    $scope.invitePlayer = function () {
        $state.go('app.invite', {teamId: $scope.teamId});
    };

    $scope.activatePlayer = function (uid) {
        Teams.activatePlayer($scope.teamId, uid);
    };

    $scope.deactivatePlayer = function (uid) {
        Teams.deactivatePlayer($scope.teamId, uid);
    };
})

    .controller('InvitesCtrl', function ($scope, User, Teams, Mail, $state, $ionicHistory, $stateParams) {
        $scope.teamId = $stateParams.teamId;
        //console.log( $scope.teamId);
        $scope.getTeamName = Teams.getTeamName($scope.teamId).then(function (data) {
            $scope.teamName = data;
        });

        $scope.invite = function (em) {
            //console.log($scope.teamName);
            Mail.mailInvite(em, $scope.teamId, $scope.teamName);
            $ionicHistory.goBack();
        }
    })