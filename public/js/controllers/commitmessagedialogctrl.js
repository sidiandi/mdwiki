(function (controllers) {
  'use strict';

  controllers.controller('CommitMessageDialogCtrl', ['$rootScope', '$scope', 'ngDialog', 'EditorService',
    function ($rootScope, $scope, ngDialog, editorService) {
      $scope.commitMessage = 'Some changes for ' + $rootScope.pageName;

      editorService.getSelectedText().then(function (selectedText) {
        if (selectedText) {
          $scope.commitMessage = selectedText;
        }
      });

      $scope.closeDialog = function () {
        ngDialog.close();
        $rootScope.$broadcast('save', { commitMessage: $scope.commitMessage });
      };
    }
  ]);
})(angular.module('mdwiki.controllers'));

