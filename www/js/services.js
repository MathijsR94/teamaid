angular.module('starter.services', [])
    .factory('firebaseRef', function () {
        //var ref = new Firebase("https://teamaid.firebaseio.com/"); // live db
        var ref = new Firebase("https://amber-torch-2058.firebaseio.com/"); // test db
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
            changePassword: function (email, oldPW, newPW) {
                ref.changePassword({
                        email: email,
                        oldPassword: oldPW,
                        newPassword: newPW
                    }, function (error) {
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
                        else {
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
        var accountData = $firebaseObject(ref.child("Users").child(user.uid));
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
            getTeam: function () {
                var teamId = $firebaseArray(userTeamsRef);
                var deferred = $q.defer();
                teamId.$loaded(function () {
                    deferred.resolve(teamId[0].$id);
                });
                return deferred.promise;
            },

            isAdmin: function (teamId) {

                var admins = $firebaseArray(ref.child("Admins").child(teamId));
                var deferred = $q.defer();

                admins.$loaded(function () {
                    deferred.resolve(admins);
                });
                return deferred.promise;
            },
            getAccountData: function () {
                return accountData;
            },
            getName: function () {
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
            ref: function () {
                return teamsRef;
            },
            getTeamName: function (teamId) {
                //console.log(teamId);
                var deferred = $q.defer();
                var team = $firebaseObject(teamsRef.child(teamId));
                team.$loaded(function () {
                    deferred.resolve(team.teamName);
                });
                return deferred.promise;
            },
            addTeam: function (teamName) {
                teams.$add({
                    teamName: teamName
                });
                var deferred = $q.defer();
                teams.$loaded(function () {
                    deferred.resolve(teams[teams.length - 1]);
                });
                return deferred.promise;
            },
            linkPlayer: function (teamId, firstName, ins, lastName, uid) {
                var playersRef = teamsRef.child(teamId).child("Players").child(uid);
                var nickname = firstName.substr(0, 1) + ".";
                if (ins != "") {
                    var a;
                    var sections = ins.split(" "); // take  first letter of each section of ins
                    for (a = 0; a < sections.length; a++) {
                        console.log(sections[a].substr(0, 1));
                        nickname += sections[a].substr(0, 1);
                    }
                    nickname += ".";
                }
                nickname += lastName;
                playersRef.update({
                    firstName: firstName,
                    insertion: ins,
                    lastName: lastName,
                    nickName: nickname,
                    defaultNumber: -1
                });
            },
            getPlayers: function (teamId) {
                var deferred = $q.defer();
                var players = $firebaseObject(teamsRef.child(teamId).child("Players"));
                players.$loaded(function () {
                    deferred.resolve(players);
                });
                return deferred.promise;
            },
            getPlayersArray: function (teamId) {
                var deferred = $q.defer();
                var players = $firebaseArray(teamsRef.child(teamId).child("Players"));
                players.$loaded(function () {
                    deferred.resolve(players);
                });
                return deferred.promise;
            },
            activatePlayer: function (teamId, uid) {
                teamsRef.child(teamId).child("InActive").child(uid).once('value', function (data) {
                    teamsRef.child(teamId).child("Players").child(uid).update(data.val());
                    teamsRef.child(teamId).child("InActive").child(uid).remove();
                });
            },
            deactivatePlayer: function (teamId, uid) {
                teamsRef.child(teamId).child("Players").child(uid).once('value', function (data) {
                    teamsRef.child(teamId).child("InActive").child(uid).update(data.val());
                    teamsRef.child(teamId).child("Players").child(uid).remove();
                });
            },
            updatePlayer: function (teamId, uid, firstName, ins, lastName, defaultNumber, nickName, type) {
                if (typeof defaultNumber === 'undefined') {
                    defaultNumber = -1;
                }
                if (typeof nickName === 'undefined') {
                    var nickname = firstName.substr(0, 1) + ".";
                    if (ins != "") {
                        var a;
                        var sections = ins.split(" "); // take  first letter of each section of ins
                        for (a = 0; a < sections.length; a++) {
                            console.log(sections[a].substr(0, 1));
                            nickname += sections[a].substr(0, 1);
                        }
                        nickname += ".";
                    }
                    nickname += lastName;
                }
                else {
                    nickname = nickName;
                }
                teamsRef.child(teamId).child(type).child(uid).update({
                    firstName: firstName,
                    insertion: ins,
                    lastName: lastName,
                    nickName: nickname,
                    defaultNumber: defaultNumber
                });
            }

        }
    })
    .factory('Admins', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var adminsRef = ref.child("Admins");

        var admins = $firebaseArray(ref.child("Admins"));

        return {
            ref: function () {
                return adminsRef;
            },
            linkAdmin: function (teamId, uid) {
                var teamAdminsRef = adminsRef.child(teamId);
                var admin = {};
                admin[uid] = true;
                teamAdminsRef.update(admin);
            },
            unlinkAdmin: function (teamId, uid) {
                var teamAdminsRef = adminsRef.child(teamId).child(uid);
                teamAdminsRef.remove();
            }
        }
    })

    .factory('Games', function ($firebaseArray, $firebaseObject, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var gamesRef = ref.child("Games");
        var selectedGame = localStorage.getItem("selectedGame");


        return {
            getGamesRef: function (teamId,seasonId) {
                return gamesRef.child(teamId).child(seasonId);
            },
            getGames: function (teamId,seasonId) {
                return $firebaseObject(gamesRef.child(teamId).child(seasonId));
            },
            getGamesArray: function (teamId,seasonId) {
                var deferred = $q.defer();
                var games = $firebaseArray(gamesRef.child(teamId).child(seasonId));
                games.$loaded(function () {
                    deferred.resolve(games);
                });
                return deferred.promise;
            },
            getGame: function (teamId,seasonId) {
                var deferred = $q.defer();
                var game = $firebaseObject(gamesRef.child(teamId).child(seasonId).child(selectedGame));
                game.$loaded(function () {
                    deferred.resolve(game);
                });
                return deferred.promise;
            },
            createGame: function (teamId, seasonId, gameDate, gameTime, collectTime, home, away) {
                var teamGamesRef = gamesRef.child(teamId).child(seasonId);
                var games = $firebaseArray(teamGamesRef);

                games.$add({
                    date: gameDate,
                    time: gameTime,
                    collect: collectTime,
                    home: home,
                    away: away
                });
            },
            updateGame: function (teamId, seasonId, gameId, date, time, collectTime, home, away) {
                gamesRef.child(teamId).child(seasonId).child(gameId).update({
                    date: date,
                    time: time,
                    collect: collectTime,
                    home: home,
                    away: away
                });
            },
            setGame: function (gameId) {
                localStorage.setItem("selectedGame", gameId);
                selectedGame = gameId;
            }
        }

    })
    .factory('Practises', function ($firebaseArray, $firebaseObject, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var practisesRef = ref.child("Practises");
        var selectedPractise = localStorage.getItem("selectedPractise");

        return {
            getPractisesRef: function (teamId, seasonId) {
                return practisesRef.child(teamId).child(seasonId);
            },
            getPractises: function (teamId, seasonId) {
                return $firebaseObject(practisesRef.child(teamId).child(seasonId));
            },
            getPractisesArray: function (teamId, seasonId) {
                var deferred = $q.defer();
                var practises = $firebaseArray(practisesRef.child(teamId).child(seasonId));
                practises.$loaded(function () {
                    deferred.resolve(practises);
                });
                return deferred.promise;
            },
            getPractise: function (teamId, seasonId) {
                var deferred = $q.defer();
                var practise = $firebaseObject(practisesRef.child(teamId).child(seasonId).child(selectedPractise)); //$firebaseArray(practisesRef.child(teamId));
                practise.$loaded(function () {
                    deferred.resolve(practise);
                });
                return deferred.promise;
            },
            setPractise: function (practiseId) {
                localStorage.setItem("selectedPractise", practiseId);
                selectedPractise = practiseId;
            },
            createPractise: function (teamId, seasonId, date, time, location, repeat) {
                var teamPractiseRef = practisesRef.child(teamId).child(seasonId);
                var practises = $firebaseArray(teamPractiseRef);
                for (var i = 0; i < repeat; i++) {
                    practises.$add({
                        date: date,
                        time: time,
                        location: location
                    });
                    // increase a week
					var dateObj = new Date(date);
                    dateObj.setDate(dateObj.getDate() + (7));
					date = Date.parse(dateObj);
                }
                ;
            },
            updatePractise: function (teamId, seasonId, practiseId, date, time, location) {
                practisesRef.child(teamId).child(seasonId).child(practiseId).update({
                    date: date,
                    time: time,
                    location: location
                });
            }

        }

    })
    .factory('Events', function ($firebaseArray, $firebaseObject, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var eventsRef = ref.child("Events");
        var selectedEvent = localStorage.getItem("selectedEvent");

        return {
            getEventsRef: function (teamId, seasonId) {
                return eventsRef.child(teamId).child(seasonId);
            },
            getEvents: function (teamId, seasonId) {
                return $firebaseObject(eventsRef.child(teamId).child(seasonId));
            },
            getEventsArray: function (teamId, seasonId) {
                var deferred = $q.defer();
                var events = $firebaseArray(eventsRef.child(teamId).child(seasonId));
                events.$loaded(function () {
                    deferred.resolve(events);
                });
                return deferred.promise;
            },
            getEvent: function (teamId, seasonId) {
                var deferred = $q.defer();
                var events = $firebaseArray(eventsRef.child(teamId).child(seasonId));
                events.$loaded(function () {
                    deferred.resolve(events.$getRecord(selectedEvent));
                });
                return deferred.promise;
            },
            setEvent: function (eventId) {
                localStorage.setItem("selectedEvent", eventId);
                selectedEvent = eventId;
            },
            createEvent: function (teamId, seasonId, date, time, location) {
                var teamEventRef = eventsRef.child(teamId).child(seasonId);
                var events = $firebaseArray(teamEventRef);
                events.$add({
                    date: date,
                    time: time,
                    location: location
                });
            },
            updateEvent: function (teamId, seasonId, eventId, date, time, location) {
                eventsRef.child(teamId).child(seasonId).child(eventId).update({
                    date: date,
                    time: time,
                    location: location
                });
            }

        }

    })
    .factory('Finance', function ($firebaseArray, firebaseRef, $q) {
        var financeRef = firebaseRef.ref().child("Finance");

        return {
            getCredits: function (teamId, seasonId) {
                var deferred = $q.defer();
                var credits = $firebaseArray(financeRef.child(teamId).child(seasonId));

                credits.$loaded(function () {
                    deferred.resolve(credits);
                });
                return deferred.promise;
            },
            newCredit: function (teamId, seasonId, uid, value, comment, player) {
                var balance = 0;
                var playerRef = financeRef.child(teamId).child(seasonId).child(uid);
                var credits = $firebaseArray(playerRef.child("credits"));

                // read old balance
                playerRef.once('value', function (dataSnapshot) {
                    if (dataSnapshot.val() !== null) {
                        balance = dataSnapshot.val().balance;
                        // write back new balance
                        playerRef.update({
                            balance: ((+balance) + (+value))
                        });
                    }
                    else { // this user is new to credits lets instantiate
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
                    timestamp: timestamp.toString(),
                    value: value,
                    comment: comment
                });
            }
        }
    })
    .factory('Attendance', function (firebaseRef) {
        var ref = firebaseRef.ref();

        return {
            checkUnknown: function (present, absent, players) {
                var unknown = {};//new Array();
                var dummy = {};
                if (typeof present === "undefined")
                    present = dummy;
                if (typeof absent === "undefined")
                    absent = dummy;

                for (key in players) {
                    if (!(key in present) && !(key in absent)) {
                        //unknown.push(players[key]);
                        unknown[key] = players[key];
                    }
                }
                ;
                return unknown;
            },
            checkAttendance: function (attendanceArray, uid) {
                if (typeof attendanceArray === "undefined") {
                    return false; // no defined array found
                } else {
                    //console.log(attendanceArray);
                    //console.log(attendancePresent);
                    return (uid in attendanceArray);
                }
            },
            addAttendance: function (type, source, uid, gameId, teamId, seasonId, removalArray) {
                switch (type) {
                    case "present":
                        var player = {};
                        player[uid] = true;
                        if (this.checkAttendance(removalArray, uid)) {
                            // remove from absent, because it is still listed there
                            delete removalArray[uid];
                            ref.child(source).child(teamId).child(seasonId).child(gameId).child("Absent").set(removalArray);
                        }
                        ref.child(source).child(teamId).child(seasonId).child(gameId).child("Present").update(player);
                        return true;
                        break;
                    case "absent":
                        var player = {};
                        player[uid] = true;
                        if (this.checkAttendance(removalArray, uid)) {
                            // remove from present, because it is still listed there
                            delete removalArray[uid]
                            ref.child(source).child(teamId).child(seasonId).child(gameId).child("Present").set(removalArray);
                        }
                        ref.child(source).child(teamId).child(seasonId).child(gameId).child("Absent").update(player);
                        return true;
                        break;
                    default:
                        return 0;
                        break;
                }
            },
            resetAttendance: function (source, uid, gameId, teamId, seasonId, present, absent) {
                var player = {};
                player[uid] = true;
                if (this.checkAttendance(present, uid)) {
                    // remove from absent, because it is still listed there
                    delete present[uid];
                    ref.child(source).child(teamId).child(seasonId).child(gameId).child("Present").set(present);
                }
                if (this.checkAttendance(absent, uid)) {
                    // remove from present, because it is still listed there
                    delete absent[uid]
                    ref.child(source).child(teamId).child(seasonId).child(gameId).child("Absent").set(absent);
                }
                return;
            }

        }
    })

    .factory('Mail', function ($http) {
        return {
            mailInvite: function (tomail, teamId, teamName) {
                var data = {
                    Tomail: tomail,
                    teamId: teamId,
                    teamName: teamName
                };

                $http({
                    method: 'POST',
                    url: 'php/invite-mailer.php',
                    data: data,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Access-Control-Allow-Origin': true},
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                }).success(function (data, status, headers, config) {
                    return true;
                }).error(function (data, status, headers, config) {
                    return false;
                });
            }
        };
    })

    .factory('Settings', function (firebaseRef, $firebaseObject, $q) {
        var settingsRef = firebaseRef.ref().child("Teams");
        return {
            getSettings: function (teamId) {
                return $firebaseObject(settingsRef.child(teamId).child("Settings"));
            },
            getRef: function () {
                return settingsRef;
            },
            updateSetting: function (key, value, teamId) {
                var setting = {};
                setting[key] = value;
                settingsRef.child(teamId).child("Settings").update(setting);
            },
        };
    })
    .factory('Statistics', function (firebaseRef, $firebaseObject, $firebaseArray, $q) {
        var statsRef = firebaseRef.ref().child("Statistics");
        return {
			getStatisticsRef: function (teamId, seasonId) {
                return statsRef.child(teamId).child(seasonId);
            },
            initialize: function (teamId, seasonId, gameId, gameTime) {
                var stats = {
                    firstHalfStart: gameTime,
                    firstHalfEnd: gameTime + (45 * 60),
                    secondHalfStart: gameTime + (60 * 60),
                    secondHalfEnd: gameTime + (105 * 60)
                };
                statsRef.child(teamId).child(seasonId).child(gameId).set(stats);
                return stats;
            },
			makeActual: function( basisLineUp, basisChanges, GameLog, playingHome) {
				var actualResult = {actualPlayers: basisLineUp, changes: basisChanges,homeScore: 0,awayScore: 0,error: false};
				// main event interation loop
				if (typeof GameLog !== 'undefined') {
					// loop trough each event in the gameLog
					for (key in GameLog) {
						switch (GameLog[key].statsType) {
							
							case "Changes":
								switch (GameLog[key].type) { //change type, in/out or  position
									case "In/Out":
										;
										if( typeof actualResult.actualPlayers[GameLog[key].playerOut] === 'undefined' ){
											actualResult.error = true;
											console.log(GameLog[key].type);
										}
										actualResult.actualPlayers[GameLog[key].playerIn] = actualResult.actualPlayers[GameLog[key].playerOut]; // transfer position
										delete actualResult.actualPlayers[GameLog[key].playerOut];
										// he is already changed so he cannot be changed in again
										delete actualResult.changes[GameLog[key].playerIn];
										break;

									case "Position":
										var pos1 = actualResult.actualPlayers[GameLog[key].player1]; // position of player1
										var pos2 = actualResult.actualPlayers[GameLog[key].player2]; // position of player2
										if( typeof actualResult.actualPlayers[GameLog[key].player1] === 'undefined' || typeof actualResult.actualPlayers[GameLog[key].player2] === 'undefined'){
											actualResult.error = true;
											console.log(GameLog[key].type);
										}
										actualResult.actualPlayers[GameLog[key].player1] = pos2; // transfer position
										actualResult.actualPlayers[GameLog[key].player2] = pos1; // transfer position
										break;
								}
								break;

							case "Cards":
								var player = actualResult.actualPlayers[GameLog[key].player];
								if( typeof actualResult.actualPlayers[GameLog[key].player] === 'undefined' ){
									actualResult.error = true;
									console.log(GameLog[key].type);
								}
								if (GameLog[key].type === 'red') {
									delete actualResult.actualPlayers[GameLog[key].player]; // remove from actual players
								}
								if (GameLog[key].type === 'yellow2') {
									delete actualResult.actualPlayers[GameLog[key].player]; // remove from actual players
								}
								break;

							case "OurGoals":
								if (playingHome) {
									actualResult.homeScore++;
								}
								else {
									actualResult.awayScore++;
								}
								break;

							case "TheirGoals":
								if (!playingHome) {
									actualResult.homeScore++;
								}
								else {
									actualResult.awayScore++;
								}
								break;
							case "GameEvents":
								break; // nothing
							default:
								break;
						}
					}
				}					
				return actualResult;
			},
            updateActualTeam: function (actualPlayers) {
                var newActual = {};
                for (key in actualPlayers) {
                    newActual[actualPlayers[key]] = key;
                }
                ;
                return newActual;

            },
            updateBasis: function (teamId, seasonId, gameId, basisTeam) {
                statsRef.child(teamId).child(seasonId).child(gameId).update({
                    Basis: basisTeam
                });

            },
            newChange: function (teamId, seasonId, gameId, playerIn, playerOut, pos, time, comment) {
                var changes = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                changes.$add({
                    time: time,
                    type: "In/Out",
                    statsType: "Changes",
                    playerIn: playerIn,
                    playerOut: playerOut,
                    position: pos,
                    comment: comment
                });
            },
			addPlayer: function (teamId, seasonId, gameId, player, pos, time, comment) {
                var changes = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                changes.$add({
                    time: time,
                    type: "In",
                    statsType: "Changes",
                    playerIn: player,
                    position: pos,
                    comment: comment
                });
            },
			removePlayer: function (teamId, seasonId, gameId, player, pos, time, comment) {
                var changes = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                changes.$add({
                    time: time,
                    type: "Out",
                    statsType: "Changes",
                    playerOut: playerOut,
                    position: pos,
                    comment: comment
                });
            },
            newPosChange: function (teamId, seasonId, gameId, player1, player2, time, comment) {
                var posChanges = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                posChanges.$add({
                    time: time,
                    type: "Position",
                    statsType: "Changes",
                    player1: player1,
                    player2: player2,
                    comment: comment
                });
            },
            newGoal: function (teamId, seasonId, gameId, ours, player, time, comment) {
                if (ours === true) {
                    var ourGoals = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                    ourGoals.$add({
                        player: player,
                        statsType: "OurGoals",
                        time: time,
                        comment: comment
                    });
                }
                else {
                    var theirGoals = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                    theirGoals.$add({
                        time: time,
                        statsType: "TheirGoals",
                        comment: comment
                    });
                }
            },
            newCard: function (teamId, seasonId, gameId, type, player, time, comment) {

                var cards = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                cards.$add({
                    type: type,
                    statsType: "Cards",
                    player: player,
                    time: time,
                    comment: comment
                });

            },
            getRef: function () {
                return statsRef;
            },
            getGameLogArray: function (teamId, seasonId, gameId) {
                var deferred = $q.defer();
                var gameLog = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                gameLog.$loaded(function () {
                    deferred.resolve(gameLog);
                });
                return deferred.promise;
            },
			clearGameLog: function (teamId, seasonId, gameId) {
				var gameLog = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                gameLog.remove();
            },
            storeExternals: function (teamId, seasonId, gameId, externalPlayers) {
                statsRef.child(teamId).child(seasonId).child(gameId).update({
                    externalPlayers: externalPlayers
                });
            },
            RemoveStats: function (teamId, seasonId, gameId) {
                statsRef.child(teamId).child(seasonId).child(gameId).remove();
            },
            newGameEvent: function (teamId, seasonId, gameId, time, comment) {
                var gameEvents = $firebaseArray(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog"));
                gameEvents.$add({
                    time: time,
                    statsType: "GameEvents",
                    comment: comment
                });
            },
            getStat: function (teamId, seasonId, gameId, statId) {
                var deferred = $q.defer();
                var stat = $firebaseObject(statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog").child(statId));
                stat.$loaded(function () {
                    deferred.resolve(stat);
                });
                return deferred.promise;
            },
            updateStat: function (teamId, seasonId, gameId, statId, time, comment) {
                statsRef.child(teamId).child(seasonId).child(gameId).child("GameLog").child(statId).update({
                    time: time,
                    comment: comment
                })
            }
        };
    })
    .factory('Duties', function (firebaseRef, $firebaseObject, $firebaseArray, $q) {
        var ref = firebaseRef.ref();
        var dutyRef = ref.child("Duties");
        var selectedDuty = localStorage.getItem("selectedDuty");
        return {
            getDuties: function (teamId, seasonId) {
                return $firebaseObject(dutyRef.child(teamId).child(seasonId));
            },
            getDutiesArray: function (teamId, seasonId) {
                return $firebaseArray(dutyRef.child(teamId).child(seasonId));
            },
            setDuty: function (dutyId) {
                localStorage.setItem("selectedDuty", dutyId);
                selectedDuty = dutyId;
            },
            addDuty: function (teamId, seasonId, key, startValue, endValue, dutyObj) {
                dutyRef.child(teamId).child(seasonId).child(key).set({
                    start: startValue,
                    end: endValue,
                    Duty: dutyObj
                });
                return {
                    start: startValue,
                    end: endValue,
                    Duty: dutyObj
                };
                //console.log("add Duty");
            },
            getDuty: function (dutyId) {
                var deferred = $q.defer();
                var duties = $firebaseArray(dutyRef.child(dutyId));
                duties.$loaded(function () {
                    deferred.resolve(duties.$getRecord(selectedDuty));
                });
                return deferred.promise;
            },
            updateDuty: function (teamId, seasonId, key, dutyObj) {

                dutyRef.child(teamId).child(seasonId).child(key).child("Duty").set(dutyObj);
                //console.log("update Duty");
            },
            removeDuty: function (teamId, seasonId, key) {

                dutyRef.child(teamId).child(seasonId).child(key).remove();
                //console.log("update Duty");
            },
            linkEvents: function (teamId, seasonId, events, duty) {
                Object.keys(events).forEach(function (type) {
                    //console.log(type);
                    var typeRef = ref.child(type).child(teamId).child(seasonId);
                    //console.log(typeRef);
                    switch (type) {
                        case "Games":
                            //console.log(events.Games);
                            Object.keys(events.Games).forEach(function (event) {
                                typeRef.child(event).child("Duty").set(duty);
                            });
                            break;
                        case "Practises":
                            Object.keys(events.Practises).forEach(function (event) {
                                typeRef.child(event).child("Duty").set(duty);
                            });
                            break;
                        case "Events":
                            Object.keys(events.Events).forEach(function (event) {
                                typeRef.child(event).child("Duty").set(duty);
                            });
                            break;
                    }

                });

            },
            unlinkEvents: function (teamId, seasonId, events) {
                Object.keys(events).forEach(function (type) {
                    //console.log(type);
                    //console.log(events);
                    var typeRef = ref.child(type).child(teamId).child(seasonId);
                    switch (type) {
                        case "Games":
                            //console.log(events.Games);
                            Object.keys(events.Games).forEach(function (event) {
                                typeRef.child(event).child("Duty").remove();
                            });
                            break;
                        case "Practises":
                            //console.log(events.Practises);
                            Object.keys(events.Practises).forEach(function (event) {
                                typeRef.child(event).child("Duty").remove();
                            });
                            break;
                        case "Events":
                            Object.keys(events.Events).forEach(function (event) {
                                typeRef.child(event).child("Duty").remove();
                            });
                            break;
                    }

                });

            },

            checkForEvents: function (teamEvents, occurence) {
                var result = {};
                //console.log(occurence);
                teamEvents.forEach(function (event) {
                    var eventDate = new Date(+event.date);
                    var startDate = new Date(occurence.start);
                    var endDate = new Date(occurence.end);
                    //console.log(endDate);
                    if (eventDate > startDate && eventDate <= endDate) {
                        //console.log("hit");
                        result[event.$id] = true;
						console.log(result);
                    }
                });
                //console.log(result);
                return result;
            }
        };
    })
	.factory('Seasons', function ($firebaseArray, $firebaseObject, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var seasonsRef = ref.child("Seasons");
        var allSeasons = $firebaseArray(ref.child("Seasons"));

        return {
            ref: function () {
                return seasonsRef;
            },
            getSeasonTitle: function (teamId,seasonId) {
                var deferred = $q.defer();
                var season = $firebaseObject(seasonsRef.child(teamId).child(seasonId));
                season.$loaded(function () {
                    deferred.resolve(season.title);
                });
                return deferred.promise;
            },
            addSeason: function (teamId,seasonTitle,start,end) {
                seasonsRef.child(teamId).push({
				    title: seasonTitle,
					start: start,
					end : end
                });
            },
			deleteSeason: function (teamId, id) {
                var seasonRef = seasonsRef.child(teamId).child(id);
                seasonRef.remove();
            }
        }
    })
    .factory('Utility', function () {
        return {
            deleteItem: function (array, item) {
                console.log(item);
                var retArray = [];
                if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                    array.forEach(function (game) {
                        if (game !== item) {
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
            editItem: function (item) {

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
            setTeams: function (teams) {
                localStorage.setItem('teams', JSON.stringify(teams));
            },
			setTeamId: function (teamId) {
                localStorage.setItem('teamId', JSON.stringify(teamId));
            },
			setSeasons: function (seasons) {
                localStorage.setItem('seasons', JSON.stringify(seasons));
            },
			setSeasonId: function (seasonId) {
                localStorage.setItem('seasonId', JSON.stringify(seasonId));
            },
            setPlayers: function (players) {
                localStorage.setItem('players', JSON.stringify(players));
            },
            setInactivePlayers: function (inactivePlayers) {
                localStorage.setItem('inactivePlayers', JSON.stringify(inactivePlayers));
            },
            setStatistics: function (statistics) {
                localStorage.setItem('statistics', JSON.stringify(statistics));
            },
            setPlayerStatistics: function (PlayerStats) {
                localStorage.setItem('PlayerStatistics', JSON.stringify(PlayerStats));
            },
            setSettings: function (settings) {
                localStorage.setItem('settings', JSON.stringify(settings));
            },
            setAdmin: function (admins, uid) {
                console.log(admins);
                for (var key in admins) {
                    console.log(key, uid);
                    if (key === uid) {
                        localStorage.setItem('admin', true);
                        break;
                    }
                    else {
                        localStorage.setItem('admin', false);
                    }
                }
            },
            setGames: function (games) {
                localStorage.setItem('games', JSON.stringify(games));
            },
            setTeamName: function (team) {
                localStorage.setItem('teamName', team.teamName);
            },
            setPractises: function (practises) {
                localStorage.setItem('practises', JSON.stringify(practises));
            },
            setEvents: function (events) {
                localStorage.setItem('events', JSON.stringify(events));
            },
            setSelectedStat: function (stat) {
                localStorage.setItem('selectedStat', JSON.stringify(stat));
            },
            getSelectedStat: function () {
                return JSON.parse(localStorage.getItem('selectedStat'));
            },
            getTeamId: function () {
                return JSON.parse(localStorage.getItem('teamId'));
            },
			getSeasonId: function () {
                return JSON.parse(localStorage.getItem('seasonId'));
            },
            getPlayers: function () {
                return JSON.parse(localStorage.getItem('players'));
            },
            getInactivePlayers: function () {
                return JSON.parse(localStorage.getItem('inactivePlayers'));
            },
            getStatistics: function () {
                return JSON.parse(localStorage.getItem('statistics'));
            },
            getPlayerStatistics: function () {
                return JSON.parse(localStorage.getItem('PlayerStatistics'));
            },
            getSettings: function () {
                return JSON.parse(localStorage.getItem('settings'));
            },
            getAdmin: function () {
                var admin = localStorage.getItem('admin');
                return (admin === "true"); // cast string to bool
            },
            getGames: function () {
                return JSON.parse(localStorage.getItem('games'));
            },
            getTeamName: function () {
                return localStorage.getItem('teamName');
            },
            getSelectedGame: function () {
                return localStorage.getItem('selectedGame');
            },
            getPractises: function () {
                return JSON.parse(localStorage.getItem('practises'));
            },
            getEvents: function () {
                return JSON.parse(localStorage.getItem('events'));
            }

        }
    })
		
