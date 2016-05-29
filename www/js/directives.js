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
			drawChanges: '=changes',
            type: '=type',
            grid: '=grid',
            drawSpeed: '=drawspeed',
            players: '=players',
            methodToCall: '&method'
        },
        template: "<canvas id=\"playing-field\">",
        link: function (scope, elem, attrs) {
            var originX = 77;
            var originY = 100;
            var fieldImg = "../img/Field.svg";
            var canvas = document.getElementById("playing-field");
            var context;
            var source = new Image();
            source.src = fieldImg;

            var shirt = new Image();
            shirt.src = "../img/shirt.svg";

            var WIDTH;
            var HEIGHT;
            var offsetX;
            var offsetY;
            var gridSizeX;
            var gridSizeY;
            var moveX;
            var moveY;

            var dragOk = false;
            var playerDown = -1;
            var playerUp = -1;
			var changeDown = -1;
            var changeUp = -1;
            var editEnabled = false;

            if (scope.type < 1) {
                editEnabled = false;
            } else if (scope.type >= 1) {
                editEnabled = true;
            }

            function collides(rects, x, y, downObject) {
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
                        && top <= y && key != downObject) {
                        isCollision = key;
                    }
                }
                return isCollision;
            }

            function clear() {
                context.clearRect(0, 0, WIDTH, HEIGHT);
            }

            //*******************
            // Down
            //*******************

            function mDown(e) {
                var rect = canvas.getBoundingClientRect();
                down(e.pageX - rect.left, e.pageY - rect.top);
                if(playerDown != -1 || changeDown != -1)
                    canvas.onmousemove = mMove;
            }

            function tDown(e) {
                //console.log('tdown', e);
                var rect = canvas.getBoundingClientRect();
                down(e.changedTouches[0].pageX - rect.left, e.changedTouches[0].pageY - rect.top);
                //canvas.touchmove = tMove;
                if(playerDown != -1 || changeDown != -1)
                    canvas.addEventListener("touchmove", tMove, true);
            }

            function down(x, y) {
                if (editEnabled) {
                    playerDown = collides(scope.drawPlayers, x, y, playerDown);
					changeDown = collides(scope.drawChanges, x, y, changeDown);
                    if (playerDown != -1) {
                        scope.methodToCall({value: false});
                        move(x, y);
                    }
                }
            }

            //*******************
            // Up
            //*******************

            function mUp(e) {
                var rect = canvas.getBoundingClientRect();
                up(e.pageX - rect.left, e.pageY - rect.top);
                canvas.onmousemove = null;
            }

            function tUp(e) {
                var rect = canvas.getBoundingClientRect();
                up(e.changedTouches[0].pageX - rect.left, e.changedTouches[0].pageY - rect.top);
                canvas.removeEventListener("touchmove", tMove, true);
            }

            function up(x, y) {
                if (editEnabled) {
                    scope.methodToCall({value: true});
                    playerUp = collides(scope.drawPlayers, x, y, playerDown);
					changeUp = collides(scope.drawChanges, x, y, changeDown);
                    
					if (playerUp != -1 && playerDown != -1) {
                        //positie wissel
                    } 
					if (playerDown != -1 && ( playerUp === -1 && changeUp === -1)) {
						// move player on the field
                        scope.drawPlayers[playerDown].gridX = Math.floor((x - offsetX) / gridSizeX);
                        scope.drawPlayers[playerDown].gridY = Math.floor((y - offsetY) / gridSizeY);
                    }
					if (changeDown != -1 && ( playerUp === -1 && changeUp === -1)) {
						if(true){ // check if the max number of players is not exceeded.
							// place change on the field, can only be used for basis setup
						}
					}
					if ((changeDown != -1 &&  playerUp != -1) || (changeUp != -1 && playerDown != -1)) {
						// wissel player
					}

					playerDown = -1;
					playerUp = -1;
			
                }
            }

            //*******************
            // Move
            //*******************

            function mMove(e) {
                var rect = canvas.getBoundingClientRect();
                move(e.pageX - rect.left, e.pageY - rect.top);
            }

            function tMove(e) {
                var rect = canvas.getBoundingClientRect();
                move(e.changedTouches[0].pageX - rect.left, e.changedTouches[0].pageY - rect.top);
            }

            function move(x, y) {
                if (editEnabled) {
                    moveX = x - (gridSizeX / 2);
                    moveY = y - (gridSizeY / 2);   //offset headerbar
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
                            context.drawImage(shirt, moveX, moveY, gridSizeX, gridSizeY);
                            context.fillText(scope.players[key].firstName[0] + ". " + scope.players[key].lastName, moveX, moveY + (offsetY * 2.3));
                        }
                    }
					var changeIndex = 0;
					for (var key in scope.drawChanges) {
						
                        // skip loop if the property is from prototype
                        if (!scope.drawChanges.hasOwnProperty(key)) continue;
                        if (key != playerDown) {
                            var obj = scope.drawChanges[key];
                            //context.fillRect(obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY);
                            context.drawImage(shirt, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY);
                            context.fillText(scope.players[key].firstName[0] + ". " + scope.players[key].lastName, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + (offsetY * 3.3));
                        } else {
                            //context.fillRect(moveX, moveY, gridSizeX, gridSizeY);
                            context.drawImage(shirt, moveX, moveY, gridSizeX, gridSizeY);
                            context.fillText(scope.players[key].firstName[0] + ". " + scope.players[key].lastName, moveX, moveY + (offsetY * 2.3));
                        }
                    }

                }
                if (scope.grid) drawGrid(gridSizeX, gridSizeY);
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

            scope.$watch('xy', function(newValue, oldValue) {
                if (newValue) {
                    console.log('change!');
                    scope.isScrollEnabled({value : scope.xy});
                }
            }, true);

            window.addEventListener("resize", sizeCalc);
            canvas.onmousedown = mDown;
            canvas.onmouseup = mUp;
            canvas.addEventListener("touchstart", tDown, false);
            canvas.addEventListener("touchend", tUp, false);
        }
    }
});