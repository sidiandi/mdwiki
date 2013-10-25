'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('GitCloneCtrl', ['$scope', '$location', 'GitService', 'PageService', function ($scope, $location, gitService, pageService) {
  $scope.repositoryUrl = '';
  $scope.isBusy = false;
  $scope.message = 'Please enter the git-url of your repository to clone it into the content folder';
  $scope.hasError = false;

  $scope.clone = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while cloning your repository...';
    $scope.hasError = false;

    gitService.clone($scope.repositoryUrl)
      .then(pageService.getPages)
      .then(function () {
        $scope.message = 'The repository was successfully cloned!';
        $location.path('/');
      }, function (error) {
        $scope.message = 'An error occurred while cloning the repository: ' + error.message;
        $scope.isBusy = false;
        $scope.hasError = true;
      })
      .finally(function () {
        $scope.isBusy = false;
      });
  };
}]);
