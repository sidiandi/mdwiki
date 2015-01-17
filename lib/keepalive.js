'use strict';

var http = require('http'),
    logger = require('./logger');

var callMeEvery20Minutes = 20 * 60 * 1000; // load every 20 minutes

function startKeepAlive(hostname, port) {
  setInterval(function () {
    var options = {
      host: hostname,
      port: port,
      path: '/'
    };
    http.get(options, function (res) {
      res.on('data', function (chunk) {
        logger.info('Successful response from ', hostname);
      });
    }).on('error', function (err) {
      logger.error('Error while calling mdwiki on heroku: ' + err.message);
    });
  }, callMeEvery20Minutes);
}

module.exports = startKeepAlive;