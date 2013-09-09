'use strict';

/* Directives */

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
    link: function postlink(scope, element, attrs) {
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
