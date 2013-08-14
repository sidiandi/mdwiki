'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    sinon = require('sinon'),
    git = require('../lib/git'),
    Q = require('q'),
    child_process = require('child_process');

/*function rmdirIfExists(path) {
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
}*/

describe('tests for git module tests', function () {
  this.timeout(5000);

  describe('When the clone method was called and the content folder doesnt exists', function () {
    var sandbox;
    var testDir = path.join(__dirname, 'content'),
        gitRepositoryUrl = 'https://github.com/janbaer/mdwiki.wiki.git';

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    it('should clone the specified repository in the content folder', function (done) {
      var stub = sandbox.stub(child_process, 'exec', function (command, options, callback) {
        callback(null, 'ok');
      });

      var expected = util.format('git clone %s content', gitRepositoryUrl);

      git.clone(__dirname, 'content', gitRepositoryUrl)
        .done(function () {
          stub.calledOnce.should.be.true;
          stub.calledWithMatch(expected).should.be.true;
          done();
        });
    });

    afterEach(function () {
      sandbox.restore();
    });
  });
});



