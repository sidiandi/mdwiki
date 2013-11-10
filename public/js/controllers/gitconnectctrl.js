'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('GitConnectCtrl', ['$scope', '$location', 'GitService', 'PageService', 'SettingsService', function ($scope, $location, gitService, pageService, settingsService) {
  $scope.provider = 'GitHub';
  $scope.repositoryUrl = '';
  $scope.isBusy = false;
  $scope.message = 'Please choose the provider that you want to use and enter the url of your git-repository';
  $scope.hasError = false;

  $scope.clone = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while cloning your repository...';
    $scope.hasError = false;

    gitService.clone($scope.repositoryUrl)
      .then(function () {
        $scope.connect('The repository was successfully cloned!');
      }, function (error) {
        $scope.message = 'An error occurred while cloning the repository: ' + error.message;
        $scope.isBusy = false;
        $scope.hasError = true;
      });
  };

  $scope.connect = function (successMessage) {
    successMessage = successMessage || 'The git-repository was successfully connected!';

    $scope.message = 'Please wait while connecting your repository...';

    var settings = { provider: $scope.provider, url: $scope.repositoryUrl };

    pageService.getPages(settings)
      .then(function () {
        settingsService.put(settings);
        $scope.message = successMessage;
        $location.path('/');
      }, function (error) {
        $scope.message = 'An error occurred while connection to the git-repository: ' + error.message;
        $scope.isBusy = false;
        $scope.hasError = true;
      })
      .finally(function () {
        $scope.isBusy = false;
      });
  };

}]);
