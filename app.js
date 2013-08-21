'use strict';

var express = require("express"),
    path = require('path'),
    logger = require('./lib/logger'),
    api = require('./api/index'),
    pages = require('./api/pages'),
    git = require('./api/gitroutes'),
    searchRoutes = require('./api/searchroutes');

var app = express();

app.configure(function () {
  app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000);
  app.set('ip', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
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

// redirect all others to the index (HTML5 history)
app.get(['/git/clone', '/page/*'], function (req, res) {
  res.sendfile('./public/index.html');
});

var port = app.get('port');

app.listen(port);

logger.info('Listening on port %s', port);
