(function (services, CodeMirror) {
  'use strict';

  services.factory('EditorService', ['$rootScope', '$q',
    function($rootScope, $q) {
      var getSelectedText = function () {
        var deferred = $q.defer();

        $rootScope.$broadcast('CodeMirror', function (codemirror) {
          deferred.resolve(codemirror.getSelection());
        });

        return deferred.promise;
      };

      return {
        getSelectedText: getSelectedText
      };
    }
  ]);
})(angular.module('mdwiki.services'), window.CodeMirror);
