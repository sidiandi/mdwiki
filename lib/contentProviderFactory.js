'use strict';

var errors = require('./errors');
var Provider;

exports.create = function (providerName, userName, repositoryName) {
  switch (providerName.toLowerCase()) {
  case "git":
    Provider = require('./gitContentProvider');
    return new Provider();
  case "github":
    Provider = require('./githubContentProvider');
    return new Provider(userName, repositoryName);
  default:
    throw new errors.UnknownProviderError('Unknown provider', providerName);
  }
};
