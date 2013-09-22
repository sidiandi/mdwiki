'use strict';

describe('Directives', function () {
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
        spyOn($.fn, 'tooltip').andCallThrough;

        // ACT
        element = createAndCompileHtml(scope, html);

        // ASSERT
        expect($.fn.tooltip).toHaveBeenCalled();
      });

    });
  });

  describe('bsSwitchtext', function () {
    var element, scope,
        html = '<button data-loading-text="Pulling..." bs-switchtext>Click me</button>';

    beforeEach(function () {
      scope = rootScope.$new();

      // get the jqLite or jQuery element
      element = createAndCompileHtml(scope, html);

    });

    // see http://stackoverflow.com/questions/15720072/how-do-i-test-angularjs-directive-to-spy-on-the-function-call
    describe('when the model isBusy changes to true', function () {
      it('should call the button method with loading', function () {
        // ARRANGE
        spyOn($.fn, 'button').andCallThrough();

        // ACT
        scope.$apply(function () {
          scope.isBusy = true;
        });

        // ASSERT
        expect(element.html()).toBe('Pulling...');
        expect($.fn.button).toHaveBeenCalledWith('loading');
      });
    });

    describe('when the model isBusy changes to false changes', function () {
      it('should call the button method with loading', function () {
        // ARRANGE
        spyOn($.fn, 'button').andCallThrough();

        // ACT
        scope.$apply(function () {
          scope.isBusy = false;
        });

        // ASSERT
        expect(element.html()).toBe('Click me');
        expect($.fn.button).toHaveBeenCalledWith('reset');
      });
    });

  });

});
