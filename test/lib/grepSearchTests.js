'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    sinon = require('sinon'),
    should = require('should'),
    grepSearcher = require('../lib/grepSearcher'),
    Q = require('q'),
    errors = require('../lib/errors'),
    child_process = require('child_process');

describe('grep search module tests', function () {
  this.timeout(5000);

  describe('search tests', function () {
    describe('When the searchForText method was called and the content folder contains matches for the searched text', function () {
        var sandbox,
            textToSearch = 'Java',
            folderToSearch = 'Content';

        beforeEach(function () {
            sandbox = sinon.sandbox.create();
          });

        it('should return the list of files that contain the text', function (done) {
          // ARRANGE
          sandbox.stub(fs, 'exists', function (folder, callback) {
            callback(true);
          });
          var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
            callback(null, 'Text with Java');
          });
          var expected = util.format('grep -i "%s" %s/*.*', textToSearch, folderToSearch);

          // ACT
          grepSearcher.searchForText(folderToSearch, textToSearch)
            .done(function (data) {
              // ASSERT
              stub.calledOnce.should.be.true;
              stub.calledWithMatch(expected).should.be.true;
              data.should.be.eql('Text with Java');
              done();
            });
        });

        afterEach(function () {
          sandbox.restore();
        });

      });
  });
});
