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

.controller('PlayerDetailCtrl', function ($scope, Statistics, localStorageFactory, firebaseRef, Games, $filter, $stateParams) {

        $scope.playerId = $stateParams.playerId;
        var sourceStats = localStorageFactory.getPlayerStatistics();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();


        if (typeof $scope.inactivePlayers !== 'undefined') {
            $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
        }
        //console.log(sourceStats);
        Games.getGamesRef($scope.teamId).once("value", function (gamesSnap) {
            $scope.games = gamesSnap.val();

            if (typeof sourceStats.gametimeList !== 'undefined') {
                console.log(sourceStats.gametimeList)
                for (key in sourceStats.gametimeList) {
                    sourceStats.gametimeList[key].date = $scope.games[key].date;
                }
            }
            if (typeof sourceStats.goalsList !== 'undefined') {
                for (key in sourceStats.goalsList) {
                    sourceStats.goalsList[key].date = $scope.games[sourceStats.goalsList[key].game].date;
                }
            }
            if (typeof sourceStats.cardsList !== 'undefined') {
                for (key in sourceStats.cardsList) {
                    sourceStats.cardsList[key].date = $scope.games[sourceStats.cardsList[key].game].date;
                }
            }

            $scope.playerStats = angular.copy(sourceStats);
        });


        $scope.toggleGroup = function (group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
        };
        $scope.isGroupShown = function (group) {
            return $scope.shownGroup === group;
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