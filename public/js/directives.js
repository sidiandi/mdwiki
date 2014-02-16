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

directives.directive('keybinding', ['$document', '$parse', '$window', function ($document, $parse, $window) {
  var isMac = /Mac|iPod|iPhone|iPad/.test($window.navigator.platform);

  function isModifier(modifier, event, isMac) {
    if (modifier) {
      switch (modifier) {
        case 'shift':
          return event.shiftKey;
        case 'ctrl':
        case 'cmd':
          return isMac ? event.metaKey : event.ctrlKey;
        case 'alt':
          return event.altKey;
      }
    }
    return false;
  }

  function verifyKeyCode(event, modifier, key) {
    if (String.fromCharCode(event.keyCode) === key) {
      if (modifier) {
        return isModifier(modifier, event, isMac);
      }
      return true;
    }
    return false;
  }

  function verifyCondition($eval, condition) {
    if (condition) {
      return $eval(condition);
    }
    return true;
  }

  return {
    restrict: 'E',
    scope: {
      modifier: '@modifier',
      key: '@key',
      condition: '&',
      invoke: '&'
    },
    link: function (scope, $element, attr) {
      $document.bind('keydown', function (event) {
        if (verifyKeyCode(event, scope.modifier, scope.key) &&
            verifyCondition(scope.$eval, scope.condition)) {
          scope.$apply(scope.invoke);
        }
      });
    }
  };
}]);

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

