'use strict';

var fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    util = require('util'),
    child_process = require('child_process'),
    logger = require('./logger'),
    errors = require('./errors');


module.exports.clone = function (targetFolderPath, contentFolderName, repositoryUrl) {
  var deferred = Q.defer();

  var contentFolderPath = path.join(targetFolderPath, contentFolderName);

  var exec = Q.nfbind(child_process.exec);

  var defer = Q.defer();
  fs.exists(contentFolderPath, defer.resolve);  // See http://bit.ly/14eZBtb

  defer.promise.then(function (exists) {
    if (exists) {
      deferred.reject(new errors.ContentFolderExistsError('The contentfolder already existsDir', contentFolderPath));
    } else {
      var gitcommand = util.format('git clone %s %s', repositoryUrl, contentFolderName);
      var options = {
        cwd: targetFolderPath
      };

      exec(gitcommand, options)
        .then(function () {
          deferred.resolve();
        });
    }
  })
  .catch(function (error) {
    logger.error(error);
    deferred.reject(error);
  });

  return deferred.promise;
};
