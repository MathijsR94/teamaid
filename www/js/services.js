angular.module('starter.services', [])
    .factory('firebaseRef', function () {
        //var ref = new Firebase("https://teamaid.firebaseio.com/"); // live db
		var ref = new Firebase("https://amber-torch-2058.firebaseio.com/"); // test db
        var connectedRef = new Firebase("https://amber-torch-2058.firebaseio.com/.info/connected");
        return {
            ref: function () {
                return ref;
            },
            connectedRef: function () {
                return connectedRef;
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
            },
			changePassword: function(email, oldPW,newPW){
				ref.changePassword({
				email: email,
				oldPassword: oldPW,
				newPassword: newPW
				}, function(error) {
						if (error) {
							switch (error.code) {
							  case "INVALID_PASSWORD":
								console.log("The specified user account password is incorrect.");
								break;
							  case "INVALID_USER":
								console.log("The specified user account does not exist.");
								break;
							  default:
								console.log("Error changing password:", error);
							}
						}
						else{
							alert("succes!");
							console.log("User password changed successfully!");
						}
					}
				)
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
			getEmail: function () {
                return accountData.email;
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
                var players = $firebaseObject(teamsRef.child(teamId).child("Players"));
                players.$loaded(function () {
                    deferred.resolve(players);
                });
                return deferred.promise;
            },
			getPlayersArray: function(teamId) {
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
				return $firebaseObject(gamesRef.child(teamId));
			},
			getGamesArray: function(teamId) {
                var deferred = $q.defer();
                var games = $firebaseArray(gamesRef.child(teamId));
                games.$loaded(function () {
                    deferred.resolve(games);
                });
                return deferred.promise;
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
			}
		}
		
    })
	.factory('Practises', function ($firebaseArray,$firebaseObject, firebaseRef, $q) {
		var ref = firebaseRef.ref();
		var practisesRef = ref.child("Practises");
		var selectedPractise = localStorage.getItem("selectedPractise");

		return {
			getPractisesRef: function(teamId) {
				return practisesRef.child(teamId);
			},
			getPractises: function(teamId) {
				return $firebaseObject(practisesRef.child(teamId));
			},
			getPractisesArray: function(teamId) {
				return $firebaseArray(practisesRef.child(teamId));
			},
			getPractise: function(teamId) {
				var deferred = $q.defer();
				var practises = $firebaseArray(practisesRef.child(teamId));
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
				var teamPractiseRef = practisesRef.child(teamId);
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
				var practisesRef = practisesRef.child(teamId).child(practiseId);
				practisesRef.update({
					date : date.toString(),
					time : time,
					location : location
				});
            }
			
		}
		
    })
	.factory('Events', function ($firebaseArray,$firebaseObject, firebaseRef, $q) {
		var ref = firebaseRef.ref();
		var eventsRef = ref.child("Events");
		var selectedEvent = localStorage.getItem("selectedEvent");

		return {
			getEventsRef: function(teamId) {
				return eventsRef.child(teamId);
			},
			getEvents: function(teamId) {
				return $firebaseObject(eventsRef.child(teamId));
			},
			getEventsArray: function(teamId) {
				return $firebaseArray(eventsRef.child(teamId));
			},
			getEvent: function(teamId) {
				var deferred = $q.defer();
				var events = $firebaseArray(eventsRef.child(teamId));
                events.$loaded(function(){
					deferred.resolve(events.$getRecord(selectedEvent));
				});
				return deferred.promise;
			},
			setEvent: function(eventId) {
				localStorage.setItem("selectedEvent", eventId);
				selectedEvent = eventId;
			},
			createEvent: function(teamId, date, time, location){
				var teamEventRef = eventsRef.child(teamId);
				var events = $firebaseArray(teamEventRef);
				events.$add({
					date : date.toString(),
					time : time,
					location : location
				});							
			},
			updateEvent: function(teamId, eventId, date, time, location){
                console.log(teamId);
				var eventsRef = eventsRef.child(teamId).child(eventId);
				eventsRef.update({
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
	.factory('Attendance', function(firebaseRef){
		var ref = firebaseRef.ref();
		
		return{
			checkUnknown: function(present, absent, players) {
				var unknown = new Array();
				var dummy = [{"XidX": " "}];
				if(typeof present === "undefined")
					present = dummy;
				if(typeof absent === "undefined")
					absent = dummy;	
				//console.log(players);	
                players.forEach(function(value,key) {
					//console.log(key);
                    if(!(key in present) && !(key in absent)) {
                        unknown.push(value);
                    }
                });
                return unknown;
            },
			checkAttendance: function(attendanceArray , uid) {
				if(typeof attendanceArray === "undefined"){
					return false; // no defined array found
				}else{
					//console.log(attendanceArray);
					//console.log(attendancePresent);
					return(uid in attendanceArray);
				}
			},
			addAttendance: function(type , source, uid, gameId, teamId, removalArray ) {		
				switch(type){
				case "present": 
					var player= {};
					player[uid] = true;
					if(this.checkAttendance(removalArray, uid)){
						// remove from absent, because it is still listed there
						delete removalArray[uid];
						ref.child(source).child(teamId).child(gameId).child("Absent").set(removalArray);	
					}
					ref.child(source).child(teamId).child(gameId).child("Present").update(player);
					return true;
				break;
				case "absent": 
					var player= {};
					player[uid] = true;
					if(this.checkAttendance(removalArray, uid)){
						// remove from present, because it is still listed there
						delete removalArray[uid]
						ref.child(source).child(teamId).child(gameId).child("Present").set(removalArray);	
					}
					ref.child(source).child(teamId).child(gameId).child("Absent").update(player);
					return true;
				break;
				default:
					return 0;
				break;
				}
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
	
	.factory('Settings', function(firebaseRef,$firebaseObject, $q){
		var ref = firebaseRef.ref();
		return {
			getSettings: function(teamId){
				return $firebaseObject(ref.child("Teams").child(teamId).child("Settings"));
			},
			updateSetting: function(key,value,teamId){
				var setting = {};
				setting[key] = value;
				ref.child("Teams").child(teamId).child("Settings").update(setting);
			}
		};
	})
	.factory('Statistics', function(firebaseRef,$firebaseObject, $firebaseArray, $q){
		var statsRef = firebaseRef.ref().child("Statistics");
		return {
			getStatistics: function(teamId, gameId){
			var deferred = $q.defer();
				var stats = $firebaseObject(statsRef.child(teamId).child(gameId));
				stats.$loaded(function () {
					deferred.resolve(stats);
				});
				return deferred.promise;
			},
			initialize: function(teamId,gameId,gameTime){
				var stats = {
					firstHalfStart : gameTime,
					firstHalfEnd : gameTime + (45*60),
					secondHalfStart : gameTime + (60*60),
					secondHalfEnd : gameTime + (105*60)
				};
				statsRef.child(teamId).child(gameId).set(stats);
				return stats;
			},
			updateActualTeam: function(actualPlayers){
				var newActual= {};
				for(key in actualPlayers){
					newActual[actualPlayers[key]] = key;
				};
				return newActual;

			},
			updateBasis: function(teamId,gameId,basisTeam,tactic,externals){
				statsRef.child(teamId).child(gameId).update({ 
					Basis : basisTeam,
					tactic : tactic,
					externalPlayers : externals
				});
				
			},
			newChange: function(teamId, gameId, playerIn, playerOut, pos, time, comment){
				var changes = $firebaseArray(statsRef.child(teamId).child(gameId).child("Changes"));
				changes.$add({
					time : time,
					type : "In/Out",
					playerIn : playerIn,
					playerOut : playerOut,
					position : pos,
					comment : comment
				});
			},
			newPosChange: function(teamId, gameId, player1, player2, pos1, pos2, time, comment){
				var posChanges = $firebaseArray(statsRef.child(teamId).child(gameId).child("Changes"));
				posChanges.$add({
					time : time,
					type : "Position",
					player1 : player1,
					player2 : player2,
					position1 : pos1,
					position2 : pos2,
					comment : comment
				});
			},
			newGoal: function(teamId, gameId, ours, player, time, comment){
				if(ours === true){
					var ourGoals = $firebaseArray(statsRef.child(teamId).child(gameId).child("OurGoals"));
					ourGoals.$add({
						player : player,
						time : time,
						comment : comment
					});
				}
				else{
					var theirGoals = $firebaseArray(statsRef.child(teamId).child(gameId).child("TheirGoals"));
					theirGoals.$add({
						time : time,
						comment : comment
					});
				}
			},
			newCard: function(teamId, gameId, type, player, time, comment){
			
				var cards = $firebaseArray(statsRef.child(teamId).child(gameId).child("Cards"));
				cards.$add({
					type : type,
					player : player,
					time : time,
					comment : comment
				});

			}
		};
	})
	.factory('Duties', function(firebaseRef,$firebaseObject, $q){
		var ref = firebaseRef.ref();
		var dutyRef = ref.child("Duties");
		return {
			getDuties: function(teamId) {
				return $firebaseObject(dutyRef.child(teamId));
			},
			addDuty: function(teamId, key,startValue,endValue,dutyObj) {
				dutyRef.child(teamId).child(key).set({
					start : startValue.toString(),
					end : endValue.toString(),
					Duty : dutyObj
				});
				//console.log("add Duty");
			},
			updateDuty: function(teamId, key,dutyObj) {
				
				dutyRef.child(teamId).child(key).child("Duty").set(dutyObj);
				//console.log("update Duty");
			},
			removeDuty: function(teamId, key) {
				
				dutyRef.child(teamId).child(key).remove();
				//console.log("update Duty");
			},
			linkEvents: function(teamId, events, duty){
				Object.keys(events).forEach(function(type){
					//onsole.log(type);
					var typeRef = ref.child(type).child(teamId);
					//console.log(typeRef);
					switch(type){
					case "Games":
						//console.log(events.Games);
						Object.keys(events.Games).forEach(function(event){
							typeRef.child(event).child("Duty").set(duty);
						});
					break;
					case "Practises":
						Object.keys(events.Practises).forEach(function(event){
							typeRef.child(event).child("Duty").set(duty);
						});
					break;
					case "Events":
						Object.keys(events.Events).forEach(function(event){
							typeRef.child(event).child("Duty").set(duty);
						});
					break;
					}
					
				});
			
			},
			unlinkEvents: function(teamId, events){
				Object.keys(events).forEach(function(type){
					//console.log(events);
					var typeRef = ref.child(type).child(teamId);
					switch(type){
					case "Games":
						//console.log(events.Games);
						Object.keys(events.Games).forEach(function(event){
							typeRef.child(event).child("Duty").remove();
						});
					break;
					case "Practices":
						Object.keys(events.Practises).forEach(function(event){
							typeRef.child(event).child("Duty").remove();
						});
					break;
					case "Events":
						Object.keys(events.Events).forEach(function(event){
							typeRef.child(event).child("Duty").remove();
						});
					break;
					}
					
				});
			
			},
			checkForEvents: function(teamEvents,occurence){
				var result = {};
				teamEvents.forEach(function(event,id){
					var eventDate = new Date(event.date);
					if( eventDate > occurence.start && eventDate <= occurence.end){
						result[id] = true;
					}
				});
				//console.log(result);
				return result;
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
			deleteItemObj: function (object, item) {
				var mainObject = object
                if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                    delete mainObject[item];
                    return mainObject;
                }

            },
            editItem: function(item) {

            }
        }
    })

    .factory('localStorage', function () {
        return {
            setTeams: function(teams) {
                localStorage.setItem('teams', JSON.stringify(teams));
            },
            setPlayers: function(players) {
                localStorage.setItem('players', JSON.stringify(players));
            },
            setSettings: function(settings) {
                localStorage.setItem('settings', JSON.stringify(settings));
            },
            setAdmin: function(admins, uid) {
                for(var key in admins) {
                    console.log(uid);
                    if(key === uid)
                        localStorage.setItem('admin', true);
                    else
                        localStorage.setItem('admin', false);
                }
            },
            setGames: function(games) {
                localStorage.setItem('games', JSON.stringify(games));
            },
            getTeamId: function() {
                var test = JSON.parse(localStorage.getItem('teams'));
                for(var key in test)
                    return key;
            },
            getPlayers: function() {
                return JSON.parse(localStorage.getItem('players'));
            },
            getSettings: function() {
                return JSON.parse(localStorage.getItem('settings'));
            },
            getAdmin: function() {
                return localStorage.getItem('admin');
            },
            getGames: function() {
                return JSON.parse(localStorage.getItem('games'));
            }

        }
    })
		
