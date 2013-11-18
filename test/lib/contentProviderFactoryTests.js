'use strict';

var factory = require('../../lib/contentProviderFactory'),
    errors = require('../../lib/errors'),
    should = require('should');

describe('provider factory tests', function () {

  describe('When the provider git was given ', function () {
    it('should return the git provider', function () {
      var provider = factory.create('Git');
      factory.create('git').getName().should.equal('git');
    });
  });

  describe('When the provider github was given ', function () {
    it('should return the github provider', function () {
      var provider = factory.create('GitHub', 'janbaer', 'wiki-content');
      factory.create('github').getName().should.equal('github');
    });
  });

  describe('When the name of the provider was not camelcase', function () {
    it('should return the expected provider', function () {
      factory.create('git').getName().should.equal('git');
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

