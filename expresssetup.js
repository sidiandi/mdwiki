'use strict';

var express = require('express'),
    logger = require('./lib/logger'),
    path = require('path'),
    util = require('util'),
    pageRequestHandler = require('./api/pagerequesthandler'),
    pagesRequestHandler = require('./api/pagesrequesthandler'),
    searchRequestHandler = require('./api/searchrequesthandler'),
    staticFileRequestHandler = require('./api/staticfilerequesthandler'),
    serverConfigRequestHandler = require('./api/serverconfigrequesthandler'),
    bodyParser = require('body-parser');

module.exports.middleware = function (app, isProductionMode) {
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(require('method-override')());
  app.use(require('static-favicon')(__dirname + '/public/images/favicon.ico'));
  app.use(require('cookie-parser')('7pb0HHz9Mwq5yZfw'));
  app.use(require('cookie-session')({ secret: '7pb0HHz9Mwq5yZfw' }));

  if (isProductionMode) {
    app.use(require('compression')());
    app.use(require('morgan')('combined'));
    app.use(require('errorhandler')());
  } else {
    app.use(require('morgan')('tiny'));
    app.use(require('errorhandler')({ dumpExceptions: true, showStack: true }));
  }
};

module.exports.staticRoutes = function (app) {
  app.use('/font', express.static(path.join(__dirname, 'public/font')));
  app.use('/js', express.static(path.join(__dirname, 'public/js')));
  app.use('/views', express.static(path.join(__dirname, 'public/views')));
  app.use('/images', express.static(path.join(__dirname, 'public/images')));
};

module.exports.defineRoutes = function (app, oauth, isProductionMode) {
  var regExUrl = /^\/(js|css)\/(\w+)\.(js|css)$/

  app.get(regExUrl, function (req, res) {
    if (isProductionMode) {
      logger.info('Send minified script');
      var match = regExUrl.exec(req.url);
      var path = match[1];
      var fileName = match[2];
      var extension = match[3];

      res.sendFile(__dirname + util.format('/public/%s/%s.min.%s', path, fileName, extension));
    } else {
      res.sendFile(__dirname + '/public' + req.url);
    }
  });

  // Authentication routes
  app.get('/auth/user', oauth.user);
  app.delete('/auth/user', oauth.logout);

  // JSON API
  app.get('/api/serverconfig', serverConfigRequestHandler);

  app.get('/api/:githubUser/:githubRepository/pages', pagesRequestHandler);
  app.get('/api/:githubUser/:githubRepository/page/:page?', pageRequestHandler.get);

  app.route('/api/:githubUser/:githubRepository/page/:page')
    .all(oauth.ensureAuthentication)
    .put(pageRequestHandler.put)
    .delete(pageRequestHandler.delete);

  app.post('/api/:githubUser/:githubRepository/search', searchRequestHandler.search);

  // Static pages
  app.get('/static/:githubUser/:githubRepository/*', staticFileRequestHandler);

  app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
  });
};
