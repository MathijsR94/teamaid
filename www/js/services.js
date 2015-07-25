angular.module('starter.services', [])
    .factory('firebaseRef', function () {
        var ref = new Firebase("https://amber-torch-2058.firebaseio.com/");
        return {
            ref: function () {
                return ref;
            }
        }
    })

    .factory('fireBaseData', function (firebaseRef) {
        var ref = firebaseRef.ref();
        return {
            ref: function () {
                return ref;
            },
            user: function () {
                return ref.getAuth();
            },
            logout: function () {
                ref.unauth()
            },
            resetPassword: function (email) {
                ref.resetPassword({
                    email: email
                }, function (error) {
                    if (error) {
                        switch (error.code) {
                            case "INVALID_USER":
                                alert("The specified user account does not exist.");
                                break;
                            default:
                                alert("Error resetting password:", error);
                        }
                    }
                    else {
                        alert("Password reset email sent successfully!");
                    }
                });
            }
        }
    })

    .factory('User', function ($firebaseObject, $firebaseArray, $q, $timeout, firebaseRef) {
        var ref = firebaseRef.ref();
        var user = ref.getAuth();
        var accountData =  $firebaseObject(ref.child("Users").child(user.uid));
        var userTeamsRef = ref.child("Users").child(user.uid).child("Teams");
        return {
            all: function () {
                return accountData;
            },

            getTeam: function() {
                var teamId = $firebaseArray(userTeamsRef);
                var deferred = $q.defer();
                teamId.$loaded(function () {
                    deferred.resolve(teamId[0].$id);
                });
                return deferred.promise;
            },

			isAdmin: function(teamId){
				
				var adminRef = ref.child("Admins").child(teamId).child(user.uid);
				adminRef.once("value", function(data){
					return data.val();
				});
			},
            getAccountData: function() {
                return accountData;
            }
        }
    })

    .factory('Teams', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var teamsRef = ref.child("Teams");
        var usersRef = ref.child("Users");
        var user = ref.getAuth();
        var teams = $firebaseArray(ref.child("Teams"));


        return {
            ref: function() {
                return teamsRef;
            },

            addTeam: function(teamName) {
				teams.$add({
                    teamName: teamName
                });
                var deferred = $q.defer();
                teams.$loaded(function () {
                    deferred.resolve(teams[teams.length -1]);
                });
                return deferred.promise;
            },
			linkPlayer: function(teamId, firstName, ins, lastName, uid) {
				var playersRef = teamsRef.child(teamId).child("Players").child(uid);
				playersRef.update({
                        firstName: firstName,
                        insertion: ins,
                        lastName: lastName
                });
			},
            getPlayers: function(teamId) {
				var deferred = $q.defer();
                var players = $firebaseArray(teamsRef.child(teamId).child("Players"));
                players.$loaded(function () {
                    deferred.resolve(players);
                });
                return deferred.promise;
            }
        }
    })
	
	.factory('Admins', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var adminsRef = ref.child("Admins");
		
        var admins = $firebaseArray(ref.child("Admins"));
		

        return {
            ref: function() {
                return adminsRef;
            },
			linkAdmin: function(teamId,uid) {
				var teamAdminsRef = adminsRef.child(teamId);
				var admin={};
				admin[uid] = true;
				teamAdminsRef.update(admin);
			}
        }
    })
	
	.factory('Games', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
		var gamesRef = ref.child("Games");
		
		return {
			getGames: function(teamId) {
				var deferred = $q.defer();
				var games = $firebaseArray(gamesRef.child(teamId));

				games.$loaded(function () {
					deferred.resolve(games);
				});
				return deferred.promise;
			},
			createGame: function(teamId, gameDate, gameTime, home, away){
				var teamGamesRef = gamesRef.child(teamId);
				var games = $firebaseArray(teamGamesRef);

				games.$add({
					date : gameDate.toString(),
					time : gameTime,
					home : home,
					away : away
				});			
			},
			updateGame: function(teamId,gameId, date, hr, min, home, away){
				var gameRef = gamesRef.child(teamId).child(gameId);
				gameRef.update({
					date : date.toString(),
					time : hr + ":" + min,
					home : home,
					away : away
				});
			}
			
		}
		
    })
	.factory('Practises', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
		var practiseRef = ref.child("Practises");
		
		return {
			getPractises: function(teamId) {
				var deferred = $q.defer();
				var practises = $firebaseArray(practiseRef.child(teamId));

				practises.$loaded(function () {
					deferred.resolve(practises);
				});
				return deferred.promise;
			},
			createPractise: function(teamId, date, time, location,repeat){
				var teamPractiseRef = practiseRef.child(teamId);
				console.log(date);
				console.log(time);
				console.log(location);
				console.log(repeat);
				var practises = $firebaseArray(teamPractiseRef);
				for (i = 0; i < repeat; i++) {
					date.setDate(date.getDate() + (7));
					console.log(date);					
					practises.$add({
						date : date.toString(),
						time : time,
						location : location,
					});	
				};					
			},
			updatePractise: function(teamId,practiseId, date, time, home, away){
				var practiseRef = PractiseRef.child(teamId).child(practiseId);
				practiseRef.update({
					date : date.toString(),
					time : time,
					home : home,
					away : away
				});
			}
			
		}
		
    })
	.factory('Boetes', function ($firebaseArray, firebaseRef, $q) {
		var boeteRef = fireBaseData.ref().child("Boetes");
			
        var ref = firebaseRef.ref();
        var adminsRef = ref.child("Admins");
		
        var admins = $firebaseArray(ref.child("Admins"));
		

        return {
            ref: function() {
                return boeteRef;
            },
			addBoete: function(value, type ,uid, teamId) {
				var currentRef = boeteRef.child($scope.teamId).child(uid);
				var boetes = $firebaseArray(currentRef);
				
				boetes.$add({
					type : type,
					value : value,
					timestamp : Firebase.ServerValue.TIMESTAMP
				});
				
				
				newInvite[Firebase.ServerValue.TIMESTAMP] = em;
				inviteRef.update( newInvite );
				
				alert("Implementeer : verstuur email nu XXX");
				
				$ionicHistory.goBack();
			}
        }
	})
		