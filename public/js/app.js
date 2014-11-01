(function (angular) {
  'use strict';

  var mdwiki = angular.module('mdwiki', [
    'ngRoute',
    'ngSanitize',
    'ngAnimate',
    'jmdobry.angular-cache',
    'ngDialog',
    'mdwiki.controllers',
    'mdwiki.services',
    'mdwiki.directives',
    'mdwiki.filters',
  ]).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider, $angularCacheProvider) {
    $routeProvider
      .when('/git/connect', {
        templateUrl: './views/gitconnect.html',
        controller: 'GitConnectCtrl'
      })
      .when('/', {
        templateUrl: './views/content.html',
        controller: 'ContentCtrl'
      })
      .when('/search', {
        templateUrl: './views/searchResult.html',
        controller: 'SearchCtrl'
      })
      .when('/:page', {
        templateUrl: './views/content.html',
        controller: 'ContentCtrl'
      }).otherwise({
        redirectTo: '/index'
      });

    $locationProvider.html5Mode(true);
  }]);

  angular.module('mdwiki.controllers', []);
  angular.module('mdwiki.services', []);
  angular.module('mdwiki.directives', []);
  angular.module('mdwiki.filters', []);
})(angular);

