'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('GitPullCtrl', ['$scope', '$route', 'GitService', 'PageService', 'SettingsService', function ($scope, $route, gitService, pageService, settingsService) {
  $scope.isBusy = false;
  $scope.message = '';
  $scope.hasError = false;
  $scope.hasContent = false;
  $scope.provider = 'git';

  var checkHasContent = function (pages) {
    $scope.hasContent = pages && pages.length > 0;
    $scope.provider = settingsService.get().provider;
  };

  pageService.registerObserver(checkHasContent);

  $scope.pull = function () {
    $scope.isBusy = true;
    $scope.message = 'Please wait while we pulling the latest changes in your repository...';
    $scope.hasError = false;

    gitService.pull()
      .then(pageService.getPages)
      .then(function () {
        $scope.message = 'The repository was successful update...';
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
