angular.module('starter.services', [])
    .factory('firebaseRef', function () {
        var ref = new Firebase("https://teamaid.firebaseio.com/"); // live db
		// var ref = new Firebase("https://amber-torch-2058.firebaseio.com/"); // test db
		var connectedRef = new Firebase("https://teamaid.firebaseio.com/.info/connected"); // live db
        // var connectedRef = new Firebase("https://amber-torch-2058.firebaseio.com/.info/connected");
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
            },
            getName: function() {
                var deferred = $q.defer();
                accountData.$loaded(function () {
                    deferred.resolve(accountData);
                });
                return deferred.promise;
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
            },
			activatePlayer: function(teamId, uid){
				teamsRef.child(teamId).child("InActive").child(uid).once('value', function(data){
					teamsRef.child(teamId).child("Players").child(uid).update(data.val());
					teamsRef.child(teamId).child("InActive").child(uid).remove();
				});
			},
			deactivatePlayer: function(teamId, uid){
				teamsRef.child(teamId).child("Players").child(uid).once('value', function(data){
					teamsRef.child(teamId).child("InActive").child(uid).update(data.val());
					teamsRef.child(teamId).child("Players").child(uid).remove();
				});				
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
                var game = $firebaseObject(gamesRef.child(teamId).child(selectedGame));
                game.$loaded(function(){
                    deferred.resolve(game);
                });
                return deferred.promise;
            },
			createGame: function(teamId, gameDate, gameTime,collectTime, home, away){
				var teamGamesRef = gamesRef.child(teamId);
				var games = $firebaseArray(teamGamesRef);

				games.$add({
					date : Date.parse(gameDate),
					time : gameTime,
					collect : collectTime,
					home : home,
					away : away
				});			
			},
			updateGame: function(teamId, gameId, date, time,collectTime, home, away){
				gamesRef.child(teamId).child(gameId).update({
					date : Date.parse(date),
					time : time,
					collect: collectTime,
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
                var deferred = $q.defer();
                var practises = $firebaseArray(practisesRef.child(teamId));
                practises.$loaded(function () {
                    deferred.resolve(practises);
                });
                return deferred.promise;
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
						date : Date.parse(date),
						time : time,
						location : location
					});	
					// increase a week
					date.setDate(date.getDate() + (7));
					//console.log(date);
				};					
			},
			updatePractise: function(teamId, practiseId, date, time, location){
                //console.log(teamId);
				
				practisesRef.child(teamId).child(practiseId).update({
					date : Date.parse(date),
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
                var deferred = $q.defer();
                var events = $firebaseArray(eventsRef.child(teamId));
                events.$loaded(function () {
                    deferred.resolve(events);
                });
                return deferred.promise;
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
					date : Date.parse(date),
					time : time,
					location : location
				});		
			},
			updateEvent: function(teamId, eventId, date, time, location){
                //console.log(teamId);
				
				eventsRef.child(teamId).child(eventId).update({
					date : Date.parse(date),
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
			newCredit: function( teamId, uid, value, comment, player ) {
				var balance = 0;
				var playerRef = financeRef.child(teamId).child(uid);
				var credits = $firebaseArray(playerRef.child("credits"));
				
				// read old balance
				playerRef.once('value', function(dataSnapshot) {
					if(dataSnapshot.val() !== null){
						balance =dataSnapshot.val().balance;
						// write back new balance
						playerRef.update({
							balance: ((+balance) + (+value))
						});
					}
					else{ // this user is new to credits lets instantiate
						// get his name
						playerRef.update({
							firstName: player.firstName,
							insertion: player.insertion,
							lastname: player.lastName,
							balance: (0 + (+value))
						});
					}
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
				var unknown = {};//new Array();
				var dummy = {};
				if(typeof present === "undefined")
					present = dummy;
				if(typeof absent === "undefined")
					absent = dummy;	
				
				for(key in players){
                    if(!(key in present) && !(key in absent)) {
                        //unknown.push(players[key]);
						unknown[key] = players[key];
                    }
                };
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
			addAttendance: function(type , source, uid, gameId, teamId, removalArray) {		
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
			},
			resetAttendance: function(source, uid, gameId, teamId, present, absent) {		
				var player= {};
				player[uid] = true;
				if(this.checkAttendance(present, uid)){
					// remove from absent, because it is still listed there
					delete present[uid];
					ref.child(source).child(teamId).child(gameId).child("Present").set(present);	
				}
				if(this.checkAttendance(absent, uid)){
					// remove from present, because it is still listed there
					delete absent[uid]
					ref.child(source).child(teamId).child(gameId).child("Absent").set(absent);	
				}
				return;
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
		var settingsRef = firebaseRef.ref().child("Teams");
		return {
			getSettings: function(teamId){
				return $firebaseObject(settingsRef.child(teamId).child("Settings"));
			},
			getRef: function(){
				return settingsRef;
			},
			updateSetting: function(key,value,teamId){
				var setting = {};
				setting[key] = value;
				settingsRef.child(teamId).child("Settings").update(setting);
			},
		};
	})
	.factory('Statistics', function(firebaseRef,$firebaseObject, $firebaseArray, $q){
		var statsRef = firebaseRef.ref().child("Statistics");
		return {
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
			updateBasis: function(teamId,gameId,basisTeam,tactic){
				statsRef.child(teamId).child(gameId).update({ 
					Basis : basisTeam,
					tactic : tactic
				});
				
			},
			newChange: function(teamId, gameId, playerIn, playerOut, pos, time, comment){
				var changes = $firebaseArray(statsRef.child(teamId).child(gameId).child("GameLog"));
				changes.$add({
					time : time,
					type : "In/Out",
					statsType: "Changes",
					playerIn : playerIn,
					playerOut : playerOut,
					position : pos,
					comment : comment
				});
			},
			newPosChange: function(teamId, gameId, player1, player2, pos1, pos2, time, comment){
				var posChanges = $firebaseArray(statsRef.child(teamId).child(gameId).child("GameLog"));
				posChanges.$add({
					time : time,
					type : "Position",
					statsType: "Changes",
					player1 : player1,
					player2 : player2,
					position1 : pos1,
					position2 : pos2,
					comment : comment
				});
			},
			newGoal: function(teamId, gameId, ours, player, time, comment){
				if(ours === true){
					var ourGoals = $firebaseArray(statsRef.child(teamId).child(gameId).child("GameLog"));
					ourGoals.$add({
						player : player,
						statsType: "OurGoals",
						time : time,
						comment : comment
					});
				}
				else{
					var theirGoals = $firebaseArray(statsRef.child(teamId).child(gameId).child("GameLog"));
					theirGoals.$add({
						time : time,
						statsType: "TheirGoals",
						comment : comment
					});
				}
			},
			newCard: function(teamId, gameId, type, player, time, comment){
			
				var cards = $firebaseArray(statsRef.child(teamId).child(gameId).child("GameLog"));
				cards.$add({
					type : type,
					statsType: "Cards",
					player : player,
					time : time,
					comment : comment
				});

			},
			getRef: function(){
				return statsRef;
			},
			getGameLogArray: function(teamId,gameId){
				var deferred = $q.defer();
                var gameLog = $firebaseArray(statsRef.child(teamId).child(gameId).child("GameLog"));
                gameLog.$loaded(function () {
                    deferred.resolve(gameLog);
                });
                return deferred.promise;
			},
			storeExternals: function(teamId,gameId,externalPlayers){
				statsRef.child(teamId).child(gameId).update({ 
					externalPlayers : externalPlayers
				});
			},
			RemoveStats: function(teamId,gameId){
				statsRef.child(teamId).child(gameId).remove();
			},
			newGameEvent: function(teamId, gameId, time, comment){
				var gameEvents = $firebaseArray(statsRef.child(teamId).child(gameId).child("GameLog"));
				gameEvents.$add({
						time : time,
						statsType: "GameEvents",
						comment : comment
					});
			},
			getStat: function(teamId,gameId,statId){
				var deferred = $q.defer();
                var stat = $firebaseObject(statsRef.child(teamId).child(gameId).child("GameLog").child(statId));
                stat.$loaded(function(){
                    deferred.resolve(stat);
                });
                return deferred.promise;				
			},
			updateStat: function(teamId,gameId,statId,time,comment) {
				statsRef.child(teamId).child(gameId).child("GameLog").child(statId).update({
					time : time,
					comment : comment
				})
			}
		};
	})
	.factory('Duties', function(firebaseRef,$firebaseObject,$firebaseArray, $q){
		var ref = firebaseRef.ref();
		var dutyRef = ref.child("Duties");
		var selectedDuty = localStorage.getItem("selectedDuty");
		return {
			getDuties: function(teamId) {
				return $firebaseObject(dutyRef.child(teamId));
			},
			getDutiesArray: function(teamId) {
				return $firebaseArray(dutyRef.child(teamId));
			},
			setDuty: function(dutyId) {
				localStorage.setItem("selectedDuty", dutyId);
				selectedDuty = dutyId;
			},
			addDuty: function(teamId, key,startValue,endValue,dutyObj) {
				dutyRef.child(teamId).child(key).set({
					start : Date.parse(startValue),
					end : Date.parse(endValue),
					Duty : dutyObj
				});
				return {start : Date.parse(startValue),
						end : Date.parse(endValue),
						Duty : dutyObj};
				//console.log("add Duty");
			},
			getDuty: function(dutyId) {
				var deferred = $q.defer();
				var duties = $firebaseArray(dutyRef.child(dutyId));
                duties.$loaded(function(){
					deferred.resolve(duties.$getRecord(selectedDuty));
				});
				return deferred.promise;
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
					console.log(type);
					console.log(events);
					var typeRef = ref.child(type).child(teamId);
					switch(type){
					case "Games":
						console.log(events.Games);
						Object.keys(events.Games).forEach(function(event){
							typeRef.child(event).child("Duty").remove();
						});
					break;
					case "Practises":
						console.log(events.Practises);
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
				//console.log(occurence);
				teamEvents.forEach(function(event){
					var eventDate = new Date(+event.date);
					var startDate = new Date(occurence.start);
					var endDate = new Date(occurence.end);
					//console.log(endDate);
					if( eventDate > startDate && eventDate <= endDate){
						console.log("hit");
						result[event.$id] = true;
					}
				});
				console.log(result);
				return result;
			}
		};
	})
	
    .factory('Utility', function () {
        return {
            deleteItem: function (array, item) {
                console.log(item);
                var retArray = [];
                if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
					array.forEach(function(game){
						if(game !== item){
							var obj = angular.copy(game);
							console.log(obj);
							retArray.push(obj);
							console.log(retArray);
						}
					});
                    //array.$remove(item);
                    return retArray;
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

            },
            isEmpty: function (obj) {
                var hasOwnProperty = Object.prototype.hasOwnProperty;

                // null and undefined are "empty"
                if (obj == null) return true;

                // Assume if it has a length property with a non-zero value
                // that that property is correct.
                if (obj.length > 0)    return false;
                if (obj.length === 0)  return true;

                // Otherwise, does it have any properties of its own?
                // Note that this doesn't handle
                // toString and valueOf enumeration bugs in IE < 9
                for (var key in obj) {
                    if (hasOwnProperty.call(obj, key)) return false;
                }

                return true;
            }
        }
    })

    .factory('localStorageFactory', function () {
        return {
            setTeams: function(teams) {
                localStorage.setItem('teams', JSON.stringify(teams));
            },
            setPlayers: function(players) {
                localStorage.setItem('players', JSON.stringify(players));
            },
			setInactivePlayers: function(inactivePlayers) {
                localStorage.setItem('inactivePlayers', JSON.stringify(inactivePlayers));
            },
			setStatistics: function(statistics) {
				localStorage.setItem('statistics', JSON.stringify(statistics));
			},
			setRawStatistics: function(statistics) {
				localStorage.setItem('RawStatistics', JSON.stringify(statistics));
			},
			setPlayerStatistics: function(PlayerStats) {
				localStorage.setItem('PlayerStatistics', JSON.stringify(PlayerStats));
			},
            setSettings: function(settings) {
                localStorage.setItem('settings', JSON.stringify(settings));
            },
            setAdmin: function(admins, uid) {
				console.log(admins);
                for(var key in admins) {
					console.log(key, uid);
                    if(key === uid){
                        localStorage.setItem('admin', true);
						break;
					}
                    else{
                        localStorage.setItem('admin', false);
					}
                }
            },
            setGames: function(games) {
                localStorage.setItem('games', JSON.stringify(games));
            },
            setTeamName: function(team) {
                localStorage.setItem('teamName', team.teamName);
            },
            setPractises: function(practises) {
                localStorage.setItem('practises', JSON.stringify(practises));
            },
			setEvents: function(events) {
                localStorage.setItem('events', JSON.stringify(events));
            },
			setSelectedStat: function(stat){
				localStorage.setItem('selectedStat', JSON.stringify(stat));
			},
			getSelectedStat: function() {
                return JSON.parse(localStorage.getItem('selectedStat'));
            },
            getTeamId: function() {
                var test = JSON.parse(localStorage.getItem('teams'));
                for(var key in test)
                    return key;
            },
            getPlayers: function() {
                return JSON.parse(localStorage.getItem('players'));
            },
			getInactivePlayers: function() {
                return JSON.parse(localStorage.getItem('inactivePlayers'));
            },
			getStatistics: function() {
				return JSON.parse(localStorage.getItem('statistics'));
			},
			getRawStatistics: function() {
				return JSON.parse(localStorage.getItem('RawStatistics'));
			},
			getPlayerStatistics: function() {
				return JSON.parse(localStorage.getItem('PlayerStatistics'));
			},
            getSettings: function() {
                return JSON.parse(localStorage.getItem('settings'));
            },
            getAdmin: function() {
				var admin = localStorage.getItem('admin');
				return (admin === "true"); // cast string to bool
            },
            getGames: function() {
                return JSON.parse(localStorage.getItem('games'));
            },
			getTeamName: function() {
                return localStorage.getItem('teamName');
            },
			getSelectedGame: function() {
                return localStorage.getItem('selectedGame');
            },
            getPractises: function() {
                return JSON.parse(localStorage.getItem('practises'));
            },
			getEvents: function() {
                return JSON.parse(localStorage.getItem('events'));
            }

        }
    })
		
