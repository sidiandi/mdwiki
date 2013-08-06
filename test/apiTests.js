var request = require('supertest'),
    express = require('express'),
    should = require('should'),
    sinon = require('sinon'),
    fs = require('fs');

var pagesRoute = require('../api/pages').pages;

describe('API tests', function () {
  'use strict';

  var server;

  beforeEach(function (done) {
    server = request('http://localhost:3000');
    done();
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
    var app = express();

    beforeEach(function (done) {
      sandbox = sinon.sandbox.create();

      app.get('/api/pages', pagesRoute);
      done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });

    it('should return a list of the pages with their titles except the index page', function (done) {
      sandbox.stub(fs, 'readdir', function (path, callback) {
        callback(null, ['index.md', 'page1.md', 'page2.md']);
      });

      request(app).get('/api/pages')
        .expect('Content-Type', "application/json")
        .expect(200)
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



