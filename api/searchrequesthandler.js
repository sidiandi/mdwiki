'use strict';

var path = require('path'),
    grepSearcher = require('../lib/grepSearcher'),
    grepResultParser = require('../lib/grepResultParser'),
    logger = require('../lib/logger');

var search = function (req, res) {
  grepSearcher.searchForText(req.body.textToSearch)
    .then(function (searchResult) {
      logger.info(searchResult);
      res.statusCode = 200;
      var parsedResult = grepResultParser.parse(searchResult);
      parsedResult.then(function (resultObjects) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          var stringifiedResult = JSON.stringify(resultObjects);
          res.write(stringifiedResult);
          res.end();
        });
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
