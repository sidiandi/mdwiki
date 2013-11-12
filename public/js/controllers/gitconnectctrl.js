'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('GitConnectCtrl', ['$scope', '$location', 'GitService', 'PageService', 'SettingsService', function ($scope, $location, gitService, pageService, settingsService) {
  $scope.provider = 'github';
  $scope.repositoryUrl = '';
  $scope.isBusy = false;
  $scope.message = 'Please choose the provider that you want to use and enter the url of your git-repository';
  $scope.repositoryUrlPlaceHolderText = '';
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

    var githubUser = $scope.repositoryUrl.split('/')[0];
    var githubRepository = $scope.repositoryUrl.split('/')[1];

    var settings = { provider: $scope.provider, githubUser: githubUser, githubRepository: githubRepository };

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

  $scope.$watch('provider', function () {
    switch ($scope.provider) {
    case 'git':
      $scope.repositoryUrlPlaceHolderText = 'Enter here the git-url of the repository';
      break;
    case 'github':
      $scope.repositoryUrlPlaceHolderText = 'Enter here the name of the git user and repository in format user/repository';
      break;
    }
  });

}]);
