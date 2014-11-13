'use strict';

var q = require('q'),
    path = require('path'),
    marked = require('marked');

var reduceBigHeaders =  function (html) {
    if (html) {
      return html.replace('<h1', '<h4')
                 .replace('</h1>', '</h4>')
                 .replace('<h2', '<h4')
                 .replace('</h2>', '</h4>')
                 .replace('<h3', '<h4')
                 .replace('</h3>', '</h4>');
    }

    return html;
  };

var parseOneLine = function (fileName, line) {
    var result = {};

    var fileIndex = line.indexOf(fileName);
    var fileContext = line.substr(fileIndex + fileName.length + 1);
    fileContext = marked.parse(fileContext);

    var name = path.basename(fileName, '.md');

    result = {
      title: name,
      name: name,
      fileName: fileName,
      fileContext: reduceBigHeaders(fileContext)
    };

    return result;
  };

var parse = function (textToParse) {
  var deferred = q.defer(),
      result = [];

  if (textToParse === '') {

    deferred.resolve(result);

  } else {

    var lines = textToParse.split('\n');

    var resultCounter = 0;

    lines.pop();

    lines.forEach(function (line) {
      var fileNameAndContext = '',
          fileName = '';

      fileNameAndContext = line.split(':');

      fileName = fileNameAndContext[0].trim();

      result[resultCounter] = parseOneLine(fileName, line);

      resultCounter = resultCounter + 1;

    });

    deferred.resolve(result);

  }

  return deferred.promise;
};

module.exports.parse = parse;
