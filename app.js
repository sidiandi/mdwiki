'use strict';

var express = require('express'),
    logger = require('./lib/logger'),
    oauth = require('./lib/oauth'),
    expressSetup = require('./expresssetup.js');

var app = express();

var isProductionMode = app.get('env') === 'production';

expressSetup.staticRoutes(app);
expressSetup.middleware(app, isProductionMode);

oauth.setup(app, ['github'], isProductionMode ? require('./config/oauthconfig.json') : require('./config/oauthconfig.dev.json'));

expressSetup.defineRoutes(app, oauth, isProductionMode);

var port = process.env.PORT || 3000;
var hostname = process.env.HOST || 'localhost';

logger.info('Starting server in %s mode', app.get('env'));
app.listen(port, hostname, function () {
  logger.info('Listening on port %s over hostname %s', port, hostname);
});
