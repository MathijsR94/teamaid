// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var app = angular.module('starter', ['ionic', 'ionic-datepicker','ionic-timepicker','starter.controllers', 'starter.services', 'firebase'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

app.directive('standardTimeNoMeridian', function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      etime: '=etime'
    },
    template: "<strong>{{stime}}</strong>",
    link: function(scope, elem, attrs) {

      scope.stime = epochParser(scope.etime, 'time');

      function prependZero(param) {
        if (String(param).length < 2) {
          return "0" + String(param);
        }
        return param;
      }

      function epochParser(val, opType) {
        if (val === null) {
          return "00:00";
        } else {
          if (opType === 'time') {
            var hours = parseInt(val / 3600);
            var minutes = (val / 60) % 60;

            return (prependZero(hours) + ":" + prependZero(minutes));
          }
        }
      }

      scope.$watch('etime', function(newValue, oldValue) {
        scope.stime = epochParser(scope.etime, 'time');
      });

    }
  };
})

app.directive('dateTime', function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      sdate: '=sdate'
    },
    template: "<strong>{{date}}</strong>",
    link: function(scope, elem, attrs) {

		scope.date = dateParser(scope.sdate,'MM-DD-YYYY');
		
		function dateParser(val, format) {
			if (val === null) {
			  return "invalid Date";
			} 
			else{
				var newDate = new Date(val);
				if (format === 'MM-DD-YYYY') {
				
				return (newDate.getDate() + "-" + (newDate.getMonth()+1) + "-" + newDate.getFullYear());
				}
				else {
					if (format === 'YYYY-DD-MM') {

						return (newDate.getFullYear() + "-" + newDate.getDate() + "-" +(newDate.getMonth()+1));
					}
					else{ //(format === 'MM-DD-YYYY') 
						console.log(newDate);
						return ( newDate.getDate() + "-" + (newDate.getMonth()+1) + "-" + newDate.getFullYear());
					}
				}
			}
		}
		
		//scope.$watch('sdate', function(newValue, oldValue) {
		//scope.date = dateParser(scope.sdate,'MM-DD-YYYY');
		//});

    }
  };
})
 
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
      .state('tab', {
          url: "/tab",
          abstract: true,
          templateUrl: "templates/tabs.html"
      })

      .state('tab.login', {
          url: '/login',
          views: {
              'tab-account': {
                  templateUrl: 'templates/login.html',
                  controller: 'LoginCtrl'
              }
          }
      })

      .state('tab.lostpassword', {
          url: '/wachtwoordvergeten',
          views: {
              'tab-lostpassword': {
                  templateUrl: 'templates/lostpassword.html',
                  controller: 'ForgotPasswordCtrl'
              }
          }
      })

      .state('tab.register', {
          url: '/registreren',
          views: {
              'tab-register': {
                  templateUrl: 'templates/register.html',
                  controller: 'RegisterCtrl'
              }
          }
      })

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })
      .state('app.home', {
          url: "/home",
          views: {
              'menuContent': {
                  templateUrl: "templates/home.html",
                  controller: 'HomeCtrl'
              }
          }
      })
    .state('app.players', {
      url: "/spelers",
      views: {
        'menuContent': {
          templateUrl: "templates/players.html",
          controller: 'PlayersCtrl'
        }
      }
    })
	.state('app.games', {
      url: "/games",
      views: {
        'menuContent': {
          templateUrl: "templates/games.html",
          controller: 'GamesCtrl'
        }
      }
    })
	.state('app.newGame', {
      url: "/newGame",
      views: {
        'menuContent': {
          templateUrl: "templates/newGame.html",
          controller: 'GamesCtrl'
        }
      }
    })
	.state('app.practises', {
      url: "/practises",
      views: {
        'menuContent': {
          templateUrl: "templates/practises.html",
          controller: 'PractisesCtrl'
        }
      }
    })
	.state('app.newPractise', {
      url: "/newPractise",
      views: {
        'menuContent': {
          templateUrl: "templates/newPractise.html",
          controller: 'PractisesCtrl'
        }
      }
    })
	.state('app.events', {
      url: "/events",
      views: {
        'menuContent': {
          templateUrl: "templates/events.html",
          controller: 'EventsCtrl'
        }
      }
    })
	.state('app.Finance', {
      url: "/Finanance",
      views: {
        'menuContent': {
          templateUrl: "templates/Finance.html",
          controller: 'FinanceCtrl'
        }
      }
    })
	.state('app.newCredit', {
      url: "/newCedit",
      views: {
        'menuContent': {
          templateUrl: "templates/newCredit.html",
          controller: 'CreditsCtrl'
        }
      }
    })
	.state('app.invite', {
      url: "/invite",
      views: {
        'menuContent': {
          templateUrl: "templates/invite.html",
          controller: 'InvitesCtrl'
        }
      }
    });
	
	
	
	
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/login');
});
