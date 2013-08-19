'use strict';

var path = require('path'),
    grepSearcher = require('../lib/grepSearcher'),
    logger = require('../lib/logger');

var search = function (req, res) {

  var rootPath = path.join(__dirname, '../content');

  grepSearcher.searchForText(rootPath, req.body.textToSearch)
    .then(function (data) {
      console.log(data);
      res.statusCode = 200;
      res.send(data);
    })
    .catch(function (error) {
      logger.error(error);
      res.statusCode = 500;
      res.send('Unexpected error while searching: ' + error.message);
    })
    .done(function () {
      res.end();
    });
};

module.exports.search = search;
