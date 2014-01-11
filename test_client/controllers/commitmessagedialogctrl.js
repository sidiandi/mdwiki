'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('CommitMessageDialogCtrl', ['$rootScope', '$scope', 'ngDialog', function ($rootScope, $scope, ngDialog) {
  $scope.commitMessage = 'Some changes for ' + $rootScope.pageName;

  $scope.closeDialog = function () {
    ngDialog.close();
    $rootScope.$broadcast('closeCommitMessageDialog', { commitMessage: $scope.commitMessage });
  };
}]);
