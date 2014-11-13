'use strict';

var logger = require('../lib/logger'),
    paramHandler = require('../lib/requestParamHandler.js');

module.exports = function (req, res) {
  logger.info('static url: %s', req.url);

  var provider = paramHandler.createProviderFromRequest(req);
  provider.fetchStaticFile(req, res);
};
