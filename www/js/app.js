// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'firebase'])

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
          controller: 'ActivitiesCtrl'
        }
      }
    })
	.state('app.events', {
      url: "/events",
      views: {
        'menuContent': {
          templateUrl: "templates/events.html",
          controller: 'ActivitiesCtrl'
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
