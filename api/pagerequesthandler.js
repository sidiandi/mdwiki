'use strict';

var q = require('q'),
    errors = require('../lib/errors'),
    paramHandler = require('../lib/requestParamHandler.js');

var userWantsToHaveMarkdown = function (query) {
  return query.format && query.format === 'markdown';
};

module.exports = function (req, res) {
  var promise, contentType, pageName,
      provider = paramHandler.createProviderFromRequest(req);

  pageName = req.params.page || 'index';

  if (userWantsToHaveMarkdown(req.query)) {
    promise = provider.getPageContent(pageName);
    contentType = 'text/plain; charset=utf-8';
  } else {
    promise = provider.getPageContentAsHtml(pageName);
    contentType = 'text/html; charset=utf-8';
  }

  promise.then(function (pageContent) {
      res.setHeader('Content-Type', contentType);
      // the Buffer solves the problem with the automatic UTF-8 conversion
      res.setHeader('Content-Length', new Buffer(pageContent).length);
      res.status(200);
      res.send(pageContent);
    })
    .catch(function (error) {
      if (error instanceof errors.FileNotFoundError) {
        res.setHeader('Content-Type', 'text/plain');
        res.send(404, 'page not found');
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.send(500, 'server error: ' + error);
      }
    })
    .done(function () {
      res.end();
    });
};
