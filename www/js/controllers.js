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
			if(emailValid === true){
				fireBaseData.resetPassword(em);
			}
        }
    })
    .controller('RegisterCtrl', function ($scope, fireBaseData, $state, Teams, Admins) {
		$scope.spinner = false;
		
		// get passed variables from URL
		$scope.URL = window.location.href;
		var teamRefPos = $scope.URL.indexOf("TeamRef=");
		if(teamRefPos !== -1){
			$scope.teamName = $scope.URL.substr(teamRefPos+8,20);
			if($scope.teamName.indexOf("&") !== -1)
				$scope.teamName = $scope.teamName.substr(0, $scope.teamName.indexOf("&"))	
		}
		var emailPos = $scope.URL.indexOf("Email=");
		if(emailPos !== -1){
			$scope.em = $scope.URL.substr(emailPos+6);
			if($scope.em.indexOf("&") !== -1)
				$scope.em = $scope.em.substr(0, $scope.em.indexOf("&"))		
		}
		
		
        //Create user methode
        $scope.createTeam = function (teamName, newTeam, firstName, lastName, insertion, em, pwd) {
			$scope.spinner = true;
			if(newTeam === true){
				// teams can be added  allways
				$scope.createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
			}
			else{
				// teamRef must be a key in the DB
				fireBaseData.ref().child("Teams").once('value', function(snapshot) {
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
								
                            } 
							else{
								$scope.spinner = false;
								alert("Er ging wat mis:", error);
							}
                        });
                    }
                });

            }
            else{
				$scope.spinner = false;
				alert('Vul alle gegevens in!');
			}
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

    .controller('HomeCtrl', function ($scope, User, Teams, localStorageFactory, firebaseRef) {
        var ref = firebaseRef.ref();

        var uid = User.getUID();
        ref.child('Users').child(uid).child('Teams').once('value', function(teams) {
            localStorageFactory.setTeams(teams.val());

            var teamId = localStorageFactory.getTeamId();

            ref.child('Teams').child(teamId).once('value', function(teamData) {
                localStorageFactory.setPlayers(teamData.val().Players);
                localStorageFactory.setSettings(teamData.val().Settings);
                localStorageFactory.setTeamName(teamData.val());
            })

            ref.child('Admins').child(teamId).once('value', function(admin) {
                localStorageFactory.setAdmin(admin.val(), uid);
            })

            User.getName().then(function(data){
                var firstName = data.firstName,
                    insertion = data.insertion,
                    lastName = data.lastName;
                $scope.name = firstName + ' ' + insertion + ' ' + lastName;
            })
        })
    })
	
    .controller('PlayersCtrl', function ($scope, Teams, User, $state,$stateParams, localStorageFactory) {
		
		$scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();

        $scope.players = localStorageFactory.getPlayers();

        console.log($scope.players);
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

	.controller('GamesCtrl', function ($scope, Games, User, $state, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
		$scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.games = localStorageFactory.getGames($scope.teamId);
        $scope.players = localStorageFactory.getPlayers();

        $scope.connected =  firebaseRef.connectedRef().on("value", function(snap) {
            if(snap.val() === true) {
                $scope.getGames = Games.getGamesArray($scope.teamId).then(function(games) {
                   $scope.games = games;
                    localStorageFactory.setGames(games);
                });
            }
        });

		$scope.gamesRef = Games.getGamesRef($scope.teamId);

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
    })

	.controller('Games_DetailCtrl', function ($scope, Games, User, Teams, Attendance, Settings, Statistics, localStorageFactory, $stateParams) {
		$scope.gameId = $stateParams.gameId;
		$scope.players = localStorageFactory.getPlayers();
		$scope.fieldPlayers = angular.copy($scope.players);
		$scope.teamId = localStorageFactory.getTeamId();
		$scope.basis= {};
		$scope.getGame = Games.getGame($scope.teamId).then(function(game) {
			$scope.gameDate = new Date(game.date);
			$scope.game = game;
			$scope.settings = Settings.getSettings($scope.teamId);
			//update buttons
			$scope.present = Attendance.checkAttendance($scope.game.Present,User.getUID());
			$scope.absent = Attendance.checkAttendance($scope.game.Absent,User.getUID());
			
			$scope.unknown = (!$scope.present && !$scope.absent);
			
			
			$scope.unknownPlayers = Attendance.checkUnknown($scope.game.Present, $scope.game.Absent, $scope.players);
		});
		
		Statistics.getRef().child($scope.teamId).child($scope.gameId).on('value',function(statsSnap){
			
			if(statsSnap.val() !== null){
				console.log(statsSnap.val());
				if(typeof statsSnap.val().Basis !== 'undefined'){
					
					if(typeof statsSnap.val().externalPlayers !== 'undefined'){
						for(var i = 1;i <= statsSnap.val().externalPlayers;i++){
							//add external player to the fieldplayers List
							$scope.fieldPlayers["external"+i] = {firstName : "external", insertion: "", lastName: ""+i};
						};
					}
					for(key in statsSnap.val().Basis){
						$scope.basis[statsSnap.val().Basis[key]] = key;
					};
					$scope.tactic = statsSnap.val().tactic;
				}
			}
			else{
				$scope.tactic = 0;
			}			
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

	.controller('Games_EditCtrl', function ($scope, Games, User, $stateParams, localStorageFactory, $ionicHistory) {
		$scope.gameId = $stateParams.gameId;
		
		$scope.teamId = localStorageFactory.getTeamId();
		$scope.getGame = Games.getGame($scope.teamId).then(function (game) {
			$scope.gameDate = new Date(game.date);
			$scope.title = "Selecteer datum";
			$scope.gameTime = game.time;
			$scope.game = game;
			$scope.home = game.home;
			$scope.away = game.away;
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
	
	.controller('newGamesCtrl', function($scope, User, Games, Teams,localStorageFactory, $ionicHistory) {
		
		$scope.teamId = localStorageFactory.getTeamId();
		$scope.teamName = localStorageFactory.getTeamName();
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
		$scope.newGame = function(homeAway, opponent){
			if (typeof ($scope.gameDate) === 'undefined' || typeof ($scope.gameTime) === 'undefined') {
				
			} else {
				if(homeAway === true){
					var home = $scope.teamName;
					var away = opponent;
				}
				else{
					var away = $scope.teamName;
					var home = opponent;
				}
				Games.createGame($scope.teamId, $scope.gameDate, $scope.gameTime, home, away);
				console.dir($ionicHistory);
				$ionicHistory.goBack();
			}
		};
	
	})
	
	.controller('Games_StatsCtrl', function ($scope, Teams, Games, User, Statistics,$state, $stateParams,firebaseRef, localStorageFactory, $ionicHistory) {
		$scope.gameId = $stateParams.gameId;
		$scope.selectedType = "";
		$scope.typeStats = ["wissel","positie wissel", "goal voor","goal tegen", "gele kaart", "rode kaart"]
		$scope.game ={}; // empty game object
		
		$scope.teamId = localStorageFactory.getTeamId(); // get TeamId from local storage
		$scope.nbsp = " "; // whitespace
		$scope.title = "Selecteer datum";
		$scope.tactic = 0;
		$scope.positions = [];
		$scope.actualPositions = [];
		$scope.homeScore = 0;
		$scope.awayScore = 0;
		
		$scope.teamName = localStorageFactory.getTeamName();
		$scope.players = localStorageFactory.getPlayers();
		console.log($scope.players);
		//$scope.getGame = Games.getGame($scope.teamId).then(function (game) {
		var gamesRef = firebaseRef.ref().child("Games").child($scope.teamId);
		gamesRef.child(localStorageFactory.getSelectedGame()).on('value',function(gameSnap){
			
			$scope.game = gameSnap.val();
			console.log($scope.game);
			if(typeof $scope.game.Present !== 'undefined'){
				$scope.presentPlayers = angular.copy($scope.game.Present);
			}
			else{
				$scope.presentPlayers = {};
			}
			// get current statistics and  fill them in !
			// console.log(game);
			var statsRef = firebaseRef.ref().child("Statistics").child($scope.teamId);
			statsRef.child(localStorageFactory.getSelectedGame()).on('value',function(statsSnap){
				console.log(statsSnap.val());
				var stats = statsSnap.val();
				if(stats === null){ // no statistics 
					var init = Statistics.initialize($scope.teamId,localStorageFactory.getSelectedGame(),$scope.game.time);
					$scope.firstHalfStart = init.firstHalfStart;
					$scope.firstHalfEnd = init.firstHalfEnd;
					$scope.secondHalfStart = init.secondHalfStart;
					$scope.secondHalfEnd = init.secondHalfEnd;
					$scope.tactic = 0;
					$scope.externalPlayers = 0;
					$scope.actualPlayers = {};
					$scope.changes = {};
				}
				else{
					$scope.tactic = stats.tactic;
					$scope.externalPlayers = stats.externalPlayers;						
					$scope.firstHalfStart = stats.firstHalfStart;
					$scope.firstHalfEnd =  stats.firstHalfEnd;
					$scope.secondHalfStart =  stats.secondHalfStart;
					$scope.secondHalfEnd =  stats.secondHalfEnd;
					
					//external players must be added to the present List
					if(typeof $scope.externalPlayers !== 'undefined'){
						for(var i = 1;i <= $scope.externalPlayers;i++){
							//add external player to the Present List
							$scope.presentPlayers["external"+i]=true;
							$scope.players["external"+i] = {firstName : "external", insertion: "", lastName: ""+i};
						};
					}
					else{
						$scope.externalPlayers = 0;
					}
					
					// parse the current filled in stats for basic team and statType "wissels"
					//read this back to the input fields!
					if(typeof stats.Basis !== 'undefined'){
						for(key in stats.Basis){
							$scope.positions[stats.Basis[key]] = key;
						};
					}
					
					$scope.actualPlayers = angular.copy(stats.Basis);
					$scope.changes = angular.copy($scope.presentPlayers);
					
					if(typeof stats.Basis !== 'undefined'){
						for(key in stats.Basis){
							//console.log(key);
							delete $scope.changes[key];
						};
					}
					
					if(typeof stats.Changes !== 'undefined'){
						for(key in stats.Changes){
							switch(stats.Changes[key].type){ //change type, in/out or  position
								case "In/Out":
									$scope.actualPlayers[stats.Changes[key].playerIn] = $scope.actualPlayers[stats.Changes[key].playerOut]; // transfer position
									delete $scope.actualPlayers[stats.Changes[key].playerOut];
									// he is already changed so he cannot be changed in again
									delete $scope.changes[stats.Changes[key].playerIn];
								break;
								
								case "Position":
									var pos1 = $scope.actualPlayers[stats.Changes[key].player1]; // position of player1
									var pos2 = $scope.actualPlayers[stats.Changes[key].player2]; // position of player2
									$scope.actualPlayers[stats.Changes[key].player1] = pos2; // transfer position
									$scope.actualPlayers[stats.Changes[key].player2] = pos1; // transfer position
								break;
							}
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
							if($scope.game.home === $scope.teamName)
								$scope.homeScore++;
							else
								$scope.awayScore++;
						};
					}
					// scoreboard Their Goals
					if(typeof stats.TheirGoals !== 'undefined'){
						for(key in stats.TheirGoals){
							if($scope.game.home !== $scope.teamName)
								$scope.homeScore++;
							else
								$scope.awayScore++;
						};
					}
				}
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
		$scope.updatePlayerList = function(externalPlayers){
			for(var i = 1;i <= externalPlayers;i++){
				//add external player to the Present List
				$scope.presentPlayers["external"+i]=true;
				$scope.players["external"+i] = {firstName : "external", insertion: "", lastName: ""+i};
				//console.log($scope.players);
			};
			$scope.externalPlayers = externalPlayers;
		};
		$scope.storeBasis = function(tactic){
			$scope.tactic = tactic;
			var basis ={};
			for(key in $scope.positions){
				basis[$scope.positions[key]] = key;
			};
			Statistics.updateBasis($scope.teamId,$scope.gameId,basis,$scope.tactic,$scope.externalPlayers);
			//$scope.actualPositions = Statistics.updateActualTeam(basis); no need since we reload th whole page after this, else external players and basis  update  becomes alot more complicated, since all arrays  need to be rebuild
			$state.go($state.current, {}, {reload: true});
		};
		$scope.saveChange = function(playerIn, playerOut, time, comment) {
			var pos = $scope.actualPlayers[playerOut]; // position of player going out
			$scope.actualPlayers[playerIn] = $scope.actualPlayers[playerOut]; // transfer position
			delete $scope.actualPlayers[playerOut]; // remove from actual players
			delete $scope.changes[playerIn]; // remove from available changeable players
			
			if(typeof comment === 'undefined'){ // protect against undefined
				comment = " ";
			}	
			Statistics.newChange($scope.teamId,$scope.gameId,playerIn, playerOut,pos, time, comment);
			$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
			$scope.selectedType = "";
			$scope.toggleGroup(null);
		};
		$scope.savePosChange = function(player1, player2, time, comment) {
			var pos1 = $scope.actualPlayers[player1]; // position of player1
			var pos2 = $scope.actualPlayers[player2]; // position of player2
			$scope.actualPlayers[player1] = pos2; // transfer position
			$scope.actualPlayers[player2] = pos1; // transfer position
			
			if(typeof comment === 'undefined'){ // protect against undefined
				comment = " ";
			}	
			Statistics.newPosChange($scope.teamId,$scope.gameId,player1, player2,pos1, pos2, time, comment);
			$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
			$scope.selectedType = "";
			$scope.toggleGroup(null);
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
			Statistics.newGoal($scope.teamId,$scope.gameId, true, player, time, comment);
						$scope.selectedType = "";
			$scope.toggleGroup(null);
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
			Statistics.newGoal($scope.teamId,$scope.gameId, false, 'undefined', time, comment);
			$scope.selectedType = "";
			$scope.toggleGroup(null);			
		};
		$scope.saveCard = function(player, type, time, comment) {
			Statistics.newCard($scope.teamId,$scope.gameId, type, player, time, comment);
			if(type === 'red'){
				delete $scope.actualPlayers[player]; // remove from actual players
				$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
			}
			else{ // yellow
				if (confirm('tweede gele kaart?')) {
					delete $scope.actualPlayers[player]; // remove from actual players
					$scope.actualPositions = Statistics.updateActualTeam($scope.actualPlayers);
				}
			}
			$scope.selectedType = "";
			$scope.toggleGroup(null);
		};

	})
	
	.controller('PractisesCtrl', function ($scope, Practises, User, $state, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
		$scope.ShowDelete = false;
		$scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.practises = localStorageFactory.getPractises();
        $scope.practisesRef = Practises.getPractisesRef($scope.teamId);
		$scope.showDelete = function() {
			console.log('showdelete:' + $scope.ShowDelete);
			$scope.ShowDelete = !$scope.ShowDelete;
		};

        $scope.connected =  firebaseRef.connectedRef().on("value", function(snap) {
            if(snap.val() === true) {
                $scope.getPractises = Practises.getPractisesArray($scope.teamId).then(function(practises) {
                    $scope.practises = practises;
                    localStorageFactory.setPractises(practises);
                });
            }
        });

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

    .controller('Practises_DetailCtrl', function ($scope, Practises, User, Teams, Attendance, Settings,localStorageFactory, $stateParams) {
		$scope.practiseId = $stateParams.practiseId;
		
		$scope.teamId = localStorageFactory.getTeamId();
		$scope.getPractise = Practises.getPractise($scope.teamId).then(function(practise){
			console.log(practise);
			$scope.practiseDate = new Date(practise.date);
			$scope.practise = practise;
			$scope.settings = Settings.getSettings($scope.teamId);
			//update buttons
			$scope.present = Attendance.checkAttendance($scope.practise.Present,User.getUID());
			$scope.absent = Attendance.checkAttendance($scope.practise.Absent,User.getUID());
			$scope.unknown = (!$scope.present && !$scope.absent);
			
			$scope.players = localStorageFactory.getPlayers();
			$scope.unknownPlayers = Attendance.checkUnknown($scope.practise.Present, $scope.practise.Absent, $scope.players);
		});
		
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

    .controller('Practises_EditCtrl', function ($scope, Practises, User, $stateParams,localStorageFactory, $ionicHistory) {
        $scope.practiseId = $stateParams.practiseId;

		$scope.teamId = localStorageFactory.getTeamId();
		$scope.getPractise = Practises.getPractise($scope.teamId).then(function (practise) {
			$scope.practiseDate = new Date(practise.date);
			$scope.title = "Selecteer datum";
			$scope.practiseTime = practise.time;
			$scope.practise = practise;
			$scope.location = practise.location;
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

	.controller('newPractisesCtrl', function($scope, User, Practises, localStorageFactory, $ionicHistory) {
		$scope.teamId = localStorageFactory.getTeamId();
		$scope.practiseDate = new Date();
		$scope.title = "Selecteer datum";
		$scope.practiseTime = 72000;
		$scope.weeks = 1;
		
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
	
	.controller('EventsCtrl', function ($scope, Events, User, $state, $ionicHistory, localStorageFactory, Utility) {
		// contyroller must be  made equal to GAMES!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		
		
		//
		
		
		//
		
		//
		$scope.ShowDelete = false;
		$scope.isAdmin = false;
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;

			//check if current user is Admin for this team
			$scope.events = Events.getEventsArray($scope.teamId);
			$scope.eventsRef = Events.getEventsRef($scope.teamId);
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

        $scope.getDetail = function(event) {
            console.log('detail');
			console.log(event);
            Events.setEvent(event);
            $state.go('app.event', { eventId: event });
        }
		
		$scope.addEvent = function(){
			$state.go('app.newEvent');
		}

        $scope.onItemDelete = function(item) {
            var strippedItem = angular.copy(item);
            Utility.deleteItem($scope.events, item, strippedItem);
            $scope.eventsRef.set($scope.events);
        };
		$scope.newEvent = function(location,repeatValue){
			if (typeof ($scope.date) === 'undefined' || typeof ($scope.time) === 'undefined'|| typeof (repeatValue) === 'undefined') {
				
			} else {		
				Events.createEvent($scope.teamId, $scope.date, $scope.time, location, repeatValue);
				//return to previous page
				$ionicHistory.goBack();
			}	
		}
        $scope.editEvent = function(event) {
            Events.setEvent(event.$id);
            $state.go('app.event_edit', { eventId: event.$id});
        }
		
    })

    .controller('Events_DetailCtrl', function ($scope, Events, User, Teams, Attendance, Settings, $stateParams) {
		$scope.eventId = $stateParams.eventId;
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			console.log(data);
			$scope.getEvent = Events.getEvent($scope.teamId).then(function(event){
				console.log(event);
				$scope.eventDate = new Date(event.date);
				$scope.event = event;
				$scope.settings = Settings.getSettings($scope.teamId);
				//update buttons
				$scope.present = Attendance.checkAttendance($scope.event.Present,User.getUID());
				$scope.absent = Attendance.checkAttendance($scope.event.Absent,User.getUID());
				$scope.unknown = (!$scope.present && !$scope.absent);
			}).then(function(){
				$scope.getPlayers = Teams.getPlayers($scope.teamId).then(function(players){
					$scope.players = players;
					$scope.unknownPlayers = Attendance.checkUnknown($scope.event.Present, $scope.event.Absent, $scope.players);
				});
			});
		})
		
		$scope.changeAttendance = function(type){
			switch(type){
			case "present":
				
				if($scope.present === true ){
					// already logged, no change needed
				}else{
					$scope.present = Attendance.addAttendance("present","Events",User.getUID(),$scope.eventId,$scope.teamId,$scope.event.Absent);
					$scope.absent = false;					
				}
			break;
			case "absent": 
				if($scope.absent === true ){
					// already logged, no change needed
				}else{
					$scope.absent = Attendance.addAttendance("absent","Events",User.getUID(),$scope.eventId,$scope.teamId,$scope.event.Present);
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
			$scope.unknownPlayers = Attendance.checkUnknown($scope.event.Present, $scope.event.Absent, $scope.players)
		}
    })

    .controller('Events_EditCtrl', function ($scope, Events, User, $stateParams,$ionicHistory) {
        $scope.eventId = $stateParams.eventId;

        $scope.getTeam = User.getTeam().then(function (data) {
            $scope.teamId = data;
            $scope.getEvent = Events.getEvent($scope.teamId).then(function (event) {
                $scope.eventDate = new Date(event.date);
                $scope.title = "Selecteer datum";
                $scope.eventTime = event.time;
                $scope.event = event;
                $scope.location = event.location;
            })
        })
        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                console.log('Date not selected');
            } else {
                console.log('Selected date is : ', val);
                $scope.eventDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                console.log('Time not selected');
            } else {
                console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.eventTime = val;
            }
        };

        $scope.updateEvent = function(location) {
            Events.updateEvent($scope.teamId, $scope.eventId, $scope.eventDate, $scope.eventTime, location);
            $ionicHistory.goBack();
        }
    })

	.controller('newEventsCtrl', function($scope, User, Events, $ionicHistory) {
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.eventDate = new Date();
			$scope.title = "Selecteer datum";
			$scope.eventTime = 72000;
			$scope.weeks = 1;
		});
		
		$scope.datePickerCallback = function (val) {
			if (typeof(val) === 'undefined') {
				console.log('Date not selected');
			} else {
				console.log('Selected date is : ', val);
				$scope.eventDate = val;
			}
		};

		$scope.timePickerCallback = function (val) {
			if (typeof (val) === 'undefined') {
				console.log('Time not selected');
			} else {
				console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
				$scope.eventTime = val;
			}
		};

		$scope.newEvent = function(location,repeatValue){
			if (typeof ($scope.eventDate) === 'undefined' || typeof ($scope.eventTime) === 'undefined'|| typeof (repeatValue) === 'undefined') {
				
			} else {		
				Events.createEvent($scope.teamId, $scope.eventDate, $scope.eventTime, location, repeatValue);
				//return to previous page
				$ionicHistory.goBack();
			}	
		}
	})
	
	.controller('FinanceCtrl', function ($scope, User, Teams, Finance, localStorageFactory, $state) {
		$scope.isAdmin = localStorageFactory.getAdmin();
		
        $scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			Teams.getPlayers($scope.teamId).then(function(teamPlayers){
				$scope.players = teamPlayers;
			});
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
	
	.controller('CreditsCtrl', function ($scope, Teams, localStorageFactory, User, Finance, $state,$ionicHistory) {

			$scope.teamId = localStorageFactory.getTeamId();
			$scope.nbsp = " "; // whitespace
            $scope.players = localStorageFactory.getPlayers();
				console.log( $scope.players );
		    $scope.newCredit = function(uid, value, comment){
			Finance.newCredit($scope.teamId, uid, value, comment);
			$ionicHistory.goBack();
		}
    })
	
	.controller('DutiesCtrl', function ($scope, Teams, Games,Practises, Settings, User, Duties, localStorageFactory) {

        $scope.currentDate = new Date();
        console.log($scope.currentDate);

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.settings = Settings.getSettings($scope.teamId);
        $scope.duties = Duties.getDuties($scope.teamId);
        //get Games
        $scope.games = Games.getGames($scope.teamId);
        // get Practices
        $scope.practises = Practises.getPractises($scope.teamId);
        // get Events
        //$scope.events = ;


        $scope.players = localStorageFactory.getPlayers();
		$scope.updateDuties = function(){
		
			var dutyPlayers = new Array();

            for(var key in $scope.players) {
                dutyPlayers.push(key);
            }
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
	
	.controller('SettingsCtrl', function ($scope, fireBaseData, User, Settings, localStorageFactory) {

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.settings = Settings.getSettings();
        $scope.isAdmin = localStorageFactory.getAdmin();
		
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
            console.log(key, value);
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
    })
	
	.controller('StatisticsCtrl', function ($scope, Statistics, localStorageFactory) {

        $scope.teamId = localStorageFactory.getTeamId();
		$scope.players = localStorageFactory.getPlayers();
		console.log($scope.players);
		Statistics.getRef().child($scope.teamId).once('value',function(statsSnap){
			for(player in $scope.players){ // reset all gameTime counters to 0
				$scope.players[player]['totGameTime'] = 0;
			}
			for(key in statsSnap.val()){ // walk trough each game
				var gameStats = statsSnap.val()[key];
				var maxGameTime = ((gameStats.firstHalfEnd - gameStats.firstHalfStart) + (gameStats.SecondHalfEnd - gameStats.SecondHalfStart))/60;
				//console.log(maxGameTime);
				for(player in gameStats.Basis){
					if(player.indexOf("external") == -1)
						$scope.players[player]['totGameTime'] += maxGameTime;  // initially add a fill length game to each basis player
				};
				//console.log($scope.players);
				for(change in gameStats.Changes){
					//first half  or second half?
					if(change.time < gameStats.firstHalfEnd){// first half
						console.log("change in first half");
					}
					if(change.time > gameStats.SecondHalfEnd){// second half
						console.log("change in Second half");
					}
					if(change.playerOut.indexOf("external") == -1){ // only calculate if  player is not external
						//calc time
					}
					if(change.playerIn.indexOf("external") == -1){ // only calculate if  player is not external
						// calc time
					}
				}
				
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
	
	function dynamicSort(property) {
		var sortOrder = 1;
		if(property[0] === "-") {
			sortOrder = -1;
			property = property.substr(1);
		}
		return function (a,b) {
			var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
			return result * sortOrder;
		}
	};
	
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


