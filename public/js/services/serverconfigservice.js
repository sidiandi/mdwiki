(function (services) {
  'use strict';

  services.factory('ServerConfigService', ['$http', '$q', function ($http, $q) {
    var getConfig = function (page) {
      var deferred = $q.defer();

      $http({
        method: 'GET',
        url: '/api/serverconfig',
        headers: {'Content-Type': 'application/json'},
      })
      .success(function (data, status, headers, config) {
        deferred.resolve(data);
      })
      .error(function (data, status, headers, config) {
        var error = new Error();
        error.message = status === 404 ? 'Content not found' : 'Unexpected server error';
        error.code = status;
        deferred.reject(error);
      });

      return deferred.promise;
    };

    return {
      getConfig: getConfig
    };
  }]);
})(angular.module('mdwiki.services'));

