'use strict';

var errors = require('./errors');

exports.create = function (providerName) {
  switch (providerName.toLowerCase()) {
  case "git":
    return require('./gitContentProvider');
  case "github":
    return require('./gitHubContentProvider');
  default:
    throw new errors.UnknownProviderError('Unknown provider', providerName);
  }
};
