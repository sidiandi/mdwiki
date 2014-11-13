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

    describe('bsTooltip', function () {
      var element, scope,
          html = '<button data-original-title="Pull latest changes" bs-tooltip>Click me</button>';

      beforeEach(function () {

        scope = rootScope.$new();

      });

      describe('When the element was created', function () {

        it('should call the popup function', function () {
          // ARRANGE
          spyOn($.fn, 'tooltip').and.callThrough();

          // ACT
          element = createAndCompileHtml(scope, html);

          // ASSERT
          expect($.fn.tooltip).toHaveBeenCalled();
        });

      });
    });

  });
})();


