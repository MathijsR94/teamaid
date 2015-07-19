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
			var inviteRef = fireBaseData.ref().child("Teams").child("PendingInvites");
			var newInvite = {};
			
			newInvite[removeSpecials(em)] = em;
			inviteRef.update( newInvite );
			
			alert("Implementeer : verstuur email nu XXX");
			
			$ionicHistory.goBack();
			
		}
    })

	.controller('GamesCtrl', function ($scope, Games, Teams, User, $state, $ionicHistory,fireBaseData) {
		
		$scope.shouldShowDelete = false;
		$scope.shouldShowReorder = false;
		$scope.listCanSwipe = true;
		
		$scope.getTeam = User.getTeam().then(function(data) {
			$scope.teamId = data;
			
			if(User.isAdmin($scope.teamId)){
				$scope.shouldShowDelete = true;
				$scope.shouldShowReorder = false;
			}
			
			//var gamesRef = fireBaseData.ref().child("Games").child($scope.teamId);
			//
			//$scope.games= {};
			//var count = 0;
			//gamesRef.once("value",function(gamesList){
			//	//create array
			//});
			
			//console.log($scope.games);

			Games.getGames($scope.teamId).then(function(data){
				$scope.games = data;
			});
        });
		
		$scope.addGame = function(){
			$state.go('app.newGame');
		}
		
		$scope.newGame = function (date, time, home, away){
			Games.createGame($scope.teamId, date, time, home, away);
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
