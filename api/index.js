'use strict';

var fs = require('fs'),
    path = require('path'),
    q = require('q'),
    marked = require('marked');


exports.index = function (req, res) {
  console.log('show content of: ' + req.params.page);
  var fileName = 'index.md';

  if (req.params.page) {
    fileName = req.params.page + '.md';
  }

  fileName = path.join(__dirname, '../content', fileName);

  var existsFile = q.nfbind(fs.existsFile);
  var readFile = q.nfbind(fs.readFile);

  if (fs.existsSync(fileName)) {
    readFile(fileName, 'UTF8')
      .then(marked)
      .then(function (html) {
        //var html = marked(markdown);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', html.length);
        res.status(200);
        res.end(html);
      })
      .catch(function (error) {
        console.error(error);
        res.setHeader('Content-Type', 'text/plain');
        res.send(500, 'server error: ' + error);
        res.end();
      })
      .done();
  } else {
      res.setHeader('Content-Type', 'text/plain');
      res.send(404, 'page not found');
      res.end();
  }


};
