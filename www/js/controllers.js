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
    .controller('RegisterCtrl', function ($scope, fireBaseData, $state, Teams) {
        //Create user methode
        $scope.addTeam = function(teamName) {
            $scope.getTeamId = Teams.addTeam(teamName);
            $scope.getTeamId.then(function(data){
                $scope.teamId = data.$id;
            })

        }
        $scope.createPlayer = function (firstName, lastName, insertion, em, pwd) {
            if (firstName != null && lastName != null && em != null && pwd != null) {
                fireBaseData.ref().createUser({
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
                                alert("Error creating user:", error);
                        }
                    } else {
                        fireBaseData.ref().authWithPassword({
                            email: em,
                            password: pwd
                        }, function (error, authData) {
                            if (error === null) {
                                var usersRef = fireBaseData.ref().child("Users");
                                var uid = authData.uid;
                                var ins = "";
								var $teamId = $scope.teamId;
                                if (insertion != null) ins = insertion;
                                usersRef.child(uid).set({
                                    firstName: firstName,
                                    insertion: ins,
                                    lastName: lastName,
                                    email: em,
                                    registerDate: Firebase.ServerValue.TIMESTAMP
                                });
								console.log("dit is het TEamid:" + $teamId);
								// add team to teams
								usersRef.child(uid).child("Teams").set({
									$teamId : true
								});
								//add admin position 
								usersRef.child(uid).child("Admins").set({
									$teamId : true
								});
                                //Teams.linkPlayer($scope.teamId, uid);
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

        $scope.teams.$loaded(function() {
            for(var value in $scope.teams) {
                console.log(value);
            }
        })

    })

