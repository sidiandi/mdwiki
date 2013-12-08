'use strict';

var grepSearcher = require('../lib/grepSearcher'),
    grepResultParser = require('../lib/grepResultParser'),
    logger = require('../lib/logger'),
    Q = require('q');

var search = function (textToSearch) {
  var deferred = Q.defer();

  grepSearcher.searchForText(textToSearch)
    .then(function (searchResult) {
      grepResultParser.parse(searchResult)
        .then(function (resultObjects) {
          deferred.resolve(resultObjects);
        });
    })
    .catch(function (error) {
      deferred.reject(error);
      logger.error(error);
    });

  return deferred.promise;
};

module.exports.search = search;
