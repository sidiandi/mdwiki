'use strict';

var fs = require('fs'),
    path = require('path'),
    md = require("node-markdown").Markdown,
    child_process = require('child_process'),
    Q = require('q'),
    util = require('util'),
    logger = require('./logger'),
    errors = require('./errors');

var searchForText = function (folderToSearch, textToSearch) {
  var deferred = Q.defer(),
      exec = Q.nfbind(child_process.exec),
      defer = Q.defer();

  fs.exists(folderToSearch, defer.resolve);

  defer.promise.then(function (exists) {
    if (!exists) {
      deferred.reject(new errors.ContentFolderExistsError('The content folder does not exists', folderToSearch));
    } else {
      var grepCommand = util.format('grep -i "%s" *.*', textToSearch);
      var options = {
        cwd: folderToSearch
      };

      exec(grepCommand, options)
      .then(function (searchResult) {
        logger.info('Result for search for %s with grep: %s', textToSearch, searchResult);
        deferred.resolve(searchResult[0]);
      })
      .catch(function (error) {
        logger.error(error);
        deferred.resolve('');
      });
    }
  })
  .catch(function (error) {
    logger.error(error);
    deferred.reject(error);
  });

  return deferred.promise;
};

module.exports.searchForText = searchForText;