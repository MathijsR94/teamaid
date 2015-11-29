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
		  