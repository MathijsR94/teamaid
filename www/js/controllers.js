angular.module('starter.controllers', [])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});

    })

    .controller('HomeCtrl', function ($scope) {
    })

    .controller('ForgotPasswordCtrl', function ($scope, fireBaseData) {
        //wachtwoord vergeten
        $scope.forgot = function (em) {
            fireBaseData.resetPassword(em);
        }
    })
    .controller('RegisterCtrl', function ($scope, Teams, $state) {
        //Create user methode

        $scope.addTeam = function(teamName) {
            $scope.teamId = Teams.addTeam(teamName);

        }

        $scope.createPlayer = function (firstName, lastName, insertion, em, pwd) {
            console.log('createPlayer');
            if (firstName != null && lastName != null && em != null && pwd != null) {
                Teams.teamsRef().addPlayer({
                    email: em,
                    password: pwd
                }, function (error) {
                    if (error) {
                        switch (error.code) {
                            case "EMAIL_TAKEN":
                                alert("The new user account cannot be created because the email is already in use.");
                                break;
                            case "INVALID_EMAIL":
                                alert("The specified email is not a valid email.");
                                break;
                            default:
                                alert("Error creating user:" +  error);
                        }
                    } else {
                            Teams.teamsRef().authWithPassword({
                            email: em,
                            password: pwd
                        }, function (error, authData) {
                            if (error === null) {
                                var teamsRef = Teams.teamsRef();
                                var uid = authData.uid;
                                var ins = "";
                                if (insertion != null) ins = insertion;
                                teamsRef.child(uid).set({
                                    firstName: firstName,
                                    insertion: ins,
                                    lastName: lastName,
                                    email: em,
                                    registerDate: Firebase.ServerValue.TIMESTAMP,
                                    teamId: $scope.teamId
                                });
                                $state.go('app.home');
                            } else alert("Er ging wat mis:", error);
                        });
                    }
                });
            }
            else alert('Vul alle gegevens in!');
        }
    })
    .controller('LoginCtrl', function ($scope, firebaseRef, $state) {
        //Login method
        $scope.login = function (em, pwd, isValid) {
            if (isValid) {
                firebaseRef.ref().authWithPassword({
                    email: em,
                    password: pwd
                }, function (error) {
                    if (error === null) {
                        $state.go('app.home');
                    }
                    else {

                    }
                })
            }
        }
    })
    .controller('LogoutCtrl', function ($scope, fireBaseData) {
        //Logout method
        $scope.logout = function () {
            console.log('logout');
            fireBaseData.logout();
            document.location = "/";
        }
    })

    .controller('HomeCtrl', function ($scope, User) {

    })
    .controller('PlayersCtrl', function ($scope, Teams) {
        $scope.teams = Teams.getTeams();
        $scope.addTeam = function () {
            console.log('efhui');
            Teams.addTeam('Bla', 'Zwolle');
        };
    })

