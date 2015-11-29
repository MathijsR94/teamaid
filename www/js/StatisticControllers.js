angular.module('starter.StatisticControllers', [])
    .controller('StatisticsCtrl', function ($scope, Statistics, localStorageFactory, $filter, $state) {

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.playerStats = {};


        if (typeof $scope.inactivePlayers !== 'undefined') {
            $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
        }


        // Get the size of an object
        //console.log($scope.players);
        Statistics.getRef().child($scope.teamId).once('value', function (statsSnap) {
            localStorageFactory.setRawStatistics(statsSnap.val());
            for (player in $scope.players) {
                $scope.players[player]["totGameTime"] = 0;
                $scope.players[player]["totYellow"] = 0;
                $scope.players[player]["totRed"] = 0;
                $scope.players[player]["totGoals"] = 0;
                $scope.playerStats[player] = {
                    gametimeList: {},
                    goalsList: {},
                    cardsList: {},
                    totGameTime: 0,
                    totYellow: 0,
                    totRed: 0,
                    totGoals: 0
                };
            }
            for (var key in statsSnap.val()) { // walk trough each game
                var gameStats = statsSnap.val()[key];
                var maxGameTime = ((gameStats.firstHalfEnd - gameStats.firstHalfStart) + (gameStats.secondHalfEnd - gameStats.secondHalfStart)) / 60;

                for (player in gameStats.Basis) {
                    if (player.indexOf("external") === -1) {
                        //console.log($scope.players);
                        $scope.players[player]['totGameTime'] += maxGameTime;  // initially add a fill length game to each basis player
                        $scope.playerStats[player].gametimeList[key] = {game: key};
                        $scope.playerStats[player].gametimeList[key].gametime = maxGameTime;

                    }
                }

                var fieldPlayers = angular.copy(gameStats.Basis);
                var firstOrSecond = false;
                var remainingTime = 0;

                // sort the GameLog --- this is not working correctly!!
                // var sortedLog = $filter('orderObjectBy')(gameStats.GameLog, "time");
                // console.log(gameStats.GameLog, "old");
                // console.log(sortedLog);
                //---------------------------------------


                // main iteration loop
                for (var itemKey in gameStats.GameLog) {
                    switch (gameStats.GameLog[itemKey].statsType) {

                        case "Changes":
                            var change = gameStats.GameLog[itemKey];
                            // update fieldPlayers ( used for cards later on )

                            if (change.type === "In/Out") { //change type, in/out or  position
                                fieldPlayers[change.playerIn] = fieldPlayers[change.playerOut]; // transfer position
                                delete fieldPlayers[change.playerOut];

                                remainingTime = calcReaminingTime(change.time, gameStats.firstHalfStart, gameStats.firstHalfEnd, gameStats.secondHalfStart, gameStats.secondHalfEnd);

                                if (change.playerOut.indexOf("external") == -1) { // only calculate if player is not external
                                    $scope.players[change.playerOut]['totGameTime'] -= remainingTime; // update totGameTime, subtract remaining time from gametime already granted. ( this  will be transferred to the player who will be changed in )
                                    $scope.playerStats[change.playerOut].gametimeList[key].gametime -= remainingTime; //subtract remaining time from already granted gametime
                                }
                                if (change.playerIn.indexOf("external") == -1) { // only calculate if player is not external
                                    $scope.players[change.playerIn]['totGameTime'] += remainingTime;// update totGameTime, add remaining time to Totgametime.
                                    $scope.playerStats[change.playerIn].gametimeList[key] = {game: key};
                                    $scope.playerStats[change.playerIn].gametimeList[key].gametime = remainingTime;
                                }
                            }
                            break;
                        case "Cards":
                            var card = gameStats.GameLog[itemKey];
                            //console.log(card);
                            if (card.player.indexOf("external") == -1) {
                                if (card.type === "red") {
                                    $scope.players[card.player]['totRed'] += 1; // sum count red cards
                                    $scope.playerStats[card.player].cardsList[itemKey] = {
                                        game: key,
                                        gamelogId: itemKey
                                    };
                                }

                                if (card.type === "yellow" || card.type === 'yellow2') { // sum count  yellow cards
                                    $scope.players[card.player]['totYellow'] += 1;
                                    $scope.playerStats[card.player].cardsList[itemKey] = {
                                        game: key,
                                        gamelogId: itemKey
                                    };
                                }
                                if (card.type === "red" || card.type === "yellow2") {

                                    if (card.player in fieldPlayers) { // is this player on the field??
                                        //reduce player's gametime

                                        remainingTime = calcReaminingTime(card.time, gameStats.firstHalfStart, gameStats.firstHalfEnd, gameStats.secondHalfStart, gameStats.secondHalfEnd);

                                        //console.log(card.type, $scope.playerStats[card.player], remainingTime);
                                        if (card.player.indexOf("external") == -1) { // only calculate if player is not external
                                            $scope.players[card.player]['totGameTime'] -= remainingTime; // update totGameTime, subtract remaining time from gametime already granted.
                                            $scope.playerStats[card.player].gametimeList[key].gametime -= remainingTime;
                                        }
                                    }
                                }
                            }
                            break;

                        case "OurGoals":
                            var goal = gameStats.GameLog[itemKey];
                            if (goal.player.indexOf("external") == -1) { // only calculate if player is not external
                                $scope.players[goal.player]['totGoals'] += 1; // update totGoals
                                $scope.playerStats[goal.player].goalsList[itemKey] = {game: key, gamelogId: itemKey};
                            }
                            break;

                        default:
                            break;
                    }
                }
            }
            console.log($scope.playerStats);
            for (player in $scope.players) {
                $scope.playerStats[player].totGameTime = $scope.players[player].totGameTime;
                $scope.playerStats[player].totGoals = $scope.players[player].totGoals;
                $scope.playerStats[player].totRed = $scope.players[player].totRed;
                $scope.playerStats[player].totYellow = $scope.players[player].totYellow;
            }
            $scope.$apply();
        });

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
            // $scope.playersWithoutId.push($scope.playerStats[player]);
            $scope.players[player].id = player;
            $scope.playersWithoutId.push($scope.players[player]);
        }

        $scope.order = function (sortingOption) {
            console.log($scope.playersWithoutId)
            $scope.orderByField = sortingOption;
            var sort;
            if (!$scope.selected[sortingOption])
                sort = "-" + sortingOption;
            else
                sort = sortingOption;
            $scope.selected[sortingOption] = !$scope.selected[sortingOption];
            $scope.sortedPlayers = $filter('orderBy')($scope.playersWithoutId, sort);
            console.log($scope.sortedPlayers)
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

        function calcReaminingTime(time, firstHalfStart, firstHalfEnd, secondHalfStart, secondHalfEnd) {
            var firstOrSecond;

            // correct the time if it is outside of the given game times
            if (time < firstHalfStart) {
                time = firstHalfStart;
            }
            else {
                if (time > firstHalfEnd && time < secondHalfStart) {
                    time = secondHalfStart;
                }
                else {
                    if (time > secondHalfEnd) {
                        time = secondHalfEnd;
                    }
                }
            }

            //first half  or second half?
            if (time <= firstHalfEnd) {
                return ((firstHalfEnd - time) + (secondHalfEnd - secondHalfStart)) / 60;
            }
            else {
                if (time >= secondHalfStart) {
                    return ((secondHalfEnd - time)) / 60;
                }
            }
        };

        $scope.ShowPlayerStats = function (player) {
            console.log($scope.playerStats[player.id]);
            localStorageFactory.setPlayerStatistics($scope.playerStats[player.id]);

            $state.go('app.playerStatistics', {playerId: player.id});
        }
    })

    .controller('PlayerStatsCtrl', function ($scope, Statistics, localStorageFactory, firebaseRef, Games, $filter, $stateParams) {

        $scope.playerId = $stateParams.playerId;
        var sourceStats = localStorageFactory.getPlayerStatistics();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.statistics = localStorageFactory.getRawStatistics();


        if (typeof $scope.inactivePlayers !== 'undefined') {
            $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
        }
        console.log(sourceStats);
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
		  