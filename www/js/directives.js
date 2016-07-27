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
});

app.directive('standardTimeMeridian', function () {
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
                    var meridian = ['AM', 'PM'];

                    if (opType === 'time') {
                        var hours = parseInt(val / 3600);
                        var minutes = (val / 60) % 60;
                        var hoursRes = hours > 12 ? (hours - 12) : hours;

                        var currentMeridian = meridian[parseInt(hours / 12)];

                        return (prependZero(hoursRes) + ":" + prependZero(minutes) + " " + currentMeridian);
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
        }
    };
});

app.directive('playingField', function () {
    return {
        restrict: 'AE',
        replace: true,
        scope: {
            drawPlayers: '=',
            drawChanges: '=',
            type: '=',
            grid: '=',
            drawSpeed: '=',
            players: '=',
            scrollEnabled: '&',
            savePosChange: '&',
            eventFunction: '&'
        },
        template: "<canvas>",
        link: function (scope, elem, attrs) {
            var originX = 77;
            var originY = 100;
            var gridNoX = 11;
            var gridNoY = 15;
            var fieldImg = "./img/Field.svg";
            var canvas = elem[0];//document.getElementById("playing-field");
            var context;
            var source = new Image();
            source.src = fieldImg;
            var shirt = new Image();
            shirt.src = "./img/shirt.svg";
            var basis = false;

            var WIDTH;
            var HEIGHT;
            var offsetX;
            var offsetY;
            var gridSizeX;
            var gridSizeY;
            var moveX;
            var moveY;

            var playerDown = -1;
            var playerUp = -1;
            var changeDown = -1;
            var changeUp = -1;
            var eventDown = -1;
            var eventUp = -1;
			
            var editEnabled = false;
            var events = { ourGoal: "",theirGoal: "",yellowCard: "", redCard: "", gameEvent:"" };

            if (scope.type < 3) {
                editEnabled = false;
            } else if (scope.type >= 3) {
                editEnabled = true;
                if (scope.type === 3) {
                    basis = true;
                }
            }


            function collides(objects, x, y, downObject) {
                //console.log(objects, x, y);
                var isCollision = -1;
                for (var key in objects) {

                    if (!objects.hasOwnProperty(key)) continue;
                    var left;
                    var right;
                    var top;
                    var bottom;

                    left = objects[key].gridX * gridSizeX + offsetX;
                    right = left + gridSizeX;
                    top = objects[key].gridY * gridSizeY + offsetY;
                    bottom = top + gridSizeY;

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
                if (playerDown != -1 || changeDown != -1 || eventDown != -1)
                    canvas.onmousemove = mMove;
            }

            function tDown(e) {
                //console.log('tdown', e);
                var rect = canvas.getBoundingClientRect();
                down(e.changedTouches[0].pageX - rect.left, e.changedTouches[0].pageY - rect.top);
                //canvas.touchmove = tMove;
                if (playerDown != -1 || changeDown != -1 || eventDown != -1)
                    canvas.addEventListener("touchmove", tMove, true);
            }

            function down(x, y) {
                if (editEnabled) {
                    playerDown = collides(scope.drawPlayers, x, y, playerDown);
                    changeDown = collides(scope.drawChanges, x, y, changeDown);
					if(scope.type === 4)
						eventDown = collides(events, x, y, eventDown);
					
                    if (playerDown != -1 || changeDown != -1 || eventDown != -1) {
                        scope.scrollEnabled({value: false});
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
                    scope.scrollEnabled({value: true});
                    playerUp = collides(scope.drawPlayers, x, y, playerDown);
                    changeUp = collides(scope.drawChanges, x, y, changeDown);
					
					if(scope.type === 4)
						eventUp = collides(events, x, y, eventDown);
					
                    var gridX = Math.floor((x - offsetX) / gridSizeX);
                    var gridY = Math.floor((y - offsetY) / gridSizeY);
                    var numberOfPlayers = 0;
                    var bitMask = 0x0;

                    if (playerDown != -1)
                        bitMask = bitMask | 0x1;
                    if (playerUp != -1)
                        bitMask = bitMask | 0x2;
                    if (changeDown != -1)
                        bitMask = bitMask | 0x4;
                    if (changeUp != -1)
                        bitMask = bitMask | 0x8;
                    if (eventDown != -1)
                        bitMask = bitMask | 0x10;
                    if (eventUp != -1)
                        bitMask = bitMask | 0x20;
                    //if (eventDown)
                    for (player in scope.drawPlayers) {
                        numberOfPlayers += 1;
                    }

                    if (bitMask == 0x3) { //positie wissel
                        var eventData = {
                            player1: playerUp, player2: playerDown,
                            pos1: scope.drawPlayers[playerDown], pos2: scope.drawPlayers[playerUp],
                            comment: scope.players[playerDown].nickName + " wisselt positie met " + scope.players[playerUp].nickName
                        };
                        scope.eventFunction({type: "posChange", basis: basis, eventData: eventData});
                    }
                    if (bitMask == 0x1) { // move player on the field
                        
						if (gridX < 1 || gridX > gridNoX - 2 || gridY < 0 || gridY > gridNoY) {//move player to changes or from the field
                            var eventData = {
                                player: playerDown,
								pos: scope.drawPlayers[playerDown],
                                comment: scope.players[playerDown].nickName + " verlaat het veld "
                            };
							if (basis) { // in basis mode  return player back to changes
								scope.drawChanges[playerDown] = true;
							}
							updateChangePos();
							
                            scope.eventFunction({type: "changeOut", basis: basis, eventData: eventData});
							
                        } else { // move player to other free position
                            scope.drawPlayers[playerDown].gridX = gridX;//Math.floor((x - offsetX) / gridSizeX);
                            scope.drawPlayers[playerDown].gridY = gridY;//Math.floor((y - offsetY) / gridSizeY);
                            var eventData = {
                                player: playerDown,
                                pos: scope.drawPlayers[playerDown],
                                comment: scope.players[playerDown].nickName + " verplaatst op het veld"
                            };
                            scope.eventFunction({type: "posMove", basis: basis, eventData: eventData});
                        }
                    }
                    if (bitMask == 0x4) { // place change on the field
                        if (numberOfPlayers < 11) { // check if the max number of players is not exceeded.
							if (gridX >= 1 && gridX <= gridNoX - 2 && gridY >= 0 && gridY <= gridNoY) {//move change to the field
								scope.drawPlayers[changeDown] = {
									gridX: gridX, //Math.floor((x - offsetX) / gridSizeX),
									gridY: gridY//gridYMath.floor((y - offsetY) / gridSizeY)
								};
								delete scope.drawChanges[changeDown];
								updateChangePos();

								var eventData = {
									player: changeDown,
									pos: scope.drawPlayers[changeDown],
									comment: scope.players[changeDown].nickName + " is in het veld geplaatst"
								};
								scope.eventFunction({type: "changeIn", basis: basis, eventData: eventData});
							}
                        }
                    }
                    if (bitMask == 0x6) { // wissel player for change
                        scope.drawPlayers[changeDown] = scope.drawPlayers[playerUp]; // take over position
                        delete scope.drawChanges[changeDown];
                        delete scope.drawPlayers[playerUp];
                        if (basis) { // in basis mode  return player back to changes
                            scope.drawChanges[playerUp] = true;
                        }
                        updateChangePos();

                        var eventData = {
                            player1: changeDown, player2: playerUp,
                            pos: scope.drawPlayers[changeDown],
                            comment: scope.players[changeDown].nickName + " komt in het veld voor " + scope.players[playerUp].nickName
                        };
                        scope.eventFunction({type: "change", basis: basis, eventData: eventData});
                    }
                    if (bitMask == 0x9) { // wissel change for player
                        scope.drawPlayers[changeUp] = scope.drawPlayers[playerDown]; // take over position
                        delete scope.drawChanges[changeUp];
                        delete scope.drawPlayers[playerDown];
                        if (basis) {
                            scope.drawChanges[playerDown] = true;
                        }
                        updateChangePos();

                        var eventData = {
                            player1: changeUp, player2: playerDown,
                            pos1: scope.drawPlayers[changeUp],
                            comment: scope.players[changeUp].nickName + " komt in het veld voor" + scope.players[playerDown].nickName
                        };
                        scope.eventFunction({type: "change", basis: basis, eventData: eventData});

                    }
                    if (bitMask == 0x12) { // event on player
						var eventData = {
							player: playerUp,
						};
						scope.eventFunction({type: eventDown, basis: basis, eventData: eventData});
                    }
					if(bitMask == 0x10){ // event released on noone
						switch(eventDown) {
							case "theirGoal":
								scope.eventFunction({type: eventDown, basis: basis, eventData: {}});
								break;
							case "gameEvent":
								scope.eventFunction({type: eventDown, basis: basis, eventData: {}});
								break;
							default: break;
						}
					}
                    if (bitMask == 0x18) { // event on change
						var eventData = {
							player: changeUp,
						};
						scope.eventFunction({type: eventDown, basis: basis, eventData: eventData});
                    }

                    updateChangePos();

                    playerDown = -1;
                    playerUp = -1;
                    changeDown = -1;
                    changeUp = -1;
                    eventDown = -1;
                    eventUp = -1;

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
                    var nickName = "";
					
                    for (var key in scope.drawPlayers) {
                        // skip loop if the property is from prototype
                        if (!scope.drawPlayers.hasOwnProperty(key)) continue;

                        if (typeof scope.players[key].nickName !== 'undefined') {
                            nickName = scope.players[key].nickName;
                        }
						else {
                            nickName = scope.players[key].firstName;
                        }
                        if (key != playerDown) {
                            var obj = scope.drawPlayers[key];
                            context.drawImage(shirt, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY * 0.8);
                            context.fillText(nickName, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + (offsetY) + gridSizeY * 0.95, gridSizeX);
                        } else {
                            context.drawImage(shirt, moveX, moveY, gridSizeX, gridSizeY * 0.8);
                            context.fillText(nickName, moveX, moveY + gridSizeY * 0.95, gridSizeX);
                        }
                    }
                    for (var key in scope.drawChanges) {

                        // skip loop if the property is from prototype
                        if (!scope.drawChanges.hasOwnProperty(key)) continue;

                        if (typeof scope.players[key].nickName !== 'undefined') {
                            nickName = scope.players[key].nickName;
                        }
                        else {
                            nickName = scope.players[key].firstName;
                        }
                        if (key != changeDown) {
                            var obj = scope.drawChanges[key];
                            context.drawImage(shirt, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY * 0.8);
                            context.fillText(nickName, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + (offsetY) + gridSizeY * 0.95, gridSizeX);

                        } else {
                            context.drawImage(shirt, moveX, moveY, gridSizeX, gridSizeY * 0.8);
                            context.fillText(nickName, moveX, moveY + gridSizeY * 0.95, gridSizeX);
                        }
                    }
					if(scope.type === 4){ // only show events when type  === 4
						for (var event in events) {
							if (!events.hasOwnProperty(event)) continue;
							switch(event){
								case "yellowCard":
									context.fillStyle = "#FFFF00";
								break;
								case "redCard":
									context.fillStyle = "#FF0000";
								break;
								case "ourGoal":
									context.fillStyle = "#00FF00";
								break;
								case "theirGoal":
									context.fillStyle = "#0000FF";
								break;
								case "gameEvent":
									context.fillStyle = "#000000";
								break;
							}
							if (event != eventDown) {
								var obj = events[event];
								context.fillRect(obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY * 0.8 );
								context.fillStyle = "#000000";
								context.fillText(event, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + (offsetY) + gridSizeY * 0.95, gridSizeX);
							}
							else {
								context.fillRect(moveX, moveY, gridSizeX, gridSizeY * 0.8);
								context.fillStyle = "#000000";
								context.fillText(event, moveX, moveY + gridSizeY * 0.95, gridSizeX);
							}
							context.fillStyle = "#000000";
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
                // init changes position
                updateChangePos();
				
				if(scope.type === 4)
					updateEventPos();
				
                context = canvas.getContext("2d");
                sizeCalc();
                canvas.width = WIDTH;
                canvas.height = HEIGHT;
                //console.log(scope.drawPlayers);
                return setInterval(draw, scope.drawSpeed);
				
            }

            init();

            function sizeCalc() {
                WIDTH = window.innerWidth - 30;// 16 px is padding of  the container
                HEIGHT = originY / (originX / WIDTH);
                offsetX = (WIDTH * 0.01); // tuning parameters left offset
                offsetY = (HEIGHT * 0.038); // tuning parameters top offset
                gridSizeX = (WIDTH - offsetX - (WIDTH * 0.01)) / gridNoX; // tuning parameters right offset
                gridSizeY = (HEIGHT - offsetY - (HEIGHT * 0.04)) / gridNoY; //tuning parameters bottom offset
            }

            function updateChangePos() {
                var changeIndex = 0;
                for (player in scope.drawChanges) {
                    scope.drawChanges[player] = {gridX: 0, gridY: changeIndex};
                    changeIndex += 1;
                }
            }

            function updateEventPos() {
                var eventIndex = 0;
                for (var event in events) {
                    events[event] = {gridX: 10, gridY: eventIndex};
                    eventIndex += 2;
                }
            }

            window.addEventListener("resize", sizeCalc);
            canvas.onmousedown = mDown;
            canvas.onmouseup = mUp;
            canvas.addEventListener("touchstart", tDown, false);
            canvas.addEventListener("touchend", tUp, false);
        }
    }
});

app.directive('playerName', function () {
    return {
        restrict: 'AE',
        scope: {
            player: '=',
            nickName: '='
        },
        template: "<span>{{name}}</span>",
        link: function (scope, elem, attrs) {
            //scope.name = nameParser(scope.player, scope.nickName);

            scope.$watch('player', function (newValue, oldValue) {
                if (newValue)
                    scope.name = nameParser(scope.player, scope.nickName);
            })

            //console.log(scope.name,scope.player, scope.nickName);
            function nameParser(player, useNickName) {
                if (typeof player === 'undefined') {
                    return "invalid player";
                }
                else {
                    if (useNickName) {
                        return player.nickName;
                    } else {
                        var fullName = "";
                        fullName += player.firstName + " ";
                        if (player.insertion !== "") {
                            fullName += player.insertion + " ";
                        }
                        fullName += player.lastName;
                        return fullName;
                    }
                }
            }


        }
    };
});