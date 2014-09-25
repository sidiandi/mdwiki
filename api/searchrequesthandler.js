'use strict';

var logger = require('../lib/logger'),
    paramHandler = require('../lib/requestParamHandler.js');

var search = function (req, res) {
  var provider = paramHandler.createProviderFromRequest(req);

  provider.search(req.body.textToSearch)
    .then(function (searchResult) {
      console.log('textToSearch:' + req.body.textToSearch);
      console.log('searchResult.....:' + searchResult);

      var stringifiedResult = JSON.stringify(searchResult);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', stringifiedResult.length);
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
