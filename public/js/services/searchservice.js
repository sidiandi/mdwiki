'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('SearchService', ['$http', '$q', 'HttpHeaderBuilderService', function ($http, $q, httpHeaderBuilder) {
    var searchServiceInstance = {};
    searchServiceInstance.searchResult = '';

    var search = function (textToSearch) {
      var deferred = $q.defer();

      $http({
        method: 'POST',
        url: '/api/search',
        headers: httpHeaderBuilder.build('application/json'),
        data: { textToSearch: textToSearch }
      })
      .success(function (searchResult, status, headers, config) {
        deferred.resolve(searchResult);
      })
      .error(function (searchedText, status, headers, config) {
        deferred.reject(searchedText);
      });
    };

    return {
      search: search,
      searchServiceInstance: searchServiceInstance
    };

  }]);
