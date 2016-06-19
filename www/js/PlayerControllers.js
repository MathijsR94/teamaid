angular.module('starter.PlayerControllers', [])

.controller('PlayersCtrl', function ($scope, Teams, User, $state, $stateParams, localStorageFactory, $firebaseArray) {

    $scope.isAdmin = localStorageFactory.getAdmin();
    $scope.teamId = localStorageFactory.getTeamId();
    $scope.players = localStorageFactory.getPlayers();
	$scope.inactivePlayers = localStorageFactory.getInactivePlayers();
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
	
.controller('SettingsCtrl', function ($scope, fireBaseData, User, Settings, Attendance, Statistics, Teams, localStorageFactory, firebaseRef, Admins, Seasons) {

        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.settings = localStorageFactory.getSettings();
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.players = localStorageFactory.getPlayers();
		$scope.inactivePlayers = localStorageFactory.getInactivePlayers();
		$scope.availableNumbers = {};
        $scope.externalList = {};
        $scope.nbsp = " ";
		$scope.showData = false;
		$scope.selectedPlayer;
		
		
		// create available numbers
		for(var x = 1;x <= 45;x++){
			$scope.availableNumbers[x] = x;
		}
		// now remove already taken numbers based on the  player array
		for(key in $scope.players){
			console.log($scope.players[key]);	
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
		
		$scope.playerSelected = function (player) {
            $scope.selectedNumber = $scope.players[player].defaultNumber;
			if($scope.selectedNumber == -1)
				$scope.selectedNumber = null;
			//console.log($scope.selectedNumber);
			$scope.showData = true;
        }
		$scope.changeNumber = function (player, newNumber) {
			if (typeof player === 'undefined' || typeof newNumber === -1 ){
                alert("vul beide velden in");
            }
			alert("rugnummer wordt gewijzigd van "+ $scope.players[player].defaultNumber + " naar " + newNumber);
			
			// update local player and scope variable for available numbers
			$scope.availableNumbers[$scope.players[player].defaultNumber] = $scope.players[player].defaultNumber;
			$scope.players[player].defaultNumber = newNumber;
			delete $scope.availableNumbers[newNumber];
			
			// update firebase
			Teams.updatePlayer($scope.teamId,player,$scope.players[player].firstName,$scope.players[player].insertion,$scope.players[player].lastName,$scope.players[player].defaultNumber,$scope.players[player].nickName);
			
			// update local storage
			localStorageFactory.setPlayers($scope.players);
			$scope.showNumbers = false;
			$scope.selectedPlayer = {};
				
		}
		
		$scope.updatePlayer = function (player) {
		
			// update firebase
			Teams.updatePlayer($scope.teamId,player,$scope.players[player].firstName,$scope.players[player].insertion,$scope.players[player].lastName,$scope.players[player].defaultNumber,$scope.players[player].nickName);
			localStorageFactory.setPlayers($scope.players);
		}
		
		$scope.updatePlayers = function () {
		
			// update local player and scope variable for available numbers
			for( player in $scope.players ){
				
				// update firebase
				Teams.updatePlayer($scope.teamId,player,$scope.players[player].firstName,$scope.players[player].insertion,$scope.players[player].lastName,$scope.players[player].defaultNumber,$scope.players[player].nickName,"Players");
			}
			for( player in $scope.inactivePlayers ){
				// update firebase
				Teams.updatePlayer($scope.teamId,player,$scope.inactivePlayers[player].firstName,$scope.inactivePlayers[player].insertion,$scope.inactivePlayers[player].lastName,$scope.inactivePlayers[player].defaultNumber,$scope.inactivePlayers[player].nickName,"InActive");
				
			}
			
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