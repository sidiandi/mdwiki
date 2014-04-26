'use strict';

var express = require('express'),
    logger = require('./lib/logger'),
    oauth = require('./lib/oauth'),
    expressSetup = require('./expresssetup.js');

var app = express();

var isProductionMode = app.get('env') === 'production';

oauth.setup(['github'], isProductionMode ? require('./config/oauthconfig.json') : require('./config/oauthconfig.dev.json'));

expressSetup.middleware(app, isProductionMode);
expressSetup.staticRoutes(app);
expressSetup.defineRoutes(app, oauth, isProductionMode);

var port = process.env.PORT || 3000;
var hostname = process.env.HOST;

logger.info('Starting server in %s mode', app.get('env'));

if (hostname) {
  app.listen(port, hostname, function () {
    logger.info('Listening on port %s over hostname %s', port, hostname);
  });
} else {
  app.listen(port, function () {
    logger.info('Listening on port %s...', port);
  });
}

