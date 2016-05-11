angular.module('starter.HomeControllers', [])
    .controller('HomeCtrl', function ($scope, User, Teams,Statistics, localStorageFactory, firebaseRef) {
        var ref = firebaseRef.ref();
		var playerStats = {};
        var uid = User.getUID();
        ref.child('Users').child(uid).child('Teams').once('value', function (teams) {
            localStorageFactory.setTeams(teams.val());
            var teamId = localStorageFactory.getTeamId();

            ref.child('Teams').child(teamId).once('value', function (teamData) {
                if (typeof teamData.val() !== 'undefined') {
                    localStorageFactory.setTeamName(teamData.val());

                    if (typeof teamData.val().Players !== 'undefined'){
						var players = teamData.val().Players;
                        localStorageFactory.setPlayers(teamData.val().Players);
					}
                    else{
                        localStorageFactory.setPlayers({});
					}

                    if (typeof teamData.val().InActive !== 'undefined'){
						var inactivePlayers = teamData.val().InActive;
                        localStorageFactory.setInactivePlayers(teamData.val().InActive);
					}
                    else{
                        localStorageFactory.setInactivePlayers({});
					}

                    if (typeof teamData.val().Settings !== 'undefined'){
                        localStorageFactory.setSettings(teamData.val().Settings);
					}
                    else{
                        localStorageFactory.setSettings({});
					}
					
					// initialize  statistics! ( PlayerStats )--------------------------------------
					
					if (typeof inactivePlayers !== 'undefined') {
						players = angular.extend(players, inactivePlayers);
					}
					for (player in players) {
							playerStats[player] = {
								gametimeList: {},
								goalsList: {},
								cardsList: {},
								totGameTime: 0,
								totYellow: 0,
								totRed: 0,
								totGoals: 0
							};
					}
						
					Statistics.getRef().child(teamId).once('value', function (statsSnap) {
						for (var key in statsSnap.val()) { // walk trough each game
							var gameStats = statsSnap.val()[key];
							var maxGameTime = ((gameStats.firstHalfEnd - gameStats.firstHalfStart) + (gameStats.secondHalfEnd - gameStats.secondHalfStart)) / 60;

							for (player in gameStats.Basis) {
								if (player.indexOf("external") === -1) {
									playerStats[player]['totGameTime'] += maxGameTime;  // initially add a fill length game to each basis player
									playerStats[player].gametimeList[key] = {game: key};
									playerStats[player].gametimeList[key].gametime = maxGameTime;
								}
							}

							var fieldPlayers = angular.copy(gameStats.Basis);
							var firstOrSecond = false;
							var remainingTime = 0;

							// sort the GameLog --- this is not working correctly!!
							// var sortedLog = $filter('orderObjectBy')(gameStats.GameLog, "time");
							// console.log(gameStats.GameLog, "old");
							// console.log(sortedLog);
							//---------------------------------------

							// main iteration loop
							for (var itemKey in gameStats.GameLog) {
								switch (gameStats.GameLog[itemKey].statsType) {

									case "Changes":
										var change = gameStats.GameLog[itemKey];
										// update fieldPlayers ( used for cards later on )

										if (change.type === "In/Out") { //change type, in/out or  position
											fieldPlayers[change.playerIn] = fieldPlayers[change.playerOut]; // transfer position
											delete fieldPlayers[change.playerOut];

											remainingTime = calcReaminingTime(change.time, gameStats.firstHalfStart, gameStats.firstHalfEnd, gameStats.secondHalfStart, gameStats.secondHalfEnd);

											if (change.playerOut.indexOf("external") == -1) { // only calculate if player is not external
												playerStats[change.playerOut]['totGameTime'] -= remainingTime; // update totGameTime, subtract remaining time from gametime already granted. ( this  will be transferred to the player who will be changed in )
												playerStats[change.playerOut].gametimeList[key].gametime -= remainingTime; //subtract remaining time from already granted gametime
											}
											if (change.playerIn.indexOf("external") == -1) { // only calculate if player is not external
												playerStats[change.playerIn]['totGameTime'] += remainingTime;// update totGameTime, add remaining time to Totgametime.
												playerStats[change.playerIn].gametimeList[key] = {game: key};
												playerStats[change.playerIn].gametimeList[key].gametime = remainingTime;
											}
										}
										break;
									case "Cards":
										var card = gameStats.GameLog[itemKey];
										//console.log(card);
										if (card.player.indexOf("external") == -1) {
											if (card.type === "red") {
												playerStats[card.player]['totRed'] += 1; // sum count red cards
												playerStats[card.player].cardsList[itemKey] = {
													game: key,
													gamelogId: itemKey
												};
											}

											if (card.type === "yellow" || card.type === 'yellow2') { // sum count  yellow cards
												playerStats[card.player]['totYellow'] += 1;
												playerStats[card.player].cardsList[itemKey] = {
													game: key,
													gamelogId: itemKey
												};
											}
											if (card.type === "red" || card.type === "yellow2") {

												if (card.player in fieldPlayers) { // is this player on the field??
													//reduce player's gametime

													remainingTime = calcReaminingTime(card.time, gameStats.firstHalfStart, gameStats.firstHalfEnd, gameStats.secondHalfStart, gameStats.secondHalfEnd);

													//console.log(card.type, playerStats[card.player], remainingTime);
													if (card.player.indexOf("external") == -1) { // only calculate if player is not external
														playerStats[card.player]['totGameTime'] -= remainingTime; // update totGameTime, subtract remaining time from gametime already granted.
														playerStats[card.player].gametimeList[key].gametime -= remainingTime;
													}
												}
											}
										}
										break;

									case "OurGoals":
										var goal = gameStats.GameLog[itemKey];
										if (goal.player.indexOf("external") == -1) { // only calculate if player is not external
											playerStats[goal.player]['totGoals'] += 1; // update totGoals
											playerStats[goal.player].goalsList[itemKey] = {game: key, gamelogId: itemKey};
										}
										break;

									default:
										break;
								}
							}
						}
						console.log(playerStats);
						localStorageFactory.setStatistics(playerStats);
					});
					//-------------------
                }
                else
                    localStorageFactory.setTeamName({});

            })

            ref.child('Admins').child(teamId).once('value', function (admin) {
                localStorageFactory.setAdmin(admin.val(), uid);
            })

            User.getName().then(function (data) {
                var firstName = data.firstName,
                    insertion = data.insertion,
                    lastName = data.lastName;
                $scope.name = firstName + ' ' + insertion + ' ' + lastName;
            })
        })
    })
