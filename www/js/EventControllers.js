angular.module('starter.EventControllers', [])
    .controller('EventsCtrl', function ($scope, Events, User, $state, Attendance, $ionicHistory, Utility, localStorageFactory, Games, firebaseRef) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.events = localStorageFactory.getEvents();
        $scope.eventsRef = Events.getEventsRef($scope.teamId);

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getEvents = Events.getEventsArray($scope.teamId).then(function (events) {
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
                    $scope.present = Attendance.addAttendance("present", "Events", User.getUID(), event.$id, $scope.teamId, event.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Events", User.getUID(), event.$id, $scope.teamId, event.Present);
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
        $scope.isAdmin = localStorageFactory.getAdmin();

        $scope.settings = Settings.getSettings($scope.teamId);

        Events.getEventsRef($scope.teamId).child($scope.eventId).on('value', function (eventSnap) {
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
                        $scope.present = Attendance.addAttendance("present", "Events", User.getUID(), $scope.eventId, $scope.teamId, $scope.event.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Events", User.getUID(), $scope.eventId, $scope.teamId, $scope.event.Present);
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
                    Attendance.addAttendance("present", "Events", uid, $scope.eventId, $scope.teamId, $scope.event.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Events", uid, $scope.eventId, $scope.teamId, $scope.event.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Events", uid, $scope.eventId, $scope.teamId, $scope.event.Present, $scope.event.Absent);
                    return true;
                    break;
                default:
                    //nothing
                    break;
            }
        }
    })

    .controller('Events_EditCtrl', function ($scope, Events, User, $stateParams, localStorageFactory, $ionicHistory) {
        $scope.eventId = $stateParams.eventId;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.getEvent = Events.getEvent($scope.teamId).then(function (event) {
            $scope.eventDate = new Date(+event.date);
            $scope.title = "Selecteer datum";
            $scope.eventTime = event.time;
            $scope.event = event;
            $scope.location = event.location;
        })

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.eventDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.eventTime = val;
            }
        };

        $scope.updateEvent = function (location) {
            Events.updateEvent($scope.teamId, $scope.eventId, $scope.eventDate, $scope.eventTime, location);
            $ionicHistory.goBack();
        }
    })

    .controller('newEventsCtrl', function ($scope, User, Events, localStorageFactory, $ionicHistory) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.eventDate = new Date();
        $scope.eventDate.setHours(0, 0, 0, 0);
        $scope.title = "Selecteer datum";
        $scope.eventTime = 72000;

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.eventDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.eventTime = val;
            }
        };

        $scope.newEvent = function (location) {
            Events.createEvent($scope.teamId, $scope.eventDate, $scope.eventTime, location);
            //return to previous page
            $ionicHistory.goBack();
        }
    })