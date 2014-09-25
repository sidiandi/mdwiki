'use strict';

var factory = require('../../lib/contentProviderFactory'),
    githubContentProvider = require('../../lib/githubContentProvider'),
    errors = require('../../lib/errors');

describe('provider factory tests', function () {
  describe('When the provider github was given ', function () {
    it('should return the github provider', function () {
      (factory.create('github') instanceof githubContentProvider).should.be.true;
    });
  });

  describe('When the name of the provider was not camelcase', function () {
    it('should return the expected provider', function () {
      (factory.create('github') instanceof githubContentProvider).should.be.true;
    });
  });

  describe('When a unknown provider was given ', function () {
    it('should throw an UnknownProviderError', function () {
      /*jshint -W068 */
      (function () {
        factory.create('providerXYZ');
      }).should.throw(errors.UnkownProviderError);
    });
  });
});

