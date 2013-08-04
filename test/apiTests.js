var request = require('supertest'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs'),
    when = require('when');

describe('API tests', function () {
  'use strict';

  var server;

  beforeEach(function () {
    server = request('http://localhost:3000');
  });

  describe('When no parameter is given', function () {
    it('should return the index page', function (done) {
      server.get('/api')
            .expect('Content-Type', "text/html")
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });
  describe('When parameter index is given', function () {
    it('should return the index page', function (done) {
      server.get('/api/index')
            .expect('Content-Type', "text/html")
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });

  describe('When an non existing page is given', function () {
    it('should return an 404 http code', function (done) {
      server.get('/api/nonexistingPage')
            .expect('Content-Type', "text/plain")
            .expect(404)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              done();
            });
    });
  });

  describe('When user wants to list all existing pages', function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();

      sandbox.stub(fs, "readdir")
             .callsArgWith(1, ['content/index.md', 'content/page1.md', 'content/page2.md', 'content/page3.md']);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should return a list of the pages with their titles except the index page', function (done) {

      server.get('/api/pages')
            .expect('Content-Type', "application/json")
            .end(function (err, res) {
              if (err) {
                return done(err);
              }

              var pages = res.body;

              should.exists(pages);

              pages.length.should.equal(2);

              done();
            });
    });
  });
});



