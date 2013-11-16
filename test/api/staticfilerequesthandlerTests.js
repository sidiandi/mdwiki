'use strict';

var path = require('path'),
    sinon = require('sinon'),
    should = require('should'),
    fs = require('fs'),
    staticFileRequestHandler = require('../../api/staticfilerequesthandler');

describe('Tests for the static content handler', function () {
  var sandbox;

  var response = {
    sendfile: function (filename) {},
    send: function (code, message) {},
    end: function () {}
  };

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  describe('When the static file exists', function () {
    beforeEach(function () {

      sandbox.stub(fs, 'exists', function (path, callback) {
        callback(true);
      });
    });

    it('should send the file back', function (done) {
      // ARRANGE
      var expectedFilePath = path.join(__dirname, '../../content/static/pdf', 'test.pdf');

      sinon.spy(response, 'sendfile');

      // ACT
      staticFileRequestHandler({ url: '/static/pdf/test.pdf', params: [] }, response);

      // ASSERT
      response.sendfile.withArgs(expectedFilePath).calledOnce.should.be.true;

      done();
    });

    afterEach(function () {
      response.sendfile.restore();
      sandbox.restore();
    });
  });

  describe('When the static file not exists', function () {
    beforeEach(function () {
      sandbox.stub(fs, 'exists', function (path, callback) {
        callback(false);
      });
    });

    it('should send and 404 error', function (done) {
      // ARRANGE
      sinon.spy(response, 'sendfile');
      sinon.spy(response, 'send');

      // ACT
      staticFileRequestHandler({ url: '/static/pdf/test.pdf', params: [] }, response);

      // ASSERT
      response.sendfile.called.should.be.false;
      response.send.withArgs(404, 'file not found').calledOnce.should.be.true;

      done();
    });

    afterEach(function () {
      response.sendfile.restore();
      response.send.restore();
      sandbox.restore();
    });
  });
});
