angular.module('starter.PlayerControllers', [])

.controller('PlayersCtrl', function ($scope, Teams, User, $state, $stateParams, localStorageFactory, $firebaseArray) {

    $scope.isAdmin = localStorageFactory.getAdmin();
    $scope.teamId = localStorageFactory.getTeamId();
    $scope.players = localStorageFactory.getPlayers();
	$scope.playerStats = localStorageFactory.getStatistics();
	
	for (var player in $scope.players) {
		$scope.players[player].id = player;
	}

    $scope.invitePlayer = function () {
        $state.go('app.invite', {teamId: $scope.teamId});
    };

    $scope.activatePlayer = function (uid) {
        Teams.activatePlayer($scope.teamId, uid);
    };

    $scope.deactivatePlayer = function (uid) {
        Teams.deactivatePlayer($scope.teamId, uid);
    };
	
	$scope.ShowPlayerDetails = function (player) {
		console.log(player);
		console.log($scope.playerStats);
		
		localStorageFactory.setPlayerStatistics($scope.playerStats[player.id]);

		$state.go('app.playerDetail', {playerId: player.id});
	}
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