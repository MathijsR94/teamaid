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
        var accountData =  $firebaseObject(ref.child("Users").child(user.uid));
        var userTeamsRef = ref.child("Users").child(user.uid).child("Teams");
        return {
            all: function () {
                return accountData;
            },
            getName: function() {
                var deferred = $q.defer();
                accountData.$loaded(function () {
                    deferred.resolve(accountData);
                });
                return deferred.promise;
            },
            getTeam: function() {
                var teamId = $firebaseArray(userTeamsRef);
                var deferred = $q.defer();
                teamId.$loaded(function () {
                    deferred.resolve(teamId[0].$id);
                });
                return deferred.promise;
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
        var usersRef = ref.child("Users");
        var user = ref.getAuth();
        var teams = $firebaseArray(ref.child("Teams"));


        return {
            ref: function() {
                return teamsRef;
            },

            addTeam: function(teamName) {
				teams.$add({
                    teamName: teamName
                });
                var deferred = $q.defer();
                teams.$loaded(function () {
                    deferred.resolve(teams[teams.length -1]);
                });
                return deferred.promise;
            },
			linkPlayer: function(teamId, firstName, ins, lastName, uid) {
				var playersRef = teamsRef.child(teamId).child("Players").child(uid);
				playersRef.update({
                        firstName: firstName,
                        insertion: ins,
                        lastName: lastName
                });
			},
            getPlayers: function(teamId) {
                var deferred = $q.defer();
                var players = $firebaseArray(teamsRef.child(teamId).child("Players"));

                players.$loaded(function () {
                    deferred.resolve(players);
                });
                return deferred.promise;
            }
        }
    })
	
	.factory('Admins', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
        var adminsRef = ref.child("Admins");
		
        var admins = $firebaseArray(ref.child("Admins"));
		

        return {
            ref: function() {
                return adminsRef;
            },
			linkAdmin: function(teamId,uid) {
				var teamAdminsRef = adminsRef.child(teamId);
				var admin={};
				admin[uid] = true;
				teamAdminsRef.update(admin);
			}
        }
    })
	
	.factory('Activities', function ($firebaseArray, firebaseRef, $q) {
        var ref = firebaseRef.ref();
       
    })