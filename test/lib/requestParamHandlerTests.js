'use strict';

var should = require('should'),
    sinon = require('sinon'),
    oauth = require('../../lib/oauth.js'),
    requestParamHandler = require('../../lib/requestParamHandler.js'),
    githubContentProvider = require('../../lib/githubContentProvider.js');

describe('requestParamHandler tests', function () {
  var request = {
    params: {
      githubUser: undefined,
      githubRepository: undefined
    }
  };

  describe('When the githubUser and githubRepository params are set', function () {
    it('should return the github provider', function () {
      request.params.githubUser = 'janbaer';
      request.params.githubRepository = 'wiki';

      var provider = requestParamHandler.createProviderFromRequest(request);
      (provider instanceof githubContentProvider).should.be.true;
    });
  });

  describe('When request has a session with oauth token', function () {
    beforeEach(function () {
      sinon.stub(oauth, 'getOAuthToken').returns('12345678');
    });

    it('Should add the oauth token to the github user', function () {
      request.params.githubUser = 'janbaer';
      request.params.githubRepository = 'wiki';

      var provider = requestParamHandler.createProviderFromRequest(request);
      provider.should.have.property('oauth', '12345678');
    });
  });


});
