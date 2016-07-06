angular.module('starter.DutyControllers', [])
    .controller('DutiesCtrl', function ($scope, Teams, Games, Practises, Events, Settings, User, Duties, $state, firebaseRef, localStorageFactory) {
        $scope.ShowDelete = false;
		$scope.useNickNames = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId, $scope.seasonId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        $scope.events = localStorageFactory.getEvents();

        $scope.players = localStorageFactory.getPlayers();

		/*
		// tijdelijk
		var dutyRef = firebaseRef.ref().child("Duties");
        dutyRef.once('value', function (dutySnap) {
			$scope.all_duty = dutySnap.val();
			
			for (teamId in $scope.all_duty) { // team layer
			console.log(teamId, "TEAM");
			for (dutyId in $scope.all_duty[teamId]) { // duty layer
			console.log(dutyId, "DUTY");
			
			var newStart = Date.parse($scope.all_duty[teamId][dutyId].start);
			
			var newEnd = Date.parse($scope.all_duty[teamId][dutyId].end);
			
			
			if(isNaN(newStart) === false){
				console.log($scope.all_duty[teamId][dutyId].start,newStart);
				dutyRef.child(teamId).child(dutyId).update({start:newStart});
			}
			if(isNaN(newEnd) === false){
				console.log($scope.all_duty[teamId][dutyId].end, newEnd);
				dutyRef.child(teamId).child(dutyId).update({end:newEnd});
			}
			
			}
			}
		});
		
		////----------------------------- tijdelijk duty crawler ---------------
		*/
			
				
        $scope.limit = 3;
        $scope.loadMore = function () {
            $scope.limit = $scope.duties.length;
        }
        $scope.loadLess = function () {
            $scope.limit = 3;
        }

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getGames = Games.getGamesArray($scope.teamId,$scope.seasonId).then(function (games) {
                    $scope.games = games;
                    localStorageFactory.setGames(games);
                });
            }
            if (snap.val() === true) {
                $scope.getPractises = Practises.getPractisesArray($scope.teamId,$scope.seasonId).then(function (practises) {
                    $scope.practises = practises;
                    localStorageFactory.setPractises(practises);
                });
            }
            if (snap.val() === true) {
                $scope.getEvents = Events.getEventsArray($scope.teamId,$scope.seasonId).then(function (events) {
                    $scope.events = events;
                    localStorageFactory.setEvents(events);
                });
            }
        });

        $scope.currentDate = new Date();
        //console.log($scope.currentDate);

        $scope.showDelete = function () {
            //console.log('showdelete:' + $scope.ShowDelete);
            $scope.ShowDelete = !$scope.ShowDelete;
        };

        $scope.updateDuties = function () {
			var dutyContext = {0:[],1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[],10:[]}; // context matrix
			var highestCountContext = 9; // above this value you reach the maximum level and  you are no longer feasible for duty
            var dutyPlayers = new Array();

            for (var key in $scope.players) {
                dutyPlayers.push(key);
            }
            var loopPlayers = dutyPlayers.slice();
			dutyContext[0] = dutyPlayers.slice(); // new
			
            // create al required occurences ( we take a year by default)
            $scope.dutyOccurrences = new Array();
            var firstDate = new Date($scope.currentDate.getFullYear(), $scope.currentDate.getMonth(), $scope.currentDate.getDate());
            // correct to start at day 0 so it always starts at the same day of the week!
            firstDate.setDate(firstDate.getDate() + (7 - $scope.currentDate.getDay()));
            var backTrackDate = new Date(firstDate);
            console.log(backTrackDate);
            var lastDate = new Date(firstDate.getFullYear() + 1, firstDate.getMonth(), firstDate.getDate());

            while (firstDate < lastDate) {
                $scope.dutyOccurrences.push({
                    start: new Date(firstDate),
                    end: new Date(firstDate.setDate(firstDate.getDate() + (7)))
                });
            }

            // backtrack our Duty schedule to initialize the loopPlayers array. this  will make sure we do give players double duty
            //backtrack for  no of  players times
            //console.log($scope.duties);
            //console.log($scope.duties.$getRecord(201579));
            for (var i = 0; i < $scope.duties.length; i++) {
                //actually make the backtrack go back

                backTrackDate.setDate(backTrackDate.getDate() - 7);
                var backTrackKey = backTrackDate.getFullYear() + "" + backTrackDate.getMonth() + "" + backTrackDate.getDate();
                if (typeof $scope.duties.$getRecord([backTrackKey]) === "undefined" || $scope.duties.$getRecord([backTrackKey]) === null) {
                    // no Duty here or this date does not exist
                    console.log("no duty exists");
                }else {
                    // there is a duty record here, lets see who is listed
                    var foundDuties = Object.keys($scope.duties.$getRecord(backTrackKey).Duty);
                    //update dutyContext
					
					//---- new context matrix
					foundDuties.forEach(function (key) {
                        //console.log(key);
						for(var contextLevel = highestCountContext;contextLevel >= 0;contextLevel--){
							var index = dutyContext[contextLevel].indexOf(key);
							if (index != -1){
								dutyContext[contextLevel+1].push(dutyContext[contextLevel][index]);
								dutyContext[contextLevel].splice(index, 1);
								break;
							}
						}
                        
                    });
                }
            }
			//console.log(dutyContext);
            //fill future Occurences
            $scope.dutyOccurrences.forEach(function (occurence) {
                var occurenceKey = occurence.start.getFullYear() + "" + occurence.start.getMonth() + "" + occurence.start.getDate();
				
                //check if there are any events planned in this occurence
                var occurenceEvents = {};
                var retVal = {};
                if ($scope.settings.dutyGames === true) {
                    retVal = Duties.checkForEvents($scope.games, occurence);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Games"] = retVal;
                }
                if ($scope.settings.dutyPractises === true) {
                    retVal = Duties.checkForEvents($scope.practises, occurence);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Practises"] = retVal;
                }
                if ($scope.settings.dutyEvents === true) {
                    retVal = Duties.checkForEvents($scope.events, occurence);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Events"] = retVal;
                }
                //var occurenceEvents = Duties.checkForEvents($scope.games,occurence); // return array of the  events within this occurence (gameId, practiseId is needed to update datebase )
                //console.log(occurenceEvents);
                //check if there are any events in this  returned array
                if (Object.keys(occurenceEvents).length > 0) {

                    var duty = {};
					for(var contextLevel = 0;contextLevel <= highestCountContext;contextLevel++){ //assign player from context level 0 first the  1,2,3,4,5 etc.
						if( dutyContext[contextLevel].length >= 1 ){ // context level is not empty
							// take out one player and assign it
							duty[dutyContext[contextLevel][0]] = true;
							// move player one contextLevel up!
							console.log("move "+ dutyContext[contextLevel][0] +" from "+ contextLevel + " to " + (contextLevel+1) );
							dutyContext[contextLevel+1].push(dutyContext[contextLevel][0]);
							dutyContext[contextLevel].splice(0,1);
							break; // stop the loop from adding more people
						}
					}

                    if ($scope.duties.$getRecord(occurenceKey) === null) {
                        // this Duty item does not yet exist lets create it
                        Duties.addDuty($scope.teamId, $scope.seasonId, occurenceKey, occurence.start, occurence.end, duty);
                    }
                    else {
                        // pre existing duty overwrite the Duty players
                        Duties.updateDuty($scope.teamId, $scope.seasonId, occurenceKey, duty);
                    }
                    //update the linked Events
                    Duties.linkEvents($scope.teamId, $scope.seasonId, occurenceEvents, duty);

                }
                else {
                    // remove the  duty instance if  it already exists
                    if ($scope.duties.$getRecord(occurenceKey) === null) {
                        // this Duty item does not yet exist. thats good!
                    }
                    else {
                        // pre existing duty, it is no longer valid, lets remove it!

                        // it needs to be removed since it has no linked events
                        Duties.removeDuty($scope.teamId, $scope.seasonId, occurenceKey);
                    }
                }


            });

        }
        $scope.onItemDelete = function (item) {
            if (confirm('Dit Item verwijderen?')) {
                $scope.duties.$remove(item);
                // unlink items!

                var occurenceEvents = {};
                var retVal = {};
                if ($scope.settings.dutyGames === true) {
                    retVal = Duties.checkForEvents($scope.games, item);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Games"] = retVal;
                }
                if ($scope.settings.dutyPractises === true) {
                    retVal = Duties.checkForEvents($scope.practises, item);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Practises"] = retVal;
                }
                if ($scope.settings.dutyEvents === true) {
                    retVal = Duties.checkForEvents($scope.events, item);
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Events"] = retVal;
                }
                //console.log("occurrences");
                Duties.unlinkEvents($scope.teamId, $scope.seasonId, occurenceEvents);
            }
        };

        $scope.addDuty = function () {
            $state.go('app.newDuty');
        }

        $scope.editDuty = function (duty) {
            //console.log(duty);
            Duties.setDuty(duty.$id);
            $state.go('app.Duty_edit', {dutyId: duty.$id});
        };
        $scope.toggleGroup = function (group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
        };
        $scope.isGroupShown = function (group) {
            return $scope.shownGroup === group;
        };
    })

    .controller('Duties_EditCtrl', function ($scope, Duties, Settings, $ionicHistory, localStorageFactory, $stateParams) {
        $scope.dutyId = $stateParams.dutyId;
		$scope.useNickNames = false;
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId,$scope.seasonId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        $scope.events = localStorageFactory.getEvents();

        //console.log($scope.dutyId);
        $scope.dutyPlayers = {};
        $scope.getDuty = Duties.getDuty($scope.teamId,$scope.seasonId).then(function (duty) {
            $scope.occurence = duty;
            $scope.startDate = new Date(+duty.start);
            $scope.endDate = new Date(+duty.end);
            $scope.dutyPlayers = angular.copy(duty.Duty);
            //console.log($scope.dutyPlayers);
        });

        $scope.changeKey = function (key) {
            // temporary fix while  the number of corvee remains 1
            //console.log(key);
            delete $scope.dutyPlayers[Object.keys($scope.dutyPlayers)[0]]
            $scope.dutyPlayers[key] = true;
        }

        $scope.updateDuty = function () {
            //console.log($scope.dutyPlayers);
            var occurenceEvents = {};
            var retVal = {};
            if ($scope.settings.dutyGames === true) {
                retVal = Duties.checkForEvents($scope.games, $scope.occurence);
                if (Object.keys(retVal).length > 0)
                    occurenceEvents["Games"] = retVal;
            }
            if ($scope.settings.dutyPractises === true) {
                retVal = Duties.checkForEvents($scope.practises, $scope.occurence);
                if (Object.keys(retVal).length > 0)
                    occurenceEvents["Practises"] = retVal;
            }
            if ($scope.settings.dutyEvents === true) {
                retVal = Duties.checkForEvents($scope.events, $scope.occurence);
                if (Object.keys(retVal).length > 0)
                    occurenceEvents["Events"] = retVal;
            }
            Duties.linkEvents($scope.teamId, $scope.seasonId, occurenceEvents, $scope.dutyPlayers);
            Duties.updateDuty($scope.teamId, $scope.seasonId, $scope.dutyId, $scope.dutyPlayers);

            $ionicHistory.goBack();
        }
    })

    .controller('newDutiesCtrl', function ($scope, User, Duties, localStorageFactory, $ionicHistory, ionicDatePicker) {
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
		$scope.useNickNames = false;
        $scope.players = localStorageFactory.getPlayers();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId,$scope.seasonId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        $scope.events = localStorageFactory.getEvents();

        $scope.dutyStart = new Date();
        $scope.dutyStart.setHours(0, 0, 0, 0);
        $scope.dutyEnd = new Date();
        $scope.dutyEnd.setHours(0, 0, 0, 0);
        $scope.dutyEnd.setDate($scope.dutyStart.getDate() + 7);
		$scope.dutyStart = Date.parse($scope.dutyStart);
		$scope.dutyEnd = Date.parse($scope.dutyEnd);
        $scope.title = "Selecteer datum";

		var dutyDateObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.dutyStart = val;
					$scope.dutyEnd = val + 604800*1000; // 604800 = 1 week in seconds
					console.log($scope.dutyStart,$scope.dutyEnd);
                }
            },
            disabledDates: [            //Optional
                // new Date(2016, 2, 16),
                // new Date(2015, 3, 16),
                // new Date(2015, 4, 16),
                // new Date(2015, 5, 16),
                // new Date('Wednesday, August 12, 2015'),
                // new Date("08-16-2016"),
                // new Date(1439676000000)
            ],
            //from: new Date(2012, 1, 1), //Optional
            //to: new Date(2016, 10, 30), //Optional
            inputDate: new Date($scope.dutyStart),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };
		
		$scope.openDatePicker = function(type){
			switch(type){
				case "dutyDate": ionicDatePicker.openDatePicker(dutyDateObj);
				break;
			default: break;
			}
        };

        $scope.newDuty = function (duty) {

            if (typeof duty !== 'undefined') {
                var dutyPlayers = {};
				var tempDate = new Date($scope.dutyStart);
                dutyPlayers[duty] = true;

                //console.log($scope.dutyEnd);
                var occurenceKey = tempDate.getFullYear() + "" + tempDate.getMonth() + "" + tempDate.getDate();
                // create new occurence
                Duties.addDuty($scope.teamId, $scope.seasonId, occurenceKey, $scope.dutyStart, $scope.dutyEnd, dutyPlayers);

                // gather to be linked events
                var occurenceEvents = {};
                var retVal = {};
                if ($scope.settings.dutyGames === true) {
                    retVal = Duties.checkForEvents($scope.games, {start: $scope.dutyStart, end: $scope.dutyEnd});
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Games"] = retVal;
                }
                if ($scope.settings.dutyPractises === true) {
                    retVal = Duties.checkForEvents($scope.practises, {start: $scope.dutyStart, end: $scope.dutyEnd});
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Practises"] = retVal;
                }
                if ($scope.settings.dutyEvents === true) {
                    retVal = Duties.checkForEvents($scope.events, {start: $scope.dutyStart, end: $scope.dutyEnd});
                    if (Object.keys(retVal).length > 0)
                        occurenceEvents["Events"] = retVal;
                }
                // link all events
                //console.log(occurenceEvents);
                Duties.linkEvents($scope.teamId, $scope.seasonId, occurenceEvents, dutyPlayers);

                //return to previous page
                $ionicHistory.goBack();
            }
            else
                alert("geen speler geselecteerd");
        }
    })