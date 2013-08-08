'use strict';

var fs = require('fs'),
    sinon = require('sinon'),
    storage = require('../lib/pageStorageFS'),
    should = require('should');

describe('PageStorageTests', function () {

  describe('When an existing page was queried', function () {

    beforeEach(function () {
      sinon.stub(fs, 'existsSync').returns(true);
      sinon.stub(fs, 'readFile', function (fileName, callback) {
        callback(null, '#Test');
      });
    });
    it('it should return the content', function (done) {
      storage.getPageContent('index')
        .then(function (html) {
          should.exists(html);
          console.log(html);
          html.should.not.be.empty;
          html.should.be.eql('<h1>Test</h1>\n');
        })
        .done(function () {
          done();
        });
    });

    afterEach(function () {
    });
  });
});