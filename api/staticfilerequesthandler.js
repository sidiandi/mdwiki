'use strict';

var fs = require('fs'),
    path = require('path'),
    logger = require('../lib/logger');

module.exports = function (req, res) {
  logger.info('static url: %s', req.url);
  var fileName = path.join(__dirname, '../content/', req.url);

  fs.exists(fileName, function (exists) {
    if (!exists) {
      logger.warn('static file %$ doesnt exists', fileName);
      res.send(404, 'file not found');
      res.end();
    }
    else {
      res.sendfile(fileName);
    }
  });

};
