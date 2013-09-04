'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    sinon = require('sinon'),
    should = require('should'),
    Q = require('q'),
    child_process = require('child_process'),
    git = require('../../lib/git'),
    errors = require('../../lib/errors');

describe('git module tests', function () {
  this.timeout(5000);

  describe('clone tests', function () {
    describe('When the clone method was called and the content folder does not exists', function () {
      var sandbox,
          gitRepositoryUrl = 'https://github.com/janbaer/mdwiki.wiki.git';

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      it('should clone the specified repository into the content folder', function (done) {
        // ARRANGE
        sandbox.stub(fs, 'exists', function (folder, callback) {
          callback(false);
        });
        var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });
        var expected = util.format('git clone %s content', gitRepositoryUrl);

        // ACT
        git.clone(__dirname, 'content', gitRepositoryUrl)
          .done(function () {
            // ASSERT
            stub.calledOnce.should.be.true;
            stub.calledWithMatch(expected).should.be.true;
            done();
          });
      });

      afterEach(function () {
        sandbox.restore();
      });
    });

    describe('When content folder already exists', function () {
      var sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      it('should return an ContentFolderExistsError', function (done) {
        // ARRANGE
        sandbox.stub(fs, 'exists', function (folder, callback) {
          callback(true);
        });
        var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });

        var lastError;

        // ACT
        git.clone(__dirname, 'content', 'git...')
          .catch(function (error) {
            lastError = error;
          })
          .done(function () {
            should.exists(lastError);
            lastError.should.be.an.instanceof(errors.ContentFolderExistsError);
            stub.callCount.should.be.eql(0);
            done();
          });

      });

      afterEach(function () {
        sandbox.restore();
      });
    });
  });

  describe('pull tests', function () {
    describe('When pull was called and content was cloned before', function () {
      var sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      it('should pull the latest changes from the remote repository', function (done) {
        // ARRANGE
        sandbox.stub(fs, 'existsSync').returns(true);
        var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });

        // ACT
        git.pull(__dirname)
          .done(function () {
            // ASSERT
            stub.calledOnce.should.be.true;
            stub.calledWithMatch('git pull origin master').should.be.true;
            done();
          });

      });

      afterEach(function () {
        sandbox.restore();
      });
    });

    describe('When pull was called and content was never cloned before', function () {
      var sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      it('should return an ContentFolderNotExistsError', function (done) {
        // ARRANGE
        sandbox.stub(fs, 'existsSync').returns(false);
        var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });
        var lastError;

        // ACT
        git.pull(__dirname)
        .catch(function (error) {
          lastError = error;
        })
        .done(function () {
          // ASSERT
          should.exists(lastError);
          lastError.should.be.an.instanceof(errors.ContentFolderNotExistsError);
          stub.callCount.should.be.eql(0);
          done();
        });
      });

      afterEach(function () {
        sandbox.restore();
      });
    });

    describe('When exec throws an error it should be handled correctly', function () {
      var sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      it('should return an ContentFolderNotExistsError', function (done) {
        // ARRANGE
        sandbox.stub(fs, 'existsSync').returns(true);
        var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(new Error('something was wrong'));
        });
        var lastError;

        // ACT
        git.pull(__dirname)
          .catch(function (error) {
            lastError = error;
          })
          .done(function () {
            // ASSERT
            should.exists(lastError);
            lastError.message.should.be.equal('something was wrong');
            done();
          });
      });

      afterEach(function () {
        sandbox.restore();
      });
    });
  });
});



