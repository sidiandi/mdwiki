'use strict';

var controllers = controllers || angular.module('mdwiki.controllers', []);

controllers.controller('ContentCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$q', 'PageService', 'SettingsService', function ($rootScope, $scope, $routeParams, $location, $q, pageService, settingsService) {
  $scope.content = '';
  $scope.markdown = '';
  $scope.pageName = '';
  $scope.errorMessage = '';
  $scope.hasError = false;
  $scope.refresh = false;
  $scope.isEditorVisible = false;
  $scope.commitMessage = '';

  $scope.codemirror = {
    lineWrapping : true,
    lineNumbers: true,
    readOnly: 'nocursor',
    mode: 'markdown',
  };

  $scope.codemirrorLoaded = function (editor) {
    /* globals CodeMirror */
    CodeMirror.commands.save = function () {
      $rootScope.$broadcast('beforeSave');
    };
  };

  var settings = settingsService.get();
  var startPage = settings.startPage || 'index';
  var pageName = $routeParams.page || startPage;

  var prepareLinks = function (html, settings) {
    var $dom = $('<div>' + html + '</div>');

    $dom.find('a[href^="wiki/"]').each(function () {
      var $link = $(this);
      $link.attr('href', $link.attr('href').substring(4));
    });

    if (settings.provider === 'github') {
      $dom.find('a[href^="/static/"]').each(function () {
        var $link = $(this);
        var newLink = '/static/'.concat(settings.githubUser, '/', settings.githubRepository, '/', $link.attr('href').substring('/static/'.length));
        $link.attr('href', newLink);
        $link.attr('target', '_blank');
      });
    } else {
      $dom.find('a[href^="/static/"]').attr('target', '_blank');
    }
    return $dom.html();
  };

  var getPage = function (pageName) {
    var deferred = $q.defer();

    pageService.getPage(pageName)
      .then(function (pageContent) {
        $scope.pageName = pageName;
        $rootScope.pageName = pageName;
        $scope.content = prepareLinks(pageContent, settings);
        deferred.resolve();
      }, function (error) {
        if (pageName === startPage && error.code === 404) {
          $location.path('/git/connect');
        } else {
          $scope.errorMessage = 'Content not found!';
          $scope.hasError = true;
        }
        deferred.reject(error);
      });

    return deferred.promise;
  };

  var showOrHideEditor = function (isVisible) {
    $scope.isEditorVisible = isVisible;
    $rootScope.isEditorVisible = isVisible;
    $rootScope.$broadcast('isEditorVisible', { isEditorVisible: isVisible });
  };

  var showEditor = function () {
    showOrHideEditor(true);
  };

  var hideEditor = function () {
    showOrHideEditor(false);
  };

  var canEdit = function () {
    return $rootScope.isAuthenticated && !$scope.isEditorVisible;
  };

  $scope.showHtml = function () {
    getPage($scope.pageName).then(hideEditor());
  };

  $scope.editMarkdown = function () {
    if (!canEdit()) {
      //return;
    }

    showEditor();

    pageService.getPage(pageName, 'markdown')
      .then(function (markdown) {
        $scope.markdown = markdown;
        $scope.refresh = true;
      }, function (error) {
        if (pageName === startPage && error.code === 404) {
          $location.path('/git/connect');
        } else {
          $scope.errorMessage = 'Content not found!';
          $scope.hasError = true;
        }
      });
  };

  $rootScope.$on('save', function (event, data) {
    pageService.updatePage($scope.pageName, data.commitMessage, $scope.markdown)
      .then(function (pageContent) {
        $scope.content = prepareLinks(pageContent, settings);
        hideEditor();
      }, function (error) {
        $scope.errorMessage = error.message;
        $scope.hasError = true;
      });
  });

  $rootScope.$on('edit', function () {
    $scope.editMarkdown();
  });

  $rootScope.$on('cancelEdit', function () {
    hideEditor();
  });

  getPage(pageName).then(hideEditor);
}]);



