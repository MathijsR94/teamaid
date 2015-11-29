angular.module('starter.StatisticControllers', [])
    .controller('StatisticsCtrl', function ($scope, Statistics, localStorageFactory, $filter, $state) {

        // Get the size of an object
        //console.log($scope.players);
		$scope.playerStats = localStorageFactory.getStatistics();
		$scope.players = localStorageFactory.getPlayers();
       
	    // extend players me the stats from Local storage
		for (player in $scope.players) {
			$scope.players[player].totGameTime = $scope.playerStats[player].totGameTime;
			$scope.players[player].totGoals = $scope.playerStats[player].totGoals;
			$scope.players[player].totRed = $scope.playerStats[player].totRed;
			$scope.players[player].totYellow = $scope.playerStats[player].totYellow;
		}		

        $scope.selected = [];
        $scope.selected["firstName"] = true;
        $scope.selected["totGoals"] = true;
        $scope.selected["totGameTime"] = true;
        $scope.selected["totRed"] = true;
        $scope.selected["totYellow"] = true;
        $scope.orderByField = "";
        $scope.sortedPlayers = $scope.players;
        $scope.playersWithoutId = [];
        for (var player in $scope.players) {
            $scope.players[player].id = player;
            $scope.playersWithoutId.push($scope.players[player]);
        }

        $scope.order = function (sortingOption) {
            $scope.orderByField = sortingOption;
            var sort;
            if (!$scope.selected[sortingOption])
                sort = "-" + sortingOption;
            else
                sort = sortingOption;
            $scope.selected[sortingOption] = !$scope.selected[sortingOption];
            $scope.sortedPlayers = $filter('orderBy')($scope.playersWithoutId, sort);
        };

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

        $scope.ShowPlayerDetails = function (player) {
            console.log($scope.playerStats[player.id]);
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
		  