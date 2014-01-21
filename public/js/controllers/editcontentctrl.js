'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('EditContentCtrl', ['$rootScope', '$scope', '$location', 'ngDialog', function ($rootScope, $scope, $location, ngDialog) {
  var nonEditablePaths = ['/search', '/git/connect'];
  $scope.isAuthenticated = false;
  $scope.isEditorVisible = false;
  $scope.canEditPage = false;

  var isEditPagePossible = function (isAuthenticated, nonEditablePaths, path) {
    var canEditPage = isAuthenticated;

    if (canEditPage) {
      nonEditablePaths.forEach(function (nonEditablePath) {
        if (nonEditablePath === path) {
          canEditPage = false;
        }
      });
    }

    return canEditPage;
  };

  $scope.edit = function () {
    $rootScope.$broadcast('edit');
  };

  $scope.cancelEdit = function () {
    $rootScope.$broadcast('cancelEdit');
  };

  $scope.save = function () {
    ngDialog.open({
      template: 'commitMessageDialog',
      controller: 'CommitMessageDialogCtrl',
      className: 'ngdialog-theme-default'
    });
  };

  $rootScope.$on('isAuthenticated', function (event, data) {
    $scope.isAuthenticated = data.isAuthenticated;
    $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());
  });

  $rootScope.$on('isEditorVisible', function (event, data) {
    $scope.isEditorVisible = data.isEditorVisible;
  });

  $rootScope.$on('closeCommitMessageDialog', function (event, data) {
    $rootScope.$broadcast('save', data);
  });

  $rootScope.$on('beforeSave', function () {
    $scope.save();
  });

  $rootScope.$on('$routeChangeSuccess', function (e, current, pre) {
    $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());
  });

  $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());
}]);
