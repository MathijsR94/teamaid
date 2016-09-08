angular.module('starter.FinanceControllers', [])
    .controller('FinanceCtrl', function ($scope, User, Teams, Finance, localStorageFactory, $state) {
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.teamId = localStorageFactory.getTeamId();
		$scope.seasonId = localStorageFactory.getSeasonId();
        $scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.players = localStorageFactory.getPlayers();

		if (typeof $scope.inactivePlayers !== 'undefined') {
			$scope.players = angular.extend($scope.players, $scope.inactivePlayers);
		}

        $scope.getCredits = Finance.getCredits($scope.teamId,$scope.seasonId).then(function (data) {
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
		$scope.seasonId = localStorageFactory.getSeasonId();
		$scope.inactivePlayers = localStorageFactory.getInactivePlayers();
        $scope.players = localStorageFactory.getPlayers();

		if (typeof $scope.inactivePlayers !== 'undefined') {
			$scope.players = angular.extend($scope.players, $scope.inactivePlayers);
		}
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
                Finance.newCredit($scope.teamId, $scope.seasonId, uid, (val * (-1)), comment, $scope.players[uid]);
                //console.log("debet");
            }
            else {
                Finance.newCredit($scope.teamId, $scope.seasonId, uid, (val), comment, $scope.players[uid]);
                //console.log("credit");
            }

            $ionicHistory.goBack();
        }
    })
