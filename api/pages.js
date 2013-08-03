'use strict';

var fs = require('fs'),
  path = require('path'),
  q = require('q'),
  _ = require('underscore');

exports.pages = function (req, res) {
  var directoryName = path.join(__dirname, '../content');

  var readdir = q.nfbind(fs.readdir);

  readdir(directoryName)
    .then(function (files) {
      var pages = [];

      _.each(files, function (file) {
        if (path.extname(file) === '.md' && file !== 'index.md') {
          var fileWithoutExt = path.basename(file, '.md');

          var page = {
            title: fileWithoutExt,
            name: fileWithoutExt
          };

          pages.push(page);
        }
      });

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

