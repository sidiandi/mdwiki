(function (controllers) {
  'use strict';

  controllers.controller('SidebarCtrl', ['$mdSidenav', sidebarCtrl]);

  function sidebarCtrl($mdSidenav) {
    /*jshint validthis:true */
    this.toggleList = toggleList;

    function toggleList(id) {
      $mdSidenav(id).toggle();
    }
  }
})(angular.module('mdwiki.controllers'));