(function () {
  'use strict';

  describe('Directives spec', function () {
    var rootScope, compile;

    beforeEach(function () {
      module('mdwiki');
      module('mdwiki.directives');

      inject(function ($rootScope, $compile) {
        rootScope = $rootScope;
        compile = $compile;
      });
    });

    var createAndCompileHtml = function (scope, html) {
      var element = angular.element(html);
      compile(element)(scope);

      scope.$digest();

      return element;
    };

  });
})();


