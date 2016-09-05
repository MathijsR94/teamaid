angular.module('starter.PracticeControllers', [])
    .controller('PractisesCtrl', function ($scope, Practises, User, $state, Attendance, $ionicHistory, Utility, localStorageFactory, firebaseRef) {
        $scope.ShowDelete = false;
		$scope.useNickNames = false;
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.practises = localStorageFactory.getPractises();
        $scope.limit = 3;
		
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
                $scope.getPractises = Practises.getPractisesArray($scope.teamId,$scope.seasonId).then(function (practises) {
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
                    $scope.present = Attendance.addAttendance("present", "Practises", User.getUID(), practise.$id, $scope.teamId, $scope.seasonId, practise.Absent);
                    break;
                case "absent":
                    $scope.absent = Attendance.addAttendance("absent", "Practises", User.getUID(), practise.$id, $scope.teamId, $scope.seasonId, practise.Present);
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
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.isAdmin = localStorageFactory.getAdmin();
		$scope.useNickNames = false;
        $scope.settings = Settings.getSettings($scope.teamId);

        Practises.getPractisesRef($scope.teamId,$scope.seasonId).child($scope.practiseId).on('value', function (practiseSnap) {
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
                        $scope.present = Attendance.addAttendance("present", "Practises", User.getUID(), $scope.practiseId, $scope.teamId, $scope.seasonId, $scope.practise.Absent);
                    }
                    break;
                case "absent":
                    if ($scope.absent === true) {
                        // already logged, no change needed
                    } else {
                        $scope.absent = Attendance.addAttendance("absent", "Practises", User.getUID(), $scope.practiseId, $scope.teamId, $scope.seasonId, $scope.practise.Present);
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
                    Attendance.addAttendance("present", "Practises", uid, $scope.practiseId, $scope.teamId, $scope.seasonId, $scope.practise.Absent);
                    break;
                case "absent":
                    Attendance.addAttendance("absent", "Practises", uid, $scope.practiseId, $scope.teamId, $scope.seasonId, $scope.practise.Present);
                    break;
                case 'unknown':
                    //remove  attendance, reset to unknown
                    Attendance.resetAttendance("Practises", uid, $scope.practiseId, $scope.teamId, $scope.seasonId, $scope.practise.Present, $scope.practise.Absent);
                    return true;
                    break;
                default:
                    //nothing
                    break;
            }
        }
    })

    .controller('Practises_EditCtrl', function ($scope, Practises, User, $stateParams, localStorageFactory, $ionicHistory, ionicDatePicker, ionicTimePicker) {
        $scope.practiseId = $stateParams.practiseId;
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
		
        $scope.getPractise = Practises.getPractise($scope.teamId,$scope.seasonId).then(function (practise) {
            $scope.practiseDate = new Date(+practise.date);
            $scope.title = "Selecteer datum";
            $scope.practiseTime = practise.time;
            $scope.practise = practise;
            $scope.location = practise.location;
        })

        var practiseDateObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.practiseDate = val;
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
            inputDate: new Date($scope.practiseDate),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        $scope.openDatePicker = function(type){
			switch(type){
				case "practiseDate": 
					practiseDateObj.inputDate = new Date($scope.practiseDate);
					ionicDatePicker.openDatePicker(practiseDateObj);
				break;
			default: break;
			}
        };


        var practiseTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.practiseTime = val;
                }
            },
            inputTime: $scope.practiseTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };
		
		$scope.openTimePicker = function(type) {
			switch(type){
			case "practiseTime":
				practiseTimeObj.inputTime = $scope.practiseTime;
				ionicTimePicker.openTimePicker(practiseTimeObj);
				break;
			default: break;
			}
        }

        $scope.updatePractise = function (location) {
            Practises.updatePractise($scope.teamId, $scope.seasonId, $scope.practiseId, $scope.practiseDate, $scope.practiseTime, location);
            $ionicHistory.goBack();
        }
    })

    .controller('newPractisesCtrl', function ($scope, User, Practises, localStorageFactory, $ionicHistory, ionicDatePicker, ionicTimePicker) {
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.practiseDate = new Date();
        $scope.practiseDate.setHours(0, 0, 0, 0);
		$scope.practiseDate = Date.parse($scope.practiseDate);
        $scope.title = "Selecteer datum";
        $scope.practiseTime = 72000;
        $scope.weeks = 1;

        var practiseDateObj = {
            callback: function (val) {  //Mandatory
                if (typeof(val) === 'undefined') {
                    //console.log('Date not selected');
                } else {
                    //console.log('Selected date is : ', val);
                    $scope.practiseDate = val;
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
            inputDate: new Date($scope.practiseDate),      //Optional
            mondayFirst: true,          //Optional
            closeOnSelect: false,       //Optional
            templateType: 'popup'       //Optional
        };

        $scope.openDatePicker = function(type){
			switch(type){
				case "practiseDate": ionicDatePicker.openDatePicker(practiseDateObj);
				break;
			default: break;
			}
        };


        var practiseTimeObj = {
            callback: function (val) {      //Mandatory
                if (typeof (val) === 'undefined') {
                    //console.log('Time not selected');
                } else {
                    //console.log('Selected time is : ', val);    // `val` will contain the selected time in epoch
                    $scope.practiseTime = val;
                }
            },
            inputTime: $scope.practiseTime,   //Optional
            format: 24,         //Optional
            step: 1,           //Optional
            setLabel: 'Set'    //Optional
        };
		
		$scope.openTimePicker = function(type) {
			switch(type){
			case "practiseTime":
				ionicTimePicker.openTimePicker(practiseTimeObj);
				break;
			default: break;
			}
        }

        $scope.newPractise = function (location, repeatValue) {
            //$scope.practiseDate = Date.parse($scope.practiseDate);
			//console.log($scope.teamId, $scope.seasonId, $scope.practiseDate, $scope.practiseTime, location, repeatValue);
            Practises.createPractise($scope.teamId, $scope.seasonId, $scope.practiseDate, $scope.practiseTime, location, repeatValue);
            //return to previous page
            $ionicHistory.goBack();
        }
    })
