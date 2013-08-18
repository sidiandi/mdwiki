'use strict';

var fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    util = require('util'),
    child_process = require('child_process'),
    logger = require('./logger'),
    errors = require('./errors');


var clone = function (targetFolderPath, contentFolderName, repositoryUrl) {
  var deferred = Q.defer(),
      contentFolderPath = path.join(targetFolderPath, contentFolderName),
      exec = Q.nfbind(child_process.exec),
      defer = Q.defer();

  fs.exists(contentFolderPath, defer.resolve);  // See http://bit.ly/14eZBtb

  defer.promise.then(function (exists) {
    if (exists) {
      deferred.reject(new errors.ContentFolderExistsError('The content folder already exists', contentFolderPath));
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

var pull = function (appFolderPath) {
  var deferred = Q.defer(),
      contentFolderPath = path.join(appFolderPath, 'content'),
      exec = Q.nfbind(child_process.exec),
      defer = Q.defer();

  fs.exists(contentFolderPath, defer.resolve);

  defer.promise.then(function (exists) {
    if (exists) {
      var gitcommand = 'git pull origin master';
      var options = {
        cwd: contentFolderPath
      };

      exec(gitcommand, options)
        .then(function () {
          deferred.resolve();
        });
    } else {
      deferred.reject(new errors.ContentFolderNotExistsError('The content folder does not exists', contentFolderPath));
    }
  })
  .catch(function (error) {
    logger.error(error);
    deferred.reject(error);
  });

  return deferred.promise;
};

module.exports.clone = clone;
module.exports.pull = pull;
