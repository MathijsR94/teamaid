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
	
	
    .controller('PlayersCtrl', function ($scope, Teams, User, $state) {
		
        $scope.getTeam = User.getTeam().then(function(data) {
			
			$scope.teamId = data;
			
			Teams.getPlayers($scope.teamId).then(function(data){
				$scope.players = data;
			});
        });
		$scope.invitePlayer = function() {
			$state.go('app.invite');
		}
    })
	
	.controller('InvitesCtrl', function ($scope, fireBaseData, User,Teams,  Mail, $state,$ionicHistory) {
        $scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			
        });
		$scope.getTeamName = Teams.getTeamName().then(function(data) {
			$scope.teamName = data;
			
        });
		
		$scope.invite = function ( em ) {
		
			//var inviteRef = fireBaseData.ref().child("Teams").child($scope.teamId).child("PendingInvites");
			//var newInvite = {};
			
			//newInvite[removeSpecials(em)] = em;
			//inviteRef.update( newInvite );
			
			//alert("Implementeer : verstuur email nu XXX");

			Mail.mailInvite(em, $scope.teamId, $scope.teamName);
			
			$ionicHistory.goBack();
			
		}
    })

	.controller('GamesCtrl', function ($scope, Games, User, $state, $ionicHistory,fireBaseData, Utility, $stateParams) {
		$scope.ShowDelete = false;
		$scope.isAdmin = false;

		$scope.getTeam = User.getTeam().then(function(data) {
			console.log('start getTeam');
			$scope.teamId = data;

			//check if current user is Admin for this team
			$scope.games = Games.getGames($scope.teamId);
			$scope.gamesRef = Games.getGamesRef($scope.teamId);
			//console.log($scope.gamesRef);
			console.log('eind getTeam');
        }).then(function(){
			console.log('after getTeam');
			$scope.admin = User.isAdmin($scope.teamId).then(function(admins) {
				console.log('start admin');
				console.log(admins);
				admins.forEach(function(admin){
					console.log('foreach');
					if(admin.$id === User.getUID()){
						console.log('if Admin');
						$scope.isAdmin = true;
						console.log('isAdmin?: ' + $scope.isAdmin);
					}
					console.log($scope.isAdmin);
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
			$scope.gamesRef.set($scope.games);
		};

		$scope.editGame = function(item) {

		}
		$scope.getDetail = function(game) {
			Games.setGame(game.$id);
			$state.go('app.game', { gameId: game.$id});
		}
		$scope.selectGame = function(game) {
			Games.setGame(game.$id);
			$state.go('app.game_edit', { gameId: game.$id});
		}
		console.log($scope.isAdmin);
    })

	.controller('Games_DetailCtrl', function ($scope, Games, User, $stateParams) {
		$scope.gameId = $stateParams.gameId;
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.getGame = Games.getGame($scope.teamId).then(function(game) {
				$scope.game = game;
			});
		})


		//$http({
		//	method: 'GET', url: 'hotels/' + $scope.hotelId + '/albums/' + $scope.albumId + '.json'
		//}).success(function(data, status, headers, config){
		//	$scope.photos = data;
		//}).error(function(data, status, headers, config){
		//	$scope.status = status;
		//});
	})

	.controller('Games_EditCtrl', function ($scope, Games, User, $stateParams) {
		$scope.gameId = $stateParams.gameId;
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			$scope.getGame = Games.getGame($scope.teamId).then(function(game) {
				$scope.game = game;
			})
		})
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

					alert();
				}
			}
		})
	})
	.controller('PractisesCtrl', function ($scope, Practises, User, $state, $ionicHistory,fireBaseData) {
		
		$scope.shouldShowDelete = false;
		$scope.shouldShowReorder = false;
		$scope.listCanSwipe = true;
		$scope.currentDate = new Date();
		$scope.title = "Selecteer datum";
		$scope.slots = {epochTime: 73800, format: 24, step: 15};
		
		$scope.weeks = 0;
		$scope.drag = function(value) {
			$scope.weeks = value;
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
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			
			if(User.isAdmin($scope.teamId)){
				$scope.shouldShowDelete = true;
				$scope.shouldShowReorder = false;
			}
			
			Practises.getPractises($scope.teamId).then(function(data){
				$scope.practises = data;
			});
        })
		
		$scope.addPractise = function(){
			$state.go('app.newPractise');
		}
		
		$scope.newPractise = function(location,repeatValue){
			if (typeof ($scope.date) === 'undefined' || typeof ($scope.time) === 'undefined'|| typeof (repeatValue) === 'undefined') {
				
			} else {		
				Practises.createPractise($scope.teamId, $scope.date, $scope.time, location, repeatValue);
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
			Teams.getPlayers($scope.teamId).then(function(data){
				$scope.players = data;
			});
        });
		
		$scope.newCredit = function(uid, value, comment){
			console.log(uid);
			Finance.newCredit($scope.teamId, uid, value, comment);
			$ionicHistory.goBack();
		}
    })
	.controller('registerPlayerCtrl', function ($scope, Teams, User, Finance, $state,$ionicHistory) {
        
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


