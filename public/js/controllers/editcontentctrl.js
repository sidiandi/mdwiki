'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('EditContentCtrl', ['$rootScope', '$scope', 'ngDialog', function ($rootScope, $scope, ngDialog) {
  $scope.isAuthenticated = false;
  $scope.isEditorVisible = false;

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
  });

  $rootScope.$on('isEditorVisible', function (event, data) {
    $scope.isEditorVisible = data.isEditorVisible;
  });

  $rootScope.$on('closeCommitMessageDialog', function (event, data) {
    $rootScope.$broadcast('save', data);
  });

}]);
