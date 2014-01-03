'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('AuthCtrl', ['$scope', 'AuthService', function ($scope, authService) {
  $scope.isAuthenticated = false;
  $scope.user = null;

  authService.getAuthenticatedUser()
    .then(function (user) {
      $scope.user = user || null;
    });

  $scope.logout = function () {
    authService.logout()
      .then(function () {
        $scope.user = null;
      });
  };

  $scope.$watch('user', function (newValue, oldValue) {
    $scope.isAuthenticated = newValue !== null;
  });

}]);
