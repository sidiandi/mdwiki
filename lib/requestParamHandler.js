'use strict';

var contentProviderFactory = require('../lib/contentProviderFactory');

var createProviderFromRequest = function (request) {
  if (request.params.githubUser !== undefined &&
      request.params.githubRepository !== undefined) {
    return contentProviderFactory.create('github',
                                          request.params.githubUser,
                                          request.params.githubRepository);
  }

  return contentProviderFactory.create('git');
};

module.exports.createProviderFromRequest = createProviderFromRequest;
