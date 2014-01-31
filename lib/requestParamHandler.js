'use strict';

var contentProviderFactory = require('../lib/contentProviderFactory'),
    oauth = require('./oauth');

var createProviderFromRequest = function (req) {
  if (req.params.githubUser !== undefined &&
      req.params.githubRepository !== undefined) {
    var provider = contentProviderFactory.create('github',
                                          req.params.githubUser,
                                          req.params.githubRepository);
    if (oauth.hasSession(req)) {
      provider.oauth = req.session.oauth;
    }

    return provider;
  }

  return contentProviderFactory.create('git');
};

module.exports.createProviderFromRequest = createProviderFromRequest;
