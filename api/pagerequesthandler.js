'use strict';

var q = require('q'),
    errors = require('../lib/errors'),
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

var sendResponse = function (response, html, isNewPage) {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Content-Length', new Buffer(html).length);
  response.status(200);
  response.send(html);
  response.end();
};

var sendErrorResponse = function (response, error) {
  response.setHeader('Content-Type', 'text/plain');
  response.send(500, 'server error: ' + error);
  response.end();
};

var createOrUpdatePage = function (req, res) {
  var pageName = req.params.page,
      commitMessage = req.body.commitMessage,
      markdown = req.body.markdown;

  if (markdown === undefined || commitMessage === undefined) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(400, 'commitMessage and markdown are required');
    res.end();
    return;
  }

  var provider = paramHandler.createProviderFromRequest(req);

  provider.getPage(pageName).then(function (page) {
    provider.updatePage(commitMessage, pageName, markdown, page.sha)
      .then(function (response) {
        sendResponse(res, response.body);
      })
      .catch(function (error) {
        sendErrorResponse(res, error);
      });
  }).catch(function (error) {
    if (error instanceof errors.FileNotFoundError) {
      provider.createPage(commitMessage, pageName, markdown)
        .then(function (response) {
          sendResponse(res, response.body);
        })
        .catch(function (error) {
          sendErrorResponse(res, error);
        });
    } else {
      sendErrorResponse(res, error);
    }
  });
};

module.exports.get = getPage;
module.exports.put = createOrUpdatePage;
