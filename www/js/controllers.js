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
        $scope.createTeam = function (teamName, firstName, lastName, insertion, em, pwd) {
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
	
	.controller('InvitesCtrl', function ($scope, fireBaseData, User, $state,$ionicHistory) {
        $scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
        });
		
		$scope.invite = function ( em ) {
			var inviteRef = fireBaseData.ref().child("Teams").child($scope.teamId).child("PendingInvites");
			var newInvite = {};
			
			newInvite[removeSpecials(em)] = em;
			inviteRef.update( newInvite );
			
			alert("Implementeer : verstuur email nu XXX");
			
			$ionicHistory.goBack();
			
		}
    })

	.controller('GamesCtrl', function ($scope, Games, User, $state, $ionicHistory,fireBaseData) {
		$scope.ShowDelete = true;
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			
			//werkt nog niet
			if(User.isAdmin($scope.teamId)){
				
				$scope.ShowDelete = true;
			}

			Games.getGames($scope.teamId).orderByChild("date").on("value",function(dataX){
				console.log(dataX.val());
				$scope.games = dataX.val();
			});
        });
		
		
		$scope.currentDate = new Date();
		$scope.title = "Selecteer datum";
		$scope.slots = {epochTime: 52200, format: 24, step: 15};

		$scope.datePickerCallback = function (val) {
			if(typeof(val)==='undefined'){      
				console.log('Date not selected');
			}else{
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
		
		$scope.addGame = function(){
			$state.go('app.newGame');
		}
		
		$scope.newGame = function (home, away){
			if (typeof ($scope.gameDate) === 'undefined' || typeof ($scope.gameTime) === 'undefined') {
				
		  } else {
			Games.createGame($scope.teamId, $scope.gameDate, $scope.gameTime, home, away);
			$ionicHistory.goBack();
		  }
		};
		
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
