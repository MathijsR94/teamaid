angular.module('starter.EventControllers', [])
    .controller('EventsCtrl', function ($scope, Events, User, $state, Attendance, $ionicHistory, Utility, localStorageFactory, Games, firebaseRef) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.events = localStorageFactory.getEvents();

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getEvents = Events.getEventsArray($scope.teamId,$scope.seasonId).then(function (events) {
                    $scope.events = events;
                    //console.log(events);
                    localStorageFactory.setEvents(events);
                });
            }
        });
        $scope.showDelete = function () {
            //console.log('showdelete:' + $scope.ShowDelete);
            $scope.ShowDelete = !$scope.ShowDelete;
        };

        $scope.getDetail = function (event) {
            Events.setEvent(event.$id);
            $state.go('app.event', {eventId: event.$id});
        }

        $scope.addEvent = function () {
            $state.go('app.newEvent');
        }

        $scope.onItemDelete = function (item) {
            if (confirm('Dit Item verwijderen?')) {
                $scope.events.$remove(item);
            }
        };

        $scope.editEvent = function (event) {
            Events.setEvent(event.$id);
            $state.go('app.event_edit', {eventId: event.$id});
        }
        $scope.changeAttendance = function (type, event) {

            switch (type) {
                case "present":
                    $scope.present = Attendance.addAttendance("present", "Events", User.getUID(), event.$id, $scope.teamId, $scope.seasonId, event.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Events", User.getUID(), event.$id, $scope.teamId, $scope.seasonId, event.Present);
                    break;
                default:
                    //nothing yet
                    break;
            }
        }

    })

    .controller('Events_DetailCtrl', function ($scope, Events, User, Teams, Attendance, Settings, localStorageFactory, $stateParams) {
        $scope.eventId = $stateParams.eventId;
        $scope.players = localStorageFactory.getPlayers();
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.isAdmin = localStorageFactory.getAdmin();

        $scope.settings = Settings.getSettings($scope.teamId,$scope.seasonId);

        Events.getEventsRef($scope.teamId,$scope.seasonId).child($scope.eventId).on('value', function (eventSnap) {
            $scope.eventDate = new Date(+eventSnap.val().date);
            $scope.event = eventSnap.val();

            //update buttons
            $scope.present = Attendance.checkAttendance($scope.event.Present, User.getUID());
            $scope.absent = Attendance.checkAttendance($scope.event.Absent, User.getUID());
            $scope.unknown = (!$scope.present && !$scope.absent);
            $scope.unknownPlayers = Attendance.checkUnknown($scope.event.Present, $scope.event.Absent, $scope.players);
        });

        $scope.changeAttendance = function (type) {
            switch (type) {
                case "present":

                    if ($scope.present === true) {
                        // already logged, no change needed
                    } else {
                        $scope.present = Attendance.addAttendance("present", "Events", User.getUID(), $scope.eventId, $scope.teamId, $scope.seasonId, $scope.event.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Events", User.getUID(), $scope.eventId, $scope.teamId, $scope.seasonId, $scope.event.Present);
                    }
                    break;
                default:
                    //nothing yet
                    break;
            }
        }
        $scope.forceAttendance = function (type, uid) {
            switch (type) {
                case "present":
                    Attendance.addAttendance("present", "Events", uid, $scope.eventId, $scope.teamId, $scope.seasonId, $scope.event.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Events", uid, $scope.eventId, $scope.teamId, $scope.seasonId, $scope.event.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Events", uid, $scope.eventId, $scope.teamId, $scope.seasonId, $scope.event.Present, $scope.event.Absent);
                    return true;
                    break;
                default:
                    //nothing
                    break;
            }
        }
    })

    .controller('Events_EditCtrl', function ($scope, Events, User, $stateParams, localStorageFactory, $ionicHistory, ionicDatePicker, ionicTimePicker) {
        $scope.eventId = $stateParams.eventId;
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
		
        $scope.getEvent = Events.getEvent($scope.teamId,$scope.seasonId).then(function (event) {
            $scope.eventDate = event.date;
            $scope.title = "Selecteer datum";
            $scope.eventTime = event.time;
            $scope.event = event;
            $scope.location = event.location;
        })

		var eventDateObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.eventDate = val;
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
            inputDate: new Date($scope.eventDate),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        $scope.openDatePicker = function(type){
			switch(type){
				case "eventDate": 
					eventDateObj.inputDate = new Date($scope.eventDate);
					ionicDatePicker.openDatePicker(eventDateObj);
				break;
			default: break;
			}
        };


        var eventTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.eventTime = val;
                }
            },
            inputTime: $scope.eventTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };
		
		$scope.openTimePicker = function(type) {
			switch(type){
			case "eventTime":
				eventTimeObj.inputTime = $scope.eventTime;
				ionicTimePicker.openTimePicker(eventTimeObj);
				break;
			default: break;
			}
        }

        $scope.updateEvent = function (location) {
            Events.updateEvent($scope.teamId, $scope.seasonId, $scope.eventId, $scope.eventDate, $scope.eventTime, location);
            $ionicHistory.goBack();
        }
    })

    .controller('newEventsCtrl', function ($scope, User, Events, localStorageFactory, $ionicHistory, ionicDatePicker, ionicTimePicker) {
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.eventDate = new Date();
        $scope.eventDate.setHours(0, 0, 0, 0);
		$scope.eventDate = Date.parse($scope.eventDate);
        $scope.title = "Selecteer datum";
        $scope.eventTime = 72000;

		var eventDateObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.eventDate = val;
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
            inputDate: new Date($scope.eventDate),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        $scope.openDatePicker = function(type){
			switch(type){
				case "eventDate": ionicDatePicker.openDatePicker(eventDateObj);
				break;
			default: break;
			}
        };


        var eventTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.eventTime = val;
                }
            },
            inputTime: $scope.eventTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };
		
		$scope.openTimePicker = function(type) {
			switch(type){
			case "eventTime":
				ionicTimePicker.openTimePicker(eventTimeObj);
				break;
			default: break;
			}
        }

        $scope.newEvent = function (location) {
            Events.createEvent($scope.teamId, $scope.seasonId, $scope.eventDate, $scope.eventTime, location);
            //return to previous page
            $ionicHistory.goBack();
        }
    })