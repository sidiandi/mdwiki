'use strict';

var express = require("express"),
    path = require('path'),
    logger = require('./lib/logger'),
    util = require('util'),
    everyauth = require('everyauth'),
    oauth = require('./lib/oauth'),
    pageRequestHandler = require('./api/pagerequesthandler'),
    pagesRequestHandler = require('./api/pagesrequesthandler'),
    gitRequestHandler = require('./api/gitrequesthandler'),
    searchRequestHandler = require('./api/searchrequesthandler'),
    staticFileRequestHandler = require('./api/staticfilerequesthandler'),
    serverConfigRequestHandler = require('./api/serverconfigrequesthandler');

var app = express();

var isProductionMode = app.get('env') === 'production';

var oauthConfig = isProductionMode ? require('./config/oauthconfig.js') : require('./config/oauthconfig.dev.json');
oauth.setup(['github'], oauthConfig);

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.use(express.compress());
  app.use(express.favicon());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser('7pb0HHz9Mwq5yZfw'));
  app.use(express.cookieSession());
  app.use(everyauth.middleware());
  app.use(express.logger());

  if (isProductionMode) {
    app.use(express.errorHandler());
  } else {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  }

  app.use('/font', express.static(path.join(__dirname, 'public/font')));
  app.use('/views', express.static(path.join(__dirname, 'public/views')));
  app.use('/images', express.static(path.join(__dirname, 'public/images')));

  app.use(app.router);
});

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
app.put('/api/page/page', pageRequestHandler.put);
app.get('/api/:githubUser/:githubRepository/pages', pagesRequestHandler);
app.get('/api/:githubUser/:githubRepository/page/:page?', pageRequestHandler.get);
app.put('/api/:githubUser/:githubRepository/page/:page', pageRequestHandler.put);
app.post('/api/search', searchRequestHandler.search);
app.post('/api/:githubUser/:githubRepository/search', searchRequestHandler.search);

app.post('/api/git/clone', gitRequestHandler.clone);
app.post('/api/git/pull', gitRequestHandler.pull);

app.get('/static/:githubUser/:githubRepository/*', staticFileRequestHandler);
app.get('/static/*', staticFileRequestHandler);

app.get('/git/clone', function (req, res) {
  res.sendfile('./public/index.html');
});

app.get('*', function (req, res) {
  res.sendfile('./public/index.html');
});


var port = app.get('port');
var ipAddress = app.get('ipAddress');

logger.info('Starting server in %s mode', app.get('env'));

if (process.env.HOST !== undefined) {
  var hostname = process.env.HOST;
  app.listen(port, hostname, function () {
    logger.info('Listening on port %s over hostname %s', port, hostname);
  });
} else {
  app.listen(port, function () {
    logger.info('Listening on port %s ', port);
  });
}

