'use strict';

var should = require('should'),
    requestParamHandler = require('../../lib/requestParamHandler.js');

describe('requestParamHandler tests', function () {
  var request = {
    params: {
      githubUser: undefined,
      githubRepository: undefined
    }
  };

  describe('When no github params are set', function () {
    it('should return the git provider', function () {
      request.params.githubUser = undefined;
      request.params.githubRepository = undefined;

      var provider = requestParamHandler.createProviderFromRequest(request);

      should.exists(provider);
      provider.getName().should.equal('git');
    });
  });

  describe('When the githubUser and githubRepository params are set', function () {
    it('should return the github provider', function () {
      request.params.githubUser = 'janbaer';
      request.params.githubRepository = 'wiki';

      var provider = requestParamHandler.createProviderFromRequest(request);

      should.exists(provider);
      provider.getName().should.equal('github');
    });
  });


});
