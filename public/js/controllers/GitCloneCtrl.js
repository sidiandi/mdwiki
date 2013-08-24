'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('GitCloneCtrl', ['$scope', '$location', 'GitService', function ($scope, $location, gitService) {
  $scope.repositoryUrl = '';
  $scope.isBusy = false;
  $scope.message = 'Please enter the git-url of your repository to clone it into the content folder';
  $scope.hasError = false;

  $scope.clone = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while cloning your repository...';
    $scope.hasError = false;

    gitService.clone($scope.repositoryUrl)
      .then(function () {
        $scope.message = 'The repository was successful cloned...';
        $location.path('/');
      }, function (error) {
        $scope.message = 'There is an error occured while cloning the repository: ' + error.message;
        $scope.isBusy = false;
        $scope.hasError = true;
      })
      .finally(function () {
        $scope.isBusy = false;
      });
  };
}]);