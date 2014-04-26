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
      exec = Q.denodeify(child_process.exec);

  if (fs.existsSync(contentFolderPath)) {
    deferred.reject(new errors.ContentFolderExistsError('The content folder already exists', contentFolderPath));
  } else {
    var gitcommand = util.format('git clone %s %s', repositoryUrl, contentFolderName);
    var options = {
      cwd: targetFolderPath
    };

    exec(gitcommand, options)
      .then(function () {
        deferred.resolve();
      })
      .catch(function (error) {
        logger.error(error);
        deferred.reject(error);
      });
  }

  return deferred.promise;
};

var pull = function (appFolderPath) {
  var deferred = Q.defer(),
      contentFolderPath = path.join(appFolderPath, 'content'),
      exec = Q.denodeify(child_process.exec);

  if (fs.existsSync(contentFolderPath)) {
    var gitcommand = 'git pull origin master';
    var options = {
      cwd: contentFolderPath
    };

    exec(gitcommand, options)
      .then(function () {
        deferred.resolve();
      })
      .catch(function (error) {
        logger.error(error);
        deferred.reject(error);
      });
  } else {
    deferred.reject(new errors.ContentFolderNotExistsError('The content folder does not exists', contentFolderPath));
  }

  return deferred.promise;
};

module.exports.clone = clone;
module.exports.pull = pull;
