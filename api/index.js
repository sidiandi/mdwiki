'use strict';

var fs = require('fs'),
  path = require('path'),
  q = require('q'),
  marked = require('marked'),
  storage = require('../lib/pageStorageFS');

exports.index = function (req, res) {
  console.log('show content of: ' + req.params.page);
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
      console.error(error);
      if (error.message === 'page not found') {
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