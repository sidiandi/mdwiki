'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var services = angular.module('mdwiki.services', []).value('version', '0.1');

services.factory('searchService', function (){
    var searchServiceInstance = {};
    searchServiceInstance.searchResult = '';
    return searchServiceInstance;
});

