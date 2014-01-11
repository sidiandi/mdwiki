'use strict';

var q = require('q'),
    errors = require('../lib/errors'),
    oauth = require('../lib/oauth'),
    paramHandler = require('../lib/requestParamHandler.js');

var userWantsToHaveMarkdown = function (query) {
  return query.format && query.format === 'markdown';
};

var getPage = function (req, res) {
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

var updatePage = function (req, res) {
  var pageName = req.params.page,
      commitMessage = req.body.commitMessage,
      markdown = req.body.markdown;

  if (!oauth.hasSession(req)) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(401, 'not authenticated');
    res.end();
    return;
  }

  if (markdown === undefined || commitMessage === undefined) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(400, 'commitMessage and markdown are required');
    res.end();
    return;
  }

  var provider = paramHandler.createProviderFromRequest(req);
  provider.updatePage(commitMessage, pageName, markdown)
    .then(function (response) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Length', new Buffer(response.body).length);
      res.status(200);
      res.send(response.body);
    })
    .catch(function (error) {
      res.setHeader('Content-Type', 'text/plain');
      res.send(500, 'server error: ' + error);
    })
    .done(function () {
      res.end();
    });
};

module.exports.get = getPage;
module.exports.put = updatePage;
