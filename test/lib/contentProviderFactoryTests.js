'use strict';

var factory = require('../../lib/contentProviderFactory'),
    errors = require('../../lib/errors'),
    should = require('should');

describe('provider factory tests', function () {

  describe('When the git provider was given ', function () {
    it('should return the git provider', function () {
      var provider = factory.create('Git');
      should.exists(provider);
    });
  });

  describe('When the github provider was given ', function () {
    it('should return the github provider', function () {
      var provider = factory.create('GitHub');
      should.exists(provider);
    });
  });

  describe('When the name of the provider was not camelcase', function () {
    it('should return the expected provider', function () {
      should.exists(factory.create('git'));
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

