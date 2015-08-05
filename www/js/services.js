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
			getUID: function () {
                return user.uid;
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
				
				var admins = $firebaseArray(ref.child("Admins").child(teamId));
				//ref.child("Admins").child(teamId).once("value",function(snap){
				//	var admins = snap;
				//});
				
				var deferred = $q.defer();
				
				admins.$loaded(function () {
                    deferred.resolve(admins);
                });
                return deferred.promise;			
			},
            getAccountData: function() {
                return accountData;
            }
        }
    })

    .factory('Teams', function ($firebaseArray, $firebaseObject, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var teamsRef = ref.child("Teams");
        var usersRef = ref.child("Users");
        var user = ref.getAuth();
        var teams = $firebaseArray(ref.child("Teams"));


        return {
            ref: function() {
                return teamsRef;
            },
			getTeamName: function(teamId) {
			//console.log(teamId);
                var deferred = $q.defer();
                var team = $firebaseObject(teamsRef.child(teamId));
                team.$loaded(function () {
                    deferred.resolve(team.teamName);
					//console.log(team);
                });
                return deferred.promise;
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
	
	.factory('Games', function ($firebaseArray, $firebaseObject, firebaseRef, $q) {
        var ref = firebaseRef.ref();
		var gamesRef = ref.child("Games");
		var selectedGame = localStorage.getItem("selectedGame");


		return {
			getGamesRef: function(teamId) {
				return gamesRef.child(teamId);
			},
			getGames: function(teamId) {
				return $firebaseArray(gamesRef.child(teamId));
			},
            getGame: function(teamId) {
                var deferred = $q.defer();
                var games = $firebaseArray(gamesRef.child(teamId));
                games.$loaded(function(){
                    deferred.resolve(games.$getRecord(selectedGame));
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
			updateGame: function(teamId, gameId, date, time, home, away){
				var gameRef = gamesRef.child(teamId).child(gameId);
				gameRef.update({
					date : date.toString(),
					time : time,
					home : home,
					away : away
				});
			},
			setGame: function(gameId) {
                localStorage.setItem("selectedGame", gameId);
				selectedGame = gameId;
			},
            checkUnknown: function(present, absent, players) {
                players.forEach(function(player) {
                    if(!(player.$id in present) || !(player.$id in absent)) {
                        players.push(player);
                    }
                });
                return players;
            },
			checkAttendance: function(type , uid, gameId, teamId ) {
                switch(type){
				case "present": 
					var attendancePresent = $firebaseObject(gamesRef.child(teamId).child(gameId).child("Present"));
					return(uid in attendancePresent);
				break;
				case "absent": 
					var attendanceAbsent = $firebaseObject(gamesRef.child(teamId).child(gameId).child("Absent"));
					return(uid in attendanceAbsent);
				break;
				default:
					return 0;
				break;
				}
			},
			addAttendance: function(type , uid, gameId, teamId ) {
                switch(type){
				case "present": 
					var player= {};
					player[uid] = true;
					if(checkAttendance("absent" , uid, gameId, teamId)){
						// remove  from absent 
					}
					gamesRef.child(teamId).child(gameId).child("Present").update(player);
					
				break;
				case "absent": 
					var player= {};
					player[uid] = true;
					if(checkAttendance("present" , uid, gameId, teamId)){
						// remove  from present 
					}
					gamesRef.child(teamId).child(gameId).child("Absent").update(player);
				break;
				default:
					return 0;
				break;
				}
			}
		}
		
    })
	.factory('Practises', function ($firebaseArray, firebaseRef, $q) {
		var ref = firebaseRef.ref();
		var practisesRef = ref.child("Practises");
		var selectedPractise = localStorage.getItem("selectedPractise");

		return {
			getPractisesRef: function(teamId) {
				return practisesRef.child(teamId);
			},
			getPractises: function(teamId) {
				return $firebaseArray(practisesRef.child(teamId));
			},
			getPractise: function(practiseId) {
				var deferred = $q.defer();
				var practises = $firebaseArray(practisesRef.child(practiseId));
                practises.$loaded(function(){
					deferred.resolve(practises.$getRecord(selectedPractise));
				});
				return deferred.promise;
			},
			setPractise: function(practiseId) {
				localStorage.setItem("selectedPractise", practiseId);
				selectedPractise = practiseId;
			},
			createPractise: function(teamId, date, time, location, repeat){
				var teamPractiseRef = practiseRef.child(teamId);
				var practises = $firebaseArray(teamPractiseRef);
				for (var i = 0; i < repeat; i++) {
					practises.$add({
						date : date.toString(),
						time : time,
						location : location
					});	
					// increase a week
					date.setDate(date.getDate() + (7));
				};					
			},
			updatePractise: function(teamId, practiseId, date, time, location){
                console.log(teamId);
				var practiseRef = practisesRef.child(teamId).child(practiseId);
				practiseRef.update({
					date : date.toString(),
					time : time,
					location : location
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

    .factory('Utility', function () {
        return {
            deleteItem: function (array, item, strippedItem) {
                console.log(item);
                console.log(strippedItem);
                var array = array;
                if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                    array.$remove(item);
                    return array;
                }

            },
            editItem: function(item) {

            }
        }
    })
		
