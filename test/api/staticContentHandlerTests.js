'use strict';

var path = require('path'),
    sinon = require('sinon'),
    fs = require('fs'),
    staticFileHandler = require('../../api/staticcontent');

describe('Tests for the static content handler', function () {
  var sandbox;

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
      var expectedFilePath = path.join(__dirname, '../../content/static/pdf', 'test.pdf');
      var response = {
        sendfile: function (filename) {}
      };

      var mock = sinon.mock(response);
      mock.expects('sendfile').withArgs(expectedFilePath);

      staticFileHandler({url: '/static/pdf/test.pdf'}, response);

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
      var response = {
        sendfile: function (filename) {},
        send: function (code, message) {},
        end: function () {}
      };

      var mock = sinon.mock(response);
      mock.expects('sendfile').never();
      mock.expects('send').withArgs(404, 'file not found');

      staticFileHandler({url: '/static/pdf/test.pdf'}, response);

      done();
    });

    afterEach(function () {
      sandbox.restore();
    });
  });
});
