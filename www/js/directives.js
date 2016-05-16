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
});

app.directive('playingField', function () {
    return {
        restrict: 'AE',
        replace: true,
        scope: {
            drawPlayers: '=lineup',
            type: '=type',
            grid: '=grid',
            drawSpeed: '=drawspeed',
            players: '=players'
        },
        template: "<canvas id=\"playing-field\">",
        link: function (scope, elem, attrs) {
            console.log(scope);

            var originX = 77;
            var originY = 100;
            var fieldImg = "../img/Field.svg";
            var canvas = document.getElementById("playing-field");
            var canvasSubs = document.getElementById("subs");
            var context;
            var contextSubs;
            var source = new Image();
            source.src = fieldImg;

            var shirt = new Image();
            shirt.src = "../img/shirt.svg";


            var WIDTH;// = image.width;
            var HEIGHT;// = originY/(originX/WIDTH);
            var offsetX;// = (WIDTH*0.07);
            var offsetY;// = (HEIGHT*0.05);
            var gridSizeX;// = (WIDTH - offsetX*2)/9;
            var gridSizeY;
            var moveX;
            var moveY;


            var dragOk = false;
            var playerDown = -1;
            var playerUp = -1;
            var editEnabled = false;

            if (scope.type < 1) {
                editEnabled = false;
            } else if (scope.type >= 1) {
                editEnabled = true;
            }

            function collides(rects, x, y) {
                //console.log(rects, x, y);
                var isCollision = -1;
                for (var key in rects) {

                    if (!rects.hasOwnProperty(key)) continue;

                    var left = rects[key].gridX * gridSizeX + offsetX;
                    var right = left + gridSizeX;
                    var top = rects[key].gridY * gridSizeY + offsetY;
                    var bottom = top + gridSizeY;

                    if (right >= x
                        && left <= x
                        && bottom >= y
                        && top <= y && key != playerDown) {
                        isCollision = key;
                    }
                }
                return isCollision;
            }

            function clear() {
                context.clearRect(0, 0, WIDTH, HEIGHT);
            }

            function myMove(e) {
                if (editEnabled) {
                    moveX = e.pageX - canvas.offsetLeft - (gridSizeX / 2);
                    moveY = e.pageY - canvas.offsetTop - (gridSizeY / 2) - 44;   //offset headerbar
                }
            }

            function myDown(e) {
                if (editEnabled) {
                    playerDown = collides(scope.drawPlayers, e.offsetX, e.offsetY);
                    if (playerDown != -1) {
                        myMove(e);
                        canvas.onmousemove = myMove;
                    }
                }
            }

            function myUp(e) {
                if (editEnabled) {
                    dragOk = false;
                    canvas.onmousemove = null;
                    playerUp = collides(scope.drawPlayers, e.offsetX, e.offsetY);
                    if (playerUp != -1) {
                        // wissel spelers
                    } else if (playerDown != -1) {
                        scope.drawPlayers[playerDown].gridX = Math.floor((e.offsetX - offsetX) / gridSizeX);
                        scope.drawPlayers[playerDown].gridY = Math.floor((e.offsetY - offsetY) / gridSizeY);
                    }
                    else {

                    }

                    playerDown = -1;
                    playerUp = -1;
                }
            }


            function draw() {
                clear();
                if (context) {
                    canvas.width = WIDTH;
                    canvas.height = HEIGHT;
                    context.drawImage(source, 0, 0, WIDTH, HEIGHT);
                    context.lineWidth = 0.1;
                    for (var key in scope.drawPlayers) {
                        // skip loop if the property is from prototype
                        if (!scope.drawPlayers.hasOwnProperty(key)) continue;
                        if (key != playerDown) {
                            var obj = scope.drawPlayers[key];
                            //context.fillRect(obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY);
                            context.drawImage(shirt, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY);
                            context.fillText(scope.players[key].firstName[0] + ". " + scope.players[key].lastName, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + (offsetY * 3.3));
                        } else {
                            //context.fillRect(moveX, moveY, gridSizeX, gridSizeY);
                            context.drawImage(shirt,moveX, moveY, gridSizeX, gridSizeY);
                            context.fillText(scope.players[key].firstName[0] + ". " + scope.players[key].lastName, moveX, moveY + (offsetY * 2.3));

                        }
                    }

                }
                if (scope.grid)
                    drawGrid(gridSizeX, gridSizeY);
            }

            function drawGrid(sizeX, sizeY) {
                context.fillStyle = '#FF0000';
                for (var y = (offsetY); y < canvas.height; y += sizeY) {
                    context.fillRect(0, y, canvas.width, 1);
                }
                for (var x = (offsetX); x < canvas.width; x += sizeX) {
                    context.fillRect(x, 0, 1, canvas.height);
                }
            }

            function init() {
                context = canvas.getContext("2d");
                sizeCalc();
                canvas.width = WIDTH;
                canvas.height = HEIGHT;
                return setInterval(draw, scope.drawSpeed);
            }

            init();

            function sizeCalc() {
                WIDTH = window.innerWidth;
                HEIGHT = originY / (originX / WIDTH);
                offsetX = (WIDTH * 0.09); // tuning parameters
                offsetY = (HEIGHT * 0.035); // tuning parameters
                gridSizeX = (WIDTH - offsetX * 2) / 9;
                gridSizeY = (HEIGHT - offsetY * 2) / 15;
            }

            window.addEventListener("resize", sizeCalc);
            canvas.onmousedown = myDown;
            canvas.onmouseup = myUp;
            canvas.touchstart = myDown;
            canvas.touchend = myDown;
        }
    }
});