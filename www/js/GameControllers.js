angular.module('starter.GameControllers', [])
    .controller('GamesCtrl', function ($scope, Games, User, $filter, $state, Attendance, Statistics, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
        $scope.ShowDelete = false;
        $scope.useNickNames = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.games = localStorageFactory.getGames();
        $scope.players = localStorageFactory.getPlayers();
        $scope.limit = 3;
        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getGames = Games.getGamesArray($scope.teamId, $scope.seasonId).then(function (games) {
                    $scope.games = games;
                    console.log(games);
                    localStorageFactory.setGames(games);
                });
            }
        });


        $scope.gamesRef = Games.getGamesRef($scope.teamId, $scope.seasonId);

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
                Statistics.RemoveStats($scope.teamId, $scope.seasonId, item.$id);
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
                    $scope.present = Attendance.addAttendance("present", "Games", User.getUID(), game.$id, $scope.teamId, $scope.seasonId, game.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Games", User.getUID(), game.$id, $scope.teamId, $scope.seasonId, game.Present);
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
        $scope.useNickNames = false;
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.settings = Settings.getSettings($scope.teamId);
        $scope.teamName = localStorageFactory.getTeamName();
        $scope.homeScore = 0;
        $scope.awayScore = 0;
        $scope.showBasis = false;

        $scope.gameLog = {};
        $scope.basis = {};
        $scope.scrollEnabled = false;


        Games.getGamesRef($scope.teamId, $scope.seasonId).child($scope.gameId).on('value', function (gameSnap) {
            $scope.gameDate = new Date(+gameSnap.val().date);
            $scope.isPast = $scope.gameDate < new Date();
            $scope.game = gameSnap.val();
            //update buttons
            $scope.present = Attendance.checkAttendance($scope.game.Present, User.getUID());
            $scope.absent = Attendance.checkAttendance($scope.game.Absent, User.getUID());
            $scope.unknown = (!$scope.present && !$scope.absent);
            $scope.unknownPlayers = Attendance.checkUnknown($scope.game.Present, $scope.game.Absent, $scope.players);

            if (typeof $scope.inactivePlayers !== 'undefined') {
                $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
            }
            $scope.fieldPlayers = angular.copy($scope.players);
            Statistics.getStatisticsRef($scope.teamId, $scope.seasonId).child($scope.gameId).on('value', function (statsSnap) {

                var stats = statsSnap.val();
                console.log(stats);
                if (stats !== null) {

                    if (typeof stats.Basis !== 'undefined') {

                        if (typeof stats.externalPlayers !== 'undefined') {
                            $scope.fieldPlayers = angular.extend($scope.fieldPlayers, stats.externalPlayers);
                        }
                        $scope.basis = stats.Basis;
                        $scope.showBasis = true;
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
                        $scope.present = Attendance.addAttendance("present", "Games", User.getUID(), $scope.gameId, $scope.teamId, $scope.seasonId, $scope.game.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Games", User.getUID(), $scope.gameId, $scope.teamId, $scope.seasonId, $scope.game.Present);
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
                    Attendance.addAttendance("present", "Games", uid, $scope.gameId, $scope.teamId, $scope.seasonId, $scope.game.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Games", uid, $scope.gameId, $scope.teamId, $scope.seasonId, $scope.game.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Games", uid, $scope.gameId, $scope.teamId, $scope.seasonId, $scope.game.Present, $scope.game.Absent);
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

    })

    .controller('Games_EditCtrl', function ($scope, Games, User, $stateParams, localStorageFactory, $ionicHistory, ionicDatePicker, ionicTimePicker) {
        $scope.gameId = $stateParams.gameId;
        $scope.teamName = localStorageFactory.getTeamName();
        $scope.useNickNames = false;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.getGame = Games.getGame($scope.teamId, $scope.seasonId).then(function (game) {

            $scope.gameDate = game.date;
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

        var gameDateObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.gameDate = val;
                }
            },
            disabledDates: [            //Optional
                // new Date(2016, 2, 16),
                // new Date(2015, 3, 16),
                // new Date(2015, 4, 16),
                // new Date(2015, 5, 16),
                // new Date('Wednesday, August 12, 2015'),
                // new Date("08-16-2016"),
                // new Date(1439676000000)
            ],
            //from: new Date(2012, 1, 1), //Optional
            //to: new Date(2016, 10, 30), //Optional
            inputDate: new Date($scope.gameDate),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        $scope.openDatePicker = function (type) {

            switch (type) {
                case "gameDate":
                    gameDateObj.inputDate = new Date($scope.gameDate);
                    ionicDatePicker.openDatePicker(gameDateObj);
                    break;
                default:
                    break;
            }
        };

        var gameTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.gameTime = val;
                }
            },
            inputTime: $scope.gameTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };

        var collectTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.collectTime = val;
                }
            },
            inputTime: $scope.collectTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };

        $scope.openTimePicker = function (type) {
            switch (type) {
                case "collectTime":
                    collectTimeObj.inputTime = $scope.collectTime;
                    ionicTimePicker.openTimePicker(collectTimeObj);
                    break;
                case "gameTime":
                    gameTimeObj.inputTime = $scope.gameTime;
                    ionicTimePicker.openTimePicker(gameTimeObj);
                    break;
                default:
                    break;
            }
        }

        $scope.updateGame = function (home, away) {
            Games.updateGame($scope.teamId, $scope.seasonId, $scope.gameId, $scope.gameDate, $scope.gameTime, $scope.collectTime, home, away);
            $ionicHistory.goBack();
        }
    })

    .controller('newGamesCtrl', function ($scope, User, Games, Teams, localStorageFactory, $ionicHistory, ionicDatePicker, ionicTimePicker) {

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.teamName = localStorageFactory.getTeamName();
        $scope.gameDate = new Date();
        $scope.gameDate.setHours(0, 0, 0, 0);
        $scope.gameDate = Date.parse($scope.gameDate);
        $scope.title = "Selecteer datum";
        $scope.gameTime = 52200;
        $scope.collectTime = 48600;

        $scope.newGame = function (homeAway, opponent) {
            if (homeAway === true) {
                var home = $scope.teamName;
                var away = opponent;
            }
            else {
                var away = $scope.teamName;
                var home = opponent;
            }
            console.log($scope.teamId, $scope.seasonId, $scope.gameDate, $scope.gameTime, $scope.collectTime, home, away);
            Games.createGame($scope.teamId, $scope.seasonId, $scope.gameDate, $scope.gameTime, $scope.collectTime, home, away);
            //console.dir($ionicHistory);
            $ionicHistory.goBack();
        };


        var gameDateObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.gameDate = val;
                }
            },
            disabledDates: [            //Optional
                // new Date(2016, 2, 16),
                // new Date(2015, 3, 16),
                // new Date(2015, 4, 16),
                // new Date(2015, 5, 16),
                // new Date('Wednesday, August 12, 2015'),
                // new Date("08-16-2016"),
                // new Date(1439676000000)
            ],
            //from: new Date(2012, 1, 1), //Optional
            //to: new Date(2016, 10, 30), //Optional
            inputDate: new Date($scope.gameDate),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        $scope.openDatePicker = function (type) {
            switch (type) {
                case "gameDate":
                    ionicDatePicker.openDatePicker(gameDateObj);
                    break;
                default:
                    break;
            }
        };


        var gameTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.gameTime = val;
                }
            },
            inputTime: $scope.gameTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };

        var collectTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.collectTime = val;
                }
            },
            inputTime: $scope.collectTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };

        $scope.openTimePicker = function (type) {
            switch (type) {
                case "collectTime":
                    ionicTimePicker.openTimePicker(collectTimeObj);
                    break;
                case "gameTime":
                    ionicTimePicker.openTimePicker(gameTimeObj);
                    break;
                default:
                    break;
            }
        }

    })

    .controller('Games_StatsCtrl', function ($scope, Teams, Games, User, Statistics, $state, $stateParams, localStorageFactory, $ionicSideMenuDelegate, $ionicScrollDelegate, $ionicPopup, ionicTimePicker) {
        $scope.gameId = $stateParams.gameId;
        $scope.selectedType = "";
        $scope.typeStats = ["wissel", "positie wissel", "goal voor", "goal tegen", "gele kaart", "rode kaart", "event"];
        $scope.externalPlayerNames = {};
        $scope.game = {}; // empty game object
        $scope.homeScore = 0;
        $scope.awayScore = 0;
        $scope.teamId = localStorageFactory.getTeamId(); // get TeamId from local storage
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.gameLog = [];
        $scope.nbsp = " "; // whitespace
        $scope.title = "Selecteer datum";
        $scope.tactic = 0;
        $scope.basisLineUp = {};
        $scope.basisChanges = {}
        $scope.actualPlayers = {};
        $scope.changes = {};
        $scope.useNickNames = false;
        $scope.ShowDelete = true;
        $scope.scrollEnabled = false;

        $ionicSideMenuDelegate.canDragContent(false);
        $scope.getGameLog = Statistics.getGameLogArray($scope.teamId, $scope.seasonId, $scope.gameId).then(function (gameLog) {
            $scope.gameLog = gameLog;
            //console.log(gameLog);
        });

        $scope.teamName = localStorageFactory.getTeamName();
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();

        if (typeof $scope.inactivePlayers !== 'undefined') {
            $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
        }

        var gamesRef = Games.getGamesRef($scope.teamId, $scope.seasonId);
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
            var statsRef = Statistics.getStatisticsRef($scope.teamId, $scope.seasonId);

            statsRef.child(localStorageFactory.getSelectedGame()).on('value', function (statsSnap) {

                $scope.homeScore = 0;
                $scope.awayScore = 0;
                console.log(statsSnap.val());
                var stats = statsSnap.val();
                if (stats === null) { // no statistics
                    var init = Statistics.initialize($scope.teamId, $scope.seasonId, localStorageFactory.getSelectedGame(), $scope.game.time);
                    $scope.eventTime = init.firstHalfStart;
                    $scope.firstHalfStart = init.firstHalfStart;
                    $scope.firstHalfEnd = init.firstHalfEnd;
                    $scope.secondHalfStart = init.secondHalfStart;
                    $scope.secondHalfEnd = init.secondHalfEnd;
                    $scope.tactic = 0;
                    $scope.externalPlayers = 0;
                    $scope.actualPlayers = {};
                    $scope.changes = angular.copy($scope.presentPlayers);
                    $scope.basisChanges = angular.copy($scope.presentPlayers);
                    $scope.basisLineUp = {};
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
                        //console.log($scope.externalPlayers);
                        $scope.externalPlayerNames = stats.externalPlayers;
                        for (key in stats.externalPlayers) {
                            $scope.presentPlayers[key] = true;
                        }
                        ;
                        $scope.players = angular.extend($scope.players, stats.externalPlayers);
                    }
                    else {
                        $scope.externalPlayers = 0;
                    }

                    $scope.basisChanges = angular.copy($scope.presentPlayers);

                    if (typeof stats.Basis !== 'undefined') {
                        $scope.basisLineUp = angular.copy(stats.Basis);
                    }
                    console.log($scope.basisLineUp);
                    for (player in $scope.basisLineUp) {
                        delete $scope.basisChanges[player];
                    }
                    $scope.liveGameLog = angular.copy(stats.GameLog);
                    $scope.actualPlayers = angular.copy($scope.basisLineUp);
                    $scope.changes = angular.copy($scope.basisChanges);
                    var actual = Statistics.makeActual($scope.actualPlayers, $scope.changes, $scope.liveGameLog, $scope.game.home === $scope.teamName);
                    //console.log(actual);
                    $scope.actualPlayers = actual.actualPlayers;
                    $scope.changes = actual.changes;
                    $scope.homeScore = actual.homeScore;
                    $scope.awayScore = actual.awayScore;

                }
            })

        })

        var eventTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.eventTime = val;
                }
            },
            inputTime: $scope.eventTime,   //Optional
            format: 12,         //Optional
            step: 0,           //Optional
            setLabel: 'Set'    //Optional
        };

        $scope.openTimePicker = function (time) {
            console.log($scope.eventTime);
            eventTimeObj.inputTime = time;
            ionicTimePicker.openTimePicker(eventTimeObj);
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

        $scope.updateEventTime = function () {
            var curDate = new Date();
            var newTime = (curDate.getHours() * 3600) + (curDate.getMinutes() * 60);
            curDate.setHours(0, 0, 0, 0);
            if ($scope.game.date === curDate.getTime()) {
                if (newTime >= $scope.firstHalfStart && newTime <= $scope.secondHalfEnd) {
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
            }
            $scope.externalPlayers = externalPlayers;
        };


        $scope.storeExternalNames = function () {
            Statistics.storeExternals($scope.teamId, $scope.seasonId, $scope.gameId, $scope.externalPlayerNames);
        };
        $scope.storeBasis = function () {
            // check for conflict!
            console.log($scope.basisLineUp, $scope.basisChanges, $scope.GameLog);

            var testActual = Statistics.makeActual(angular.copy($scope.basisLineUp), angular.copy($scope.basisChanges), $scope.liveGameLog, $scope.game.home === $scope.teamName);
            console.log(testActual);
            if (testActual.error === true) {
                if (confirm("deze wijziging is inconsistent met het betaande GameLog klik op OK om deze te wissen")) {
                    // remove GameLog
                    alert("database change disabled");
                    //Statistics.clearGameLog($scope.teamId, $scope.seasonId, $scope.gameId);
                } else {
                    // Do nothing!
                }
            }
            else {
                alert("database change disabled");
                Statistics.updateBasis($scope.teamId, $scope.seasonId, $scope.gameId, $scope.basisLineUp);
            }
        };
        $scope.saveChange = function (playerIn, playerOut, time, comment) {
            var pos = $scope.actualPlayers[playerOut]; // position of player going out
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            //Statistics.newChange($scope.teamId, $scope.seasonId, $scope.gameId, playerIn, playerOut, pos, time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.savePosChange = function (player1, player2, time, comment) {
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            //comment = $scope.players[player1].nickName + " wisselt van positie met " + $scope.players[player2].nickName;

            console.log(player1, player2, time, comment);
            //Statistics.newPosChange($scope.teamId, $scope.seasonId, $scope.gameId, player1, player2, time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.saveOurGoal = function (player, time, comment) {
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            console.log($scope.teamId, $scope.seasonId, $scope.gameId, true, player, time, comment);
            //Statistics.newGoal($scope.teamId, $scope.seasonId, $scope.gameId, true, player, time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.saveTheirGoal = function (time, comment) {
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            Statistics.newGoal($scope.teamId, $scope.seasonId, $scope.gameId, false, 'undefined', time, comment);
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

            //Statistics.newCard($scope.teamId, $scope.seasonId, $scope.gameId, type, player, time, comment);
            $scope.selectedType = "";
            $scope.toggleGroup(null);
        };
        $scope.saveGameEvent = function (time, comment) {
            if (typeof comment !== 'undefined') { // protect against undefined
                Statistics.newGameEvent($scope.teamId, $scope.seasonId, $scope.gameId, time, comment);
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

        $scope.isScrollEnabled = function (value) {
            value ? $ionicScrollDelegate.getScrollView().options.scrollingY = true :
                $ionicScrollDelegate.getScrollView().options.scrollingY = false;

        }

        $scope.eventDelegator = function (type, basis, eventData) {
            if (basis) {
                switch (type) {
                    case "posChange":
                        if (eventData.player1 != -1)
                            $scope.basisLineUp[eventData.player1] = eventData.pos1;
                        if (eventData.player2 != -1)
                            $scope.basisLineUp[eventData.player2] = eventData.pos2;
                        break;

                    case "change":
                        if (eventData.player1 != -1) {// must be substitute!
                            $scope.basisLineUp[eventData.player1] = eventData.pos1;
                            delete $scope.basisChanges[eventData.player1];
                        }
                        if (eventData.player2 != -1) {
                            $scope.basisChanges[eventData.player2] = true;
                            delete $scope.basisLineUp[eventData.player2];
                        }
                        break;
                    default:
                        console.log("default");
                        break;

                }
            } else {
                switch (type) {
                    case "posChange":
                        $scope.savePosChange(eventData.player1, eventData.player2, $scope.eventTime, eventData.comment);
                        break;
                    case "ourGoal":
                        console.log("oUr");
                        $scope.showPopup("Test");
                        break;
                    default:
                        console.log("default");
                        break;
                }
            }
        }


        $scope.showPopup = function (title) {
            $scope.data = {};

            var myPopup = $ionicPopup.show({
                template: '<button class="button button-block button-stable" ng-click="openTimePicker(eventTime)"> ' +
                '<standard-time-no-meridian etime=\'eventTime\'></standard-time-no-meridian></button>' +
                '<label class="item item-input"><span class="input-label floating-label">Comment</span>' +
                '<input type="text" /></label>',
                title: title,
                subTitle: 'Please use normal things',
                scope: $scope,
                buttons: [
                    {text: 'Cancel'},
                    {
                        text: '<b>Save</b>',
                        type: 'button-primary',
                        onTap: function (e) {
                            if (!$scope.data.wifi) {
                                //don't allow the user to close unless he enters wifi password
                                e.preventDefault();
                            } else {
                                return $scope.data.wifi;
                            }
                        }
                    }
                ]
            });

            myPopup.then(function (res) {
                console.log('Tapped!', res);
            });

        }


    })

    .controller('Games_StatsEditCtrl', function ($scope, Statistics, $stateParams, localStorageFactory, Games, Statistics, $ionicHistory) {
        $scope.players = localStorageFactory.getPlayers();
        $scope.statId = $stateParams.statId;
        $scope.gameId = $stateParams.gameId;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.useNickNames = false;

        var presentRef = Games.getGamesRef($scope.teamId, $scope.seasonId).child($scope.gameId).child("Present");
        presentRef.once('value', function (PresentSnap) {
            if (typeof PresentSnap.val() !== 'undefined') {
                $scope.presentPlayers = angular.copy(PresentSnap.val());
            }
            else {
                $scope.presentPlayers = {};
            }

            // get current statistics and  fill them in !
            var statsRef = Statistics.getStatisticsRef($scope.teamId, $scope.seasonId).child($scope.gameId).once('value', function (statsSnap) {
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
                Statistics.updateStat($scope.teamId, $scope.seasonId, $scope.gameId, $scope.statId, time, comment);
                console.log("update succesfull");
                $ionicHistory.goBack();
            }
        };
    })
	