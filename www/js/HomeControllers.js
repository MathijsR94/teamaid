angular.module('starter.HomeControllers', [])
    .controller('HomeCtrl', function ($scope, User, Teams, localStorageFactory, firebaseRef) {
        var ref = firebaseRef.ref();

        var uid = User.getUID();
        ref.child('Users').child(uid).child('Teams').once('value', function (teams) {
            localStorageFactory.setTeams(teams.val());

            var teamId = localStorageFactory.getTeamId();

            ref.child('Teams').child(teamId).once('value', function (teamData) {

                if (typeof teamData.val() !== 'undefined') {
                    localStorageFactory.setTeamName(teamData.val());

                    if (typeof teamData.val().Players !== 'undefined')
                        localStorageFactory.setPlayers(teamData.val().Players);
                    else
                        localStorageFactory.setPlayers({});

                    if (typeof teamData.val().InActive !== 'undefined')
                        localStorageFactory.setInactivePlayers(teamData.val().InActive);
                    else
                        localStorageFactory.setInactivePlayers({});

                    if (typeof teamData.val().Settings !== 'undefined')
                        localStorageFactory.setSettings(teamData.val().Settings);
                    else
                        localStorageFactory.setSettings({});
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

    .controller('SettingsCtrl', function ($scope, fireBaseData, User, Settings, Attendance, Statistics, localStorageFactory, firebaseRef) {

        $scope.teamId = localStorageFactory.getTeamId();
        $scope.settings = localStorageFactory.getSettings();
        $scope.isAdmin = localStorageFactory.getAdmin();
        $scope.players = localStorageFactory.getPlayers();
        $scope.externalList = {};
        $scope.nbsp = " ";

        $scope.connected = firebaseRef.connectedRef().on("value", function (snap) {
            if (snap.val() === true) {
                Settings.getRef().child($scope.teamId).child("Settings").on("value", function (settingsSnap) {
                    $scope.settings = settingsSnap.val();
                    localStorageFactory.setSettings(settingsSnap.val());
                });
                firebaseRef.ref().child("Statistics").child($scope.teamId).once('value', function (statsSnap) {
                    $scope.statistics = statsSnap.val();
                    for (gameId in $scope.statistics) {
                        if (typeof $scope.statistics[gameId].externalPlayers !== 'undefined') {
                            // we have external players in this match
                            for (externalId in $scope.statistics[gameId].externalPlayers) {
                                $scope.externalList[gameId + "?key?" + externalId] = $scope.statistics[gameId].externalPlayers[externalId].firstName;
                            }
                        }
                    }
                    console.log($scope.externalList);
                });

            }
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
        $scope.changeSetting = function (key, value) {
            //console.log(key, value);
            Settings.updateSetting(key, value, $scope.teamId);
        };
        $scope.changePassword = function (oldPW, newPW, cnfPwd) {
            if (newPW === cnfPwd) {
                fireBaseData.changePassword(User.getEmail(), oldPW, newPW);
            }
            else {
                alert("wachtwoorden zijn niet gelijk");
            }
        };
        $scope.changeExtInt = function (playerExt, playerInt) {
            if (typeof playerExt === 'undefined' || typeof playerInt === 'undefined') {
                alert("vul beide velden in");
            }
            else {
                var keys = playerExt.split("?key?");
                var gameId = keys[0];
                var extId = keys[1];
                Attendance.addAttendance("present", "Games", playerInt, gameId, $scope.teamId, []); // player must be set to present!
                //basis must be updated
                var basis = $scope.statistics[gameId].Basis;
                console.log(basis[extId]);
                if (typeof basis[extId] !== 'undefined') {
                    basis[playerInt] = basis[extId];
                    delete basis[extId];
                    firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("Basis").set(basis);
                }

                //gamelog Must be  updaed and any reference to External key must be updated
                var gameLog = $scope.statistics[gameId].GameLog;
                for (item in gameLog) {
                    var updated = false;
                    if (gameLog[item].player === extId) {
                        gameLog[item].player = playerInt;
                        updated = true;
                    }
                    else {
                        if (gameLog[item].playerIn === extId) {
                            gameLog[item].playerIn = playerInt;
                            updated = true;
                        }
                        else {
                            if (gameLog[item].playerOut === extId) {
                                gameLog[item].playerOut = playerInt;
                                updated = true;
                            }
                            else {
                                if (gameLog[item].player1 === extId) {
                                    gameLog[item].player1 = playerInt;
                                    updated = true;
                                }
                                else {
                                    if (gameLog[item].player2 === extId) {
                                        gameLog[item].player2 = playerInt;
                                        updated = true;
                                    }
                                }
                            }
                        }
                    }
                    if (updated === true)
                        firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("GameLog").child(item).update(gameLog[item]);
                }

                firebaseRef.ref().child("Statistics").child($scope.teamId).child(gameId).child("externalPlayers").child(extId).update({firstName: "<removed>"});

            }

        }
    })
