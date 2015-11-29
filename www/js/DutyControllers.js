angular.module('starter.DutyControllers', [])
    .controller('DutiesCtrl', function ($scope, Teams, Games, Practises, Events, Settings, User, Duties, $state, firebaseRef, localStorageFactory) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        $scope.events = localStorageFactory.getEvents();

        $scope.players = localStorageFactory.getPlayers();

        $scope.limit = 3;
        $scope.loadMore = function () {
            $scope.limit = $scope.games.length;
        }
        $scope.loadLess = function () {
            $scope.limit = 3;
        }

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getGames = Games.getGamesArray($scope.teamId).then(function (games) {
                    $scope.games = games;
                    localStorageFactory.setGames(games);
                });
            }
            if (snap.val() === true) {
                $scope.getPractises = Practises.getPractisesArray($scope.teamId).then(function (practises) {
                    $scope.practises = practises;
                    localStorageFactory.setPractises(practises);
                });
            }
            if (snap.val() === true) {
                $scope.getEvents = Events.getEventsArray($scope.teamId).then(function (events) {
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

            var dutyPlayers = new Array();

            for (var key in $scope.players) {
                dutyPlayers.push(key);
            }
            var loopPlayers = dutyPlayers.slice();

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
            for (var i = 0; i < dutyPlayers.length; i++) {
                //actually make the backtrack go back

                backTrackDate.setDate(backTrackDate.getDate() - 7);
                var backTrackKey = backTrackDate.getFullYear() + "" + backTrackDate.getMonth() + "" + backTrackDate.getDate();
                if (typeof $scope.duties.$getRecord([backTrackKey]) === "undefined" || $scope.duties.$getRecord([backTrackKey]) === null) {
                    // no Duty here or this date does not exist
                    console.log("no duty exists");
                } else {
                    // there is a duty record here, lets see who is listed
                    //console.log("find history player", backTrackKey);
                    //console.log($scope.duties.$getRecord(backTrackKey));
                    var foundDuties = Object.keys($scope.duties.$getRecord(backTrackKey).Duty);
                    //remove from loopPlayers
                    foundDuties.forEach(function (key) {
                        //console.log(key);
                        var index = loopPlayers.indexOf(key);
                        if (index != -1)
                            loopPlayers.splice(loopPlayers.indexOf(key), 1);
                    });
                }
            }

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

                    var duty = {}
                    duty[loopPlayers[0]] = true;
                    loopPlayers.splice(0, 1);
                    ;
                    if (loopPlayers.length <= 1) {
                        loopPlayers = dutyPlayers.slice(); // reset to the original full array
                    }
                    if ($scope.duties.$getRecord(occurenceKey) === null) {
                        // this Duty item does not yet exist lets create it
                        Duties.addDuty($scope.teamId, occurenceKey, occurence.start, occurence.end, duty);
                    }
                    else {
                        // pre existing duty overwrite the Duty players
                        Duties.updateDuty($scope.teamId, occurenceKey, duty);
                    }
                    //update the linked Events
                    Duties.linkEvents($scope.teamId, occurenceEvents, duty);

                }
                else {
                    // remove the  duty instance if  it already exists
                    if ($scope.duties.$getRecord(occurenceKey) === null) {
                        // this Duty item does not yet exist. thats good!
                    }
                    else {
                        // pre existing duty, it is no longer valid, lets remove it!

                        // it needs to be removed since it has no linked events
                        Duties.removeDuty($scope.teamId, occurenceKey);
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
                Duties.unlinkEvents($scope.teamId, occurenceEvents);
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
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId);
        //get Games
        $scope.games = localStorageFactory.getGames();
        // get Practices
        $scope.practises = localStorageFactory.getPractises();
        // get Events
        // get Events
        $scope.events = localStorageFactory.getEvents();

        //console.log($scope.dutyId);
        $scope.dutyPlayers = {};
        $scope.getDuty = Duties.getDuty($scope.teamId).then(function (duty) {
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
            Duties.linkEvents($scope.teamId, occurenceEvents, $scope.dutyPlayers);
            Duties.updateDuty($scope.teamId, $scope.dutyId, $scope.dutyPlayers);

            $ionicHistory.goBack();
        }
    })

    .controller('newDutiesCtrl', function ($scope, User, Duties, localStorageFactory, $ionicHistory) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();
        $scope.settings = localStorageFactory.getSettings();
        $scope.duties = Duties.getDutiesArray($scope.teamId);
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
        $scope.title = "Selecteer datum";


        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.dutyStart = val;
                $scope.dutyEnd = new Date(+val);
                $scope.dutyEnd.setDate($scope.dutyEnd.getDate() + 7);
            }
        };

        $scope.newDuty = function (duty) {

            if (typeof duty !== 'undefined') {
                var dutyPlayers = {};
                dutyPlayers[duty] = true;

                //console.log($scope.dutyEnd);
                var occurenceKey = $scope.dutyStart.getFullYear() + "" + $scope.dutyStart.getMonth() + "" + $scope.dutyStart.getDate();
                // create new occurence
                Duties.addDuty($scope.teamId, occurenceKey, $scope.dutyStart, $scope.dutyEnd, dutyPlayers);

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
                Duties.linkEvents($scope.teamId, occurenceEvents, dutyPlayers);

                //return to previous page
                $ionicHistory.goBack();
            }
            else
                alert("geen speler geselecteerd");
        }
    })