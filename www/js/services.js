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
                return members;
            },
            getMember: function () {
                var deferred = $q.defer();
                members.$loaded(function () {
                    deferred.resolve(members.$getRecord(selectedMember));
                });
                return deferred.promise;
            },
            getAccountData: function() {
                return accountData;
            }
        }
    });