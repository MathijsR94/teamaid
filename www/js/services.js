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
				
				// var adminRef = ref.child("Admins").child(teamId).child(user.uid);
				// adminRef.once("value", function(data){
					
					// return 1;
				// });
				return 1;
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
		var selectedGame = localStorage.getItem("selectedGame");

		return {
			getGamesRef: function(teamId) {
				return gamesRef.child(teamId);
			},
			getGames: function(teamId) {
				return $firebaseArray(gamesRef.child(teamId));
				//var deferred = $q.defer();
				//var games = $firebaseArray(gamesRef.child(teamId));
//
				//games.$loaded(function () {
				//	deferred.resolve(games);
				//});
				//return deferred.promise;
			},
            getGame: function(teamId) {
                var deferred = $q.defer();
                var games = $firebaseArray(gamesRef.child(teamId));
                games.$loaded(function(){
                    deferred.resolve(games.$getRecord(selectedGame));
                    console.log(games.$getRecord(selectedGame));
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
			},
			setGame: function(gameId) {
				selectedGame = gameId;
				localStorage.setItem("selectedGame", gameId);
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
				var practises = $firebaseArray(teamPractiseRef);
				for (i = 0; i < repeat; i++) {					
					practises.$add({
						date : date.toString(),
						time : time,
						location : location
					});	
					// increase a week
					date.setDate(date.getDate() + (7));
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
	.factory('Finance', function ($firebaseArray, firebaseRef, $q) {
		var financeRef = firebaseRef.ref().child("Finance");
		
		return{
			getCredits: function(teamId) {
				var deferred = $q.defer();
				var credits = $firebaseArray(financeRef.child(teamId));

				credits.$loaded(function () {
					deferred.resolve(credits);
				});
				return deferred.promise;
			},
			newCredit: function( teamId, uid, value, comment ) {
				var balance = 0;
				var playerRef = financeRef.child(teamId).child(uid);
				var credits = $firebaseArray(playerRef.child("credits"));
				
				// read old balance
				playerRef.once('value', function(dataSnapshot) {
					if(dataSnapshot.val() !== null){
						balance =dataSnapshot.val().balance;
					}
					else{ // this user is new to credits lets instantiate
						// get his name
						firebaseRef.child("Users").child(uid).once(function(data) {
							if(data.val() !== null){
								playerRef.update({
									firstName: data.val().firstName,
									insertion: data.val().insertion,
									lastname:data.val().lastName,
									balance: 0
								});
							}
						})
					}
				});
				// write back new balance
				playerRef.update({
					balance: ((+balance) + (+value))
				});
				
				// add credit to the list
				var timestamp = new Date();
				credits.$add({
					timestamp : timestamp.toString(),
					value : value,
					comment : comment
				});	
            }
		}
	})

.factory('Mail', function($http){
		return {
		mailInvite: function(tomail, teamId, teamName){
			var data = {
				Tomail: tomail,
				teamId: teamId,
				teamName: teamName
			};

			$http({
				method : 'POST',
				url : 'php/invite-mailer.php',
				data : data,
				headers : { 'Content-Type': 'application/x-www-form-urlencoded', 'Access-Control-Allow-Origin' : true },
				contentType: "application/json; charset=utf-8",
				dataType: "json"
			}).success(function(data, status, headers, config) {
				return true;
			}).error(function(data, status, headers, config) {
				return false;
			});
		}
		};
	})

	.factory('Utility', function(){
		return {
			deleteItem: function(array, index) {
					//var array = array;
					//array.splice(array.indexOf(index), 1);
				console.log(array);
			}
		}
	})
		