'use strict';

var fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    util = require('util'),
    child_process = require('child_process'),
    logger = require('./logger');


module.exports.clone = function (targetFolderPath, contentFolderName, repositoryUrl) {
  var deferred = Q.defer();

  var gitcommand = util.format('git clone %s %s', repositoryUrl, contentFolderName);

  var options = {
    cwd: targetFolderPath
  };

  child_process.exec(gitcommand, options, function (error, stdout) {
    if (error) {
      logger.error(error);
      deferred.reject(error);
    }
    deferred.resolve();
  });

  return deferred.promise;
};
