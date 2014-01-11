'use strict';

var factory = require('../../lib/contentProviderFactory'),
    gitContentProvider = require('../../lib/gitContentProvider'),
    githubContentProvider = require('../../lib/githubContentProvider'),
    errors = require('../../lib/errors'),
    should = require('should');

describe('provider factory tests', function () {

  describe('When the provider git was given ', function () {
    it('should return the git provider', function () {
      var provider = factory.create('Git');
      (provider instanceof gitContentProvider).should.be.true;
    });
  });

  describe('When the provider github was given ', function () {
    it('should return the github provider', function () {
      var provider = factory.create('GitHub', 'janbaer', 'wiki-content');
      (factory.create('github') instanceof githubContentProvider).should.be.true;
    });
  });

  describe('When the name of the provider was not camelcase', function () {
    it('should return the expected provider', function () {
      (factory.create('git') instanceof gitContentProvider).should.be.true;
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

