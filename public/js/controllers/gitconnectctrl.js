(function (controllers) {
  'use strict';

  controllers.controller('GitConnectCtrl', ['$rootScope', '$scope', '$location', 'PageService', 'SettingsService', 'ServerConfigService', function ($rootScope, $scope, $location, pageService, settingsService, serverConfigService) {
    var settings = settingsService.get();
    $scope.provider = settings.provider || 'github';
    $scope.githubUser = settings.githubUser || 'mdwiki';
    $scope.repositoryName = settings.githubRepository || 'wiki';

    $scope.message = 'Please enter your GitHub user name and the name of the repository that you want to use for mdwiki.';
    $scope.githubUserPlaceHolderText = 'Enter here your GitHub username';
    $scope.repositoryNamePlaceHolderText = 'Enter here the name of the repository';

    $scope.isBusy = false;
    $scope.hasError = false;

    $scope.connect = function (successMessage) {
      successMessage = successMessage || 'The git-repository was successfully connected!';

      $scope.message = 'Please wait while connecting to your repository...';

      var respositoryUrl = $scope.githubUser + '/' + $scope.repositoryName;

      var settings = {
        provider: $scope.provider,
        url: respositoryUrl,
        githubRepository: $scope.repositoryName,
        githubUser: $scope.githubUser
      };

      pageService.getPages(settings)
        .then(function (pages) {
          var startPage = pageService.findStartPage(pages);
          if (startPage !== undefined && startPage.length > 0) {
            settings.startPage = startPage;
            settingsService.put(settings);
            $scope.message = successMessage;
            $location.path('/');

            $rootScope.$broadcast('OnGitConnected', { settings: settings});
          } else {
            $scope.message = 'No startpage was found!';
            $scope.isBusy = false;
            $scope.hasError = true;
          }
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
})(angular.module('mdwiki.controllers'));

