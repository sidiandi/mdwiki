'use strict';

var express = require("express"),
    path = require('path'),
    logger = require('./lib/logger'),
    util = require('util'),
    pageRequestHandler = require('./api/pagerequesthandler'),
    pagesRequestHandler = require('./api/pagesrequesthandler'),
    gitRequestHandler = require('./api/gitrequesthandler'),
    searchRequestHandler = require('./api/searchrequesthandler'),
    staticFileRequestHandler = require('./api/staticfilerequesthandler');

var app = express();

var isProductionMode = app.get('env') === 'production';

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('ipAddress', process.env.HOST || '127.0.0.1');
  app.use(express.compress());
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
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


// JSON API
app.get('/api/pages', pagesRequestHandler);
app.get('/api/page/:page?', pageRequestHandler);

app.post('/api/git/clone', gitRequestHandler.clone);
app.post('/api/git/pull', gitRequestHandler.pull);
app.post('/api/search', searchRequestHandler.search);

app.get('/static/*', staticFileRequestHandler);


app.get(['/git/clone', '*'], function (req, res) {
  logger.info('Request for url: %s', req.url);
  res.sendfile('./public/index.html');
});


var port = app.get('port');
var ipAddress = app.get('ipAddress');

app.listen(port, ipAddress);

logger.info('Starting server in %s mode', app.get('env'));
logger.info('Listening on port %s over ip %s', port, ipAddress);
