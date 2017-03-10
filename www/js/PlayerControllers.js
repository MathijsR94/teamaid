angular.module('starter.PlayerControllers', [])

    .controller('PlayersCtrl', function ($scope, Teams, User, $state, $stateParams, localStorageFactory, firebaseRef) {
		var ref = firebaseRef.ref();
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.playerStats = localStorageFactory.getStatistics();
		
		ref.child('Teams').child($scope.teamId).on('value', function (teamsSnap) {
			$scope.players = teamsSnap.val().Players;
			$scope.inactivePlayers = teamsSnap.val().InActive;
		});

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
            console.log($scope.playerStats[player.$key]);
            localStorageFactory.setPlayerStatistics($scope.playerStats[player.$key]);
            $state.go('app.playerDetail', {playerId: player.$key});
        }
    })

    .controller('PlayerDetailCtrl', function ($scope, Statistics, localStorageFactory, firebaseRef, Games, $filter, $heatmap, $stateParams) {
        //var gridNoX = 11;
        //var gridNoY = 15;

        $scope.playerId = $stateParams.playerId;
        $scope.playerStats = localStorageFactory.getStatistics();
        var sourceStats = $scope.playerStats[$scope.playerId];
        
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.heatmapData = sourceStats.heatmapData;
        //console.log( $scope.heatmapData);

        $scope.heatmapConfig = {
            blur: 0.8,
            minOpacity: 0,
            maxOpacity: 1,
        };

        if (typeof $scope.inactivePlayers !== 'undefined') {
            $scope.players = angular.extend($scope.players, $scope.inactivePlayers);
        }
        //console.log(sourceStats);
        Games.getGamesRef($scope.teamId, $scope.seasonId).once("value", function (gamesSnap) {
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

    .controller('SettingsCtrl', function ($scope, fireBaseData, User, Settings, Attendance, Statistics, Teams, localStorageFactory, firebaseRef, Admins, Seasons, ionicDatePicker) {

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.seasonId = localStorageFactory.getSeasonId();
        $scope.settings = localStorageFactory.getSettings();
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.players = localStorageFactory.getPlayers();
		$scope.userId = User.getUID();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.availableNumbers = {};
        $scope.externalList = {};
        $scope.nbsp = " ";
        $scope.showData = false;
        $scope.selectedPlayer;
        $scope.newStart = Date.parse(new Date());
        $scope.newEnd = new Date();
        $scope.newEnd.setFullYear(new Date().getFullYear() + 1);
        $scope.newEnd = Date.parse($scope.newEnd);

        var startObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.newStart = val;
                }
            },
            inputDate: new Date($scope.newStart),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        var endObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.newEnd = val;
                }
            },
            inputDate: new Date($scope.newEnd),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        $scope.openDatePicker = function (type) {
            if (type == "start") {
                ionicDatePicker.openDatePicker(startObj);
            }
            else if (type == "end") {
                ionicDatePicker.openDatePicker(endObj);
            }
        }

        // create available numbers
        for (var x = 1; x <= 45; x++) {
            $scope.availableNumbers[x] = x;
        }
        // now remove already taken numbers based on the  player array
        for (key in $scope.players) {
            //console.log($scope.players[key]);
            if (typeof $scope.players[key].defaultNumber !== 'undefined') {
                delete $scope.availableNumbers[$scope.players[key].defaultNumber];
            }
        }

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                Settings.getRef().child($scope.teamId).child("Settings").on("value", function (settingsSnap) {
                    $scope.settings = settingsSnap.val();
                    localStorageFactory.setSettings(settingsSnap.val());
                });
                firebaseRef.ref().child("Statistics").child($scope.teamId).child($scope.seasonId).once('value', function (statsSnap) {
                    $scope.statistics = statsSnap.val();
                    for (gameId in $scope.statistics) {
                        if (typeof $scope.statistics[gameId].externalPlayers !== 'undefined') {
                            // we have external players in this match
                            for (externalId in $scope.statistics[gameId].externalPlayers) {
                                $scope.externalList[gameId + "?key?" + externalId] = $scope.statistics[gameId].externalPlayers[externalId].firstName;
                            }
                        }
                    }
                    //console.log($scope.externalList);
                });
            }
        });

        Admins.ref().child($scope.teamId).on('value', function (adminsSnap) {
            $scope.admins = adminsSnap.val();
        });

        Seasons.ref().child($scope.teamId).on('value', function (seasonsSnap) {
            $scope.seasons = seasonsSnap.val();
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
        $scope.changeSetting = function (key, value) {
            //console.log(key, value);
            Settings.updateSetting(key, value, $scope.teamId);
        };
        $scope.changePassword = function (oldPW, newPW, cnfPwd) {
            if (newPW === cnfPwd) {
                fireBaseData.changePassword(User.getEmail(), oldPW, newPW);
            }
            else {
                alert("wachtwoorden zijn niet gelijk");
            }
        };

        $scope.addAdmin = function (id) {
            Admins.linkAdmin($scope.teamId, id);
        }

        $scope.deactivateAdmin = function (id) {
            Admins.unlinkAdmin($scope.teamId, id);
        }

        $scope.playerSelected = function (player) {
			$scope.selectedPlayer = player; //console.log(player);
            $scope.selectedNumber = $scope.players[player].defaultNumber;
            if ($scope.selectedNumber == -1)
                $scope.selectedNumber = null;
            //console.log($scope.selectedNumber);
            $scope.showData = true;
        }
        $scope.changeNumber = function (player, newNumber) {
            if (typeof player === 'undefined' || typeof newNumber === -1) {
                alert("vul beide velden in");
            }
            alert("rugnummer wordt gewijzigd van " + $scope.players[player].defaultNumber + " naar " + newNumber);

            // update local player and scope variable for available numbers
            $scope.availableNumbers[$scope.players[player].defaultNumber] = $scope.players[player].defaultNumber;
            $scope.players[player].defaultNumber = newNumber;
            delete $scope.availableNumbers[newNumber];

            // update firebase
            Teams.updatePlayer($scope.teamId, player, $scope.players[player].firstName, $scope.players[player].insertion, $scope.players[player].lastName, $scope.players[player].defaultNumber, $scope.players[player].nickName,"Players");
            $scope.showData = false;
            $scope.selectedPlayer = {};
            // update local storage
            localStorageFactory.setPlayers($scope.players);


        }

        $scope.updatePlayer = function (player) {

            // update firebase
            Teams.updatePlayer($scope.teamId, player, $scope.players[player].firstName, $scope.players[player].insertion, $scope.players[player].lastName, $scope.players[player].defaultNumber, $scope.players[player].nickName, "Players");
            localStorageFactory.setPlayers($scope.players);
        }

        $scope.updatePlayers = function () {

            // update local player and scope variable for available numbers
            for (player in $scope.players) {

                // update firebase
                Teams.updatePlayer($scope.teamId, player, $scope.players[player].firstName, $scope.players[player].insertion, $scope.players[player].lastName, $scope.players[player].defaultNumber, $scope.players[player].nickName, "Players");
            }
            for (player in $scope.inactivePlayers) {
                // update firebase
                Teams.updatePlayer($scope.teamId, player, $scope.inactivePlayers[player].firstName, $scope.inactivePlayers[player].insertion, $scope.inactivePlayers[player].lastName, $scope.inactivePlayers[player].defaultNumber, $scope.inactivePlayers[player].nickName, "InActive");

            }

        }

        $scope.addSeasons = function () {
            console.log("updateDB");
            var totalRef = firebaseRef.ref();
            totalRef.child('Games').once('value', function (totalSnap) {
                $scope.data = totalSnap.val();
                for (teamId in $scope.data) { // team layer
                    console.log(teamId, $scope.data[teamId], $scope.seasonId, "TEAM - Games");
                    totalRef.child('Games').child(teamId).remove();
                    totalRef.child('Games').child(teamId).child($scope.seasonId).set($scope.data[teamId]);
                }
            });
            totalRef.child('Statistics').once('value', function (totalSnap) {
                $scope.data = totalSnap.val();
                for (teamId in $scope.data) { // team layer
                    console.log(teamId, $scope.data[teamId], $scope.seasonId, "TEAM - Games");
                    totalRef.child('Statistics').child(teamId).remove();
                    totalRef.child('Statistics').child(teamId).child($scope.seasonId).set($scope.data[teamId]);
                }
            });
            totalRef.child('Practises').once('value', function (totalSnap) {
                $scope.data = totalSnap.val();
                for (teamId in $scope.data) { // team layer
                    console.log(teamId, $scope.data[teamId], $scope.seasonId, "TEAM - Practises");
                    totalRef.child('Practises').child(teamId).remove();
                    totalRef.child('Practises').child(teamId).child($scope.seasonId).set($scope.data[teamId]);
                }
            });
            totalRef.child('Events').once('value', function (totalSnap) {
                $scope.data = totalSnap.val();
                for (teamId in $scope.data) { // team layer
                    console.log(teamId, $scope.data[teamId], $scope.seasonId, "TEAM - Events");
                    totalRef.child('Events').child(teamId).remove();
                    totalRef.child('Events').child(teamId).child($scope.seasonId).set($scope.data[teamId]);
                }
            });
            totalRef.child('Duties').once('value', function (totalSnap) {
                $scope.data = totalSnap.val();
                for (teamId in $scope.data) { // team layer
                    console.log(teamId, $scope.data[teamId], $scope.seasonId, "TEAM - Duties");
                    totalRef.child('Duties').child(teamId).remove();
                    totalRef.child('Duties').child(teamId).child($scope.seasonId).set($scope.data[teamId]);
                }
            });
            totalRef.child('Finance').once('value', function (totalSnap) {
                $scope.data = totalSnap.val();
                for (teamId in $scope.data) { // team layer
                    console.log(teamId, $scope.data[teamId], $scope.seasonId, "TEAM - Finance");
                    totalRef.child('Finance').child(teamId).remove();
                    totalRef.child('Finance').child(teamId).child($scope.seasonId).set($scope.data[teamId]);
                }
            });
        }

        $scope.changeExtInt = function (playerExt, playerInt) {
            if (typeof playerExt === 'undefined' || typeof playerInt === 'undefined') {
                alert("vul beide velden in");
            }
            else {
                var keys = playerExt.split("?key?");
                var gameId = keys[0];
                var extId = keys[1];
                console.log(keys, gameId, extId);
                Attendance.addAttendance("present", "Games", playerInt, gameId, $scope.teamId,$scope.seasonId, []); // player must be set to present!
                //basis must be updated
                var basis = $scope.statistics[gameId].Basis;
                console.log(basis[extId]);
                if (typeof basis[extId] !== 'undefined') {
                    basis[playerInt] = basis[extId];
                    delete basis[extId];
                    firebaseRef.ref().child("Statistics").child($scope.teamId).child($scope.seasonId).child(gameId).child("Basis").set(basis);
                }
             
                //gamelog Must be  updated and any reference to External key must be updated
                var gameLog = $scope.statistics[gameId].GameLog;
                for (item in gameLog) {
                    var updated = false;
                    if (gameLog[item].player === extId) {
                        gameLog[item].player = playerInt;
                        updated = true;
                    }
                    else {
                        if (gameLog[item].playerIn === extId) {
                            gameLog[item].playerIn = playerInt;
                            updated = true;
                        }
                        else {
                            if (gameLog[item].playerOut === extId) {
                                gameLog[item].playerOut = playerInt;
                                updated = true;
                            }
                            else {
                                if (gameLog[item].player1 === extId) {
                                    gameLog[item].player1 = playerInt;
                                    updated = true;
                                }
                                else {
                                    if (gameLog[item].player2 === extId) {
                                        gameLog[item].player2 = playerInt;
                                        updated = true;
                                    }
                                }
                            }
                        }
                    }
                    if (updated === true)
                        firebaseRef.ref().child("Statistics").child($scope.teamId).child($scope.seasonId).child(gameId).child("GameLog").child(item).update(gameLog[item]);
                }

                firebaseRef.ref().child("Statistics").child($scope.teamId).child($scope.seasonId).child(gameId).child("externalPlayers").child(extId).update({ firstName: "<removed>" });

            }

        }

        $scope.addSeason = function (title) {
            //console.log(($scope.newStart), ($scope.newEnd));
            Seasons.addSeason($scope.teamId, title, $scope.newStart, $scope.newEnd);
        }
        $scope.deleteSeason = function (id) {
            Seasons.deleteSeason($scope.teamId, id);
        }

        // TIJDELIJK!
        $scope.updatePositionsToObjects = function () {
            console.log("updateDB");
            var totalRef = firebaseRef.ref();
            totalRef.child('Statistics').once('value', function (totalSnap) {
                $scope.data = totalSnap.val();
                console.log("updateDB2");
                for (teamId in $scope.data) { // team layer
                    console.log($scope.data[teamId]);
                    for (seasonId in $scope.data[teamId]) { // team season layer
                        console.log("updateDB42");
                        for (gameId in $scope.data[teamId][seasonId]) { // team layer
                            for (player in $scope.data[teamId][seasonId][gameId]['Basis']) { // basis in  layer
                                var posObj = {gridX: 0, gridY: 0};
                                var playerObj = $scope.data[teamId][seasonId][gameId]['Basis'][player];
                                console.log(playerObj)
                                switch (playerObj) {
                                    case "1":
                                        posObj = {gridX: 5, gridY: 0};
                                        break;
                                    case "2":
                                        posObj = {gridX: 2, gridY: 3};
                                        break;
                                    case "3":
                                        posObj = {gridX: 4, gridY: 2};
                                        break;
                                    case "4":
                                        posObj = {gridX: 6, gridY: 2};
                                        break;
                                    case "5":
                                        posObj = {gridX: 8, gridY: 3};
                                        break;
                                    case "6":
                                        posObj = {gridX: 2, gridY: 6};
                                        break;
                                    case "7":
                                        posObj = {gridX: 5, gridY: 5};
                                        break;
                                    case "8":
                                        posObj = {gridX: 8, gridY: 6};
                                        break;
                                    case "9":
                                        posObj = {gridX: 3, gridY: 9};
                                        break;
                                    case "10":
                                        posObj = {gridX: 5, gridY: 7};
                                        break;
                                    case "11":
                                        posObj = {gridX: 7, gridY: 9};
                                        break;
                                    default:
                                        posObj = playerObj;
                                        break;

                                }
                                firebaseRef.ref().child("Statistics").child(teamId).child(seasonId).child(gameId)
                                    .child("Basis").child(player).set(posObj);

                            }
                            var gamelogItem;
                            for (item in $scope.data[teamId][seasonId][gameId]["GameLog"]) { // gamelog layer
                                gamelogItem = $scope.data[teamId][seasonId][gameId]["GameLog"][item];
                                if (gamelogItem.hasOwnProperty("position")) {
                                    var posObj = {gridX: 0, gridY: 0};
                                    switch (gamelogItem.position) {
                                        case "1":
                                            posObj = {gridX: 5, gridY: 0};
                                            break;
                                        case "2":
                                            posObj = {gridX: 2, gridY: 3};
                                            break;
                                        case "3":
                                            posObj = {gridX: 4, gridY: 2};
                                            break;
                                        case "4":
                                            posObj = {gridX: 6, gridY: 2};
                                            break;
                                        case "5":
                                            posObj = {gridX: 8, gridY: 3};
                                            break;
                                        case "6":
                                            posObj = {gridX: 2, gridY: 6};
                                            break;
                                        case "7":
                                            posObj = {gridX: 5, gridY: 5};
                                            break;
                                        case "8":
                                            posObj = {gridX: 8, gridY: 6};
                                            break;
                                        case "9":
                                            posObj = {gridX: 3, gridY: 9};
                                            break;
                                        case "10":
                                            posObj = {gridX: 5, gridY: 7};
                                            break;
                                        case "11":
                                            posObj = {gridX: 7, gridY: 9};
                                            break;
                                        default:
                                            posObj = gamelogItem.position;
                                            break;

                                    }
                                    firebaseRef.ref().child("Statistics").child(teamId).child(seasonId).child(gameId)
                                        .child("GameLog").child(item).update({position: posObj});
                                }
                                if (gamelogItem.hasOwnProperty("position1")) {
                                    var posObj = {gridX: 0, gridY: 0};
                                    switch (gamelogItem.position1) {
                                        case "1":
                                            posObj = {gridX: 5, gridY: 0};
                                            break;
                                        case "2":
                                            posObj = {gridX: 2, gridY: 3};
                                            break;
                                        case "3":
                                            posObj = {gridX: 4, gridY: 2};
                                            break;
                                        case "4":
                                            posObj = {gridX: 6, gridY: 2};
                                            break;
                                        case "5":
                                            posObj = {gridX: 8, gridY: 3};
                                            break;
                                        case "6":
                                            posObj = {gridX: 2, gridY: 6};
                                            break;
                                        case "7":
                                            posObj = {gridX: 5, gridY: 5};
                                            break;
                                        case "8":
                                            posObj = {gridX: 8, gridY: 6};
                                            break;
                                        case "9":
                                            posObj = {gridX: 3, gridY: 9};
                                            break;
                                        case "10":
                                            posObj = {gridX: 5, gridY: 7};
                                            break;
                                        case "11":
                                            posObj = {gridX: 7, gridY: 9};
                                            break;
                                        default:
                                            posObj = gamelogItem.position1;
                                            break;

                                    }
                                    firebaseRef.ref().child("Statistics").child(teamId).child(seasonId).child(gameId)
                                        .child("GameLog").child(item).update({position: posObj});
                                }
                                if (gamelogItem.hasOwnProperty("position2")) {
                                    var posObj = {gridX: 0, gridY: 0};
                                    switch (gamelogItem.position2) {
                                        case "1":
                                            posObj = {gridX: 5, gridY: 0};
                                            break;
                                        case "2":
                                            posObj = {gridX: 2, gridY: 3};
                                            break;
                                        case "3":
                                            posObj = {gridX: 4, gridY: 2};
                                            break;
                                        case "4":
                                            posObj = {gridX: 6, gridY: 2};
                                            break;
                                        case "5":
                                            posObj = {gridX: 8, gridY: 3};
                                            break;
                                        case "6":
                                            posObj = {gridX: 2, gridY: 6};
                                            break;
                                        case "7":
                                            posObj = {gridX: 5, gridY: 5};
                                            break;
                                        case "8":
                                            posObj = {gridX: 8, gridY: 6};
                                            break;
                                        case "9":
                                            posObj = {gridX: 3, gridY: 9};
                                            break;
                                        case "10":
                                            posObj = {gridX: 5, gridY: 7};
                                            break;
                                        case "11":
                                            posObj = {gridX: 7, gridY: 9};
                                            break;
                                        default:
                                            posObj = gamelogItem.position2;
                                            break;
                                    }
                                    firebaseRef.ref().child("Statistics").child(teamId).child(seasonId).child(gameId)
                                        .child("GameLog").child(item).update({position: posObj});
                                }
                                //console.log(key, value);

                                //console.log(" item", item);
                            }
                        }
                    }
                }
            });
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