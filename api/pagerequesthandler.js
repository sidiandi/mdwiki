'use strict';

var errors = require('../lib/errors'),
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

var sendResponse = function (response, content, statusCode) {
  statusCode = statusCode || 200;
  response.status(statusCode);
  if (content) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Content-Length', new Buffer(content).length);
    response.send(content);
  }
  response.end();
};

var sendErrorResponse = function (response, error, statusCode) {
  statusCode = statusCode || 500;
  response.setHeader('Content-Type', 'text/plain');
  response.send(statusCode, 'server error: ' + error);
  response.end();
};

var savePage = function (req, res) {
  var pageName = req.params.page,
      commitMessage = req.body.commitMessage,
      markdown = req.body.markdown;

  if (markdown === undefined || commitMessage === undefined) {
    sendErrorResponse(res, new Error('commitMessage and markdown are required'), 400);
    return;
  }

  var provider = paramHandler.createProviderFromRequest(req);

  provider.savePage(commitMessage, pageName, markdown)
    .then(function (response) {
      sendResponse(res, response.body, response.statusCode);
    })
    .catch(function (error) {
      sendErrorResponse(res, error);
    });
};

var deletePage = function (req, res) {
  var pageName = req.params.page;

  var provider = paramHandler.createProviderFromRequest(req);

  provider.deletePage(pageName)
    .then(function () {
      sendResponse(res);
    })
    .catch(function (error) {
      sendErrorResponse(res, error);
    });
};

module.exports.get = getPage;
module.exports.put = savePage;
module.exports.delete = deletePage;
