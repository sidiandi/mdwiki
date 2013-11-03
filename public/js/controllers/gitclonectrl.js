'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('GitCloneCtrl', ['$scope', '$location', 'GitService', 'PageService', 'SettingsService', function ($scope, $location, gitService, pageService, settingsService) {
  $scope.provider = 'Github';
  $scope.repositoryUrl = '';
  $scope.isBusy = false;
  $scope.message = 'Please choose the provider that you want to use and enter the url of your git-repository';
  $scope.hasError = false;

  $scope.clone = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while cloning your repository...';
    $scope.hasError = false;

    var settings = { provider: $scope.provider, url: $scope.repositoryUrl };

    gitService.clone($scope.repositoryUrl)
              .then($scope.connect('The repository was successfully cloned!',
                                   'An error occurred while cloning the repository: '));

  };

  $scope.connect = function (successMessage, errorMessage) {
    if (successMessage === undefined) {
      successMessage = 'The git-repository was successfully connected!';
    }
    if (errorMessage === undefined) {
      errorMessage = 'An error occurred while connection to the git-repository: ';
    }

    $scope.message = 'Please wait while connecting your repository...';

    var settings = { provider: $scope.provider, url: $scope.repositoryUrl };

    pageService.getPages(settings)
      .then(function () {
        settingsService.put(settings);
        $scope.message = successMessage;
        $location.path('/');
      }, function (error) {
        $scope.message = errorMessage + error.message;
        $scope.isBusy = false;
        $scope.hasError = true;
      })
      .finally(function () {
        $scope.isBusy = false;
      });
  };

}]);
