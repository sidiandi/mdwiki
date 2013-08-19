'use strict';

var mdwiki = angular.module('mdwiki', [
  'ngRoute',
  'ngSanitize',
  'mdwiki.controllers',
  'mdwiki.filters',
  'mdwiki.services',
  'mdwiki.directives'
]).config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/git/clone', {
      templateUrl: './views/gitclone.html',
      controller: 'GitCloneCtrl'
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
});
