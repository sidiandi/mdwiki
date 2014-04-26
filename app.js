'use strict';

var express = require('express'),
    path = require('path'),
    logger = require('./lib/logger'),
    util = require('util'),
    oauth = require('./lib/oauth'),
    expressSetup = require('./expresssetup.js'),
    pageRequestHandler = require('./api/pagerequesthandler'),
    pagesRequestHandler = require('./api/pagesrequesthandler'),
    gitRequestHandler = require('./api/gitrequesthandler'),
    searchRequestHandler = require('./api/searchrequesthandler'),
    staticFileRequestHandler = require('./api/staticfilerequesthandler'),
    serverConfigRequestHandler = require('./api/serverconfigrequesthandler');

var app = express();

var isProductionMode = app.get('env') === 'production';

oauth.setup(['github'], isProductionMode ? require('./config/oauthconfig.json') : require('./config/oauthconfig.dev.json'));

expressSetup.middleware(app, isProductionMode);
expressSetup.staticRoutes(app);


app.get('/js/scripts.js', function (req, res) {
  if (isProductionMode) {
    logger.info('Send minified script');
    res.sendfile('./public/js/scripts.min.js');
  } else {
    res.sendfile('./public/js/scripts.js');
  }
});

app.get('/css/styles.css', function (req, res) {
  if (isProductionMode) {
    logger.info('Send minified styles');
    res.sendfile('./public/css/styles.min.css');
  }
  else {
    res.sendfile('./public/css/styles.css');
  }
});

// Authentication routes
app.get('/auth/user', oauth.user);
app.delete('/auth/user', oauth.logout);

// JSON API
app.get('/api/serverconfig', serverConfigRequestHandler);
app.get('/api/pages', pagesRequestHandler);
app.get('/api/page/:page?', pageRequestHandler.get);
app.put('/api/page/:page', oauth.ensureAuthentication, pageRequestHandler.put);
app.delete('/api/page/:page', oauth.ensureAuthentication, pageRequestHandler.delete);

app.get('/api/:githubUser/:githubRepository/pages', pagesRequestHandler);
app.get('/api/:githubUser/:githubRepository/page/:page?', pageRequestHandler.get);
app.put('/api/:githubUser/:githubRepository/page/:page', oauth.ensureAuthentication, pageRequestHandler.put);
app.delete('/api/:githubUser/:githubRepository/page/:page', oauth.ensureAuthentication, pageRequestHandler.delete);

app.post('/api/search', searchRequestHandler.search);
app.post('/api/:githubUser/:githubRepository/search', searchRequestHandler.search);

app.post('/api/git/clone', gitRequestHandler.clone);
app.post('/api/git/pull', gitRequestHandler.pull);

// Static pages
app.get('/static/:githubUser/:githubRepository/*', staticFileRequestHandler);
app.get('/static/*', staticFileRequestHandler);

// Routes that should just send the index.html
app.get('/git/clone', function (req, res) {
  res.sendfile('./public/index.html');
});

app.get('*', function (req, res) {
  res.sendfile('./public/index.html');
});

var port = process.env.PORT || 3000;

logger.info('Starting server in %s mode', app.get('env'));

if (process.env.HOST !== undefined) {
  var hostname = process.env.HOST;
  app.listen(port, hostname, function () {
    logger.info('Listening on port %s over hostname %s', port, hostname);
  });
} else {
  app.listen(port, function () {
    logger.info('Listening on port %s...', port);
  });
}

