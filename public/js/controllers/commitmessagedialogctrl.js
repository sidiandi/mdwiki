(function (controllers) {
  'use strict';

  controllers.controller('CommitMessageDialogCtrl', ['$scope', '$mdDialog', 'EditorService',
    function ($scope, $mdDialog, editorService) {
      $scope.pageName = '';
      $scope.commitMessage = 'Some changes for ' + $scope.pageName;

      editorService.getSelectedText().then(function (selectedText) {
        if (selectedText) {
          $scope.commitMessage = selectedText;
        }
      });

      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.closeDialog = function (cancel) {
        $mdDialog.hide({
          cancel: cancel,
          commitMessage: $scope.commitMessage
        });
      };
    }
  ]);
})(angular.module('mdwiki.controllers'));

