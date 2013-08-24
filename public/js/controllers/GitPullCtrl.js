'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('GitPullCtrl', ['$scope', '$route', 'GitService', function ($scope, $route, gitService) {
  $scope.isBusy = false;
  $scope.message = '';
  $scope.hasError = false;

  $scope.pull = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while pull the latest changes in your repository...';
    $scope.hasError = false;

    gitService.pull()
      .then(function () {
        $scope.message = 'The repository was successful update...';
        $('#pullButton').button('reset');
        $route.reload();
      }, function (error) {
        $scope.message = 'There is an error occured while updating your repository: ' + error.message;
        $scope.hasError = true;
      })
      .finally(function () {
        $scope.isBusy = false;
      });
  };
}]);
