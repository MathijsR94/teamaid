angular.module('starter.PracticeControllers', [])
    .controller('PractisesCtrl', function ($scope, Practises, User, $state, Attendance, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
        $scope.ShowDelete = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.practises = localStorageFactory.getPractises();
        $scope.limit = 3;
        $scope.practisesRef = Practises.getPractisesRef($scope.teamId);
        $scope.showDelete = function () {
            //console.log('showdelete:' + $scope.ShowDelete);
            $scope.ShowDelete = !$scope.ShowDelete;
        };

        $scope.loadMore = function () {
            $scope.limit = $scope.practises.length;
        }
        $scope.loadLess = function () {
            $scope.limit = 3;
        }

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                $scope.getPractises = Practises.getPractisesArray($scope.teamId).then(function (practises) {
                    $scope.practises = practises;
                    localStorageFactory.setPractises(practises);
                });
            }
        });

        $scope.getDetail = function (practise) {
            //console.log('detail');
            //console.log(practise);
            Practises.setPractise(practise.$id);
            $state.go('app.practise', {practiseId: practise.$id});
        }

        $scope.addPractise = function () {
            $state.go('app.newPractise');
        }

        $scope.onItemDelete = function (item) {
            if (confirm('Dit Item verwijderen?')) {
                $scope.practises.$remove(item);
            }
        };

        $scope.editPractise = function (practise) {
            Practises.setPractise(practise.$id);
            $state.go('app.practise_edit', {practiseId: practise.$id});
        }
        $scope.changeAttendance = function (type, practise) {

            switch (type) {
                case "present":
                    $scope.present = Attendance.addAttendance("present", "Practises", User.getUID(), practise.$id, $scope.teamId, practise.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Practises", User.getUID(), practise.$id, $scope.teamId, practise.Present);
                    break;
                default:
                    //nothing yet
                    break;
            }
        }
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

    .controller('Practises_DetailCtrl', function ($scope, Practises, User, Teams, Attendance, Settings, localStorageFactory, $stateParams) {
        $scope.practiseId = $stateParams.practiseId;
        $scope.players = localStorageFactory.getPlayers();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.isAdmin = localStorageFactory.getAdmin();

        $scope.settings = Settings.getSettings($scope.teamId);

        Practises.getPractisesRef($scope.teamId).child($scope.practiseId).on('value', function (practiseSnap) {
            $scope.practiseDate = new Date(+practiseSnap.val().date);
            $scope.isPast = $scope.practiseDate < new Date();
            $scope.practise = practiseSnap.val();

            //update buttons
            $scope.present = Attendance.checkAttendance($scope.practise.Present, User.getUID());
            $scope.absent = Attendance.checkAttendance($scope.practise.Absent, User.getUID());
            $scope.unknown = (!$scope.present && !$scope.absent);
            $scope.unknownPlayers = Attendance.checkUnknown($scope.practise.Present, $scope.practise.Absent, $scope.players);
        });

        $scope.changeAttendance = function (type) {
            switch (type) {
                case "present":

                    if ($scope.present === true) {
                        // already logged, no change needed
                    } else {
                        $scope.present = Attendance.addAttendance("present", "Practises", User.getUID(), $scope.practiseId, $scope.teamId, $scope.practise.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Practises", User.getUID(), $scope.practiseId, $scope.teamId, $scope.practise.Present);
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
                    Attendance.addAttendance("present", "Practises", uid, $scope.practiseId, $scope.teamId, $scope.practise.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Practises", uid, $scope.practiseId, $scope.teamId, $scope.practise.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Practises", uid, $scope.practiseId, $scope.teamId, $scope.practise.Present, $scope.practise.Absent);
                    return true;
                    break;
                default:
                    //nothing
                    break;
            }
        }
    })

    .controller('Practises_EditCtrl', function ($scope, Practises, User, $stateParams, localStorageFactory, $ionicHistory) {
        $scope.practiseId = $stateParams.practiseId;
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.getPractise = Practises.getPractise($scope.teamId).then(function (practise) {
            $scope.practiseDate = new Date(+practise.date);
            $scope.title = "Selecteer datum";
            $scope.practiseTime = practise.time;
            $scope.practise = practise;
            $scope.location = practise.location;
        })

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.practiseDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.practiseTime = val;
            }
        };

        $scope.updatePractise = function (location) {
            Practises.updatePractise($scope.teamId, $scope.practiseId, $scope.practiseDate, $scope.practiseTime, location);
            $ionicHistory.goBack();
        }
    })

    .controller('newPractisesCtrl', function ($scope, User, Practises, localStorageFactory, $ionicHistory) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.practiseDate = new Date();
        $scope.practiseDate.setHours(0, 0, 0, 0);
        $scope.title = "Selecteer datum";
        $scope.practiseTime = 72000;
        $scope.weeks = 1;

        $scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.practiseDate = val;
            }
        };

        $scope.timePickerCallback = function (val) {
            if (typeof (val) === 'undefined') {
                //console.log('Time not selected');
            } else {
                //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                $scope.practiseTime = val;
            }
        };

        $scope.newPractise = function (location, repeatValue) {
            //$scope.practiseDate = Date.parse($scope.practiseDate);
            Practises.createPractise($scope.teamId, $scope.practiseDate, $scope.practiseTime, location, repeatValue);
            //return to previous page
            $ionicHistory.goBack();
        }
    })
