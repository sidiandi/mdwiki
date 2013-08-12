'use strict';

var fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    util = require('util'),
    exec = require('child_process').exec,
    logger = require('./logger');


module.exports.clone = function (targetFolderPath, contentFolderName, repositoryUrl) {
  var deferred = Q.defer();

  var gitcommand = util.format('git clone %s %s', repositoryUrl, contentFolderName);

  exec(gitcommand, function (error, stdout) {
    if (error) {
      logger.error(error);
      deferred.reject(error);
    }
    deferred.resolve();
  });

  return deferred.promise;
};
