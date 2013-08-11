'use strict';

var fs = require('fs'),
    sinon = require('sinon'),
    searchRepository = require('../lib/searchRepository'),
    should = require('should'),
    errors = require('../lib/errors'),
    si = require('search-index');

describe('SearchRepositoryTests', function () {
    describe('indexPage Tests', function () {
        describe('When an mark down file is indexed', function () {
            var sandbox;

            beforeEach(function () {
                sandbox = sinon.sandbox.create();
                sandbox.stub(fs, 'existsSync').returns(true);
                sandbox.stub(fs, 'readFileSync').returns('#Test');
                sandbox.spy(si, "index");
            });

            it('it should index the content of the file', function (done) {
                searchRepository.indexMarkDownFile('index.md');
                var fileToIndex = {
                    'index.md' : {
                        'title': 'index.md',
                        'body' : '#Test',
                        'metadata': []
                    }
                };

                si.index.getCall(0).args[0].should.be.eql(JSON.stringify(fileToIndex));

                si.index.getCall(0).args[1].should.be.eql("BatchName");

                done();
            });

            afterEach(function (done) {
                sandbox.restore();
                //si.index.restore();
                done();
            });
        });

    });

 });