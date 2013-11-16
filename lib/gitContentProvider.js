'use strict';

var storage = require('./pageStorageFS');
var searchEngine = require('./textSearcher');

function GitContentProvider() {

}

GitContentProvider.prototype.getPageContent = function (pageName) {
  return storage.getPageContent(pageName);
};

GitContentProvider.prototype.getPageContentAsHtml = function (pageName) {
  return storage.getPageContentAsHtml(pageName);
};

GitContentProvider.prototype.getPages = function () {
  return storage.getPages();
};

GitContentProvider.prototype.search = function (searchTerm) {
  return searchEngine.search(searchTerm);
};

GitContentProvider.prototype.fetchStaticFile = function (request, response) {
  return storage.fetchStaticFile(request, response);
};


GitContentProvider.prototype.getName = function () {
  return "git";
};

module.exports = GitContentProvider;
