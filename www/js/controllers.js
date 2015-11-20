angular.module('starter.controllers', [])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});

    })
    .controller('ForgotPasswordCtrl', function ($scope, fireBaseData) {
        //wachtwoord vergeten
        $scope.forgot = function (em, emailValid) {
            if (emailValid === true) {
                fireBaseData.resetPassword(em);
            }
        }
    })
    .controller('RegisterCtrl', function ($scope, fireBaseData, $state, Teams, Admins) {
        $scope.spinner = false;

        // get passed variables from URL
        $scope.URL = window.location.href;
        var teamRefPos = $scope.URL.indexOf("TeamRef=");
        if (teamRefPos !== -1) {
            $scope.teamName = $scope.URL.substr(teamRefPos + 8, 20);
            if ($scope.teamName.indexOf("&") !== -1)
                $scope.teamName = $scope.teamName.substr(0, $scope.teamName.indexOf("&"))
        }
        var emailPos = $scope.URL.indexOf("Email=");
        if (emailPos !== -1) {
            $scope.em = $scope.URL.substr(emailPos + 6);
            if ($scope.em.indexOf("&") !== -1)
                $scope.em = $scope.em.substr(0, $scope.em.indexOf("&"))
        }


        //Create user methode
        $scope.createTeam = function (teamName, newTeam, firstName, lastName, insertion, em, pwd) {
            $scope.spinner = true;
            if (newTeam === true) {
                // teams can be added  allways
                $scope.createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
            }
            else {
                // teamRef must be a key in the DB
                fireBaseData.ref().child("Teams").once('value', function (snapshot) {
                    if (snapshot.hasChild(teamName)) {
                        $scope.createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
                    }
                    else {
                        $scope.spinner = false;
                        alert("That team does not exist");
                        return;
                    }
                });
            }
        }

        $scope.createNewUser = function (teamName, newTeam, firstName, lastName, insertion, em, pwd) {
            if (firstName != null && lastName != null && em != null && pwd != null) {
                fireBaseData.ref().createUser({
                    email: em,
                    password: pwd
                }, function (error) {
                    if (error) {
                        $scope.spinner = false;
                        switch (error.code) {
                            case "EMAIL_TAKEN":
                                alert("The new user account cannot be created because the email is already in use.");
                                break;
                            case "INVALID_EMAIL":
                                alert("The specified email is not a valid email.");
                                break;
                            default:

                                alert("Error creating user:", error);
                                $state.go($state.current, {}, {reload: true});
                        }
                    } else {
                        fireBaseData.ref().authWithPassword({
                            email: em,
                            password: pwd
                        }, function (error, authData) {
                            if (error === null) {
                                var usersRef = fireBaseData.ref().child("Users");
                                var uid = authData.uid;
                                var ins = "";
                                if (insertion != null) ins = insertion;
                                usersRef.child(uid).set({
                                    firstName: firstName,
                                    insertion: ins,
                                    lastName: lastName,
                                    email: em,
                                    registerDate: Firebase.ServerValue.TIMESTAMP
                                });

                                if (newTeam === true) {
                                    $scope.getTeamId = Teams.addTeam(teamName);
                                    $scope.getTeamId.then(function (data) {
                                        var teamId = data.$id;

                                        // link User to team
                                        Teams.linkPlayer(teamId, firstName, ins, lastName, uid);

                                        // add team to User
                                        var usrTeams = {};
                                        usrTeams[teamId] = true;
                                        usersRef.child(uid).child("Teams").set(usrTeams);

                                        //add admin position
                                        Admins.linkAdmin(teamId, uid);

                                        $state.go('app.home');
                                    });
                                }
                                else {
                                    var teamId = teamName;
                                    //console.log(teamName);

                                    // link User to team
                                    Teams.linkPlayer(teamId, firstName, ins, lastName, uid);

                                    // add team to User
                                    var usrTeams = {};
                                    usrTeams[teamId] = true;
                                    usersRef.child(uid).child("Teams").set(usrTeams);

                                    $state.go('app.home');
                                }

                            }
                            else {
                                $scope.spinner = false;
                                alert("Er ging wat mis:", error);
                            }
                        });
                    }
                });

            }
            else {
                $scope.spinner = false;
                alert('Vul alle gegevens in!');
            }
        }
    })

    .controller('LoginCtrl', function ($scope, firebaseRef, $state) {

        firebaseRef.ref().onAuth(function (authData) {
            if (authData) {
                console.log("Authenticated with uid:", authData.uid);
                $state.go('app.home');
            } else {
                console.log("Client unauthenticated.")
            }
        });
        //Login method
        $scope.login = function (em, pwd, isValid) {
            if (isValid) {
                firebaseRef.ref().authWithPassword({
                    email: em,
                    password: pwd
                }, function (error) {
                    if (error === null) {
                        $state.go('app.home');
                    }
                    else {

                    }
                })
            }
        }
    })
    .controller('LogoutCtrl', function ($scope, fireBaseData, $state) {
        //Logout method
        $scope.logout = function () {
            fireBaseData.logout();
            $state.go('login');
        }
    })

    .controller('HomeCtrl', function ($scope, User, Teams, localStorageFactory, firebaseRef) {
        var ref = firebaseRef.ref();

        var uid = User.getUID();
        ref.child('Users').child(uid).child('Teams').once('value', function (teams) {
            localStorageFactory.setTeams(teams.val());

            var teamId = localStorageFactory.getTeamId();

            ref.child('Teams').child(teamId).once('value', function (teamData) {

                if (typeof teamData.val() !== 'undefined') {
                    localStorageFactory.setTeamName(teamData.val());

                    if (typeof teamData.val().Players !== 'undefined')
                        localStorageFactory.setPlayers(teamData.val().Players);
                    else
                        localStorageFactory.setPlayers({});

                    if (typeof teamData.val().InActive !== 'undefined')
                        localStorageFactory.setInactivePlayers(teamData.val().InActive);
                    else
                        localStorageFactory.setInactivePlayers({});

                    if (typeof teamData.val().Settings !== 'undefined')
                        localStorageFactory.setSettings(teamData.val().Settings);
                    else
                        localStorageFactory.setSettings({});
                }
                else
                    localStorageFactory.setTeamName({});

            })

            ref.child('Admins').child(teamId).once('value', function (admin) {
                localStorageFactory.setAdmin(admin.val(), uid);
            })

            User.getName().then(function (data) {
                var firstName = data.firstName,
                    insertion = data.insertion,
                    lastName = data.lastName;
                $scope.name = firstName + ' ' + insertion + ' ' + lastName;
            })
        })
    })

    .controller('PlayersCtrl', function ($scope, Teams, User, $state, $stateParams, localStorageFactory, $firebaseArray) {

        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();


        Teams.ref().child($scope.teamId).orderByChild("lastName").on('value', function (teamSnap) {
            $scope.players = teamSnap.val().Players;
            $scope.inactivePlayers = teamSnap.val().InActive;
        });

        $scope.invitePlayer = function () {
            $state.go('app.invite', {teamId: $scope.teamId});
        };

        $scope.activatePlayer = function (uid) {
            Teams.activatePlayer($scope.teamId, uid);
        };

        $scope.deactivatePlayer = function (uid) {
            Teams.deactivatePlayer($scope.teamId, uid);
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

    .controller('GamesCtrl', function ($scope, Games, User, $filter, $state, Attendance,Statistics, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
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
				Statistics.RemoveStats($scope.teamId,item.$id);
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
        $scope.loadMore = function() {
            $scope.limit = $scope.games.length;
        }
        $scope.loadLess = function() {
            $scope.limit = 3;
        }
    })

    .controller('Games_DetailCtrl', function ($scope, Games, User, Teams, Attendance, Settings, Statistics, localStorageFactory, $stateParams) {
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
					//console.log(stats);
					if (typeof stats.Basis !== 'undefined') {

						if (typeof stats.externalPlayers !== 'undefined') {
							$scope.fieldPlayers = angular.extend($scope.fieldPlayers, stats.externalPlayers);
						}
						for (key in stats.Basis) {
							$scope.basis[stats.Basis[key]] = key;
						}
						;
						$scope.tactic = stats.tactic;
					}
					$scope.homeScore = 0;
					$scope.awayScore = 0;
					
					if (typeof stats.GameLog !== 'undefined') {
						$scope.gameLog = stats.GameLog;
						
						for (key in stats.GameLog) {
								//console.log(stats.GameLog[key].statsType);
								switch(stats.GameLog[key].statsType){
									case "OurGoals":
										if ($scope.game.home === $scope.teamName){
											$scope.homeScore++;
										}
										else{
											$scope.awayScore++;
										}
										break;
										
									case "TheirGoals":
										if ($scope.game.home !== $scope.teamName){
											$scope.homeScore++;
										}
										else{
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
        $scope.gameDate.setHours(0,0,0,0);
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

    .controller('Games_StatsCtrl', function ($scope, Teams, Games, User, Statistics, $state, $stateParams, firebaseRef, localStorageFactory, $ionicHistory) {
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

		$scope.getGameLog = Statistics.getGameLogArray($scope.teamId,$scope.gameId).then(function (gameLog) {
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
                        for (key in stats.Basis) {
                            $scope.positions[stats.Basis[key]] = key;
                        }
                        ;
                    }

                    $scope.actualPlayers = angular.copy(stats.Basis);
                    $scope.changes = angular.copy($scope.presentPlayers);

                    if (typeof stats.Basis !== 'undefined') {
                        for (key in stats.Basis) {
                            //console.log(key);
                            delete $scope.changes[key];
                        }
                        ;
                    }
					
					// main event interation loop
					if (typeof stats.GameLog !== 'undefined') {
						// loop trough each event in the gameLog
						for (key in stats.GameLog) {
							//console.log(stats.GameLog[key].statsType);
							switch(stats.GameLog[key].statsType){
								
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
									if ($scope.game.home === $scope.teamName){
										$scope.homeScore++;
									}
									else{
										$scope.awayScore++;
									}
									break;
									
								case "TheirGoals":
									if ($scope.game.home !== $scope.teamName){
										$scope.homeScore++;
									}
									else{
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
					console.log($scope.actualPlayers);
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
            $scope.eventTime = (curDate.getHours() * 3600) + (curDate.getMinutes() * 60);
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
            ;
            $scope.externalPlayers = externalPlayers;
        };

        $scope.storeExternalNames = function () {
            Statistics.storeExternals($scope.teamId, $scope.gameId, $scope.externalPlayerNames);
        }
        $scope.storeBasis = function (tactic) {
            $scope.tactic = tactic;
            var basis = {};
            for (key in $scope.positions) {
                basis[$scope.positions[key]] = key;
            }
            ;
            Statistics.updateBasis($scope.teamId, $scope.gameId, basis, $scope.tactic, $scope.externalPlayers);
            //$scope.actualPositions = Statistics.updateActualTeam(basis); no need since we reload th whole page after this, else external players and basis  update  becomes alot more complicated, since all arrays  need to be rebuild
            $state.go($state.current, {}, {reload: true});
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
            var pos1 = $scope.actualPlayers[player1]; // position of player1
            var pos2 = $scope.actualPlayers[player2]; // position of player2
            
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            Statistics.newPosChange($scope.teamId, $scope.gameId, player1, player2, pos1, pos2, time, comment);
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
			$state.go('app.game_stat_edit', {gameId: $scope.gameId,statId : stat.$id});
        }

		$scope.onItemDelete = function (item) {
			if (confirm('Dit Item verwijderen?')) {
				$scope.gameLog.$remove(item);
			}
        };
    })

	.controller('Games_StatsEditCtrl', function ($scope, Statistics, $stateParams, localStorageFactory,firebaseRef, $ionicHistory) {
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
				
				if($scope.stat.type === 'yellow2') // support the  toggle in the form for second yellow card
					$scope.yellow2 = true;
				else
					$scope.yellow2= false;
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
	
    .controller('PractisesCtrl', function ($scope, Practises, User, $state, Attendance, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.practises = localStorageFactory.getPractises();
        $scope.limit= 3;
        $scope.practisesRef = Practises.getPractisesRef($scope.teamId);
        $scope.showDelete = function () {
            //console.log('showdelete:' + $scope.ShowDelete);
            $scope.ShowDelete = !$scope.ShowDelete;
        };

        $scope.loadMore = function() {
            $scope.limit = $scope.practises.length;
        }
        $scope.loadLess = function() {
            $scope.limit = 3;
        }

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getPractises = Practises.getPractisesArray($scope.teamId).then(function (practises) {
                    $scope.practises = practises;
                    localStorageFactory.setPractises(practises);
                });
            }
        });

        $scope.getDetail = function (practise) {
            //console.log('detail');
            //console.log(practise);
            Practises.setPractise(practise.$id);
            $state.go('app.practise', {practiseId: practise.$id});
        }

        $scope.addPractise = function () {
            $state.go('app.newPractise');
        }

        $scope.onItemDelete = function (item) {
			if (confirm('Dit Item verwijderen?')) {
				$scope.practises.$remove(item);
			}
        };

        $scope.editPractise = function (practise) {
            Practises.setPractise(practise.$id);
            $state.go('app.practise_edit', {practiseId: practise.$id});
        }
        $scope.changeAttendance = function (type, practise) {

            switch (type) {
                case "present":
                    $scope.present = Attendance.addAttendance("present", "Practises", User.getUID(), practise.$id, $scope.teamId, practise.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Practises", User.getUID(), practise.$id, $scope.teamId, practise.Present);
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
    })

    .controller('Practises_DetailCtrl', function ($scope, Practises, User, Teams, Attendance, Settings, localStorageFactory, $stateParams) {
        $scope.practiseId = $stateParams.practiseId;
        $scope.players = localStorageFactory.getPlayers();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.isAdmin = localStorageFactory.getAdmin();

        $scope.settings = Settings.getSettings($scope.teamId);

        Practises.getPractisesRef($scope.teamId).child($scope.practiseId).on('value', function (practiseSnap) {
            $scope.practiseDate = new Date(+practiseSnap.val().date);
            $scope.isPast = $scope.practiseDate < new Date();
            $scope.practise = practiseSnap.val();

            //update buttons
            $scope.present = Attendance.checkAttendance($scope.practise.Present, User.getUID());
            $scope.absent = Attendance.checkAttendance($scope.practise.Absent, User.getUID());
            $scope.unknown = (!$scope.present && !$scope.absent);
            $scope.unknownPlayers = Attendance.checkUnknown($scope.practise.Present, $scope.practise.Absent, $scope.players);
        });

        $scope.changeAttendance = function (type) {
            switch (type) {
                case "present":

                    if ($scope.present === true) {
                        // already logged, no change needed
                    } else {
                        $scope.present = Attendance.addAttendance("present", "Practises", User.getUID(), $scope.practiseId, $scope.teamId, $scope.practise.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Practises", User.getUID(), $scope.practiseId, $scope.teamId, $scope.practise.Present);
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
                    Attendance.addAttendance("present", "Practises", uid, $scope.practiseId, $scope.teamId, $scope.practise.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Practises", uid, $scope.practiseId, $scope.teamId, $scope.practise.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Practises", uid, $scope.practiseId, $scope.teamId, $scope.practise.Present, $scope.practise.Absent);
                    return true;
                    break;
                default:
                    //nothing
                    break;
            }
        }
    })

    .controller('Practises_EditCtrl', function ($scope, Practises, User, $stateParams, localStorageFactory, $ionicHistory) {
        $scope.practiseId = $stateParams.practiseId;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.getPractise = Practises.getPractise($scope.teamId).then(function (practise) {
            $scope.practiseDate = new Date(+practise.date);
            $scope.title = "Selecteer datum";
            $scope.practiseTime = practise.time;
            $scope.practise = practise;
            $scope.location = practise.location;
        })
		
        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.practiseDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.practiseTime = val;
            }
        };

        $scope.updatePractise = function (location) {
            Practises.updatePractise($scope.teamId, $scope.practiseId, $scope.practiseDate, $scope.practiseTime, location);
            $ionicHistory.goBack();
        }
    })

    .controller('newPractisesCtrl', function ($scope, User, Practises, localStorageFactory, $ionicHistory) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.practiseDate = new Date();
        $scope.practiseDate.setHours(0,0,0,0);
        $scope.title = "Selecteer datum";
        $scope.practiseTime = 72000;
        $scope.weeks = 1;

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
				$scope.practiseDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.practiseTime = val;
            }
        };

        $scope.newPractise = function (location, repeatValue) {
			//$scope.practiseDate = Date.parse($scope.practiseDate);
            Practises.createPractise($scope.teamId, $scope.practiseDate, $scope.practiseTime, location, repeatValue);
            //return to previous page
            $ionicHistory.goBack();
        }
    })

    .controller('EventsCtrl', function ($scope, Events, User, $state, Attendance, $ionicHistory, Utility, localStorageFactory, Games,firebaseRef) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.events = localStorageFactory.getEvents();
        $scope.eventsRef = Events.getEventsRef($scope.teamId);

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
				$scope.getEvents = Events.getEventsArray($scope.teamId).then(function (events) {
                    $scope.events = events;
                    //console.log(events);
					localStorageFactory.setEvents(events);
                });
            }
        });
        $scope.showDelete = function () {
            //console.log('showdelete:' + $scope.ShowDelete);
            $scope.ShowDelete = !$scope.ShowDelete;
        };

        $scope.getDetail = function (event) {
            Events.setEvent(event.$id);
            $state.go('app.event', {eventId: event.$id});
        }

        $scope.addEvent = function () {
            $state.go('app.newEvent');
        }

        $scope.onItemDelete = function (item) {
			if (confirm('Dit Item verwijderen?')) {
				$scope.events.$remove(item);
			}
        };

        $scope.editEvent = function (event) {
            Events.setEvent(event.$id);
            $state.go('app.event_edit', {eventId: event.$id});
        }
        $scope.changeAttendance = function (type, event) {

            switch (type) {
                case "present":
                    $scope.present = Attendance.addAttendance("present", "Events", User.getUID(), event.$id, $scope.teamId, event.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Events", User.getUID(), event.$id, $scope.teamId, event.Present);
                    break;
                default:
                    //nothing yet
                    break;
            }
        }

    })

    .controller('Events_DetailCtrl', function ($scope, Events, User, Teams, Attendance, Settings, localStorageFactory, $stateParams) {
        $scope.eventId = $stateParams.eventId;
        $scope.players = localStorageFactory.getPlayers();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.isAdmin = localStorageFactory.getAdmin();

        $scope.settings = Settings.getSettings($scope.teamId);

        Events.getEventsRef($scope.teamId).child($scope.eventId).on('value', function (eventSnap) {
            $scope.eventDate = new Date(+eventSnap.val().date);
            $scope.event = eventSnap.val();

            //update buttons
            $scope.present = Attendance.checkAttendance($scope.event.Present, User.getUID());
            $scope.absent = Attendance.checkAttendance($scope.event.Absent, User.getUID());
            $scope.unknown = (!$scope.present && !$scope.absent);
            $scope.unknownPlayers = Attendance.checkUnknown($scope.event.Present, $scope.event.Absent, $scope.players);
        });

        $scope.changeAttendance = function (type) {
            switch (type) {
                case "present":

                    if ($scope.present === true) {
                        // already logged, no change needed
                    } else {
                        $scope.present = Attendance.addAttendance("present", "Events", User.getUID(), $scope.eventId, $scope.teamId, $scope.event.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Events", User.getUID(), $scope.eventId, $scope.teamId, $scope.event.Present);
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
                    Attendance.addAttendance("present", "Events", uid, $scope.eventId, $scope.teamId, $scope.event.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Events", uid, $scope.eventId, $scope.teamId, $scope.event.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Events", uid, $scope.eventId, $scope.teamId, $scope.event.Present, $scope.event.Absent);
                    return true;
                    break;
                default:
                    //nothing
                    break;
            }
        }
    })

    .controller('Events_EditCtrl', function ($scope, Events, User, $stateParams, localStorageFactory, $ionicHistory) {
        $scope.eventId = $stateParams.eventId;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.getEvent = Events.getEvent($scope.teamId).then(function (event) {
            $scope.eventDate = new Date(+event.date);
            $scope.title = "Selecteer datum";
            $scope.eventTime = event.time;
            $scope.event = event;
            $scope.location = event.location;
        })

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.eventDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.eventTime = val;
            }
        };

        $scope.updateEvent = function (location) {
            Events.updateEvent($scope.teamId, $scope.eventId, $scope.eventDate, $scope.eventTime, location);
            $ionicHistory.goBack();
        }
    })

    .controller('newEventsCtrl', function ($scope, User, Events, localStorageFactory, $ionicHistory) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.eventDate = new Date();
        $scope.eventDate.setHours(0,0,0,0);
        $scope.title = "Selecteer datum";
        $scope.eventTime = 72000;

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.eventDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.eventTime = val;
            }
        };

        $scope.newEvent = function (location) {
            Events.createEvent($scope.teamId, $scope.eventDate, $scope.eventTime, location);
            //return to previous page
            $ionicHistory.goBack();
        }
    })

    .controller('FinanceCtrl', function ($scope, User, Teams, Finance, localStorageFactory, $state) {
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();

        $scope.getCredits = Finance.getCredits($scope.teamId).then(function (data) {
            $scope.credits = data;
            //console.log($scope.credits);
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

        $scope.addCredit = function () {
            $state.go('app.newCredit');
        }
    })

    .controller('CreditsCtrl', function ($scope, Teams, localStorageFactory, User, Finance, $state, $ionicHistory, Utility) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.nbsp = " "; // whitespace
        $scope.players = localStorageFactory.getPlayers();

        $scope.isEmpty = function (obj) {
            return Utility.isEmpty(obj);
        }
        $scope.newCredit = function (uid, value, comment, debetCredit) {
            //console.log(debetCredit);
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            var val = value;
            if (debetCredit !== true) {
                Finance.newCredit($scope.teamId, uid, (val * (-1)), comment, $scope.players[uid]);
                //console.log("debet");
            }
            else {
                Finance.newCredit($scope.teamId, uid, (val), comment, $scope.players[uid]);
                //console.log("credit");
            }

            $ionicHistory.goBack();
        }
    })

    .controller('DutiesCtrl', function ($scope, Teams, Games, Practises, Events, Settings, User, Duties, $state, firebaseRef, localStorageFactory) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        $scope.events = localStorageFactory.getEvents();

        $scope.players = localStorageFactory.getPlayers();

        $scope.limit = 3;
        $scope.loadMore = function() {
            $scope.limit = $scope.games.length;
        }
        $scope.loadLess = function() {
            $scope.limit = 3;
        }

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getGames = Games.getGamesArray($scope.teamId).then(function (games) {
                    $scope.games = games;
                    localStorageFactory.setGames(games);
                });
            }
            if (snap.val() === true) {
                $scope.getPractises = Practises.getPractisesArray($scope.teamId).then(function (practises) {
                    $scope.practises = practises;
                    localStorageFactory.setPractises(practises);
                });
            }
            if (snap.val() === true) {
                $scope.getEvents = Events.getEventsArray($scope.teamId).then(function (events) {
                    $scope.events = events;
                    localStorageFactory.setEvents(events);
                });
            }
        });

        $scope.currentDate = new Date();
        //console.log($scope.currentDate);

        $scope.showDelete = function () {
            //console.log('showdelete:' + $scope.ShowDelete);
            $scope.ShowDelete = !$scope.ShowDelete;
        };

        $scope.updateDuties = function () {

            var dutyPlayers = new Array();

            for (var key in $scope.players) {
                dutyPlayers.push(key);
            }
            var loopPlayers = dutyPlayers.slice();

            // create al required occurences ( we take a year by default)
            $scope.dutyOccurrences = new Array();
            var firstDate = new Date($scope.currentDate.getFullYear(), $scope.currentDate.getMonth(), $scope.currentDate.getDate());
            // correct to start at day 0 so it always starts at the same day of the week!
            firstDate.setDate(firstDate.getDate() + (7 - $scope.currentDate.getDay()));
            var backTrackDate = new Date(firstDate);
			console.log(backTrackDate);
            var lastDate = new Date(firstDate.getFullYear()+1, firstDate.getMonth(), firstDate.getDate());

            while (firstDate < lastDate) {
                $scope.dutyOccurrences.push({
                    start: new Date(firstDate),
                    end: new Date(firstDate.setDate(firstDate.getDate() + (7)))
                });
            }

            // backtrack our Duty schedule to initialize the loopPlayers array. this  will make sure we do give players double duty
            //backtrack for  no of  players times
			//console.log($scope.duties);
			//console.log($scope.duties.$getRecord(201579));
            for (var i = 0; i < dutyPlayers.length; i++) {
                //actually make the backtrack go back
				
                backTrackDate.setDate(backTrackDate.getDate() - 7);
                var backTrackKey = backTrackDate.getFullYear() + "" + backTrackDate.getMonth() + "" + backTrackDate.getDate();
                if (typeof $scope.duties.$getRecord([backTrackKey]) === "undefined" || $scope.duties.$getRecord([backTrackKey]) === null) {
                    // no Duty here or this date does not exist
                    console.log("no duty exists");
                } else {
                    // there is a duty record here, lets see who is listed
                    //console.log("find history player", backTrackKey);
					//console.log($scope.duties.$getRecord(backTrackKey));
                    var foundDuties = Object.keys($scope.duties.$getRecord(backTrackKey).Duty);
                    //remove from loopPlayers
                    foundDuties.forEach(function (key) {
						//console.log(key);
                        var index = loopPlayers.indexOf(key);
                        if (index != -1)
                            loopPlayers.splice(loopPlayers.indexOf(key), 1);
                    });
                }
            }

            //fill future Occurences
            $scope.dutyOccurrences.forEach(function (occurence) {
                var occurenceKey = occurence.start.getFullYear() + "" + occurence.start.getMonth() + "" + occurence.start.getDate();

                //check if there are any events planned in this occurence
                var occurenceEvents = {};
                var retVal = {};
                if ($scope.settings.dutyGames === true) {
                    retVal = Duties.checkForEvents($scope.games, occurence);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Games"] = retVal;
                }
                if ($scope.settings.dutyPractises === true) {
                    retVal = Duties.checkForEvents($scope.practises, occurence);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Practises"] = retVal;
                }
                if ($scope.settings.dutyEvents === true) {
                    retVal = Duties.checkForEvents($scope.events, occurence);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Events"] = retVal;
                }
                //var occurenceEvents = Duties.checkForEvents($scope.games,occurence); // return array of the  events within this occurence (gameId, practiseId is needed to update datebase )
                //console.log(occurenceEvents);
                //check if there are any events in this  returned array
                if (Object.keys(occurenceEvents).length > 0) {

                    var duty = {}
                    duty[loopPlayers[0]] = true;
                    loopPlayers.splice(0, 1);
                    ;
                    if (loopPlayers.length <= 1) {
                        loopPlayers = dutyPlayers.slice(); // reset to the original full array
                    }
                    if ($scope.duties.$getRecord(occurenceKey) === null) {
                        // this Duty item does not yet exist lets create it
                        Duties.addDuty($scope.teamId, occurenceKey, occurence.start, occurence.end, duty);
                    }
                    else {
                        // pre existing duty overwrite the Duty players
                        Duties.updateDuty($scope.teamId, occurenceKey, duty);
                    }
                    //update the linked Events
                    Duties.linkEvents($scope.teamId, occurenceEvents, duty);

                }
                else {
                    // remove the  duty instance if  it already exists
                    if ($scope.duties.$getRecord(occurenceKey) === null) {
                        // this Duty item does not yet exist. thats good!
                    }
                    else {
                        // pre existing duty, it is no longer valid, lets remove it!

                        // it needs to be removed since it has no linked events
                        Duties.removeDuty($scope.teamId, occurenceKey);
                    }
                }


            });

        }
        $scope.onItemDelete = function (item) {
			if (confirm('Dit Item verwijderen?')) {
				$scope.duties.$remove(item);
				// unlink items!

				var occurenceEvents = {};
				var retVal = {};
				if ($scope.settings.dutyGames === true) {
					retVal = Duties.checkForEvents($scope.games, item);
					if (Object.keys(retVal).length > 0)
						occurenceEvents["Games"] = retVal;
				}
				if ($scope.settings.dutyPractises === true) {
					retVal = Duties.checkForEvents($scope.practises, item);
					if (Object.keys(retVal).length > 0)
						occurenceEvents["Practises"] = retVal;
				}
				if ($scope.settings.dutyEvents === true) {
					retVal = Duties.checkForEvents($scope.events, item);
					if (Object.keys(retVal).length > 0)
						occurenceEvents["Events"] = retVal;
				}
				//console.log("occurrences");
				Duties.unlinkEvents($scope.teamId, occurenceEvents);
			}
        };

        $scope.addDuty = function () {
            $state.go('app.newDuty');
        }

        $scope.editDuty = function (duty) {
            //console.log(duty);
            Duties.setDuty(duty.$id);
            $state.go('app.Duty_edit', {dutyId: duty.$id});
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
    })

    .controller('Duties_EditCtrl', function ($scope, Duties, Settings, $ionicHistory, localStorageFactory, $stateParams) {
        $scope.dutyId = $stateParams.dutyId;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        // get Events
        $scope.events = localStorageFactory.getEvents();

        //console.log($scope.dutyId);
        $scope.dutyPlayers = {};
        $scope.getDuty = Duties.getDuty($scope.teamId).then(function (duty) {
            $scope.occurence = duty;
            $scope.startDate = new Date(+duty.start);
            $scope.endDate = new Date(+duty.end);
            $scope.dutyPlayers = angular.copy(duty.Duty);
            //console.log($scope.dutyPlayers);
        });

        $scope.changeKey = function (key) {
            // temporary fix while  the number of corvee remains 1
            //console.log(key);
            delete $scope.dutyPlayers[Object.keys($scope.dutyPlayers)[0]]
            $scope.dutyPlayers[key] = true;
        }

        $scope.updateDuty = function () {
            //console.log($scope.dutyPlayers);
            var occurenceEvents = {};
            var retVal = {};
            if ($scope.settings.dutyGames === true) {
                retVal = Duties.checkForEvents($scope.games, $scope.occurence);
                if (Object.keys(retVal).length > 0)
                    occurenceEvents["Games"] = retVal;
            }
            if ($scope.settings.dutyPractises === true) {
                retVal = Duties.checkForEvents($scope.practises, $scope.occurence);
                if (Object.keys(retVal).length > 0)
                    occurenceEvents["Practises"] = retVal;
            }
            if ($scope.settings.dutyEvents === true) {
                retVal = Duties.checkForEvents($scope.events, $scope.occurence);
                if (Object.keys(retVal).length > 0)
                    occurenceEvents["Events"] = retVal;
            }
            Duties.linkEvents($scope.teamId, occurenceEvents, $scope.dutyPlayers);
            Duties.updateDuty($scope.teamId, $scope.dutyId, $scope.dutyPlayers);

            $ionicHistory.goBack();
        }
    })

    .controller('newDutiesCtrl', function ($scope, User, Duties, localStorageFactory, $ionicHistory) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        $scope.events = localStorageFactory.getEvents();

        $scope.dutyStart = new Date();
        $scope.dutyStart.setHours(0,0,0,0);
        $scope.dutyEnd = new Date();
        $scope.dutyEnd.setHours(0,0,0,0);
        $scope.dutyEnd.setDate($scope.dutyStart.getDate() + 7);
        $scope.title = "Selecteer datum";


        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.dutyStart = val;
                $scope.dutyEnd = new Date(+val);
                $scope.dutyEnd.setDate($scope.dutyEnd.getDate() + 7);
            }
        };

        $scope.newDuty = function (duty) {

            if (typeof duty !== 'undefined') {
                var dutyPlayers = {};
                dutyPlayers[duty] = true;

                //console.log($scope.dutyEnd);
                var occurenceKey = $scope.dutyStart.getFullYear() + "" + $scope.dutyStart.getMonth() + "" + $scope.dutyStart.getDate();
                // create new occurence
                Duties.addDuty($scope.teamId, occurenceKey, $scope.dutyStart, $scope.dutyEnd, dutyPlayers);

                // gather to be linked events
                var occurenceEvents = {};
                var retVal = {};
                if ($scope.settings.dutyGames === true) {
                    retVal = Duties.checkForEvents($scope.games, {start: $scope.dutyStart, end: $scope.dutyEnd});
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Games"] = retVal;
                }
                if ($scope.settings.dutyPractises === true) {
                    retVal = Duties.checkForEvents($scope.practises, {start: $scope.dutyStart, end: $scope.dutyEnd});
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Practises"] = retVal;
                }
                if ($scope.settings.dutyEvents === true) {
                    retVal = Duties.checkForEvents($scope.events, {start: $scope.dutyStart, end: $scope.dutyEnd});
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Events"] = retVal;
                }
                // link all events
                //console.log(occurenceEvents);
                Duties.linkEvents($scope.teamId, occurenceEvents, dutyPlayers);

                //return to previous page
                $ionicHistory.goBack();
            }
            else
                alert("geen speler geselecteerd");
        }
    })


    .controller('SettingsCtrl', function ($scope, fireBaseData, User, Settings, Attendance,Statistics, localStorageFactory, firebaseRef) {

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
				firebaseRef.ref().child("Statistics").child($scope.teamId).once('value', function (statsSnap){
					$scope.statistics = statsSnap.val();
					for (gameId in $scope.statistics) {
						if (typeof $scope.statistics[gameId].externalPlayers !== 'undefined') {
							// we have external players in this match
							for( externalId in $scope.statistics[gameId].externalPlayers){
								$scope.externalList[gameId+"?key?"+externalId] = $scope.statistics[gameId].externalPlayers[externalId].firstName;
							}
						}
					}
					console.log($scope.externalList);
				});
				
            }
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
		$scope.changeExtInt = function(playerExt,playerInt){
			if(typeof playerExt === 'undefined' || typeof playerInt === 'undefined'){
				alert("vul beide velden in");
			}
			else{
				var keys = playerExt.split("?key?");
				var gameId = keys[0];
				var extId = keys[1];
				Attendance.addAttendance("present", "Games", playerInt,gameId,$scope.teamId,[]); // player must be set to present!
				//basis must be updated
				var basis = $scope.statistics[gameId].Basis;
				console.log(basis[extId]);
				if(typeof basis[extId] !== 'undefined'){
					basis[playerInt] = basis[extId];
					delete basis[extId];
					firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("Basis").set(basis);
				}
				
				//gamelog Must be  updaed and any reference to External key must be updated
				var gameLog = $scope.statistics[gameId].GameLog;
				for( item in gameLog ) {
					var updated = false;
					if(gameLog[item].player === extId){
						gameLog[item].player = playerInt;
						updated = true;
					}
					else{
						if(gameLog[item].playerIn === extId){
							gameLog[item].playerIn = playerInt;
							updated = true;
						}
						else{
							if(gameLog[item].playerOut === extId){
								gameLog[item].playerOut = playerInt;
								updated = true;
							}
							else{
								if(gameLog[item].player1 === extId){
									gameLog[item].player1 = playerInt;
									updated = true;
								}
								else{
									if(gameLog[item].player2 === extId){
										gameLog[item].player2 = playerInt;
										updated = true;
									}
								}
							}
						}
					}
					if(updated === true)
						firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("GameLog").child(item).update(gameLog[item]);
				}
				
				firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("externalPlayers").child(extId).update({firstName : "<removed>"});
					
			}
			
		}
    })

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
			for (player in $scope.players){
			$scope.players[player]["totGameTime"] = 0;
			$scope.players[player]["totYellow"] = 0;
			$scope.players[player]["totRed"] = 0;
			$scope.players[player]["totGoals"] = 0;
			$scope.playerStats[player] = {
											gametimeList:{},
											goalsList:{},
											cardsList:{},
											totGameTime:0,
											totYellow : 0,
											totRed : 0,
											totGoals : 0
											};
			}
            for (var key in statsSnap.val()){ // walk trough each game
                var gameStats = statsSnap.val()[key];
                var maxGameTime = ((gameStats.firstHalfEnd - gameStats.firstHalfStart) + (gameStats.secondHalfEnd - gameStats.secondHalfStart)) / 60;

                for (player in gameStats.Basis) {
                    if (player.indexOf("external") === -1) {
                        //console.log($scope.players);
                        $scope.players[player]['totGameTime'] += maxGameTime;  // initially add a fill length game to each basis player
						$scope.playerStats[player].gametimeList[key] = {game:key};
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
					switch(gameStats.GameLog[itemKey].statsType){
									
						case "Changes":
							var change = gameStats.GameLog[itemKey];
							// update fieldPlayers ( used for cards later on )

							if (change.type === "In/Out") { //change type, in/out or  position
								fieldPlayers[change.playerIn] = fieldPlayers[change.playerOut]; // transfer position
								delete fieldPlayers[change.playerOut];

								remainingTime = calcReaminingTime(change.time,gameStats.firstHalfStart,gameStats.firstHalfEnd,gameStats.secondHalfStart,gameStats.secondHalfEnd);
								
								if (change.playerOut.indexOf("external") == -1) { // only calculate if player is not external
									$scope.players[change.playerOut]['totGameTime'] -= remainingTime; // update totGameTime, subtract remaining time from gametime already granted. ( this  will be transferred to the player who will be changed in )
									$scope.playerStats[change.playerOut].gametimeList[key].gametime -= remainingTime; //subtract remaining time from already granted gametime
								}
								if (change.playerIn.indexOf("external") == -1){ // only calculate if player is not external
									$scope.players[change.playerIn]['totGameTime'] += remainingTime;// update totGameTime, add remaining time to Totgametime.
									$scope.playerStats[change.playerIn].gametimeList[key]= {game:key};
									$scope.playerStats[change.playerIn].gametimeList[key].gametime = remainingTime;
								}
							}
						break;
						case "Cards":
							var card = gameStats.GameLog[itemKey];
							//console.log(card);
							if (card.player.indexOf("external") == -1) {
								if (card.type === "red"){
									$scope.players[card.player]['totRed'] += 1; // sum count red cards
									$scope.playerStats[card.player].cardsList[itemKey] = {game:key, gamelogId: itemKey};
								}

								if (card.type === "yellow" || card.type === 'yellow2'){ // sum count  yellow cards
									$scope.players[card.player]['totYellow'] += 1;
									$scope.playerStats[card.player].cardsList[itemKey] = {game:key, gamelogId: itemKey};
								}
								if (card.type === "red" || card.type === "yellow2") {

									if (card.player in fieldPlayers) { // is this player on the field??
										//reduce player's gametime
										
										remainingTime = calcReaminingTime(card.time,gameStats.firstHalfStart,gameStats.firstHalfEnd,gameStats.secondHalfStart,gameStats.secondHalfEnd);
								
										//console.log(card.type, $scope.playerStats[card.player], remainingTime);
										if(card.player.indexOf("external") == -1){ // only calculate if player is not external
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
								$scope.playerStats[goal.player].goalsList[itemKey] = {game:key, gamelogId: itemKey};
							}
						break;
						
						default:
						break;
					}
				}				
            }
            console.log($scope.playerStats);
			for( player in $scope.players){
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
		
		function calcReaminingTime(time,firstHalfStart,firstHalfEnd,secondHalfStart,secondHalfEnd){
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
			if (time <= firstHalfEnd){
				return ((firstHalfEnd - time) + (secondHalfEnd - secondHalfStart)) / 60;
			}
			else{
				if(time >= secondHalfStart){
					return ((secondHalfEnd - time)) / 60;
				}
			}
		};
		
		$scope.ShowPlayerStats = function(player){
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
			
			if(typeof sourceStats.gametimeList !== 'undefined'){
				console.log(sourceStats.gametimeList)
				for( key in sourceStats.gametimeList){
					sourceStats.gametimeList[key].date = $scope.games[key].date;				
				}
			}
			if(typeof sourceStats.goalsList !== 'undefined'){
				for( key in sourceStats.goalsList){
					sourceStats.goalsList[key].date = $scope.games[sourceStats.goalsList[key].game].date;				
				}
			}
			if(typeof sourceStats.cardsList !== 'undefined'){
				for( key in sourceStats.cardsList){
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
		  

    .filter('orderObjectBy', function () {
        return function (items, field, reverse) {
            var filtered = [];
            angular.forEach(items, function (item) {
				//filtered[key] = item
                filtered.push(item);
            });
            //console.log(field);
            filtered.sort(function (a, b) {
                return (a[field] > b[field] ? 1 : -1);
            });
            if (reverse) filtered.reverse();
            return filtered;
        };
    })
    .directive('autoListDivider', function ($timeout) {
        var lastDivideKey = "";

        return {
            link: function (scope, element, attrs) {
                var key = attrs.autoListDividerValue;

                var defaultDivideFunction = function (obj) {
                    //console.log(obj);
                    var date = new Date(+obj);

                    var monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni",
                        "Juli", "Augustus", "September", "Oktober", "November", "December"
                    ];

                    return monthNames[date.getMonth()] + ' ' + date.getFullYear();
                };

                var doDivide = function () {
                    var divideFunction = scope.$apply(attrs.autoListDividerFunction) || defaultDivideFunction;
                    var divideKey = divideFunction(key);

                    if (divideKey != lastDivideKey) {
                        var contentTr = angular.element("<div class='item item-divider'>" + divideKey + "</div>");
                        element[0].parentNode.insertBefore(contentTr[0], element[0]);
                    }

                    lastDivideKey = divideKey;
                }

                $timeout(doDivide, 0)
            }
        }
    })
    .filter('cmdate', [
        '$filter', function($filter) {
            return function(input, format) {
                return $filter('date')(new Date(+input), format);
            };
        }
    ])
.filter('monthName', [function() {
    return function (month) { //1 = January
        var date = new Date(+month);
        var currentMonth = date.getMonth();
        var currentYear = date.getFullYear();
        var monthNames = [ 'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
            'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December' ];

        return monthNames[currentMonth] + ' ' + currentYear;
    }
}])

.filter('isFuture', function() {
  return function(items) {
    return items.filter(function(item){
        var date = new Date();
        date.setHours(0,0,0,0);
        date.setDate(date.getDate() - 1);
        return item.date > Date.parse(date);
    });
  }
})

.filter('isFutureDuty', function() {
	return function(items) {
		return items.filter(function(item){
            var date = new Date();
            date.setHours(0,0,0,0);
            date.setDate(date.getDate() - 1);
            return item.end > Date.parse(date);
		});
	}
})

.filter('isPast', function() {
  return function(items) {
    return items.filter(function(item){
        var date = new Date();
        date.setHours(0,0,0,0);
        date.setDate(date.getDate() - 1);
      return item.date <= Date.parse(date);
    });
  }
})

.filter('isPastDuty', function() {
    return function(items) {
        return items.filter(function(item){
            var date = new Date();
            date.setHours(0,0,0,0);
            date.setDate(date.getDate() - 1);
            return item.end <= Date.parse(date);
        });
    }
});

function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
function removeSpecials(str) {
    var lower = str.toLowerCase();
    var upper = str.toUpperCase();

    var res = "";
    for (var i = 0; i < lower.length; ++i) {
        if (lower[i] != upper[i] || lower[i].trim() === '')
            res += str[i];
        else if (str[i] == '@') {
            res += "_at_";
        }
    }
    return res;
}

function formattedDate(date) {
    var d = new Date(+date || Date.now()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('-');
}


