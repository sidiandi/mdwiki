'use strict';

var Q = require('q'),
    util = require('util'),
    logger = require('./logger'),
    errors = require('./errors');

var parse = function (textToParse){
    var deferred = Q.defer();

    var result = [];
    if (textToParse === ''){
        deferred.resolve(result);
    }

    return deferred.promise;
};

module.exports.parse = parse;