angular.module('starter.controllers', [])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});

    })

    .controller('HomeCtrl', function ($scope) {
    })

    .controller('ForgotPasswordCtrl', function ($scope, fireBaseData) {
        //wachtwoord vergeten
        $scope.forgot = function (em) {
            fireBaseData.resetPassword(em);
        }
    })
    .controller('RegisterCtrl', function ($scope, fireBaseData, $state, Teams, Admins) {
        //Create user methode
        $scope.createTeam = function (teamName, newTeam, firstName, lastName, insertion, em, pwd) {
			if(newTeam === true){
				// teams can be added  allways
				createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
			}
			else{
				// teamRef must be a key in the DB
				fireBaseData.ref().child("Teams").once('value', function(snapshot) {
					if (snapshot.hasChild(teamName)) {
						createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
					}
					else {
						alert("That team does not exist");
						return;
					}
				});
			}
		}
		
		function createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd) {
            if (firstName != null && lastName != null && em != null && pwd != null) {
                fireBaseData.ref().createUser({
                    email: em,
                    password: pwd
                }, function (error) {
                    if (error) {
                        switch (error.code) {
                            case "EMAIL_TAKEN":
                                alert("The new user account cannot be created because the email is already in use.");
                                break;
                            case "INVALID_EMAIL":
                                alert("The specified email is not a valid email.");
                                break;
                            default:
                                alert("Error creating user:", error);
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
								
								if(newTeam === true){
									$scope.getTeamId = Teams.addTeam(teamName);
									$scope.getTeamId.then(function(data){
										var teamId = data.$id;
										
										// link User to team
										Teams.linkPlayer(teamId, firstName, ins, lastName, uid);
										
										// add team to User
										var usrTeams = {};
										usrTeams[teamId] = true;
										usersRef.child(uid).child("Teams").set( usrTeams );
										
										//add admin position 
										Admins.linkAdmin(teamId,uid);
										
										$state.go('app.home');
									});
								}
								else{
									var teamId = teamName;
									console.log(teamName);
											
									// link User to team
									Teams.linkPlayer(teamId, firstName, ins, lastName, uid);
									
									// add team to User
									var usrTeams = {};
									usrTeams[teamId] = true;
									usersRef.child(uid).child("Teams").set( usrTeams );
									
									$state.go('app.home');	
								}
								
                            } else alert("Er ging wat mis:", error);
                        });
                    }
                });

            }
            else alert('Vul alle gegevens in!');

        }
    })
    .controller('LoginCtrl', function ($scope, firebaseRef, $state) {
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
    .controller('LogoutCtrl', function ($scope, fireBaseData) {
        //Logout method
        $scope.logout = function () {
            console.log('logout');
            fireBaseData.logout();
            document.location = "/";
        }
    })

    .controller('HomeCtrl', function ($scope, User) {

    })
	
	
    .controller('PlayersCtrl', function ($scope, Teams, User, $state,$stateParams) {
		
        $scope.getTeam = User.getTeam().then(function(data) {
			
			$scope.teamId = data;
			
			
			Teams.getPlayers($scope.teamId).then(function(data){
				$scope.players = data;
			});
        });
		
		$scope.invitePlayer = function() {
			$state.go('app.invite', { teamId: $scope.teamId});
		}
    })
	
	.controller('InvitesCtrl', function ($scope, User, Teams,  Mail, $state, $ionicHistory, $stateParams) {
        $scope.teamId = $stateParams.teamId;
		//console.log( $scope.teamId);
		$scope.getTeamName = Teams.getTeamName($scope.teamId).then(function(data) {
			$scope.teamName = data;	
        });
		
		$scope.invite = function ( em ) {
			console.log($scope.teamName);
			Mail.mailInvite(em, $scope.teamId, $scope.teamName);		
			$ionicHistory.goBack();
		}
    })

	.controller('GamesCtrl', function ($scope, Games, User, $state, $ionicHistory, Utility, $stateParams) {
		$scope.ShowDelete = false;
		$scope.isAdmin = false;

		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;

			//check if current user is Admin for this team
			$scope.games = Games.getGamesArray($scope.teamId);
			$scope.gamesRef = Games.getGamesRef($scope.teamId);
        }).then(function(){
			$scope.admin = User.isAdmin($scope.teamId).then(function(admins) {
				admins.forEach(function(admin){
					if(admin.$id === User.getUID()){
						$scope.isAdmin = true;
						console.log('isAdmin?: ' + $scope.isAdmin);
					}
				});
			});
		})

		$scope.showDelete = function() {
			console.log('showdelete:' + $scope.ShowDelete);
			$scope.ShowDelete = !$scope.ShowDelete;
		}
		
		$scope.addGame = function(){
			$state.go('app.newGame');
		}

		$scope.onItemDelete = function(item) {
			var strippedItem = angular.copy(item);
			Utility.deleteItem($scope.games, item, strippedItem);
			console.log($scope.games);
			$scope.gamesRef.set($scope.games);
		};

		$scope.getDetail = function(game) {
			Games.setGame(game.$id);
			$state.go('app.game', { gameId: game.$id});
		}
		$scope.editGame = function(game) {
			Games.setGame(game.$id);
			$state.go('app.game_edit', { gameId: game.$id});
		}
		$scope.statsGame = function(game) {
			Games.setGame(game.$id);
			$state.go('app.game_stats', { gameId: game.$id});
		}
		console.log($scope.isAdmin);
    })

	.controller('Games_DetailCtrl', function ($scope, Games, User, Teams, Attendance, Settings, $stateParams) {
		$scope.gameId = $stateParams.gameId;
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.getGame = Games.getGame($scope.teamId).then(function(game) {
				$scope.gameDate = new Date(game.date);
				$scope.game = game;
				$scope.settings = Settings.getSettings($scope.teamId);
				//update buttons
				$scope.present = Attendance.checkAttendance($scope.game.Present,User.getUID());
				$scope.absent = Attendance.checkAttendance($scope.game.Absent,User.getUID());
				
				$scope.unknown = (!$scope.present && !$scope.absent);
			}).then(function(){
				$scope.getPlayers = Teams.getPlayers($scope.teamId).then(function(players){
					//console.log(players);
					$scope.players = players;
					$scope.unknownPlayers = Attendance.checkUnknown($scope.game.Present, $scope.game.Absent, $scope.players);
					//console.log($scope.unknownPlayers);
				});
			});
		})
		
		$scope.changeAttendance = function(type){
			switch(type){
			case "present":
				
				if($scope.present === true ){
					// already logged, no change needed
				}else{
					$scope.present = Attendance.addAttendance("present","Games",User.getUID(),$scope.gameId,$scope.teamId,$scope.game.Absent);
					$scope.absent = false;					
				}
			break;
			case "absent": 
				if($scope.absent === true ){
					// already logged, no change needed
				}else{
					$scope.absent = Attendance.addAttendance("absent","Games",User.getUID(),$scope.gameId,$scope.teamId,$scope.game.Present);
					$scope.present = false;
				}
			break;
			default:
				//nothing yet
			break;
			}
			//update buttons
			$scope.unknown = (!$scope.present && !$scope.absent);
			// update unknown
			$scope.unknownPlayers = Attendance.checkUnknown($scope.game.Present, $scope.game.Absent, $scope.players)
		}
	})

	.controller('Games_EditCtrl', function ($scope, Games, User, $stateParams,$ionicHistory) {
		$scope.gameId = $stateParams.gameId;
		
		$scope.getTeam = User.getTeam().then(function (data) {
			$scope.teamId = data;
			$scope.getGame = Games.getGame($scope.teamId).then(function (game) {
				$scope.gameDate = new Date(game.date);
				$scope.title = "Selecteer datum";
				$scope.gameTime = game.time;
				$scope.game = game;
				$scope.home = game.home;
				$scope.away = game.away;
			})
		})
		$scope.datePickerCallback = function (val) {
			if (typeof(val) === 'undefined') {
				console.log('Date not selected');
			} else {
				console.log('Selected date is : ', val);
				$scope.gameDate = val;
			}
		};

		$scope.timePickerCallback = function (val) {
			if (typeof (val) === 'undefined') {
				console.log('Time not selected');
			} else {
				console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
				$scope.gameTime = val;
			}
		};

		$scope.updateGame = function(home, away) {
			Games.updateGame($scope.teamId, $scope.gameId, $scope.gameDate, $scope.gameTime, home, away);
			$ionicHistory.goBack();
		}
	})
	.controller('newGamesCtrl', function($scope, User, Games, $ionicHistory) {
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.gameDate = new Date();
			$scope.title = "Selecteer datum";
			$scope.gameTime = 52200;
			$scope.datePickerCallback = function (val) {
				if (typeof(val) === 'undefined') {
					console.log('Date not selected');
				} else {
					console.log('Selected date is : ', val);
					$scope.gameDate = val;
				}
			};

			$scope.timePickerCallback = function (val) {
				if (typeof (val) === 'undefined') {
					console.log('Time not selected');
				} else {
					console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
					$scope.gameTime = val;
				}
			};

			$scope.newGame = function (home, away, time, date) {

				if (typeof ($scope.gameDate) === 'undefined' || typeof ($scope.gameTime) === 'undefined') {
					alert('hoi');
				} else {
					Games.createGame($scope.teamId, $scope.gameDate, $scope.gameTime, home, away);
					console.dir($ionicHistory);
					$ionicHistory.goBack();
				}
			}
		})
	})
	
	.controller('Games_StatsCtrl', function ($scope, Teams, Games, User, Statistics, $stateParams,$ionicHistory) {
		$scope.gameId = $stateParams.gameId;
		$scope.selectedType = "";

		$scope.typeStats = ["wissel","positie wissel", "goal voor","goal tegen", "gele kaart", "rode kaart"]
		
		$scope.getTeam = User.getTeam().then(function (data) {
			$scope.teamId = data;
			$scope.nbsp = " "; // whitespace
			$scope.title = "Selecteer datum";
			$scope.tactic = 0;
			$scope.positions = [];
			$scope.actualPositions = [];
			$scope.homeScore = 0;
			$scope.awayScore = 0;
			Teams.getTeamName($scope.teamId).then(function(teamName){
				$scope.teamName = teamName;
			});
			Teams.getPlayers($scope.teamId).then(function(teamPlayers){
				$scope.players = teamPlayers;
			});
			$scope.getGame = Games.getGame($scope.teamId).then(function (game) {
				$scope.game = game
				// get current statistics and  fill them in !
				//console.log(game);
				Statistics.getStatistics($scope.teamId,$scope.game.$id).then(function (stats) {
				
					if(stats.$value === null){
						var init = Statistics.initialize($scope.teamId,$scope.game.$id,game.time);
						$scope.firstHalfStart = init.firstHalfStart;
						$scope.firstHalfEnd = init.firstHalfEnd;
						$scope.secondHalfStart = init.secondHalfStart;
						$scope.secondHalfEnd = init.secondHalfEnd;
						$scope.tactic = 0;
						$scope.basis = {};
						$scope.actualPlayers = {};
						$scope.changes = {};
					}
					else{
						$scope.tactic = stats.tactic;					
						$scope.firstHalfStart = stats.firstHalfStart;
						$scope.firstHalfEnd =  stats.firstHalfEnd;
						$scope.secondHalfStart =  stats.secondHalfStart;
						$scope.secondHalfEnd =  stats.secondHalfEnd;
						
						// parse the current filled in stats for basic team and statType "wissels"
						//$scope.basis = stats.Basis;
						//read this back to the input fields!
						for(key in stats.Basis){
							$scope.positions[stats.Basis[key]] = key;
						};
						//console.log($scope.positions);
						$scope.actualPlayers = stats.Basis;
						$scope.changes = game.Present;
						
						if(typeof $scope.basis !== 'undefined'){
							for(key in $scope.basis){
								//console.log(key);
								delete $scope.changes[key];
							};
						}
						if(typeof stats.Changes !== 'undefined'){
							for(key in stats.Changes){
								$scope.actualPlayers[stats.Changes[key].playerIn] = $scope.actualPlayers[stats.Changes[key].playerOut]; // transfer position
								delete $scope.actualPlayers[stats.Changes[key].playerOut];
								// he is already changed so he cannot be changed again
								delete $scope.changes[stats.Changes[key].playerIn];
							};
						}
						if(typeof stats.PosChanges !== 'undefined'){
							for(key in stats.PosChanges){
								var pos1 = $scope.actualPlayers[stats.PosChanges[key].player1]; // position of player1
								var pos2 = $scope.actualPlayers[stats.PosChanges[key].player2]; // position of player2
								$scope.actualPlayers[stats.PosChanges[key].player1] = pos2; // transfer position
								$scope.actualPlayers[stats.PosChanges[key].player2] = pos1; // transfer position
							};
						}
						if(typeof stats.Cards !== 'undefined'){
							for(key in stats.Cards){
								if(stats.Cards[key].type === 'red'){
									delete $scope.actualPlayers[stats.Cards[key].player]; // remove from actual players
								}
							};
						}
						// make actual positions
						$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
						
						// scoreboard Our Goals
						if(typeof stats.OurGoals !== 'undefined'){
							for(key in stats.OurGoals){
								if($scope.game.home === $scope.teamname)
									$scope.homeScore++;
								else
									$scope.awayScore++;
							};
						}
						// scoreboard Their Goals
						if(typeof stats.TheirGoals !== 'undefined'){
							for(key in stats.TheirGoals){
								if($scope.game.home !== $scope.teamname)
									$scope.homeScore++;
								else
									$scope.awayScore++;
							};
						}
					}
				})
			})
		})
		
		$scope.datePickerCallback = function (val) {
		};

		$scope.timePickerCallback = function (val) {
		};
		
		$scope.toggleGroup = function(group) {
			if ($scope.isGroupShown(group)) {
			  $scope.shownGroup = null;
			} else {
			  $scope.shownGroup = group;
			}
		};
		$scope.isGroupShown = function(group) {
			return $scope.shownGroup === group;
		};
		
		$scope.updateEventTime = function(){
			var curDate = new Date();
			$scope.eventTime = (curDate.getHours()*3600)+ (curDate.getMinutes()*60);
			//console.log($scope.eventTime);
		};
		$scope.storeBasis = function(tactic){
			$scope.tactic = tactic;
			var basis ={};
			for(key in $scope.positions){
				basis[$scope.positions[key]] = key;
			};
			Statistics.updateBasis($scope.teamId,$scope.game.$id,basis,$scope.tactic);
			$scope.actualPositions = Statistics.updateActualTeam(basis);
			$scope.toggleGroup("basisTeam");
		};
		$scope.saveChange = function(playerIn, playerOut, time, comment) {
			var pos = $scope.actualPlayers[playerOut]; // position of player going out
			$scope.actualPlayers[playerIn] = $scope.actualPlayers[playerOut]; // transfer position
			delete $scope.actualPlayers[playerOut]; // remove from actual players
			delete $scope.changes[playerIn]; // remove from available changeable players
			
			if(typeof comment === 'undefined'){ // protect against undefined
				comment = " ";
			}	
			Statistics.newChange($scope.teamId,$scope.game.$id,playerIn, playerOut,pos, time, comment);
			$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
		};
		$scope.savePosChange = function(player1, player2, time, comment) {
			var pos1 = $scope.actualPlayers[player1]; // position of player1
			var pos2 = $scope.actualPlayers[player2]; // position of player2
			$scope.actualPlayers[player1] = pos2; // transfer position
			$scope.actualPlayers[player2] = pos1; // transfer position
			
			if(typeof comment === 'undefined'){ // protect against undefined
				comment = " ";
			}	
			Statistics.newPosChange($scope.teamId,$scope.game.$id,player1, player2,pos1, pos2, time, comment);
			$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
		};
		$scope.saveOurGoal = function(player, time, comment) {
			// update Scoreboard
			if($scope.game.home === $scope.teamname){
				$scope.homeScore++;
			}else{
				$scope.awayScore++;
			}
			
			if(typeof comment === 'undefined'){ // protect against undefined
				comment = " ";
			}			
			Statistics.newGoal($scope.teamId,$scope.game.$id, true, player, time, comment);
		};
		$scope.saveTheirGoal = function(time, comment) {
			if($scope.game.home !== $scope.teamname){
				$scope.homeScore++;
			}else{
				$scope.awayScore++;
			}
			if(typeof comment === 'undefined'){ // protect against undefined
				comment = " ";
			}
			Statistics.newGoal($scope.teamId,$scope.game.$id, false, 'undefined', time, comment);	
		};
		$scope.saveCard = function(player, type, time, comment) {
			Statistics.newCard($scope.teamId,$scope.game.$id, type, player, time, comment);
			if(type === 'red'){
				delete $scope.actualPlayers[player]; // remove from actual players
			}
			$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
		};

	})
	
	.controller('PractisesCtrl', function ($scope, Practises, User, $state, $ionicHistory, Utility) {
		$scope.ShowDelete = false;
		$scope.isAdmin = false;
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;

			//check if current user is Admin for this team
			$scope.practises = Practises.getPractisesArray($scope.teamId);
			$scope.practisesRef = Practises.getPractisesRef($scope.teamId);
		}).then(function(){
			$scope.admin = User.isAdmin($scope.teamId).then(function(admins) {

				admins.forEach(function(admin){
					if(admin.$id === User.getUID()){
						$scope.isAdmin = true;
						console.log('isAdmin?: ' + $scope.isAdmin);
					}
				});
			});
		});

		$scope.showDelete = function() {
			console.log('showdelete:' + $scope.ShowDelete);
			$scope.ShowDelete = !$scope.ShowDelete;
		};


		$scope.datePickerCallback = function(val) {
			if(typeof(val)==='undefined'){      
				console.log('Date not selected');
			}else{
				console.log('Selected date is : ', val);
				$scope.date = val;
			}
		};

		$scope.timePickerCallback = function(val) {
		  if (typeof (val) === 'undefined') {
			console.log('Time not selected');
		  } else {
			console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
			$scope.time = val;
		  }
		};

        $scope.getDetail = function(practise) {
            console.log('detail');
			console.log(practise);
            Practises.setPractise(practise);
            $state.go('app.practise', { practiseId: practise });
        }
		
		$scope.addPractise = function(){
			$state.go('app.newPractise');
		}

        $scope.onItemDelete = function(item) {
            var strippedItem = angular.copy(item);
            Utility.deleteItem($scope.practises, item, strippedItem);
            $scope.practisesRef.set($scope.practises);
        };
		$scope.newPractise = function(location,repeatValue){
			if (typeof ($scope.date) === 'undefined' || typeof ($scope.time) === 'undefined'|| typeof (repeatValue) === 'undefined') {
				
			} else {		
				Practises.createPractise($scope.teamId, $scope.date, $scope.time, location, repeatValue);
				//return to previous page
				$ionicHistory.goBack();
			}	
		}
        $scope.editPractise = function(practise) {
            Practises.setPractise(practise.$id);
            $state.go('app.practise_edit', { practiseId: practise.$id});
        }
		
    })

    .controller('Practises_DetailCtrl', function ($scope, Practises, User, Teams, Attendance, Settings, $stateParams) {
		$scope.practiseId = $stateParams.practiseId;
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			console.log(data);
			$scope.getPractise = Practises.getPractise($scope.teamId).then(function(practise){
				console.log(practise);
				$scope.practiseDate = new Date(practise.date);
				$scope.practise = practise;
				$scope.settings = Settings.getSettings($scope.teamId);
				//update buttons
				$scope.present = Attendance.checkAttendance($scope.practise.Present,User.getUID());
				$scope.absent = Attendance.checkAttendance($scope.practise.Absent,User.getUID());
				$scope.unknown = (!$scope.present && !$scope.absent);
			}).then(function(){
				$scope.getPlayers = Teams.getPlayers($scope.teamId).then(function(players){
					$scope.players = players;
					$scope.unknownPlayers = Attendance.checkUnknown($scope.practise.Present, $scope.practise.Absent, $scope.players);
				});
			});
		})
		
		$scope.changeAttendance = function(type){
			switch(type){
			case "present":
				
				if($scope.present === true ){
					// already logged, no change needed
				}else{
					$scope.present = Attendance.addAttendance("present","Practises",User.getUID(),$scope.practiseId,$scope.teamId,$scope.practise.Absent);
					$scope.absent = false;					
				}
			break;
			case "absent": 
				if($scope.absent === true ){
					// already logged, no change needed
				}else{
					$scope.absent = Attendance.addAttendance("absent","Practises",User.getUID(),$scope.practiseId,$scope.teamId,$scope.practise.Present);
					$scope.present = false;
				}
			break;
			default:
				//nothing yet
			break;
			}
			//update buttons
			$scope.unknown = (!$scope.present && !$scope.absent);
			// update unknown
			$scope.unknownPlayers = Attendance.checkUnknown($scope.practise.Present, $scope.practise.Absent, $scope.players)
		}
    })

    .controller('Practises_EditCtrl', function ($scope, Practises, User, $stateParams,$ionicHistory) {
        $scope.practiseId = $stateParams.practiseId;

        $scope.getTeam = User.getTeam().then(function (data) {
            $scope.teamId = data;
            $scope.getPractise = Practises.getPractise($scope.teamId).then(function (practise) {
                $scope.practiseDate = new Date(practise.date);
                $scope.title = "Selecteer datum";
                $scope.practiseTime = practise.time;
                $scope.practise = practise;
                $scope.location = practise.location;
            })
        })
        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                console.log('Date not selected');
            } else {
                console.log('Selected date is : ', val);
                $scope.practiseDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                console.log('Time not selected');
            } else {
                console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.practiseTime = val;
            }
        };

        $scope.updatePractise = function(location) {
            Practises.updatePractise($scope.teamId, $scope.practiseId, $scope.practiseDate, $scope.practiseTime, location);
            $ionicHistory.goBack();
        }
    })

	.controller('newPractisesCtrl', function($scope, User, Practises, $ionicHistory) {
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.practiseDate = new Date();
			$scope.title = "Selecteer datum";
			$scope.practiseTime = 72000;
			$scope.weeks = 1;
		});
		
		$scope.datePickerCallback = function (val) {
			if (typeof(val) === 'undefined') {
				console.log('Date not selected');
			} else {
				console.log('Selected date is : ', val);
				$scope.practiseDate = val;
			}
		};

		$scope.timePickerCallback = function (val) {
			if (typeof (val) === 'undefined') {
				console.log('Time not selected');
			} else {
				console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
				$scope.practiseTime = val;
			}
		};

		$scope.newPractise = function(location,repeatValue){
			if (typeof ($scope.practiseDate) === 'undefined' || typeof ($scope.practiseTime) === 'undefined'|| typeof (repeatValue) === 'undefined') {
				
			} else {		
				Practises.createPractise($scope.teamId, $scope.practiseDate, $scope.practiseTime, location, repeatValue);
				//return to previous page
				$ionicHistory.goBack();
			}	
		}
	})
	
	.controller('FinanceCtrl', function ($scope, User, Finance, $state) {
        $scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			
			$scope.getCredits = Finance.getCredits($scope.teamId).then(function(data){
				$scope.credits = data;
				console.log($scope.credits);
			});
        });
		$scope.toggleGroup = function(group) {
			if ($scope.isGroupShown(group)) {
			  $scope.shownGroup = null;
			} else {
			  $scope.shownGroup = group;
			}
		};
		$scope.isGroupShown = function(group) {
			return $scope.shownGroup === group;
		};
		
		$scope.addCredit = function(){
			$state.go('app.newCredit');
		}
    })
	
	.controller('CreditsCtrl', function ($scope, Teams, User, Finance, $state,$ionicHistory) {
        
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.nbsp = " "; // whitespace
			Teams.getPlayersArray($scope.teamId).then(function(teamPlayers){
				$scope.players = teamPlayers;
			});
        });
		
		$scope.newCredit = function(uid, value, comment){
			console.log(uid);
			Finance.newCredit($scope.teamId, uid, value, comment);
			$ionicHistory.goBack();
		}
    })
	
	.controller('DutiesCtrl', function ($scope, Teams, Games,Practises, Settings, User, Duties, $state,$ionicHistory) {
		
		$scope.currentDate = new Date();
		console.log($scope.currentDate);
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			
			$scope.settings = Settings.getSettings($scope.teamId);
			
			$scope.duties = Duties.getDuties($scope.teamId);
			console.log($scope.duties);
			//get Games
			$scope.games = Games.getGames($scope.teamId);	
			// get Practices
			$scope.practises = Practises.getPractises($scope.teamId);
			// get Events
			//$scope.events = ;

			console.log($scope.duties);
			Teams.getPlayers($scope.teamId).then(function(teamPlayers){
			
				$scope.players = teamPlayers;
			});
		})
		
		$scope.updateDuties = function(){
		
			var dutyPlayers = new Array();
			$scope.players.forEach(function(value,playerId){
				dutyPlayers.push(playerId);
			});
			var loopPlayers = dutyPlayers.slice();
			
			// create al required occurences ( we take a year by default)
			$scope.dutyOccurrences =new Array();
			var firstDate = new Date($scope.currentDate.getFullYear(),$scope.currentDate.getMonth(),$scope.currentDate.getDate());
			// correct to start at day 0 so it always starts at the same day of the week!
			firstDate.setDate(firstDate.getDate() + (7 - $scope.currentDate.getDay()));
			var backTrackDate = new Date(firstDate);
			var lastDate = new Date(firstDate.getFullYear()+1, firstDate.getMonth(), firstDate.getDate()); 
			
			while( firstDate < lastDate){
				$scope.dutyOccurrences.push({
					start : new Date(firstDate),
					end : new Date(firstDate.setDate(firstDate.getDate() + (7)))
				});
			}		
			
			// backtrack our Duty schedule to initialize the loopPlayers array. this  will make sure we do give players double duty
			//backtrack for  no of  players times
			for(var i = 0; i < dutyPlayers.length;i++){
				//actually make the backtrack go back
				backTrackDate.setDate(backTrackDate.getDate() -7);
				var backTrackKey = backTrackDate.getFullYear() + "" + backTrackDate.getMonth()  + "" + backTrackDate.getDate();
				if(typeof $scope.duties[backTrackKey] === "undefined"){
					// no Duty here or this date does not exist
					//console.log("no duty exists");
				}else{
					// there is a duty record here, lets see who is listed
					//console.log("find history player");
					var foundDuties = Object.keys($scope.duties[backTrackKey].Duty);
					//remove from loopPlayers
					foundDuties.forEach(function(key){
						var index =loopPlayers.indexOf(key);
						if(index != -1)
							loopPlayers.splice(loopPlayers.indexOf(key),1);
					});
				}
			}
			
			//fill future Occurences
			$scope.dutyOccurrences.forEach(function(occurence){
				var occurenceKey = occurence.start.getFullYear() + "" + occurence.start.getMonth()  + "" + occurence.start.getDate();
				
				//check if there are any events planned in this occurence
				var occurenceEvents = {};
				var retVal = {};
				if($scope.settings.dutyGames === true){
					retVal = Duties.checkForEvents($scope.games,occurence);
					if(Object.keys(retVal).length > 0)
						occurenceEvents["Games"] = retVal;
				}
				if($scope.settings.dutyPractises === true){
					retVal = Duties.checkForEvents($scope.practises,occurence);
					if(Object.keys(retVal).length > 0)
						occurenceEvents["Practises"] = retVal;
				}
				if($scope.settings.dutyEvents === true){
					retVal = Duties.checkForEvents($scope.events,occurence);
					if(Object.keys(retVal).length > 0)
						occurenceEvents["Events"] = retVal;
				}
				//var occurenceEvents = Duties.checkForEvents($scope.games,occurence); // return array of the  events within this occurence (gameId, practiseId is needed to update datebase )
				console.log(occurenceEvents);
				//check if there are any events in this  returned array
				if(Object.keys(occurenceEvents).length > 0){
					
					var duty={}
					duty[loopPlayers[0]] = true;
					loopPlayers.splice(0,1);;
					if(loopPlayers.length <= 1){
						loopPlayers = dutyPlayers.slice(); // reset to the original full array
					}
					if(typeof $scope.duties[occurenceKey] === "undefined"){
						// this Duty item does not yet exist lets create it
						Duties.addDuty($scope.teamId,occurenceKey,occurence.start, occurence.end,duty);
					}
					else{
						// pre existing duty overwrite the Duty players
						Duties.updateDuty($scope.teamId,occurenceKey,duty);
					}
					//update the linked Events
					Duties.linkEvents($scope.teamId, occurenceEvents, duty);
					
				}
				else{
					// remove the  duty instance if  it already exists
					if(typeof $scope.duties[occurenceKey] === "undefined"){
					// this Duty item does not yet exist. thats good!
					}
					else{
						// pre existing duty, it is no longer valid, lets remove it!

						// it needs to be removed since it has no linked events
						Duties.removeDuty($scope.teamId,occurenceKey);
					}
				}
				
				
			});
			
		}
			
    })
	
	.controller('SettingsCtrl', function ($scope, User, Settings,  $state) {
	
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.settings =Settings.getSettings($scope.teamId);
		});
		
		$scope.changeSetting = function(key , value){
			console.log(key, value);
			Settings.updateSetting(key, value, $scope.teamId);
		}
		
    })

	.filter('orderObjectBy', function() {
		return function(items, field, reverse) {
			var filtered = [];
			angular.forEach(items, function(item) {
				filtered.push(item);
			});
			filtered.sort(function (a, b) {
				return (a[field] > b[field] ? 1 : -1);
			});
			if(reverse) filtered.reverse();
			return filtered;
		};
	});
	
	function removeSpecials(str) {
			var lower = str.toLowerCase();
			var upper = str.toUpperCase();

			var res = "";
			for(var i=0; i<lower.length; ++i) {
				if(lower[i] != upper[i] || lower[i].trim() === '')
					res += str[i];
				else
					if (str[i] == '@') {
						res += "_at_";
					}
			}
			return res;
	}
	
	function formattedDate(date) {
    var d = new Date(date || Date.now()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('-');
	}


