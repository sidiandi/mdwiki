'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('SearchService', function () {
  var searchServiceInstance = {};
  searchServiceInstance.searchResult = '';
  return searchServiceInstance;
});
