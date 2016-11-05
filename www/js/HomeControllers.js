angular.module('starter.HomeControllers', [])
    .controller('HomeCtrl', function ($scope, User, Teams, Statistics, Games, localStorageFactory, firebaseRef, Games) {
        var ref = firebaseRef.ref();
		var playerStats = {};
		$scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.uid = User.getUID();


		ref.child('Teams').once('value', function (teams) {
			$scope.teams = teams.val();
		})

		$scope.setTeamId = function(id){
			localStorageFactory.setTeamId(id);
		}

		$scope.setSeasonId = function(id){
			localStorageFactory.setSeasonId(id);
		}
		ref.child('Users').child($scope.uid).child('Teams').once('value', function (teams) {
			localStorageFactory.setTeams(teams.val());
			$scope.userTeams = teams.val();

			$scope.$watch('teamId', function(newValue, oldValue) {
				if($scope.teamId !== null){
					console.log("Team is loaded");
					ref.child('Seasons').child($scope.teamId).once('value', function (seasonsData) {
						if (typeof seasonsData.val() !== 'undefined') {
							$scope.seasons = seasonsData.val();
							localStorageFactory.setSeasons(seasonsData.val());
							console.log($scope.seasons);
						}
					})

					ref.child('Teams').child($scope.teamId).once('value', function (teamData) {
						if (typeof teamData.val() !== 'undefined') {
							localStorageFactory.setTeamName(teamData.val());

							if (typeof teamData.val().Players !== 'undefined'){
								$scope.players = teamData.val().Players;
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
								$scope.settings = teamData.val().Settings;
								localStorageFactory.setSettings(teamData.val().Settings);
							}
							else{
								localStorageFactory.setSettings({});
							}

							// initialize  statistics! ( PlayerStats )--------------------------------------

							if (typeof inactivePlayers !== 'undefined') {
								$scope.players = angular.extend($scope.players, inactivePlayers);
							}

						}
						else{
							localStorageFactory.setTeamName({});
						}

					})

					ref.child('Admins').child($scope.teamId).once('value', function (admin) {
						localStorageFactory.setAdmin(admin.val(), $scope.uid);
					});
				}

			})
			$scope.$watch('seasonId', function(newValue, oldValue) {

				if($scope.seasonId !== null) {


					for (player in $scope.players) {
						playerStats[player] = {
							gametimeList: {},
							goalsList: {},
							cardsList: {},
							totGamePresent: 0,
							totBasis: 0,
							totChanges: 0,
						    maxGameTime: 0, 
							totGameTime: 0,
							totYellow: 0,
							totRed: 0,
							totGoals: 0
						};
					}


					//console.log($scope.stats);
					$scope.stats = {};
					if ($scope.seasonId !== null) {
						$scope.getGames = Games.getGamesArray($scope.teamId, $scope.seasonId).then(function (games) {
							$scope.games = games;
							Statistics.getRef().child($scope.teamId).child($scope.seasonId).once('value', function (statsSnap) {
								for (var key in statsSnap.val()) { // walk trough each game
									var game = $scope.games.$getRecord(key);
									if (typeof game.type === 'undefined') {
										game.type = 'Competition';
									}
									//console.log(($scope.settings.statsCup === false && game.type !== 'Cup')|| $scope.settings.statsCup === true );
									if (($scope.settings.statsCup === false && game.type !== 'Cup') || $scope.settings.statsCup === true) { // exclude  cup games from stats

									    var gameStats = statsSnap.val()[key];
									    var maxGameTime = ((gameStats.firstHalfEnd - gameStats.firstHalfStart) + (gameStats.secondHalfEnd - gameStats.secondHalfStart)) / 60;

									    // keep track of number of games player was present
									    for (player in game.Present) {
									        if (player.indexOf("external") === -1) {
									            playerStats[player]['totGamePresent'] += 1;  // add this game to the total of all games player is present
									            playerStats[player]['maxGameTime'] += maxGameTime; //keep track of the maximum minutes someone  might have made
									        }
									    }

										for (player in gameStats.Basis) {
										    if (player.indexOf("external") === -1) {
										        playerStats[player]['totBasis'] += 1;
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
															playerStats[change.playerOut]['totChanges'] += 1; //count number of changes this player has had
														}
														if (change.playerIn.indexOf("external") == -1) { // only calculate if player is not external
															playerStats[change.playerIn]['totGameTime'] += remainingTime;// update totGameTime, add remaining time to Totgametime.
															playerStats[change.playerIn].gametimeList[key] = {game: key};
															playerStats[change.playerIn].gametimeList[key].gametime = remainingTime;
															playerStats[change.playerIn]['totChanges'] += 1; //count number of changes this player has had
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
														playerStats[goal.player].goalsList[itemKey] = {
															game: key,
															gamelogId: itemKey
														};
													}
													break;

												default:
													break;
											}
										}
									}
								}
							    // calculate the coefficient of all players
								for (player in playerStats) {
								    //100% = maxGameTime
								    // totGameTime = actual time
								    // coefGameTime = percentage of max the has been played
								    if (playerStats[player]['totGameTime'] > 0 && playerStats[player]['maxGameTime'] > 0){
								        playerStats[player]['coefGameTime'] = (playerStats[player]['totGameTime'] / playerStats[player]['maxGameTime']) * 100; // time 10 for percentage
								    } else {
								        playerStats[player]['coefGameTime'] = 0;
                                    }
								    console.log(player, playerStats[player]['coefGameTime']);
								}

								localStorageFactory.setStatistics(playerStats);
								localStorageFactory.setGames([]);
								localStorageFactory.setPractises([]);
								localStorageFactory.setEvents([]);
								$scope.stats = playerStats[$scope.uid];

								Games.getGamesArray($scope.teamId, $scope.seasonId).then(function (games) {
									var games = games;
									var gameIds = [];

									for (var key in $scope.stats.gametimeList) {
										gameIds.push(key);
									}
								});
							});
							//-------------------
						});
					}
				}
			})
        })
    })
