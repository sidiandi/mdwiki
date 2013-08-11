'use strict';

var fs = require('fs'),
  path = require('path'),
  q = require('q'),
  marked = require('marked'),
  storage = require('../lib/pageStorageFS'),
  errors = require('../lib/errors');

module.exports = function (req, res) {
  var pageName = 'index';

  if (req.params.page) {
    pageName = req.params.page;
  }

  storage.getPageContent(pageName)
    .then(function (html) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Length', html.length);
      res.status(200);
      res.end(html);
    })
    .catch(function (error) {
      if (error instanceof errors.FileNotFoundError) {
        res.setHeader('Content-Type', 'text/plain');
        res.send(404, 'page not found');
        res.end();
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.send(500, 'server error: ' + error);
        res.end();
      }
    })
    .done();
};
