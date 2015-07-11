angular.module('starter.services', [])
.factory('firebaseRef', function(){
    var ref = new Firebase("https://amber-torch-2058.firebaseio.com/");
    return {
        ref: function(){
            return ref;
        }
    }
})