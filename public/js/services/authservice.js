'use strict';

var services = services || angular.module('mdwiki.services', []);

services.factory('AuthService', ['$http', '$q', function ($http, $q) {
  var user = '';

  var isAuthenticated = function () {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: '/auth/user',
      headers: {'Content-Type': 'application/json'},
    })
    .success(function (auth, status, headers, config) {
      deferred.resolve(auth.user);
    })
    .error(function (data, status, headers, config) {
      deferred.reject(data);
    });

    return deferred.promise;
  };

  var logout = function () {
    var deferred = $q.defer();

    $http({
      method: 'POST',
      url: '/auth/logout',
    })
    .success(function (data, status, headers, config) {
      deferred.resolve(data);
    })
    .error(function (data, status, headers, config) {
      deferred.reject(data);
    });

    return deferred.promise;
  };

  return {
    logout: logout,
    isAuthenticated: isAuthenticated
  };
}]);
