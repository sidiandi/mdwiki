'use strict';

var express = require("express"),
    path = require('path'),
    logger = require('./lib/logger'),
    api = require('./api/index'),
    pages = require('./api/pages');

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
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
app.get('/api/:page?', api);

// redirect all others to the index (HTML5 history)
//app.get('*', routes.index);

var port = app.get('port');

app.listen(port);

logger.info('Listening on port %s', port);
