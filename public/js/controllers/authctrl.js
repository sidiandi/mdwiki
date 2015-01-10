(function (controllers) {
  'use strict';

  controllers.controller('AuthCtrl', ['$rootScope', '$scope', '$window', 'AuthService',
    function ($rootScope, $scope, $window, authService) {
      $scope.isAuthenticated = false;
      $scope.user = null;

      authService.getAuthenticatedUser()
        .then(function (user) {
          $scope.user = user || null;
        });

      $scope.login = function () {
        $window.location.href = 'auth/github?page=' + $rootScope.pageName;
      };

      $scope.logout = function () {
        authService.logout()
          .then(function () {
            $scope.user = null;
          });
      };

      $scope.$watch('user', function (newValue, oldValue) {
        $rootScope.isAuthenticated = newValue !== null;
        $scope.isAuthenticated = $rootScope.isAuthenticated;
        $rootScope.$broadcast('isAuthenticated', { isAuthenticated: $rootScope.isAuthenticated });
      });

    }
  ]);
})(angular.module('mdwiki.controllers'));

