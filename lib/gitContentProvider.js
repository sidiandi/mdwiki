'use strict';

var storage = require('./pageStorageFS');
var searchEngine = require('./textSearcher');

var getPageContent = function (pageName) {
  return storage.getPageContent(pageName);
};

var getPageContentAsHtml = function (pageName) {
  return storage.getPageContentAsHtml(pageName);
};

var getPages = function () {
  return storage.getPages();
};

var search = function (searchTerm) {
  return searchEngine.search(searchTerm);
};

exports.getPageContent = getPageContent;
exports.getPageContentAsHtml = getPageContentAsHtml;
exports.getPages = getPages;
exports.search = search;
