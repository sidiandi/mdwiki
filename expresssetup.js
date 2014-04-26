'use strict';

var express = require('express'),
    everyauth = require('everyauth'),
    logger = require('./lib/logger'),
    path = require('path'),
    pageRequestHandler = require('./api/pagerequesthandler'),
    pagesRequestHandler = require('./api/pagesrequesthandler'),
    gitRequestHandler = require('./api/gitrequesthandler'),
    searchRequestHandler = require('./api/searchrequesthandler'),
    staticFileRequestHandler = require('./api/staticfilerequesthandler'),
    serverConfigRequestHandler = require('./api/serverconfigrequesthandler');

module.exports.middleware = function (app, isProductionMode) {
  app.use(require('body-parser')());
  app.use(require('method-override')());
  app.use(require('static-favicon')(__dirname + '/public/images/favicon.ico'));
  app.use(require('cookie-parser')('7pb0HHz9Mwq5yZfw'));
  app.use(require('cookie-session')({ secret: '7pb0HHz9Mwq5yZfw' }));
  app.use(require('compression')());

  app.use(everyauth.middleware());

  if (isProductionMode) {
    app.use(require('morgan')('dev'));
    app.use(require('errorhandler')());
  } else {
    app.use(require('morgan')());
    app.use(require('errorhandler')({ dumpExceptions: true, showStack: true }));
  }
};

module.exports.staticRoutes = function (app) {
  app.use('/font', express.static(path.join(__dirname, 'public/font')));
  app.use('/views', express.static(path.join(__dirname, 'public/views')));
  app.use('/images', express.static(path.join(__dirname, 'public/images')));
};

module.exports.defineRoutes = function (app, oauth, isProductionMode) {
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

  app.route('/api/page/:page')
    .all(oauth.ensureAuthentication)
    .put(pageRequestHandler.put)
    .delete(pageRequestHandler.delete);

  app.get('/api/:githubUser/:githubRepository/pages', pagesRequestHandler);
  app.get('/api/:githubUser/:githubRepository/page/:page?', pageRequestHandler.get);

  app.route('/api/:githubUser/:githubRepository/page/:page')
    .all(oauth.ensureAuthentication)
    .put(pageRequestHandler.put)
    .delete(pageRequestHandler.delete);

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
};
