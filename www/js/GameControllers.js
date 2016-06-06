angular.module('starter.GameControllers', [])
    .controller('GamesCtrl', function ($scope, Games, User, $filter, $state, Attendance, Statistics, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.games = localStorageFactory.getGames();
        $scope.players = localStorageFactory.getPlayers();
        $scope.limit = 3;
        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getGames = Games.getGamesArray($scope.teamId).then(function (games) {
                    $scope.games = games;
                    console.log(games);
                    localStorageFactory.setGames(games);
                });
            }
        });


        $scope.gamesRef = Games.getGamesRef($scope.teamId);

        $scope.showDelete = function () {
            //console.log('showdelete:' + $scope.ShowDelete);
            $scope.ShowDelete = !$scope.ShowDelete;
        }

        $scope.addGame = function () {
            $state.go('app.newGame');
        }

        $scope.onItemDelete = function (item) {
            if (confirm('Dit Item verwijderen?')) {
                //console.log(item);
                Statistics.RemoveStats($scope.teamId, item.$id);
                $scope.games.$remove(item);
                //remove linked statistics!
            }

        }

        $scope.getDetail = function (game) {
            Games.setGame(game.$id);
            $state.go('app.game', {gameId: game.$id});
        }
        $scope.editGame = function (game) {
            Games.setGame(game.$id);
            $state.go('app.game_edit', {gameId: game.$id});
        }
        $scope.statsGame = function (game) {
            Games.setGame(game.$id);
            $state.go('app.game_stats', {gameId: game.$id});
        }
        $scope.changeAttendance = function (type, game) {

            switch (type) {
                case "present":
                    $scope.present = Attendance.addAttendance("present", "Games", User.getUID(), game.$id, $scope.teamId, game.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Games", User.getUID(), game.$id, $scope.teamId, game.Present);
                    break;
                default:
                    //nothing yet
                    break;
            }
        }
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
        $scope.loadMore = function () {
            $scope.limit = $scope.games.length;
        }
        $scope.loadLess = function () {
            $scope.limit = 3;
        }
    })

    .controller('Games_DetailCtrl', function ($scope, $ionicScrollDelegate, Games, $ionicSideMenuDelegate, User, Teams, Attendance, Settings, Statistics, localStorageFactory, $stateParams) {
        $scope.gameId = $stateParams.gameId;
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.nbsp = " ";
        $scope.settings = Settings.getSettings($scope.teamId);
        $scope.teamName = localStorageFactory.getTeamName();
        $scope.homeScore = 0;
        $scope.awayScore = 0;

        $scope.gameLog = {};
        $scope.basis = {};
        $scope.drawPlayers = {};
        $scope.scrollEnabled = false;

        if (typeof $scope.inactivePlayers !== 'undefined') {
            $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
        }
        $scope.fieldPlayers = angular.copy($scope.players);


        Games.getGamesRef($scope.teamId).child($scope.gameId).on('value', function (gameSnap) {
            $scope.gameDate = new Date(+gameSnap.val().date);
            $scope.isPast = $scope.gameDate < new Date();
            $scope.game = gameSnap.val();
            //update buttons
            $scope.present = Attendance.checkAttendance($scope.game.Present, User.getUID());
            $scope.absent = Attendance.checkAttendance($scope.game.Absent, User.getUID());
            $scope.unknown = (!$scope.present && !$scope.absent);
            $scope.unknownPlayers = Attendance.checkUnknown($scope.game.Present, $scope.game.Absent, $scope.players);


            Statistics.getRef().child($scope.teamId).child($scope.gameId).on('value', function (statsSnap) {

                var stats = statsSnap.val();
                if (stats !== null) {

                    if (typeof stats.Basis !== 'undefined') {

                        if (typeof stats.externalPlayers !== 'undefined') {
                            $scope.fieldPlayers = angular.extend($scope.fieldPlayers, stats.externalPlayers);
                        }
                        $scope.basis = stats.Basis;
                        $scope.tactic = stats.tactic;
                    }
                    $scope.homeScore = 0;
                    $scope.awayScore = 0;

                    if (typeof stats.GameLog !== 'undefined') {
                        $scope.gameLog = stats.GameLog;

                        for (key in stats.GameLog) {
                            //console.log(stats.GameLog[key].statsType);
                            switch (stats.GameLog[key].statsType) {
                                case "OurGoals":
                                    if ($scope.game.home === $scope.teamName) {
                                        $scope.homeScore++;
                                    }
                                    else {
                                        $scope.awayScore++;
                                    }
                                    break;

                                case "TheirGoals":
                                    if ($scope.game.home !== $scope.teamName) {
                                        $scope.homeScore++;
                                    }
                                    else {
                                        $scope.awayScore++;
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
                else {
                    $scope.tactic = 0;
                }
            });
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

        $scope.changeAttendance = function (type) {
            switch (type) {
                case "present":

                    if ($scope.present === true) {
                        // already logged, no change needed
                    } else {
                        $scope.present = Attendance.addAttendance("present", "Games", User.getUID(), $scope.gameId, $scope.teamId, $scope.game.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Games", User.getUID(), $scope.gameId, $scope.teamId, $scope.game.Present);
                    }
                    break;
                default:
                    //nothing yet
                    break;
            }
        }
        $scope.forceAttendance = function (type, uid) {
            switch (type) {
                case "present":
                    Attendance.addAttendance("present", "Games", uid, $scope.gameId, $scope.teamId, $scope.game.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Games", uid, $scope.gameId, $scope.teamId, $scope.game.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Games", uid, $scope.gameId, $scope.teamId, $scope.game.Present, $scope.game.Absent);
                    return true;
                    break;
                default:
                    //nothing
                    break;
            }
        }



        $ionicSideMenuDelegate.canDragContent(false);

        Object.size = function (obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };




        //
        //$scope.isScrollEnabled = function(value) {
        //    value ? $ionicScrollDelegate.getScrollView().options.scrollingY = true:
        //        $ionicScrollDelegate.getScrollView().options.scrollingY = false;
        //}
    })

    .controller('Games_EditCtrl', function ($scope, Games, User, $stateParams, localStorageFactory, $ionicHistory) {
        $scope.gameId = $stateParams.gameId;
        $scope.teamName = localStorageFactory.getTeamName();

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.getGame = Games.getGame($scope.teamId).then(function (game) {

            $scope.gameDate = new Date(+game.date);
            //console.log($scope.gameDate);
            //console.log(game.date);
            $scope.title = "Selecteer datum";
            $scope.gameTime = game.time;
            $scope.game = game;
            $scope.home = game.home;
            $scope.away = game.away;
            if (typeof game.collect !== 'undefined')
                $scope.collectTime = game.collect;
            else
                $scope.collectTime = game.time - 3600;
        })
        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.gameDate = val;
            }
        };

        $scope.timePickerCallbackGameTime = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.gameTime = val;
            }
        };

        $scope.timePickerCallbackCollectTime = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.collect = val;
            }
        };

        $scope.updateGame = function (home, away) {
            Games.updateGame($scope.teamId, $scope.gameId, $scope.gameDate, $scope.gameTime, $scope.collectTime, home, away);
            $ionicHistory.goBack();
        }
    })

    .controller('newGamesCtrl', function ($scope, User, Games, Teams, localStorageFactory, $ionicHistory) {

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.teamName = localStorageFactory.getTeamName();
        $scope.gameDate = new Date();
        $scope.gameDate.setHours(0, 0, 0, 0);
        $scope.title = "Selecteer datum";
        $scope.gameTime = 52200;
        $scope.collectTime = 48600;

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.gameDate = val;
            }
        };

        $scope.timePickerCallbackGameTime = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.gameTime = val;
            }
        };

        $scope.timePickerCallbackCollectTime = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.collect = val;
            }
        };

        $scope.newGame = function (homeAway, opponent) {
            if (homeAway === true) {
                var home = $scope.teamName;
                var away = opponent;
            }
            else {
                var away = $scope.teamName;
                var home = opponent;
            }
            Games.createGame($scope.teamId, $scope.gameDate, $scope.gameTime, $scope.collectTime, home, away);
            //console.dir($ionicHistory);
            $ionicHistory.goBack();
        };
    })

    .controller('Games_StatsCtrl', function ($scope, Teams, Games, User, Statistics, $state, $stateParams, firebaseRef, localStorageFactory, $ionicSideMenuDelegate, $ionicScrollDelegate) {
        $scope.gameId = $stateParams.gameId;
        $scope.selectedType = "";
        $scope.typeStats = ["wissel", "positie wissel", "goal voor", "goal tegen", "gele kaart", "rode kaart", "event"]
        $scope.externalPlayerNames = {};
        $scope.game = {}; // empty game object
        $scope.homeScore = 0;
        $scope.awayScore = 0;
        $scope.teamId = localStorageFactory.getTeamId(); // get TeamId from local storage
        $scope.gameLog = [];
        $scope.nbsp = " "; // whitespace
        $scope.title = "Selecteer datum";
        $scope.tactic = 0;
        $scope.positions = [];
        $scope.actualPositions = [];
        $scope.ShowDelete = true;
        $scope.scrollEnabled = false;

        $ionicSideMenuDelegate.canDragContent(false);
        $scope.getGameLog = Statistics.getGameLogArray($scope.teamId, $scope.gameId).then(function (gameLog) {
            $scope.gameLog = gameLog;
            //console.log(gameLog);
        });

        $scope.teamName = localStorageFactory.getTeamName();
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();

        if (typeof $scope.inactivePlayers !== 'undefined') {
            $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
        }
        //console.log($scope.players);
        //$scope.getGame = Games.getGame($scope.teamId).then(function (game) {


        /* 	 		//	tijdelijk!!!

         $scope.update = function(){		 // stats crawler
         var statsRef = firebaseRef.ref().child("Statistics");
         statsRef.once('value', function (statsSnap) {

         $scope.stats = statsSnap.val();
         console.log($scope.stats);
         for (teamId in $scope.stats) { // team layer
         console.log(teamId, "TEAM");
         for (gameId in $scope.stats[teamId]) { // game layer
         console.log(gameId, "GAME");
         for (eventType in $scope.stats[teamId][gameId]) { // event layer
         console.log(eventType, "EVENTGROUP");



         if(eventType === "Changes" || eventType === "Cards" || eventType === "GameEvents" || eventType === "OurGoals" || eventType === "TheirGoals"){
         for (event in $scope.stats[teamId][gameId][eventType]){
         // move to global GameLog:
         statsRef.child(teamId).child(gameId).child("GameLog").child(event).update($scope.stats[teamId][gameId][eventType][event])
         statsRef.child(teamId).child(gameId).child(eventType).child(event).remove();
         }
         }
         // switch(eventType){


         // case "Changes":
         // for (event in $scope.stats[teamId][gameId][eventType]){
         // console.log(event, "Changes");

         // add statstype:
         // statsRef.child(teamId).child(gameId).child(eventType).child(event).update({
         // statsType: "Changes"
         // })
         // }
         // break;
         // case "Cards":
         // for (event in $scope.stats[teamId][gameId][eventType]){
         // console.log(event, "Cards");

         // statsRef.child(teamId).child(gameId).child(eventType).child(event).update({
         // statsType: "Cards"
         // })
         // }
         // break;

         // case "GameEvents":
         // for (event in $scope.stats[teamId][gameId][eventType]){
         // console.log(event, "GameEvents");
         // statsRef.child(teamId).child(gameId).child(eventType).child(event).update({
         // statsType: "GameEvents"
         // })
         // }
         // break;
         // case "OurGoals":
         // for (event in $scope.stats[teamId][gameId][eventType]){
         // console.log(event, "OurGoals");
         // statsRef.child(teamId).child(gameId).child(eventType).child(event).update({
         // statsType: "OurGoals"
         // })
         // }
         // break;
         // case "TheirGoals":
         // for (event in $scope.stats[teamId][gameId][eventType]){
         // console.log(event, "TheirGoals");
         // statsRef.child(teamId).child(gameId).child(eventType).child(event).update({
         // statsType: "TheirGoals"
         // })
         // }
         // break;

         // }
         }
         }
         }


         })
         }

         //////////// tijdelijk ^^^^^^^^^^^^^^^^^^^^ */


        var gamesRef = firebaseRef.ref().child("Games").child($scope.teamId);
        gamesRef.child(localStorageFactory.getSelectedGame()).on('value', function (gameSnap) {

            $scope.game = gameSnap.val();
            //console.log($scope.game);
            if (typeof $scope.game.Present !== 'undefined') {
                $scope.presentPlayers = angular.copy($scope.game.Present);
            }
            else {
                $scope.presentPlayers = {};
            }

            // get current statistics and  fill them in !
            // console.log(game);
            var statsRef = firebaseRef.ref().child("Statistics").child($scope.teamId);
            statsRef.child(localStorageFactory.getSelectedGame()).on('value', function (statsSnap) {

                $scope.homeScore = 0;
                $scope.awayScore = 0;
                //console.log(statsSnap.val());
                var stats = statsSnap.val();
                if (stats === null) { // no statistics
                    var init = Statistics.initialize($scope.teamId, localStorageFactory.getSelectedGame(), $scope.game.time);
					$scope.eventTime = init.firstHalfStart;
                    $scope.firstHalfStart = init.firstHalfStart;
                    $scope.firstHalfEnd = init.firstHalfEnd;
                    $scope.secondHalfStart = init.secondHalfStart;
                    $scope.secondHalfEnd = init.secondHalfEnd;
                    $scope.tactic = 0;
                    $scope.externalPlayers = 0;
                    $scope.actualPlayers = {};
                    $scope.changes = {};
                }
                else {
                    $scope.tactic = stats.tactic;
					$scope.eventTime = stats.firstHalfStart;
                    $scope.firstHalfStart = stats.firstHalfStart;
                    $scope.firstHalfEnd = stats.firstHalfEnd;
                    $scope.secondHalfStart = stats.secondHalfStart;
                    $scope.secondHalfEnd = stats.secondHalfEnd;

                    if (typeof stats.externalPlayers !== 'undefined') {
                        $scope.externalPlayers = Object.keys(stats.externalPlayers).length;
                        $scope.externalPlayerNames = stats.externalPlayers;
                        for (key in stats.externalPlayers) {
                            $scope.presentPlayers[key] = true;
                        }
                        ;
                        $scope.players = angular.extend($scope.players, stats.externalPlayers);
                        //console.log($scope.players);
                    }
                    else {
                        $scope.externalPlayers = 0;
                    }

                    // parse the current filled in stats for basic team and statType "wissels"
                    //read this back to the input fields!
					
                    if (typeof stats.Basis !== 'undefined') {
						$scope.basis = angular.copy(stats.Basis);
						
                        for (key in stats.Basis) {
                            $scope.positions[stats.Basis[key]] = key;
                        }
                    }

                    $scope.actualPlayers = angular.copy(stats.Basis);
                    $scope.changes = angular.copy($scope.presentPlayers);

                    if (typeof stats.Basis !== 'undefined') {
                        for (key in stats.Basis) {
                            //console.log(key);
                            delete $scope.changes[key];
                        }
                    }

					$scope.basisChanges = angular.copy($scope.changes);

                    // main event interation loop
                    if (typeof stats.GameLog !== 'undefined') {
                        // loop trough each event in the gameLog
                        for (key in stats.GameLog) {
                            //console.log(stats.GameLog[key].statsType);
                            switch (stats.GameLog[key].statsType) {

                                case "Changes":
                                    switch (stats.GameLog[key].type) { //change type, in/out or  position
                                        case "In/Out":
                                            $scope.actualPlayers[stats.GameLog[key].playerIn] = $scope.actualPlayers[stats.GameLog[key].playerOut]; // transfer position
                                            delete $scope.actualPlayers[stats.GameLog[key].playerOut];
                                            // he is already changed so he cannot be changed in again
                                            delete $scope.changes[stats.GameLog[key].playerIn];
                                            break;

                                        case "Position":
                                            var pos1 = $scope.actualPlayers[stats.GameLog[key].player1]; // position of player1
                                            var pos2 = $scope.actualPlayers[stats.GameLog[key].player2]; // position of player2
                                            $scope.actualPlayers[stats.GameLog[key].player1] = pos2; // transfer position
                                            $scope.actualPlayers[stats.GameLog[key].player2] = pos1; // transfer position
                                            break;
                                    }
                                    break;

                                case "Cards":
                                    if (stats.GameLog[key].type === 'red') {
                                        delete $scope.actualPlayers[stats.GameLog[key].player]; // remove from actual players
                                    }
                                    if (stats.GameLog[key].type === 'yellow2') {
                                        delete $scope.actualPlayers[stats.GameLog[key].player]; // remove from actual players
                                    }
                                    break;

                                case "OurGoals":
                                    if ($scope.game.home === $scope.teamName) {
                                        $scope.homeScore++;
                                    }
                                    else {
                                        $scope.awayScore++;
                                    }
                                    break;

                                case "TheirGoals":
                                    if ($scope.game.home !== $scope.teamName) {
                                        $scope.homeScore++;
                                    }
                                    else {
                                        $scope.awayScore++;
                                    }
                                    break;
                                case "GameEvents":
                                    break; // nothing
                                default:
                                    break;
                            }
                        }
                    }

                    // make actual positions
                    $scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);

                }
            })

        })

        $scope.timePickerCallback = function (val) {
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

        $scope.updateEventTime = function () {
            var curDate = new Date();
			var newTime = (curDate.getHours() * 3600) + (curDate.getMinutes() * 60);
			curDate.setHours(0, 0, 0, 0);
			if($scope.game.date === curDate.getTime()){
				if( newTime >= $scope.firstHalfStart && newTime <= $scope.secondHalfEnd ){
					$scope.eventTime = newTime;
				}
			}
            //console.log($scope.eventTime);
        };
        $scope.updatePlayerList = function (externalPlayers) {
            for (var i = 1; i <= externalPlayers; i++) {
                if (typeof $scope.externalPlayerNames["external" + i] === 'undefined') {
                    $scope.externalPlayerNames["external" + i] = {
                        firstName: "external" + i,
                        insertion: "",
                        lastName: ""
                    };
                }
                //add external player to the Present List
                //$scope.presentPlayers["external"+i]=true;
                //$scope.players["external"+i] = {firstName : "external"+i, insertion: "", lastName: ""};
                //console.log($scope.players);
            }
            $scope.externalPlayers = externalPlayers;
        };


        $scope.storeExternalNames = function () {
            Statistics.storeExternals($scope.teamId, $scope.gameId, $scope.externalPlayerNames);
        };
        $scope.storeBasis = function () {
            var basis = {};
            //for (key in $scope.positions) {
            //    basis[$scope.positions[key]] = key;
            //}
            Statistics.updateBasis($scope.teamId, $scope.gameId, $scope.basis, $scope.basisChanges, $scope.tactic);
            //$scope.actualPositions = Statistics.updateActualTeam(basis); no need since we reload th whole page after this, else external players and basis  update  becomes alot more complicated, since all arrays  need to be rebuild
            //$state.go($state.current, {}, {reload: true});
        };
        $scope.saveChange = function (playerIn, playerOut, time, comment) {
            var pos = $scope.actualPlayers[playerOut]; // position of player going out
            //$scope.actualPlayers[playerIn] = $scope.actualPlayers[playerOut]; // transfer position
            //delete $scope.actualPlayers[playerOut]; // remove from actual players
            //delete $scope.changes[playerIn]; // remove from available changeable players

            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            Statistics.newChange($scope.teamId, $scope.gameId, playerIn, playerOut, pos, time, comment);
            //$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.savePosChange = function (player1, player2, time, comment) {
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }

            comment = $scope.players[player1].nickName + " wisselt van positie met " + $scope.players[player2].nickName;

            console.log(player1, player2, time, comment);
            Statistics.newPosChange($scope.teamId, $scope.gameId, player1, player2, time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.saveOurGoal = function (player, time, comment) {
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            Statistics.newGoal($scope.teamId, $scope.gameId, true, player, time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.saveTheirGoal = function (time, comment) {
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            Statistics.newGoal($scope.teamId, $scope.gameId, false, 'undefined', time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.saveCard = function (player, type, time, comment) {

            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }

            if (type === 'red') {
                delete $scope.actualPlayers[player]; // remove from actual players
            }
            else { // yellow

                if (confirm('tweede gele kaart?')) {
                    type = 'yellow2';
                    delete $scope.actualPlayers[player]; // remove from actual players
                    $scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
                }
            }

            Statistics.newCard($scope.teamId, $scope.gameId, type, player, time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.saveGameEvent = function (time, comment) {
            if (typeof comment !== 'undefined') { // protect against undefined
                Statistics.newGameEvent($scope.teamId, $scope.gameId, time, comment);
                $scope.selectedType = "";
                $scope.toggleGroup(null);
            }
        };

        $scope.editStat = function (stat) {
            console.log(stat.$id);
            $state.go('app.game_stat_edit', {gameId: $scope.gameId, statId: stat.$id});
        }

        $scope.onItemDelete = function (item) {
            if (confirm('Dit Item verwijderen?')) {
                $scope.gameLog.$remove(item);
            }
        };

        $scope.isScrollEnabled = function(value) {
            value ? $ionicScrollDelegate.getScrollView().options.scrollingY = true:
                $ionicScrollDelegate.getScrollView().options.scrollingY = false;

        }


        $scope.$watch('basis', function(newValue, oldValue) {
            console.log(newValue, oldValue);
        })


        $scope.eventDelegator = function(type, basis, eventData) {
            if(basis) {
                switch (type) {
                    case "posChange":
                        console.log($scope.basisChanges);
                        if(eventData.player1 != -1)
                            $scope.basis[eventData.player1] = eventData.pos1;
                        if(eventData.player2 != -1)
                            $scope.basis[eventData.player2] = eventData.pos2;
                        break;
                    case "change":
                        if(eventData.player1 != -1) {// must be substitute!
                            $scope.basis[eventData.player1] = eventData.pos1;
                            delete $scope.basisChanges[eventData.player1];
                        }
                        if(eventData.player2 != -1) {
                            $scope.basisChanges[eventData.player2] = true;
                            delete $scope.basis[eventData.player2];
                        }
                        break;
                    default:
                        console.log("default");
                        break;

                }
            } else {
                switch(type) {
                    case "posChange":
                        $scope.savePosChange(eventData.player1, eventData.player2, $scope.eventTime, eventData.comment);
                        break;
                    default:
                        console.log("default");
                        break;
                }
            }
        }
    })

    .controller('Games_StatsEditCtrl', function ($scope, Statistics, $stateParams, localStorageFactory, firebaseRef, $ionicHistory) {
        $scope.players = localStorageFactory.getPlayers();
        $scope.statId = $stateParams.statId;
        $scope.gameId = $stateParams.gameId;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.nbsp = " ";

        var presentRef = firebaseRef.ref().child("Games").child($scope.teamId).child($scope.gameId).child("Present");
        presentRef.once('value', function (PresentSnap) {
            if (typeof PresentSnap.val() !== 'undefined') {
                $scope.presentPlayers = angular.copy(PresentSnap.val());
            }
            else {
                $scope.presentPlayers = {};
            }

            // get current statistics and  fill them in !
            var statsRef = firebaseRef.ref().child("Statistics").child($scope.teamId).child($scope.gameId).once('value', function (statsSnap) {
                var stats = statsSnap.val();
                if (typeof stats.externalPlayers !== 'undefined') {
                    $scope.externalPlayers = Object.keys(stats.externalPlayers).length;
                    $scope.externalPlayerNames = stats.externalPlayers;
                    for (key in stats.externalPlayers) {
                        $scope.presentPlayers[key] = true;
                    }
                    ;
                    $scope.players = angular.extend($scope.players, stats.externalPlayers);
                    //console.log($scope.players);
                }
                else {
                    $scope.externalPlayers = 0;
                }

                $scope.stat = stats.GameLog[$scope.statId];
                //console.log($scope.stat);

                if ($scope.stat.type === 'yellow2') // support the  toggle in the form for second yellow card
                    $scope.yellow2 = true;
                else
                    $scope.yellow2 = false;
            })
        })

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.stat.time = val;
            }
        };

        $scope.update = function (time, comment) {
            if (typeof comment !== 'undefined') { // protect against undefined
                console.log(time);
                console.log(comment);
                console.log($scope.teamId);
                console.log($scope.gameId);
                console.log($scope.stat);
                Statistics.updateStat($scope.teamId, $scope.gameId, $scope.statId, time, comment);
                console.log("update succesfull");
                $ionicHistory.goBack();
            }
        };
    })
	