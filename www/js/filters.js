angular.module('starter.filters', [])

    .filter('orderObjectBy', function () {
        return function (items, field, reverse) {
            var filtered = [];
            angular.forEach(items, function (item) {
                //filtered[key] = item
                filtered.push(item);
            });
            //console.log(field);
            filtered.sort(function (a, b) {
                return (a[field] > b[field] ? 1 : -1);
            });
            if (reverse) filtered.reverse();
            return filtered;
        };
    })

    .filter('cmdate', [
        '$filter', function ($filter) {
            return function (input, format) {
                return $filter('date')(new Date(+input), format);
            };
        }
    ])
    .filter('monthName', [function () {
        return function (month) { //1 = January
            var date = new Date(+month);
            var currentMonth = date.getMonth();
            var currentYear = date.getFullYear();
            var monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
                'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

            return monthNames[currentMonth] + ' ' + currentYear;
        }
    }])

    .filter('isFuture', function () {
        return function (items) {
            return items.filter(function (item) {
                var date = new Date();
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - 1);
                return item.date > Date.parse(date);
            });
        }
    })

    .filter('isFutureDuty', function () {
        return function (items) {
            return items.filter(function (item) {
                var date = new Date();
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - 1);
                return item.end > Date.parse(date);
            });
        }
    })

    .filter('isPast', function () {
        return function (items) {
            return items.filter(function (item) {
                var date = new Date();
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - 1);
                return item.date <= Date.parse(date);
            });
        }
    })

    .filter('isPastDuty', function () {
        return function (items) {
            return items.filter(function (item) {
                var date = new Date();
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - 1);
                return item.end <= Date.parse(date);
            });
        }
    });