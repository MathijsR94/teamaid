angular.module('starter.FinanceControllers', [])
    .controller('FinanceCtrl', function ($scope, User, Teams, Finance, localStorageFactory, $state) {
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.players = localStorageFactory.getPlayers();

        $scope.getCredits = Finance.getCredits($scope.teamId).then(function (data) {
            $scope.credits = data;
            //console.log($scope.credits);
        });


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

        $scope.addCredit = function () {
            $state.go('app.newCredit');
        }
    })

    .controller('CreditsCtrl', function ($scope, Teams, localStorageFactory, User, Finance, $state, $ionicHistory, Utility) {
        $scope.teamId = localStorageFactory.getTeamId();
        $scope.nbsp = " "; // whitespace
        $scope.players = localStorageFactory.getPlayers();
		$scope.creditDate = new Date();
        $scope.creditDate.setHours(0, 0, 0, 0);
        $scope.title = "Selecteer datum";

		
		$scope.datePickerCallback = function (val) {
            if (typeof(val) === 'undefined') {
                //console.log('Date not selected');
            } else {
                //console.log('Selected date is : ', val);
                $scope.creditDate = val;
            }
        };
        $scope.isEmpty = function (obj) {
            return Utility.isEmpty(obj);
        }
        $scope.newCredit = function (uid, value, comment, debetCredit) {
            //console.log(debetCredit);
            if (typeof comment === 'undefined') { // protect against undefined
                comment = " ";
            }
            var val = value;
            if (debetCredit !== true) {
                Finance.newCredit($scope.teamId, uid, (val * (-1)), comment, $scope.players[uid],$scope.creditDate);
                //console.log("debet");
            }
            else {
                Finance.newCredit($scope.teamId, uid, (val), comment, $scope.players[uid],$scope.creditDate);
                //console.log("credit");
            }

            $ionicHistory.goBack();
        }
    })
