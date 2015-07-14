angular.module('starter.services', [])
    .factory('firebaseRef', function () {
        var ref = new Firebase("https://amber-torch-2058.firebaseio.com/");
        return {
            ref: function () {
                return ref;
            }
        }
    })

    .factory('fireBaseData', function (firebaseRef) {
        var ref = firebaseRef.ref();
        return {
            ref: function () {
                return ref;
            },
            user: function () {
                return ref.getAuth();
            },
            logout: function () {
                ref.unauth()
            },
            resetPassword: function (email) {
                ref.resetPassword({
                    email: email
                }, function (error) {
                    if (error) {
                        switch (error.code) {
                            case "INVALID_USER":
                                alert("The specified user account does not exist.");
                                break;
                            default:
                                alert("Error resetting password:", error);
                        }
                    }
                    else {
                        alert("Password reset email sent successfully!");
                    }
                });
            }
        }
    })

    .factory('User', function ($firebaseObject, $firebaseArray, $q, $timeout, firebaseRef) {
        var ref = firebaseRef.ref();
        var user = ref.getAuth();
        //var members = $firebaseObject(ref.child("Members").child(user.uid));
        var accountData =  $firebaseArray(ref.child("Users").child(user.uid));
        console.log(accountData);
        return {
            all: function () {
                return accountData;
            },
            //getMember: function () {
            //    var deferred = $q.defer();
            //    members.$loaded(function () {
            //        deferred.resolve(members.$getRecord(selectedMember));
            //    });
            //    return deferred.promise;
            //},
            getAccountData: function() {
                return accountData;
            }
        }
    })

    .factory('Teams', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var teamsRef = ref.child("Teams");
        var teams = $firebaseArray(ref.child("Teams"));


        return {
            ref: function() {
                return teamsRef;
            },
            getTeams: function() {
                return teams;
            },
            addTeam: function(teamName) {
				var $teamsCount = teams.length;
				var thisTeam = teamsRef.child($teamsCount+":"+teamName)
                thisTeam.set({
                    teamName: teamName
                });
                var deferred = $q.defer();
                teams.$loaded(function () {
                    deferred.resolve(teams[teams.length -1]);
                });
                return deferred.promise;
            }
        }
    });