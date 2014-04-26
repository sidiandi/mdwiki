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
  describe('clone tests', function () {
    describe('When the clone method was called and the content folder does not exists', function () {
      var sandbox,
          gitRepositoryUrl = 'https://github.com/janbaer/mdwiki.wiki.git';

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
      });

      it('should clone the specified repository into the content folder', function (done) {
        // ARRANGE
        sandbox.stub(fs, 'existsSync').returns(false);
        var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });
        var expected = util.format('git clone %s content', gitRepositoryUrl);

        // ACT
        git.clone(__dirname, 'content', gitRepositoryUrl)
          .done(function () {
            // ASSERT
            stub.calledWithMatch(expected).should.be.true;
            done();
          });
      });

      afterEach(function () {
        sandbox.restore();
      });
    });

    describe('When content folder already exists', function () {
      var sandbox, execStub;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();

        sandbox.stub(fs, 'existsSync').returns(true);
        execStub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });

      });

      it('should return an ContentFolderExistsError', function (done) {
        var lastError;

        git.clone(__dirname, 'content', 'git...')
          .catch(function (error) {
            lastError = error;
          })
          .done(function () {
            lastError.should.be.an.instanceof(errors.ContentFolderExistsError);
            done();
          });
      });

      it('should not execute the git command', function (done) {
        git.clone(__dirname, 'content', 'git...')
        .catch(function (error) {
          // Nothing todo here => But we have to catch it, otherwise the test will fail when we have not catched the exception
        })
        .done(function () {
          execStub.callCount.should.be.eql(0);
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
      var sandbox, execStub;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(fs, 'existsSync').returns(true);
        execStub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });
      });

      it('should pull the latest changes from the remote repository', function (done) {
        git.pull(__dirname)
          .done(function () {
            execStub.calledWithMatch('git pull origin master').should.be.true;
            done();
          });

      });

      afterEach(function () {
        sandbox.restore();
      });
    });

    describe('When pull was called and content was never cloned before', function () {
      var sandbox, execStub;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(fs, 'existsSync').returns(false);
        execStub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
          callback(null, 'ok');
        });
      });

      it('should return an ContentFolderNotExistsError', function (done) {
        var lastError;

        git.pull(__dirname)
        .catch(function (error) {
          lastError = error;
        })
        .done(function () {
          lastError.should.be.an.instanceof(errors.ContentFolderNotExistsError);
          done();
        });
      });

      it('should not execute the git command', function (done) {
        var lastError;

        git.pull(__dirname)
        .catch(function (error) {
          // Nothing todo here => But we have to catch it, otherwise the test will fail when we have not catched the exception
        })
        .done(function () {
          execStub.callCount.should.be.eql(0);
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



