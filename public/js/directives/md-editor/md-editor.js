(function (angular) {
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

        scope.$watch('markdown', function (value) {

        });
      }
    };
  }
})(window.angular);
