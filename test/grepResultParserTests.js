'use strict';

var should = require('should'),
    Q = require('q'),
    errors = require('../lib/errors'),
    grepResultParser = require('../lib/grepResultParser.js');


describe('grep result parser module tests', function () {

    describe('grep result parser tests', function () {
        describe('When the grep result is empty the parser should return an empty array', function () {
            var grepResult = '';

            beforeEach(function () {
            });

            it('should return an empty array', function (done) {
                // ARRANGE
                grepResult = '';

                // ACT
                grepResultParser.parse(grepResult).done(function(parseResult){
                    // ASSERT
                    parseResult.length.should.be.eql(0);

                    done();
                });
            });

            afterEach(function () {
            });

        });
    });
});
