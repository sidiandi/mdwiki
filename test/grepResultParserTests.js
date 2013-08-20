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

        describe('When the grep result is not empty the parser should return a valid result object', function () {
            var grepResult = '';

            beforeEach(function () {
            });

            it('should return an empty array', function (done) {
                // ARRANGE
                grepResult = 'file.md:this was found\n';

                // ACT
                grepResultParser.parse(grepResult).done(function(parseResult){
                    // ASSERT
                    parseResult.length.should.be.eql(1);
                    parseResult[0].fileName.should.be.eql('file.md');
                    parseResult[0].fileContext.should.be.eql('this was found');
                    done();
                });
            });

            afterEach(function () {
            });

        });

        describe('When the grep result contains the path of the file the parser should return a valid result object', function () {
            var grepResult = '';

            beforeEach(function () {
            });

            it('should return an empty array', function (done) {
                // ARRANGE
                grepResult = '/path/to/file/file.md:this was found\n';

                // ACT
                grepResultParser.parse(grepResult).done(function(parseResult){
                    // ASSERT
                    parseResult.length.should.be.eql(1);
                    parseResult[0].fileName.should.be.eql('file.md');
                    parseResult[0].fileContext.should.be.eql('this was found');
                    done();
                });
            });

            afterEach(function () {
            });

        });

        describe('When the grep result contains a windows path of the file the parser should return a valid result object', function () {
            var grepResult = '';

            beforeEach(function () {
            });

            it('should return an empty array', function (done) {
                // ARRANGE
                grepResult = 'c:/path/to/file/file.md:this was found\n';

                // ACT
                grepResultParser.parse(grepResult).done(function(parseResult){
                    // ASSERT
                    parseResult.length.should.be.eql(1);
                    parseResult[0].fileName.should.be.eql('file.md');
                    parseResult[0].fileContext.should.be.eql('this was found');
                    done();
                });
            });

            afterEach(function () {
            });

        });

        describe('When the grep result contains multiple lines, then the parser should return a valid list of parsed objects', function () {
            var grepResult = '';

            beforeEach(function () {
            });

            it('should return an empty array', function (done) {
                // ARRANGE
                grepResult = 'c:/path/to/file/file.md:this was found \n c:/path/to/file/file2.md:this was found as well\n';

                // ACT
                grepResultParser.parse(grepResult).done(function(parseResult){
                    // ASSERT
                    parseResult.length.should.be.eql(2);
                    parseResult[0].fileName.should.be.eql('file.md');
                    parseResult[0].fileContext.should.be.eql('this was found');
                    parseResult[1].fileName.should.be.eql('file2.md');
                    parseResult[1].fileContext.should.be.eql('this was found as well');
                    done();
                });
            });

            afterEach(function () {
            });

        });
    });
});
