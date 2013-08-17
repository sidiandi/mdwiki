'use strict';

var path = require('path'),
    git = require('../lib/git'),
    logger = require('../lib/logger');

var clone = function (req, res) {
  if (!req.body.hasOwnProperty('repositoryUrl')) {
    res.statusCode = 400;
    return res.send('Error 400: repositoryUrl required');
  }

  var rootPath = path.join(__dirname, '..');

  git.clone(rootPath, 'content', req.body.repositoryUrl)
    .then(function () {
      res.statusCode = 200;
      res.send('ok');
    })
    .catch(function (error) {
      logger.error(error);
      res.statusCode = 500;
      res.send('Unexpected error while cloning: ' + error.message);
    })
    .done(function () {
      res.end();
    });
};

var pull = function (req, res) {
  var rootPath = path.join(__dirname, '..');

  git.pull(rootPath)
    .then(function () {
      res.statusCode = 200;
      res.send('ok');
    })
    .catch(function (error) {
      logger.error(error);
      res.statusCode = 500;
      res.send('Unexpected error while pull the latest changed: ' + error.message);
    })
    .done(function () {
      res.end();
    });
};

module.exports.clone = clone;
module.exports.pull = pull;
