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
	
    .controller('SettingsCtrl', function ($scope, fireBaseData, User, Settings, Attendance, Statistics, localStorageFactory, firebaseRef, Admins) {

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.settings = localStorageFactory.getSettings();
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.players = localStorageFactory.getPlayers();
        $scope.externalList = {};
        $scope.nbsp = " ";

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                Settings.getRef().child($scope.teamId).child("Settings").on("value", function (settingsSnap) {
                    $scope.settings = settingsSnap.val();
                    localStorageFactory.setSettings(settingsSnap.val());
                });
                firebaseRef.ref().child("Statistics").child($scope.teamId).once('value', function (statsSnap) {
                    $scope.statistics = statsSnap.val();
                    for (gameId in $scope.statistics) {
                        if (typeof $scope.statistics[gameId].externalPlayers !== 'undefined') {
                            // we have external players in this match
                            for (externalId in $scope.statistics[gameId].externalPlayers) {
                                $scope.externalList[gameId + "?key?" + externalId] = $scope.statistics[gameId].externalPlayers[externalId].firstName;
                            }
                        }
                    }
                    console.log($scope.externalList);
                });
            }
        });
		
		Admins.ref().child($scope.teamId).on('value', function (adminsSnap) {
			$scope.admins = adminsSnap.val();
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
			Admins.linkAdmin($scope.teamId,id);	
		}
		
		$scope.deactivateAdmin = function(id){
			Admins.unlinkAdmin($scope.teamId,id);
		}
        $scope.changeExtInt = function (playerExt, playerInt) {
            if (typeof playerExt === 'undefined' || typeof playerInt === 'undefined') {
                alert("vul beide velden in");
            }
            else {
                var keys = playerExt.split("?key?");
                var gameId = keys[0];
                var extId = keys[1];
                Attendance.addAttendance("present", "Games", playerInt, gameId, $scope.teamId, []); // player must be set to present!
                //basis must be updated
                var basis = $scope.statistics[gameId].Basis;
                console.log(basis[extId]);
                if (typeof basis[extId] !== 'undefined') {
                    basis[playerInt] = basis[extId];
                    delete basis[extId];
                    firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("Basis").set(basis);
                }

                //gamelog Must be  updaed and any reference to External key must be updated
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
                        firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("GameLog").child(item).update(gameLog[item]);
                }

                firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("externalPlayers").child(extId).update({firstName: "<removed>"});

            }

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