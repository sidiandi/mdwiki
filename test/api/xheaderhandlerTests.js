'use strict';

var should = require('should'),
    sinon = require('sinon'),
    xHeaderHandler = require('../../api/xheaderrequesthandler.js');

describe('xheaderhandler Tests', function () {
  var request = {
    get: function (field) {}
  };

  beforeEach(function () {
    sinon.stub(request, 'get');
  });

  describe('When no provider was set', function () {
    it('should return the default provider git', function () {
      request.get.withArgs('X-MDWiki-Provider').returns(undefined);
      xHeaderHandler.getProviderFromRequest(request).getName().should.equal('git');
    });

    afterEach(function () {
      request.get.restore();
    });
  });

  describe('When git provider was set', function () {
    it('should return the default provider git', function () {
      request.get.withArgs('X-MDWiki-Provider').returns('git');
      xHeaderHandler.getProviderFromRequest(request).getName().should.equal('git');
    });

    afterEach(function () {
      request.get.restore();
    });
  });

  describe('When github provider was set', function () {
    it('should return the default provider git', function () {
      request.get.withArgs('X-MDWiki-Provider').returns('github');
      xHeaderHandler.getProviderFromRequest(request).getName().should.equal('github');
    });

    afterEach(function () {
      request.get.restore();
    });
  });


});
