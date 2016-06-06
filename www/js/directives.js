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
        restrict: 'E',
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
        template: "<canvas>",
        link: function (scope, elem, attrs) {
            var originX = 77;
            var originY = 100;
			var gridNoX = 9;
			var gridNoY = 15;
            var fieldImg = "../img/Field.svg";
            var canvas = elem[0];//document.getElementById("playing-field");
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
			
			console.log(scope.drawChanges);
			
			

            function collides(objects, x, y, downObject) {
                //console.log(objects, x, y);
                var isCollision = -1;
                for (var key in objects) {

                    if (!objects.hasOwnProperty(key)) continue;
					var left;
					var right;
					var top;
					var bottom;
					
					if(objects[key].gridX < 1){
						left = objects[key].gridX * gridSizeX;
						right = left + gridSizeX;
						top = objects[key].gridY * gridSizeY + offsetY;
						bottom = top + gridSizeY;
					}
					else{
						left = objects[key].gridX * gridSizeX + offsetX;
						right = left + gridSizeX;
						top = objects[key].gridY * gridSizeY + offsetY;
						bottom = top + gridSizeY;
					}
					
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
					console.log(scope.drawPlayers);
					changeDown = collides(scope.drawChanges, x, y, changeDown);
					console.log(changeDown);
                    if (playerDown != -1 || changeDown != -1) {
						console.log(changeDown);
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
					if (changeDown != -1 && ( playerUp === -1 && changeUp != -1)) {
						if(true){ // check if the max number of players is not exceeded.
							
							// place change on the field, can only be used for basis setup
							updateChangePos();
						}
					}
					if ((changeDown != -1 &&  playerUp != -1) || (changeUp != -1 && playerDown != -1)) {
						// wissel player
						updateChangePos();
					}

					playerDown = -1;
					playerUp = -1;
					changeDown = -1;
					changeUp = -1;
			
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
						else{
							nickName = scope.players[key].firstName;
						}
                        if (key != playerDown) {
                            var obj = scope.drawPlayers[key];
                            context.drawImage(shirt, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + offsetY, gridSizeX, gridSizeY*0.8);
                            context.fillText(nickName, obj.gridX * gridSizeX + offsetX, obj.gridY * gridSizeY + (offsetY) + gridSizeY *0.95 ,gridSizeX);
                        } else {

                            context.drawImage(shirt, moveX, moveY, gridSizeX, gridSizeY*0.8);
                            context.fillText(nickName, moveX, moveY + gridSizeY *0.95,gridSizeX);
                        }
                    }
					for (var key in scope.drawChanges) {
						
                        // skip loop if the property is from prototype
                        if (!scope.drawChanges.hasOwnProperty(key)) continue;
						
						if (typeof scope.players[key].nickName !== 'undefined') {
							nickName = scope.players[key].nickName;
						}
						else{
							nickName = scope.players[key].firstName;
						}
                        if (key != changeDown) {
                            var obj = scope.drawChanges[key];
							if(obj.gridX < 1){
								context.drawImage(shirt, obj.gridX * gridSizeX, obj.gridY * (gridSizeY) + offsetY, gridSizeX, gridSizeY*0.8);
								context.fillText(nickName, obj.gridX * gridSizeX , obj.gridY * (gridSizeY) + (offsetY)+ gridSizeY *0.95,gridSizeX);
							}else{
								context.drawImage(shirt, (obj.gridX -1) * gridSizeX + offsetX, obj.gridY * (gridSizeY) + offsetY, gridSizeX, gridSizeY*0.8);
								context.fillText(nickName, (obj.gridX -1) * gridSizeX + offsetX, obj.gridY * (gridSizeY) + (offsetY)+ gridSizeY *0.95,gridSizeX);
							}
                            
                        } else {
                            context.drawImage(shirt, moveX, moveY, gridSizeX, gridSizeY*0.8);
                            context.fillText(nickName, moveX, moveY + gridSizeY *0.95,gridSizeX);
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
                context = canvas.getContext("2d");
                sizeCalc();
                canvas.width = WIDTH;
                canvas.height = HEIGHT;
                return setInterval(draw, scope.drawSpeed);
            }

            init();

            function sizeCalc() {
                WIDTH = window.innerWidth *0.95;
                HEIGHT = originY / (originX / WIDTH);
                offsetX = (WIDTH * 0.1); // tuning parameters left offset
                offsetY = (HEIGHT * 0.035); // tuning parameters top offset
                gridSizeX = (WIDTH - offsetX -(WIDTH * 0.1)) / gridNoX; // tuning parameters right offset
                gridSizeY = (HEIGHT - offsetY -(HEIGHT * 0.04)) / gridNoY; //tuning parameters bottom offset
            }
			
			function updateChangePos() {
				var changeIndex = 0;
				for(player in scope.drawChanges){
					scope.drawChanges[player] = {gridX:0,gridY:changeIndex}
					changeIndex += 1;
				}
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