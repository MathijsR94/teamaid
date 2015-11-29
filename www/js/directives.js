angular.module('starter.directives', [])
    .directive('autoListDivider', function ($timeout) {
        var lastDivideKey = "";

        return {
            link: function (scope, element, attrs) {
                var key = attrs.autoListDividerValue;

                var defaultDivideFunction = function (obj) {
                    //console.log(obj);
                    var date = new Date(+obj);

                    var monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni",
                        "Juli", "Augustus", "September", "Oktober", "November", "December"
                    ];

                    return monthNames[date.getMonth()] + ' ' + date.getFullYear();
                };

                var doDivide = function () {
                    var divideFunction = scope.$apply(attrs.autoListDividerFunction) || defaultDivideFunction;
                    var divideKey = divideFunction(key);

                    if (divideKey != lastDivideKey) {
                        var contentTr = angular.element("<div class='item item-divider'>" + divideKey + "</div>");
                        element[0].parentNode.insertBefore(contentTr[0], element[0]);
                    }

                    lastDivideKey = divideKey;
                }

                $timeout(doDivide, 0)
            }
        }
    })
app.directive('standardTimeNoMeridian', function () {
    return {
        restrict: 'AE',
        replace: true,
        scope: {
            etime: '=etime'
        },
        template: "<strong>{{stime}}</strong>",
        link: function (scope, elem, attrs) {

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

            scope.$watch('etime', function (newValue, oldValue) {
                scope.stime = epochParser(scope.etime, 'time');
            });

        }
    };
})

app.directive('dateTime', function () {
    return {
        restrict: 'AE',
        replace: true,
        scope: {
            sdate: '=sdate'
        },
        template: "<strong>{{date}}</strong>",
        link: function (scope, elem, attrs) {

            scope.date = dateParser(scope.sdate, 'MM-DD-YYYY');

            function dateParser(val, format) {
                if (val === null) {
                    return "invalid Date";
                }
                else {
                    var newDate = new Date(val);
                    //console.log(newDate);
                    if (format === 'MM-DD-YYYY') {

                        return (newDate.getDate() + "-" + (newDate.getMonth() + 1) + "-" + newDate.getFullYear());
                    }
                    else {
                        if (format === 'YYYY-DD-MM') {

                            return (newDate.getFullYear() + "-" + newDate.getDate() + "-" + (newDate.getMonth() + 1));
                        }
                        else { //(format === 'MM-DD-YYYY')
                            //console.log(newDate);
                            return ( newDate.getDate() + "-" + (newDate.getMonth() + 1) + "-" + newDate.getFullYear());
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