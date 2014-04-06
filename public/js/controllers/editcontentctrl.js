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

  $scope.create = function () {
    ngDialog.open({
      template: 'createNewPageDialog',
      className: 'ngdialog-theme-default',
      controller: 'NewPageDialogCtrl',
    });
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
      className: 'ngdialog-theme-default',
      controller: 'CommitMessageDialogCtrl',
    });
  };

  var isAuthenticatedUnregister = $rootScope.$on('isAuthenticated', function (event, data) {
    $scope.isAuthenticated = data.isAuthenticated;
    $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());
  });

  var isEditorVisibleUnregister = $rootScope.$on('isEditorVisible', function (event, data) {
    $scope.isEditorVisible = data.isEditorVisible;
  });

  var beforeSaveUnregister = $rootScope.$on('beforeSave', function () {
    $scope.save();
  });

  var routeChangeSuccessUnregister = $rootScope.$on('$routeChangeSuccess', function (e, current, pre) {
    $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());
  });

  $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());

  $scope.$on('$destroy', function () {
    beforeSaveUnregister();
    isAuthenticatedUnregister();
    isEditorVisibleUnregister();
    routeChangeSuccessUnregister();
  });
}]);
