'use strict';

var express = require("express"),
    path = require('path'),
    logger = require('./lib/logger'),
    api = require('./api/index'),
    util = require('util'),
    pages = require('./api/pages'),
    git = require('./api/gitroutes'),
    searchRoutes = require('./api/searchroutes'),
    staticFileHandler = require('./api/staticcontent');

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('ipAddress', process.env.HOST || '127.0.0.1');
  app.use(express.compress());
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use('/font', express.static(path.join(__dirname, 'public/font')));
  app.use('/views', express.static(path.join(__dirname, 'public/views')));
  app.use('/images', express.static(path.join(__dirname, 'public/images')));
  //app.use('/static', express.static(path.join(__dirname, 'content/static'))); // This can also handle the static file requests from the content folder

  app.use(express.logger('dev'));
  app.use(app.router);
});

var isProductionMode = app.get('env') === 'production';

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

// development only
if (!isProductionMode) {
  app.use(express.errorHandler());
}

// JSON API
app.get('/api/pages', pages);
app.get('/api/page/:page?', api);

app.post('/api/git/clone', git.clone);
app.post('/api/git/pull', git.pull);
app.post('/api/search', searchRoutes.search);

app.get('/static/*', staticFileHandler);


app.get(['/git/clone', '*'], function (req, res) {
  logger.info('Request for url: %s', req.url);
  res.sendfile('./public/index.html');
});


var port = app.get('port');
var ipAddress = app.get('ipAddress');

app.listen(port, ipAddress);

logger.info('Starting server in %s mode', app.get('env'));
logger.info('Listening on port %s over ip %s', port, ipAddress);
