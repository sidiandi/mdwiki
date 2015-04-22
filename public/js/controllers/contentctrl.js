(function (controllers, CodeMirror) {
  'use strict';

  controllers.controller('ContentCtrl',
    ['$rootScope', '$scope', '$routeParams', '$location', '$q', '$mdToast', '$mdDialog',
     'PageService', 'SettingsService',
    function ($rootScope, $scope, $routeParams, $location, $q, $mdToast, $mdDialog,
              pageService, settingsService) {
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

      var settings = settingsService.get();
      var startPage = settings.startPage || 'index';
      var pageName = $routeParams.page || startPage;

      $scope.codemirrorLoaded = function (editor) {
        CodeMirror.commands.save = function () {
          $scope.saveChanges();
        };
      };

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
              $scope.errorMessage = 'Content not found: ' + error.message;
              $scope.hasError = true;
            }
          });
      };

      var createPage = function (pageName) {
        pageService.savePage(pageName, 'create new page ' + pageName, '#' + pageName)
          .then(function (pageContent) {
            $scope.pageName = pageName;
            $rootScope.pages.push({
              fileName: pageName + '.md',
              name: pageName,
              title: pageName
            });
            $location.path('/' + pageName).search('edit');
          })
          .catch(function (error) {
            $scope.errorMessage = 'Create new page failed: ' + error.message;
            $scope.hasError = true;
          });
      };

      var removePageFromPages = function (pages, pageName) {
        var index = -1;

        pages.forEach(function (page) {
          if (page.name === pageName) {
            index = pages.indexOf(page);
          }
        });
        if (index >= 0) {
          pages.splice(index, 1);
        }
      };

      var deletePage = function (pageName) {
        pageService.deletePage(pageName)
          .then(function () {
            removePageFromPages($rootScope.pages, pageName);
            $location.path('/');
          })
          .catch(function (error) {
            $scope.errorMessage = 'Delete the current page failed: ' + error.message;
            $scope.hasError = true;
          });
      };

      var savePage = function (pageName, commitMessage, content) {
        pageService.savePage(pageName, commitMessage, content)
          .then(function (pageContent) {
            $scope.content = prepareLinks(pageContent, settings);
            hideEditor();
          })
          .catch(function (error) {
            $scope.errorMessage = 'Save current page failed: ' + error.message;
            $scope.hasError = true;
          });
      };

      $scope.cancelEdit = function () {
        hideEditor();
      };

      $scope.saveChanges = function (event) {
        $mdDialog.show({
          controller: ['$rootScope', '$scope', '$mdDialog', 'EditorService', CommitMessageDialogController],
          templateUrl: 'commitMessageDialog',
          targetEvent: event,
        })
        .then(function(result) {
          if (!result.cancel) {
            savePage($scope.pageName, result.commitMessage, $scope.markdown);
          }
        });
      };

      var saveUnregister = $rootScope.$on('save', function (event, data) {
        savePage($scope.pageName, data.commitMessage, $scope.markdown);
      });

      var createUnregister = $rootScope.$on('create', function (event, data) {
        createPage(data.pageName);
      });

      var deleteUnregister = $rootScope.$on('delete', function (event, data) {
        deletePage($scope.pageName);
      });

      var editUnregister = $rootScope.$on('edit', function () {
        editPage($scope.pageName);
      });

      var cancelEditUnregister = $rootScope.$on('cancelEdit', function () {
        hideEditor();
      });

      var unregisterHasError = $scope.$watch('hasError', function (hasError) {
        if (hasError) {
          $scope.hasError = false;

          $mdToast.show(
            $mdToast.simple()
              .content($scope.errorMessage)
              .position('bottom fit')
              .hideDelay(3000)
          );
        }
      });

      $scope.$on('$destroy', function () {
        cancelEditUnregister();
        createUnregister();
        deleteUnregister();
        editUnregister();
        saveUnregister();
        unregisterHasError();
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

  function CommitMessageDialogController($rootScope, $scope, $mdDialog, editorService) {
    $scope.commitMessage = 'Some changes for ' + $rootScope.pageName;

    editorService.getSelectedText().then(function (selectedText) {
      if (selectedText) {
        $scope.commitMessage = selectedText;
      }
    });

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

})(angular.module('mdwiki.controllers'), window.CodeMirror);




