'use strict';

var path = require('path'),
    sinon = require('sinon'),
    fs = require('fs'),
    staticFileHandler = require('../../api/staticcontent');

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
      var spy = sandbox.spy(response, 'sendfile');

      // ACT
      staticFileHandler({url: '/static/pdf/test.pdf'}, response);

      // ASSERT
      spy.withArgs(expectedFilePath).calledOnce.should.be.true;

      done();
    });

    afterEach(function () {
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
      var sendFileSpy = sandbox.spy(response, 'sendfile');
      var sendSpy = sandbox.spy(response, 'send');

      // ACT
      staticFileHandler({url: '/static/pdf/test.pdf'}, response);

      // ASSERT
      sendFileSpy.called.should.be.false;
      sendSpy.withArgs(404, 'file not found').calledOnce.should.be.true;

      done();
    });

    afterEach(function () {
      sandbox.restore();
    });
  });
});
