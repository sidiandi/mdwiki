'use strict';

var should = require('should'),
    Q = require('q'),
    errors = require('../../lib/errors'),
    grepResultParser = require('../../lib/grepResultParser.js');


describe('grep result parser module tests', function () {
  describe('grep result parser tests', function () {
    describe('When the grep result is empty the parser should return an empty array', function () {
      var grepResult = '';

      it('should return an empty array', function (done) {
        // ARRANGE
        grepResult = '';

        // ACT
        grepResultParser.parse(grepResult).done(function (parseResult) {
          // ASSERT
          parseResult.length.should.be.eql(0);

          done();
        });
      });
    });

    describe('When the grep result is not empty the parser should return a valid result object', function () {
      var grepResult = '';

      it('should return an empty array', function (done) {
        // ARRANGE
        grepResult = 'file.md:this was found\n';

        // ACT
        grepResultParser.parse(grepResult).done(function (parseResult) {
          // ASSERT
          parseResult.length.should.be.eql(1);
          parseResult[0].fileName.should.be.eql('file.md');
          parseResult[0].fileContext.should.be.eql('<p>this was found</p>\n');
          done();
        });
      });
    });

    describe('When the grep result contains multiple lines, then the parser should return a valid list of parsed objects', function () {
      var grepResult = '';

      it('should return an empty array', function (done) {
        // ARRANGE
        grepResult = 'file.md:this was found \n file2.md:this was found as well\n';

        // ACT
        grepResultParser.parse(grepResult).done(function (parseResult) {
          // ASSERT
          parseResult.length.should.be.eql(2);
          parseResult[0].fileName.should.be.eql('file.md');
          parseResult[0].fileContext.should.be.eql('<p>this was found </p>\n');
          parseResult[1].fileName.should.be.eql('file2.md');
          parseResult[1].fileContext.should.be.eql('<p>this was found as well</p>\n');
          done();
        });
      });
    });

    describe('When the grep result contains header less than four, then it should be transformed to H4', function () {
          var grepResult = '';

          it('should return an empty array', function (done) {
              // ARRANGE
              grepResult = 'file.md:#this was found \n file2.md:###this was found as well\n';

              // ACT
              grepResultParser.parse(grepResult).done(function (parseResult) {
                  // ASSERT
                  parseResult.length.should.be.eql(2);
                  parseResult[0].fileName.should.be.eql('file.md');
                  parseResult[0].fileContext.should.be.eql('<h4 id="this-was-found">this was found</h4>\n');
                  parseResult[1].fileName.should.be.eql('file2.md');
                  parseResult[1].fileContext.should.be.eql('<h4 id="this-was-found-as-well">this was found as well</h4>\n');
                  done();
                });
            });
        });
  });
});
