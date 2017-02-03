angular.module('starter.LoginControllers', [])
    .controller('ForgotPasswordCtrl', function ($scope, fireBaseData) {
        //wachtwoord vergeten
        $scope.forgot = function (em, emailValid) {
            if (emailValid === true) {
                fireBaseData.resetPassword(em);
            }
        }
    })
    .controller('RegisterCtrl', function ($scope, fireBaseData, $state, Teams, Admins, User, $timeout) {
        $scope.spinner = false;

        var usersRef = fireBaseData.ref().child("Users");

        $scope.isRegistered = User.getAuth();

        $scope.newTeam = false;
        // get passed variables from URL
        $scope.URL = window.location.href;

        if($scope.isRegistered) {
            User.getName().then(function (data) {
                console.log(data);
                $scope.currentUser = data;
            });
        }

        var teamRefPos = $scope.URL.indexOf("TeamRef=");
        if (teamRefPos !== -1) {
            $scope.teamId = $scope.URL.substr(teamRefPos + 8, 20);
            if ($scope.teamId.indexOf("&") !== -1) {
                $scope.teamId = $scope.teamId.substr(0, $scope.teamId.indexOf("&"))
            }
            Teams.getTeamName($scope.teamId).then(function (team) {
                console.log(team);
                $scope.teamName = team;
            });

        } else {
            $scope.newTeam = true;
        }

        var emailPos = $scope.URL.indexOf("Email=");
        if (emailPos !== -1) {
            $scope.em = $scope.URL.substr(emailPos + 6);
            if ($scope.em.indexOf("&") !== -1)
                $scope.em = $scope.em.substr(0, $scope.em.indexOf("&"))
        }

        //Create user methode
        $scope.register = function (teamName, newTeam, firstName, lastName, insertion, em, pwd) {
            $scope.spinner = true;
            if (newTeam === true) {
                // teams can be added  allways
                if($scope.isRegistered)
                    $scope.createTeam(teamName,  $scope.currentUser.firstName, $scope.currentUser.lastName, $scope.currentUser.insertion, $scope.currentUser.$id);
                else
                    $scope.createNewUser(teamName, newTeam, firstName, lastName, insertion, em, pwd);
            }
            else {
                // teamRef must be a key in the DB
                fireBaseData.ref().child("Teams").once('value', function (snapshot) {
                    if (snapshot.hasChild(teamName)) {
                        if($scope.isRegistered)
                            $scope.linkToExistingTeam();
                        else
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
                                    $scope.createTeam(teamName, firstName, lastName, ins, uid);
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

                                    $timeout(function() {
                                        $state.go('app.home');
                                    }, 2000);
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

        $scope.linkToExistingTeam = function () {
            var ins = "";
            if (typeof $scope.currentUser.ins == "undefined") $scope.currentUser.ins = ins;
            var teamId = $scope.teamId;
            console.log(teamId, $scope.currentUser.firstName, $scope.currentUser.ins, $scope.currentUser.lastName, $scope.currentUser.$id);


            // link User to team
            Teams.linkPlayer(teamId, $scope.currentUser.firstName, $scope.currentUser.ins, $scope.currentUser.lastName, $scope.currentUser.$id);

            // add team to User
            var usrTeams = {};
            usrTeams[teamId] = true;
            usersRef.child($scope.currentUser.$id).child("Teams").update(usrTeams);
            //
            $state.go('app.home');
        }

        $scope.createTeam = function(teamName, firstName, lastName, insertion, uid) {
            $scope.getTeamId = Teams.addTeam(teamName);
            $scope.getTeamId.then(function (data) {
                var teamId = data.$id;

                // link User to team
                Teams.linkPlayer(teamId, firstName, insertion, lastName, uid);

                // add team to User
                var usrTeams = {};
                usrTeams[teamId] = true;
                usersRef.child(uid).child("Teams").update(usrTeams);

                //add admin position
                Admins.linkAdmin(teamId, uid);

                $state.go('app.home');
            });
        }
    })


    .controller('LoginCtrl', function ($scope, firebaseRef, $state, User) {

        firebaseRef.ref().onAuth(function (authData) {
            if (authData) {
                console.log("Authenticated with uid:", authData.uid);
                User.setUser(authData);
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
                        console.log(error);
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