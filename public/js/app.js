(function (angular) {
  'use strict';

  var mdwiki = angular.module('mdwiki', [
    'ngRoute',
    'ngSanitize',
    'ngAnimate',
    'ngMaterial',
    'jmdobry.angular-cache',
    'ui.codemirror',
    'ngDialog',
    'mdwiki.controllers',
    'mdwiki.services',
    'mdwiki.directives',
    'mdwiki.filters',
  ]).config(['$routeProvider', '$locationProvider', '$mdThemingProvider', '$mdIconProvider',
    function ($routeProvider, $locationProvider, $mdThemingProvider, $mdIconProvider) {
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

      $mdIconProvider.defaultIconSet('./images/svg/avatars.svg', 128)
                     .icon('menu'       , './images/svg/menu.svg'        , 24)
                     .icon('share'      , './images/svg/share.svg'       , 24)
                     .icon('google_plus', './images/svg/google_plus.svg' , 512)
                     .icon('hangouts'   , './images/svg/hangouts.svg'    , 512)
                     .icon('twitter'    , './images/svg/twitter.svg'     , 512)
                     .icon('phone'      , './images/svg/phone.svg'       , 512);

      $mdThemingProvider.theme('default')
                        .primaryPalette('blue')
                        .accentPalette('red');
    }
  ]);

  angular.module('mdwiki.controllers', []);
  angular.module('mdwiki.services', []);
  angular.module('mdwiki.directives', []);
  angular.module('mdwiki.filters', []);
})(angular);

