'use strict';

var fs = require('fs'),
    q = require('q'),
    storage = require('../lib/pageStorageFS');

module.exports = function (req, res) {
  storage.getPages()
    .then(function (pages) {
      var json = JSON.stringify(pages);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', json.length);
      res.status(200);
      res.end(json);
    })
    .catch(function (error) {
      console.error(error);
      res.setHeader('Content-Type', 'text/plain');
      res.send(500, 'server error: ' + error);
      res.end();
    })
    .done();
};

