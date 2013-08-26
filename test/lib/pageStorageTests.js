'use strict';

var fs = require('fs'),
    sinon = require('sinon'),
    storage = require('../../lib/pageStorageFS'),
    should = require('should'),
    errors = require('../../lib/errors');

describe('PageStorageTests', function () {
  describe('getPageContent Tests', function () {
    describe('When a existing page was queried', function () {
      var sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(fs, 'exists', function (path, callback) {
          callback(true);
        });
        sandbox.stub(fs, 'readFile', function (fileName, callback) {
          callback(null, '#Test');
        });
      });

      it('it should return the content as markdown', function (done) {
        storage.getPageContent('index')
          .then(function (markdown) {
            should.exists(markdown);
            markdown.should.not.be.empty;
            markdown.should.be.eql('#Test');
          })
          .done(function () {
            done();
          });
      });

      afterEach(function (done) {
        sandbox.restore();
        done();
      });
    });

    describe('When a non existing page was queried', function () {
        var sandbox;

        beforeEach(function () {
          sandbox = sinon.sandbox.create();
          sandbox.stub(fs, 'exists', function (path, callback) {
            callback(false);
          });
        });

        it('it should throw an FileNotFoundError', function (done) {
          var lastError;

          storage.getPageContent('non_existing_page')
            .then(function (html) {
              should.fail('we have an error expected');
            })
            .catch(function (error) {
              lastError = error;
            })
            .done(function () {
              should.exists(lastError);
              lastError.should.be.an.instanceof(errors.FileNotFoundError);
              done();
            });
        });

        afterEach(function (done) {
          sandbox.restore();
          done();
        });
      });
  });

  describe('getPageContentAsHtml tests', function () {
    describe('When a existing page was queried', function () {
        var sandbox;

        beforeEach(function () {
          sandbox = sinon.sandbox.create();
          sandbox.stub(fs, 'exists', function (path, callback) {
            callback(true);
          });
          sandbox.stub(fs, 'readFile', function (fileName, callback) {
            callback(null, '#Test');
          });
        });

        it('it should return the content as html', function (done) {
          storage.getPageContentAsHtml('index')
            .then(function (html) {
              should.exists(html);
              html.should.not.be.empty;
              html.should.be.eql('<h1>Test</h1>');
            })
            .done(function () {
              done();
            });
        });

        afterEach(function (done) {
          sandbox.restore();
          done();
        });
      });
  });

  describe('getPages tests', function () {

    describe('When pages exists', function () {
      var sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      it('it should return all pages', function (done) {
        sandbox.stub(fs, 'exists', function (folderName, callback) {
          callback(true);
        });
        sandbox.stub(fs, 'readdir', function (fileName, callback) {
          callback(null, ['index.md', 'page1.md', 'page2.md']);
        });

        storage.getPages()
          .then(function (pages) {
            should.exists(pages);

            pages.should.have.length(3);
          })
          .done(function () {
            done();
          });
      });

      it('it should return only the markdown files of the directory', function (done) {
        sandbox.stub(fs, 'exists', function (folderName, callback) {
          callback(true);
        });
        sandbox.stub(fs, 'readdir', function (fileName, callback) {
          callback(null, ['index.md', 'page1.md', 'page2.md', 'page3.txt']);
        });

        storage.getPages()
          .then(function (pages) {
            should.exists(pages);

            pages.should.have.length(3);
          })
          .done(function () {
            done();
          });
      });

      afterEach(function () {
        sandbox.restore();
      });
    });

    describe('When no pages exists', function () {
      var sandbox;

      beforeEach(function () {
          sandbox = sinon.sandbox.create();
          sandbox.stub(fs, 'exists', function (folderName, callback) {
            callback(true);
          });
          sandbox.stub(fs, 'readdir', function (fileName, callback) {
            callback(null, undefined);
          });
        });

      it('it should return an empty array', function (done) {
        storage.getPages()
          .then(function (pages) {
            should.exists(pages);
            pages.should.have.length(0);
          })
          .done(function () {
            done();
          });
      });

      afterEach(function () {
        sandbox.restore();
      });
    });

    describe('When no content folder exists', function () {
      var sandbox;
      var readDirStub;

      beforeEach(function () {
          sandbox = sinon.sandbox.create();
          sandbox.stub(fs, 'exists', function (folderName, callback) {
            callback(false);
          });
          readDirStub = sandbox.stub(fs, 'readdir', function (fileName, callback) {
            callback(null, undefined);
          });
        });

      it('it should never call the readdir function and return an empty array', function (done) {
        storage.getPages()
          .then(function (pages) {
            should.exists(pages);
            pages.should.have.length(0);
          })
          .done(function () {
            readDirStub.calledOnce.should.be.false;
            done();
          });
      });

      afterEach(function () {
        sandbox.restore();
      });
    });

  });




});
