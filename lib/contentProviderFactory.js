'use strict';

var errors = require('./errors');

exports.create = function (providerName) {
  switch (providerName) {
  case "Git":
    return require('./gitContentProvider');
  case "GitHub":
    return require('./gitHubContentProvider');
  default:
    throw new errors.UnknownProviderError('Unknown provider', providerName);
  }
};
