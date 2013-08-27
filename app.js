'use strict';

var express = require("express"),
    path = require('path'),
    logger = require('./lib/logger'),
    api = require('./api/index'),
    pages = require('./api/pages'),
    git = require('./api/gitroutes'),
    searchRoutes = require('./api/searchroutes'),
    staticFileHandler = require('./api/staticcontent');

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('ip', process.env.HOST || '127.0.0.1');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
});

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
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

app.listen(port, app.get('ip'));

logger.info('Listening on port %s over ip %s', port, app.get('ip'));
