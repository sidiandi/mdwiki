'use strict';

var textSearcher = require('../lib/textSearcher'),
    logger = require('../lib/logger');

var search = function (req, res) {
  textSearcher.search(req.body.textToSearch)
    .then(function (searchResult) {
      console.log('textToSearch:' + req.body.textToSearch);
      console.log('searchResult.....:' + searchResult);
      res.statusCode = 200;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      var stringifiedResult = JSON.stringify(searchResult);
      res.write(stringifiedResult);
      res.end();
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
