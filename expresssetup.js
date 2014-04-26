'use strict';

var express = require('express'),
    everyauth = require('everyauth'),
    path = require('path');

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
