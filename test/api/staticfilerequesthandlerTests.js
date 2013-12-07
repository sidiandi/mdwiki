'use strict';

var path = require('path'),
    sinon = require('sinon'),
    should = require('should'),
    fs = require('fs'),
    staticFileRequestHandler = require('../../api/staticfilerequesthandler');

describe('Tests for the static content handler', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  describe('When the static file exists', function () {
    var response;

    beforeEach(function () {
      sandbox.stub(fs, 'exists', function (path, callback) {
        callback(true);
      });

      response = sinon.stub({
        sendfile: function (filename) {}
      });
    });

    it('should send the file back', function (done) {
      // ARRANGE
      var expectedFilePath = path.join(__dirname, '../../content/static/pdf', 'test.pdf');

      // ACT
      staticFileRequestHandler({ url: '/static/pdf/test.pdf', params: [] }, response);

      // ASSERT
      response.sendfile.withArgs(expectedFilePath).calledOnce.should.be.true;

      done();
    });

    afterEach(function () {
      sandbox.restore();
    });
  });

  describe('When the static file not exists', function () {
    var response;

    beforeEach(function () {
      sandbox.stub(fs, 'exists', function (path, callback) {
        callback(false);
      });

      response = sinon.stub({
        sendfile: function (filename) {},
        send: function (code, message) {},
        end: function () {}
      });

    });

    it('should send and 404 error', function (done) {
      // ARRANGE

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
