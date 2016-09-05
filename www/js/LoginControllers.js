angular.module('starter.LoginControllers', [])
    .controller('ForgotPasswordCtrl', function ($scope, fireBaseData) {
        //wachtwoord vergeten
        $scope.forgot = function (em, emailValid) {
            if (emailValid === true) {
                fireBaseData.resetPassword(em);
            }
        }
    })
    .controller('RegisterCtrl', function ($scope, fireBaseData, $state, Teams, Admins) {
        $scope.spinner = false;

        // get passed variables from URL
        $scope.URL = window.location.href;
        var teamRefPos = $scope.URL.indexOf("TeamRef=");
        if (teamRefPos !== -1) {
            $scope.teamName = $scope.URL.substr(teamRefPos + 8, 20);
            if ($scope.teamName.indexOf("&") !== -1)
                $scope.teamName = $scope.teamName.substr(0, $scope.teamName.indexOf("&"))
        }
        var emailPos = $scope.URL.indexOf("Email=");
        if (emailPos !== -1) {
            $scope.em = $scope.URL.substr(emailPos + 6);
            if ($scope.em.indexOf("&") !== -1)
                $scope.em = $scope.em.substr(0, $scope.em.indexOf("&"))
        }


        //Create user methode
        $scope.createTeam = function (teamName, newTeam, firstName, lastName, insertion, em, pwd) {
            $scope.spinner = true;
            if (newTeam === true) {
                // teams can be added  allways
                $scope.createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
            }
            else {
                // teamRef must be a key in the DB
                fireBaseData.ref().child("Teams").once('value', function (snapshot) {
                    if (snapshot.hasChild(teamName)) {
                        $scope.createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
                    }
                    else {
                        $scope.spinner = false;
                        alert("That team does not exist");
                        return;
                    }
                });
            }
        }

        $scope.createNewUser = function (teamName, newTeam, firstName, lastName, insertion, em, pwd) {
            if (firstName != null && lastName != null && em != null && pwd != null) {
                fireBaseData.ref().createUser({
                    email: em,
                    password: pwd
                }, function (error) {
                    if (error) {
                        $scope.spinner = false;
                        switch (error.code) {
                            case "EMAIL_TAKEN":
                                alert("The new user account cannot be created because the email is already in use.");
                                break;
                            case "INVALID_EMAIL":
                                alert("The specified email is not a valid email.");
                                break;
                            default:

                                alert("Error creating user:", error);
                                $state.go($state.current, {}, {reload: true});
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
                                if (insertion != null) ins = insertion;
                                usersRef.child(uid).set({
                                    firstName: firstName,
                                    insertion: ins,
                                    lastName: lastName,
                                    email: em,
                                    registerDate: Firebase.ServerValue.TIMESTAMP
                                });

                                if (newTeam === true) {
                                    $scope.getTeamId = Teams.addTeam(teamName);
                                    $scope.getTeamId.then(function (data) {
                                        var teamId = data.$id;

                                        // link User to team
                                        Teams.linkPlayer(teamId, firstName, ins, lastName, uid);

                                        // add team to User
                                        var usrTeams = {};
                                        usrTeams[teamId] = true;
                                        usersRef.child(uid).child("Teams").set(usrTeams);

                                        //add admin position
                                        Admins.linkAdmin(teamId, uid);

                                        $state.go('app.home');
                                    });
                                }
                                else {
                                    var teamId = teamName;
                                    //console.log(teamName);

                                    // link User to team
                                    Teams.linkPlayer(teamId, firstName, ins, lastName, uid);

                                    // add team to User
                                    var usrTeams = {};
                                    usrTeams[teamId] = true;
                                    usersRef.child(uid).child("Teams").set(usrTeams);

                                    $state.go('app.home');
                                }

                            }
                            else {
                                $scope.spinner = false;
                                alert("Er ging wat mis:", error);
                            }
                        });
                    }
                });

            }
            else {
                $scope.spinner = false;
                alert('Vul alle gegevens in!');
            }
        }
    })

    .controller('LoginCtrl', function ($scope, firebaseRef, $state) {

        firebaseRef.ref().onAuth(function (authData) {
            if (authData) {
                console.log("Authenticated with uid:", authData.uid);
                $state.go('app.home');
            } else {
                console.log("Client unauthenticated.")
            }
        });
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
    .controller('LogoutCtrl', function ($scope, fireBaseData, $state) {
        //Logout method
        $scope.logout = function () {
            fireBaseData.logout();
            $state.go('login');
        }
    })