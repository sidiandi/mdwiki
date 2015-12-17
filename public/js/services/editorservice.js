(function (services) {
  'use strict';

  services.factory('EditorService', ['$rootScope', '$q',
    function($rootScope, $q) {
      var getSelectedText = function () {
        var deferred = $q.defer();

        deferred.resolve('');

        return deferred.promise;
      };

      return {
        getSelectedText: getSelectedText
      };
    }
  ]);
})(angular.module('mdwiki.services'));
