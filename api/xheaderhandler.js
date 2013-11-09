'use strict';

var contentProviderFactory = require('../lib/contentProviderFactory');

var getProviderFromRequest = function (req) {
  var providerName = 'git',
      repositoryName = '';

  if (req.get('X-MDWiki-Provider')) {
    providerName = req.get('X-MDWiki-Provider');
    console.info('Use Provider:' + providerName);
  }

  var provider = contentProviderFactory.create(providerName);
  if (req.get('X-MDWiki-Repository')) {
    provider.repository = req.get('X-MDWiki-Repository');
  }

  return provider;
};

module.exports.getProviderFromRequest = getProviderFromRequest;

