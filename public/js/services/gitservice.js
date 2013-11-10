'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('GitService', ['$http', '$q', 'HttpHeaderBuilderService', function ($http, $q, httpHeaderBuilder) {
  var clone = function (repositoryUrl) {
    var deferred = $q.defer();

    $http({
      method: 'POST',
      url: '/api/git/clone',
      headers: httpHeaderBuilder.build('application/json'),
      data: { repositoryUrl: repositoryUrl }
    })
    .success(function (data, status, headers, config) {
      deferred.resolve();
    })
    .error(function (data, status, headers, config) {
      deferred.reject(new Error('Unexpected server error'));
    });

    return deferred.promise;
  };

  var pull = function () {
    var deferred = $q.defer();

    $http({
      method: 'POST',
      url: '/api/git/pull',
      headers: httpHeaderBuilder.build('application/json')
    })
    .success(function (data, status, headers, config) {
      deferred.resolve();
    })
    .error(function (data, status, headers, config) {
      deferred.reject(new Error('Unexpected server error'));
    });

    return deferred.promise;
  };

  return {
    clone: clone,
    pull: pull
  };
}]);
