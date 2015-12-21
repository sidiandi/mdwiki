(function (controllers) {
  'use strict';

  controllers.controller('ContentCtrl',
    ['$rootScope', '$scope', '$routeParams', '$location', '$q', '$window',
     '$mdToast', '$mdDialog', 'PageService', 'SettingsService',
    function ($rootScope, $scope, $routeParams, $location, $q, $window,
              $mdToast, $mdDialog, pageService, settingsService) {
      $scope.content = '';
      $scope.markdown = '';
      $scope.pageName = '';
      $scope.refresh = false;
      $scope.isEditorVisible = false;

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

      var showError = function (errorMessage) {
        $mdToast.show(
          $mdToast.simple()
            .content(errorMessage)
            .position('bottom fit')
            .hideDelay(3000)
        );
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
              showError('Content not found!');
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
        if ($routeParams.edit) {
          $location.search({});
        }
        showOrHideEditor(false);
      };

      var editPage = function (pageName) {
        showEditor();

        pageService.getPage(pageName, 'markdown')
          .then(function (markdown) {
            $scope.markdown = markdown;
            $scope.refresh = true;
          })
          .catch(function (error) {
            if (pageName === startPage && error.code === 404) {
              $location.path('/git/connect');
            } else {
              showError('Content not found: ' + error.message);
            }
          });
      };

      var savePage = function (pageName, commitMessage, content) {
        pageService.savePage(pageName, commitMessage, content)
          .then(function (pageContent) {
            $scope.content = prepareLinks(pageContent, settings);
            hideEditor();
          })
          .catch(function (error) {
            showError('Save current page failed: ' + error.message);
          });
      };

      function saveChanges(event, commitMessage, markdown) {
        $mdDialog.show({
          controller: CommitMessageDialogController,
          templateUrl: 'commitMessageDialog',
          locals: {
            commitMessage: commitMessage || 'Some changes for ' + $scope.pageName
          },
          targetEvent: event
        })
        .then(function(result) {
          if (!result.cancel) {
            savePage($scope.pageName, result.commitMessage, markdown);
          }
        });
      }

      $scope.navigate = function(direction) {
        if ($window.history.length === 0) {
          return;
        }

        if (direction === 'back') {
          $window.history.back();
        } else {
          $window.history.forward();
        }
      };

      $scope.$on('cancelEdit', function() {
        hideEditor();
      });

      $scope.$on('saveChanges', function(event, args){
        saveChanges(args.event, args.commitMessage, args.markdown);
      });

      getPage(pageName).then(function () {
        if ($routeParams.edit && $rootScope.isAuthenticated) {
          editPage(pageName);
        } else {
          hideEditor();
        }
      });
    }
  ]);

  function CommitMessageDialogController($scope, $mdDialog, commitMessage) {
    $scope.commitMessage = commitMessage;

    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.closeDialog = function (cancel) {
      $mdDialog.hide({
        cancel: cancel,
        commitMessage: $scope.commitMessage
      });
    };
  }

})(angular.module('mdwiki.controllers'));
