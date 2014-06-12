'use strict';

var errors = require('./errors');
var Provider;

exports.create = function (providerName, userName, repositoryName) {
  switch (providerName.toLowerCase()) {
  case 'github':
    Provider = require('./githubContentProvider');
    return new Provider(userName, repositoryName);
  default:
    throw new errors.UnknownProviderError('Unknown provider', providerName);
  }
};
