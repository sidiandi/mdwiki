'use strict';

var fs = require('fs'),
    si = require('search-index'),
     Q = require('q');

var indexMarkDownFile = function (fileName){

    if (fs.existsSync(fileName) === false) {
        throw new Error('Could not find file ' + fileName);
    }

    var fileContent = fs.readFileSync (fileName);

    var fileToIndex = new Object();
    fileToIndex[fileName] =
        {
            'title': fileName,
            'body' : fileContent,
            'metadata': []
        };


    var filters = ['metadata'];

    var fileToIndexStr = JSON.stringify(fileToIndex);

    si.index(fileToIndexStr, 'BatchName', filters,function(msg) {
        console.log(msg);
    });
};

var removeMarkDownFileFromIndex = function (filePath){

};

var searchForText = function (text){

};

exports.indexMarkDownFile = indexMarkDownFile;
exports.removeMarkDownFileFromIndex = removeMarkDownFileFromIndex;
exports.searchForText = searchForText;