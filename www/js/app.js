// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var app = angular.module('starter', ['ionic',
    'starter.GlobalControllers',
    'starter.LoginControllers',
    'starter.HomeControllers',
    'starter.PlayerControllers',
    'starter.GameControllers',
    'starter.PracticeControllers',
    'starter.EventControllers',
    'starter.DutyControllers',
    'starter.FinanceControllers',
    'starter.StatisticControllers',
    'starter.filters',
    'starter.directives',
    'starter.functions',
    'starter.services',
    'ionic-datepicker',
    'ionic-timepicker',
    'firebase',
    'angular.filter'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
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
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            })

            .state('lostpassword', {
                url: '/wachtwoordvergeten',
                templateUrl: 'templates/lostpassword.html',
                controller: 'ForgotPasswordCtrl'
            })
            .state('register', {
                url: '/registreren',
                templateUrl: 'templates/register.html',
                controller: 'RegisterCtrl'
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
            .state('app.game', {
                url: "/game/:gameId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/game_detail.html",
                        controller: 'Games_DetailCtrl'
                    }
                }
            })
            .state('app.game_edit', {
                url: "/game/:gameId/edit",
                views: {
                    'menuContent': {
                        templateUrl: "templates/game_edit.html",
                        controller: 'Games_EditCtrl'
                    }
                }
            })
            .state('app.newGame', {
                url: "/newGame",
                views: {
                    'menuContent': {
                        templateUrl: "templates/newGame.html",
                        controller: 'newGamesCtrl'
                    }
                }
            })
            .state('app.game_stats', {
                cache: false,
                url: "/game/:gameId/stats",
                views: {
                    'menuContent': {
                        templateUrl: "templates/game_stats.html",
                        controller: 'Games_StatsCtrl'
                    }
                }
            })
            .state('app.game_stat_edit', {
                cache: false,
                url: "/game/:gameId/statEdit?:statId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/game_statEdit.html",
                        controller: 'Games_StatsEditCtrl'
                    }
                }
            })
            .state('app.statistics', {
                cache: false,
                url: "/statistics",
                views: {
                    'menuContent': {
                        templateUrl: "templates/statistics.html",
                        controller: 'StatisticsCtrl'
                    }
                }
            })
            .state('app.playerDetail', {
                cache: false,
                url: "/:playerId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/player_detail.html",
                        controller: 'PlayerDetailCtrl'
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
            .state('app.practise', {
                url: "/practises/:practiseId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/practise_detail.html",
                        controller: 'Practises_DetailCtrl'
                    }
                }
            })
            .state('app.practise_edit', {
                url: "/practises/:practiseId/edit",
                views: {
                    'menuContent': {
                        templateUrl: "templates/practise_edit.html",
                        controller: 'Practises_EditCtrl'
                    }
                }
            })
            .state('app.newPractise', {
                url: "/newPractise",
                views: {
                    'menuContent': {
                        templateUrl: "templates/newPractise.html",
                        controller: 'newPractisesCtrl'
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
            .state('app.event', {
                url: "/events/:eventId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/event_detail.html",
                        controller: 'Events_DetailCtrl'
                    }
                }
            })
            .state('app.event_edit', {
                url: "/events/:eventId/edit",
                views: {
                    'menuContent': {
                        templateUrl: "templates/event_edit.html",
                        controller: 'Events_EditCtrl'
                    }
                }
            })
            .state('app.newEvent', {
                url: "/newEvent",
                views: {
                    'menuContent': {
                        templateUrl: "templates/newEvent.html",
                        controller: 'newEventsCtrl'
                    }
                }
            })
            .state('app.Finance', {
                url: "/Finance",
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
            .state('app.Duties', {
                url: "/Duties",
                views: {
                    'menuContent': {
                        templateUrl: "templates/Duties.html",
                        controller: 'DutiesCtrl'
                    }
                }
            })
            .state('app.Duty_edit', {
                url: "/Duties/:dutyId/edit",
                views: {
                    'menuContent': {
                        templateUrl: "templates/Duty_edit.html",
                        controller: 'Duties_EditCtrl'
                    }
                }
            })
            .state('app.newDuty', {
                url: "/newDuty",
                views: {
                    'menuContent': {
                        templateUrl: "templates/newDuty.html",
                        controller: 'newDutiesCtrl'
                    }
                }
            })
            .state('app.Settings', {
                url: "/Settings",
                views: {
                    'menuContent': {
                        templateUrl: "templates/Settings.html",
                        controller: 'SettingsCtrl'
                    }
                }
            })
            .state('app.invite', {
                url: "/invite/:teamId",
                views: {
                    'menuContent': {
                        templateUrl: "templates/invite.html",
                        controller: 'InvitesCtrl'
                    }
                }
            });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/login');
    });
