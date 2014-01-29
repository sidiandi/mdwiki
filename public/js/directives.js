'use strict';

var directives = angular.module('mdwiki.directives', []);

directives.directive('bsTooltip', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.tooltip({
        animation: true,
        placement: 'bottom',
        delay: { show: 100, hide: 100 }
      });
    }
  };
});

directives.directive('bsSwitchtext', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      scope.$watch('isBusy', function (newValue, oldValue) {
        if (newValue === true) {
          element.button('loading');
        } else {
          element.button('reset');
        }
      });
    }
  };
});

directives.directive('keybinding', function ($document, $parse) {
  return {
    restrict: 'E',
    scope: {
      key: '@key',
      condition: '&',
      invoke: '&'
    },
    link: function (scope, $element, attr) {
      $document.bind('keydown', function (event) {
        var key = parseInt(scope.key.toString());
        if (event.keyCode === key) {
          if (scope.$eval(scope.condition)) {
            scope.$apply(scope.invoke);
          }
        }
      });
    }
  };
});

directives.directive('autoFocus', function () {
  return {
    restrict: 'AC',
    link: function (scope, element) {
      element[0].focus();
    }
  };
});

directives.directive('autoSelect', ['$timeout', function ($timeout) {
  return {
    restrict: 'AC',
    link: function (scope, element) {
      element.bind('focus', function () {
        $timeout(function () {
          element[0].select();
        }, 1);
      });
    }
  };
}]);

