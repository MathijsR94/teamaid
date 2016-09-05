angular.module('starter.functions', [])
function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
function removeSpecials(str) {
    var lower = str.toLowerCase();
    var upper = str.toUpperCase();

    var res = "";
    for (var i = 0; i < lower.length; ++i) {
        if (lower[i] != upper[i] || lower[i].trim() === '')
            res += str[i];
        else if (str[i] == '@') {
            res += "_at_";
        }
    }
    return res;
}

function formattedDate(date) {
    var d = new Date(+date || Date.now()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('-');
}

function calcReaminingTime(time, firstHalfStart, firstHalfEnd, secondHalfStart, secondHalfEnd) {
	var firstOrSecond;

	// correct the time if it is outside of the given game times
	if (time < firstHalfStart) {
		time = firstHalfStart;
	}
	else {
		if (time > firstHalfEnd && time < secondHalfStart) {
			time = secondHalfStart;
		}
		else {
			if (time > secondHalfEnd) {
				time = secondHalfEnd;
			}
		}
	}

	//first half  or second half?
	if (time <= firstHalfEnd) {
		return ((firstHalfEnd - time) + (secondHalfEnd - secondHalfStart)) / 60;
	}
	else {
		if (time >= secondHalfStart) {
			return ((secondHalfEnd - time)) / 60;
		}
	}
};
