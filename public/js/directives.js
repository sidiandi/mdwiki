'use strict';

/* Directives */

var directives = angular.module('mdwiki.directives', []);

directives.directive('appVersion', function (version) {
    return function (scope, elm, attrs) {
      elm.text(version);
    };
  });
