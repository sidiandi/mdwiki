(function (controllers) {
  'use strict';

  controllers.controller('CommitMessageDialogCtrl', ['$rootScope', '$scope', 'ngDialog', function ($rootScope, $scope, ngDialog) {
    $scope.commitMessage = 'Some changes for ' + $rootScope.pageName;

    $scope.closeDialog = function () {
      ngDialog.close();
      $rootScope.$broadcast('save', { commitMessage: $scope.commitMessage });
    };
  }]);
})(angular.module('mdwiki.controllers'));

