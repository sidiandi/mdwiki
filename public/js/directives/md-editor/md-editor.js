(function (angular, SimpleMDE, CodeMirror) {
  'use strict';

  angular.module('mdwiki.directives')
    .directive('mdEditor', mdEditor);

  mdEditor.$inject = ['$timeout'];

  function mdEditor ($timeout) {
    return {
      scope: {
        markdown: '='
      },
      restrict: 'E',
      replace: true,
      templateUrl: 'js/directives/md-editor/md-editor.tpl.html',
      link: function (scope, element, attributes) {
        var textArea = element.find('textarea')[0];
        var options = {
          element: textArea,
          spellChecker: false,
          status: false,
          previewRender: false
        };
        var simpleMDE = new SimpleMDE(options);
        CodeMirror.commands.save = saveChanges;

        scope.cancelEdit = cancelEdit;
        scope.saveChanges = saveChanges;

        function cancelEdit() {
          scope.$emit('cancelEdit');
        }

        function saveChanges($event) {
          scope.markdown = simpleMDE.value();

          var args = {
            commitMessage: simpleMDE.codemirror.getSelection(),
            markdown: scope.markdown,
            event: $event
          };
          scope.$emit('saveChanges', args);
        }

        scope.$watch('markdown', function (value) {
          if (value) {
            simpleMDE.value(value);
          }
        });
      }
    };
  }
})(window.angular, window.SimpleMDE, window.CodeMirror);
