// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var app = angular.module('starter', ['ionic',
    'ngCordova',
    'ionic-datepicker',
    'ionic-timepicker',
    'ionic.service.core',
    'ionic.service.push',
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
    'starter.PushControllers',
    'starter.filters',
    'starter.directives',
    'starter.functions',
    'starter.services',
    'firebase',
    'heatmap',
    'angular.filter'])

    .run(function ($ionicPlatform, $ionicPush) {
        $ionicPlatform.ready(function () {
            //console.log(window);
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
            //pushNotification = window.plugins.pushNotification;
            //$ionicPush.register(
            //    onNotification,
            //    errorHandler,
            //    {
            //        'badge': 'true',
            //        'sound': 'true',
            //        'alert': 'true',
            //        'ecb': 'onNotification',
            //        'senderID': 'teamaid-1144',
            //    }
            //);
        })

    })

    .config(['$ionicAppProvider', function ($ionicAppProvider) {
        $ionicAppProvider.identify({
            app_id: '7adf82e8',
            api_key: '92c16e08ed219a1f0f2d2f4f2b715ac4043f7efa209bef4e',
            dev_push: true
        });
    }])

    .config(function (ionicDatePickerProvider) {
        var datePickerObj = {
            inputDate: new Date(),
            setLabel: 'Set',
            todayLabel: 'Vandaag',
            closeLabel: 'Sluit',
            mondayFirst: false,
            weeksList: ["Z", "M", "D", "W", "D", "V", "Z"],
            monthsList: ["Jan", "Feb", "Maart", "Apr", "Mei", "Jun", "Jul", "Aug", "Sept", "Okt", "Nov", "Dec"],
            templateType: 'popup',
            from: new Date(2012, 8, 1),
            to: new Date(2018, 8, 1),
            showTodayButton: true,
            dateFormat: 'dd MMMM yyyy',
            closeOnSelect: false,
            disableWeekdays: [8]
        };
        ionicDatePickerProvider.configDatePicker(datePickerObj);
    })

    .config(function (ionicTimePickerProvider) {
        var timePickerObj = {
            inputTime: (((new Date()).getHours() * 60 * 60) + ((new Date()).getMinutes() * 60)),
            format: 12,
            step: 15,
            setLabel: 'Set',
            closeLabel: 'Sluit'
        };
        ionicTimePickerProvider.configTimePicker(timePickerObj);
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
                url: "/player/:playerId",
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
            .state('app.push', {
                url: "/push",
                views: {
                    'menuContent': {
                        templateUrl: "templates/push.html",
                        controller: 'PushCtrl'
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

window.onNotification = function (e) {

    switch (e.event) {
        case 'registered':
            if (e.regid.length > 0) {

                var device_token = e.regid;
                RequestsService.register(device_token).then(function (response) {
                    alert('registered!');
                });
            }
            break;

        case 'message':
            alert('msg received: ' + e.message);
            /*
             {
             "message": "Hello this is a push notification",
             "payload": {
             "message": "Hello this is a push notification",
             "sound": "notification",
             "title": "New Message",
             "from": "813xxxxxxx",
             "collapse_key": "do_not_collapse",
             "foreground": true,
             "event": "message"
             }
             }
             */
            break;

        case 'error':
            alert('error occured');
            break;

    }
}

window.errorHandler = function(error){
    alert('an error occured');
}
