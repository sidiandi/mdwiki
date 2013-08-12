'use strict';

var fs = require('fs'),
    path = require('path'),
    sinon = require('sinon'),
    git = require('../lib/git'),
    Q = require('q'),
    exec = require('child_process').exec;

function rmdirIfExists(path) {
  var deferred = Q.defer();

  if (fs.existsSync(path) === false) {
    deferred.resolve();
  }

  exec('rm -rf ' + path, function (err, out) {
    if (err) {
      deferred.reject(err);
    }
    deferred.resolve();
  });

  return deferred.promise;
}

describe('tests for module tests', function () {
  describe('When the clone method was called and the content folder doesnt exists', function () {
    var testDir = path.join(__dirname, 'content'),
        gitRepositoryUrl = 'https://github.com/janbaer/mdwiki-content.git';

    beforeEach(function (done) {
      rmdirIfExists(testDir)
        .done(function () {
          done();
        });
    });

    it('should clone the specified repository in the content folder', function (done) {
      git.clone(__dirname, 'content', gitRepositoryUrl)
        .done(function () {
          fs.existsSync(testDir).should.be.true;
          done();
        });
    });

    afterEach(function () {
    });
  });
});



