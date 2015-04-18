(function (angular) {
  'use strict';

  var mdwiki = angular.module('mdwiki', [
    'ngRoute',
    'ngSanitize',
    'ngAnimate',
    'ngMaterial',
    'ngTouch',
    'jmdobry.angular-cache',
    'ui.codemirror',
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


(function (directives) {
  'use strict';

  directives.directive('keybinding', ['$document', '$parse', '$window', function ($document, $parse, $window) {
    var isMac = /Mac|iPod|iPhone|iPad/.test($window.navigator.platform);

    function isModifier(modifier, event, isMac) {
      var isShift = event.shiftKey;
      var isAlt = event.altKey;
      var isCtrl = isMac ? event.metaKey : event.ctrlKey;

      if (modifier) {
        switch (modifier) {
          case 'ctrl+shift':
          case 'shift+ctrl':
            return isShift && isCtrl;
          case 'alt+shift':
          case 'shift+alt':
            return isShift && isAlt;
          case 'ctrl+alt':
          case 'cmd+alt':
            return isAlt && isCtrl;
          case 'cmd+ctrl':
            return event.metaKey && event.CtrlKey;
          case 'shift':
            return isShift;
          case 'ctrl':
          case 'cmd':
            return isCtrl;
          case 'alt':
            return isAlt;
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

  directives.directive('onEnter', ['$timeout',
    function ($timeout) {
      return {
        restrict: 'A',
        scope: {
          onEnter: '&'
        },
        link: function (scope, element, attr) {
          element.bind('keydown', function (event) {
            if (event.keyCode === 13) {
              scope.$apply(function () {
                scope.$eval(scope.onEnter);
              });
            }
          });
        }
      };
    }
  ]);

  directives.directive('autoFocus', ['$timeout', function ($timeout) {
      return {
        restrict: 'AC',
        link: function (scope, element) {
          $timeout(function () {
            element[0].focus();
          }, 5);
        }
      };
    }]);

  directives.directive('autoSelect', ['$timeout', function ($timeout) {
    return {
      restrict: 'AC',
      link: function (scope, element) {
        element.bind('focus', function () {
          $timeout(function () {
            element[0].select();
          }, 10);
        });
      }
    };
  }]);
})(angular.module('mdwiki.directives'));


(function (services) {
  'use strict';

  services.factory('ApiUrlBuilderService', [ 'SettingsService', function (settingsService) {
    var build = function (urlBefore, urlAfter, settings) {
      settings = settings || settingsService.get();

      if (settings.provider === 'github') {
        return urlBefore + settings.githubUser + '/' + settings.githubRepository + '/' + urlAfter;
      }

      return urlBefore + urlAfter;
    };

    return {
      build: build
    };
  }]);
})(angular.module('mdwiki.services'));


(function (services) {
  'use strict';

  services.factory('AuthService', ['$http', '$q', function ($http, $q) {
    var getAuthenticatedUser = function () {
      var deferred = $q.defer();

      $http({
        method: 'GET',
        url: '/auth/user',
        headers: {'Content-Type': 'application/json'},
      })
      .success(function (auth, status, headers, config) {
        deferred.resolve(auth.user);
      })
      .error(function (data, status, headers, config) {
        deferred.reject(data);
      });

      return deferred.promise;
    };

    var logout = function () {
      var deferred = $q.defer();

      $http({
        method: 'DELETE',
        url: '/auth/user',
      })
      .success(function (data, status, headers, config) {
        deferred.resolve(data);
      })
      .error(function (data, status, headers, config) {
        deferred.reject(data);
      });

      return deferred.promise;
    };

    return {
      logout: logout,
      getAuthenticatedUser: getAuthenticatedUser
    };
  }]);
})(angular.module('mdwiki.services'));


(function (services, CodeMirror) {
  'use strict';

  services.factory('EditorService', ['$rootScope', '$q',
    function($rootScope, $q) {
      var getSelectedText = function () {
        var deferred = $q.defer();

        $rootScope.$broadcast('CodeMirror', function (codemirror) {
          deferred.resolve(codemirror.getSelection());
        });

        return deferred.promise;
      };

      return {
        getSelectedText: getSelectedText
      };
    }
  ]);
})(angular.module('mdwiki.services'), window.CodeMirror);

(function (services) {
  'use strict';

  services.factory('HttpHeaderBuilderService', [ 'SettingsService', function (settingsService) {
    var build = function (contentType, settings) {
      contentType = contentType || 'application/json';
      settings = settings || settingsService.get();

      return {
        'Content-Type': 'application/json',
        'X-MDWiki-Provider': settings.provider,
        'X-MDWiki-Url': settings.url
      };
    };

    return {
      build: build
    };
  }]);
})(angular.module('mdwiki.services'));


(function (services) {
  'use strict';

  services.factory('PageService', ['$http', '$q', 'ApiUrlBuilderService', function ($http, $q, urlBuilder) {
    var updatePagesObservers = [];

    var getPage = function (page, format) {
      format = format || 'html';
      var deferred = $q.defer(),
          requestUrl = urlBuilder.build('/api/', 'page/' + page);

      if (format === 'markdown')
      {
        requestUrl += '?format=markdown';
      }

      $http({
        method: 'GET',
        url: requestUrl
      })
      .success(function (pageContent, status, headers, config) {
        deferred.resolve(pageContent);
      })
      .error(function (errorMessage, status, headers, config) {
        var error = new Error();
        error.message = status === 404 ? 'Content not found' : 'Unexpected server error: ' + errorMessage;
        error.code = status;
        deferred.reject(error);
      });

      return deferred.promise;
    };

    var savePage = function (pageName, commitMessage, markdown) {
      var deferred = $q.defer();

      $http({
        method: 'PUT',
        url: urlBuilder.build('/api/', 'page/' + pageName),
        headers: { 'Content-Type': 'application/json' },
        data: {
          commitMessage: commitMessage,
          markdown: markdown
        }
      })
      .success(function (pageContent, status, headers, config) {
        deferred.resolve(pageContent);
      })
      .error(function (errorMessage, status, headers, config) {
        var error = new Error();
        error.message = status === 404 ? 'Content not found' : 'Unexpected server error: ' + errorMessage;
        error.code = status;
        deferred.reject(error);
      });

      return deferred.promise;
    };

    var deletePage = function (pageName) {
      var deferred = $q.defer();

      $http({
        method: 'DELETE',
        url: urlBuilder.build('/api/', 'page/' + pageName)
      })
      .success(function (pageContent, status, headers, config) {
        deferred.resolve(pageContent);
      })
      .error(function (errorMessage, status, headers, config) {
        var error = new Error();
        error.message = status === 404 ? 'Content not found' : 'Unexpected server error: ' + errorMessage;
        error.code = status;
        deferred.reject(error);
      });

      return deferred.promise;
    };

    var getPages = function (settings) {
      var deferred = $q.defer();

      $http({
        method: 'GET',
        url: urlBuilder.build('/api/', 'pages', settings),
        headers: { 'Content-Type': 'application/json' }
      })
      .success(function (data, status, headers, config) {
        var pages = data || [];

        notifyObservers(pages);
        deferred.resolve(pages);
      })
      .error(function (errorMessage, status, headers, config) {
        var error = new Error();
        error.code = status;
        error.message = status === 404 ? 'Content not found' : 'Unexpected server error: ' + errorMessage;
        deferred.reject(error);
      });

      return deferred.promise;
    };

    var findStartPage = function (pages) {
      var pagesToFind = ['index', 'home', 'readme'];

      for (var i = 0; i < pagesToFind.length ; i++) {
        var startPage = findPage(pages, pagesToFind[i]);
        if (startPage !== undefined && startPage.length > 0) {
          return startPage;
        }
      }
      return '';
    };

    var findPage = function (pages, pageName) {
      for (var i = 0; i < pages.length; i++) {
        if (pageName === pages[i].name.toLowerCase()) {
          return pages[i].name;
        }
      }
      return '';
    };

    var registerObserver = function (callback) {
      updatePagesObservers.push(callback);
    };

    var notifyObservers = function (pages) {
      angular.forEach(updatePagesObservers, function (callback) {
        callback(pages);
      });
    };

    return {
      findStartPage: findStartPage,
      getPage: getPage,
      savePage: savePage,
      deletePage: deletePage,
      getPages: getPages,
      registerObserver: registerObserver
    };
  }]);
})(angular.module('mdwiki.services'));


(function (services) {
  'use strict';

  services.factory('SearchService', ['$http', '$q', 'ApiUrlBuilderService', function ($http, $q, urlBuilder) {
    var searchServiceInstance = {};
    searchServiceInstance.searchResult = '';

    var search = function (textToSearch) {
      var deferred = $q.defer();

      $http({
        method: 'POST',
        url: urlBuilder.build('/api/', 'search'),
        headers: { 'Content-Type': 'application/json' },
        data: { textToSearch: textToSearch }
      })
      .success(function (searchResult, status, headers, config) {
        deferred.resolve(searchResult);
      })
      .error(function (searchedText, status, headers, config) {
        deferred.reject(searchedText);
      });

      return deferred.promise;
    };

    return {
      search: search,
      searchServiceInstance: searchServiceInstance
    };

  }]);
})(angular.module('mdwiki.services'));


(function (services) {
  'use strict';

  services.factory('ServerConfigService', ['$http', '$q', function ($http, $q) {
    var getConfig = function (page) {
      var deferred = $q.defer();

      $http({
        method: 'GET',
        url: '/api/serverconfig',
        headers: {'Content-Type': 'application/json'},
      })
      .success(function (data, status, headers, config) {
        deferred.resolve(data);
      })
      .error(function (data, status, headers, config) {
        var error = new Error();
        error.message = status === 404 ? 'Content not found' : 'Unexpected server error';
        error.code = status;
        deferred.reject(error);
      });

      return deferred.promise;
    };

    return {
      getConfig: getConfig
    };
  }]);
})(angular.module('mdwiki.services'));


(function (services) {
  'use strict';

  services.factory('SettingsService', ['$angularCacheFactory', function ($angularCacheFactory) {
    var cache = $angularCacheFactory('mdwiki', { storageMode: 'localStorage' });

    var getDefaultSettings = function () {
      return {
        provider: 'github',
        githubUser: 'mdwiki',
        githubRepository: 'wiki',
        url: 'mdwiki/wiki',
        startPage: 'index'
      };
    };

    var isDefaultSettings = function (settings) {
      return angular.equals(settings, this.getDefaultSettings());
    };

    var get = function () {
      var settings = cache.get('settings');
      if (settings === undefined) {
        settings = this.getDefaultSettings();
      }
      return settings;
    };

    var put = function (settings) {
      cache.put('settings', settings);
    };

    return {
      get: get,
      put: put,
      getDefaultSettings: getDefaultSettings,
      isDefaultSettings: isDefaultSettings
    };
  }]);
})(angular.module('mdwiki.services'));


(function (controllers) {
  'use strict';

  controllers.controller('AuthCtrl', ['$rootScope', '$scope', '$window', 'AuthService',
    function ($rootScope, $scope, $window, authService) {
      $scope.isAuthenticated = false;
      $scope.user = null;

      authService.getAuthenticatedUser()
        .then(function (user) {
          $scope.user = user || null;
        });

      $scope.login = function () {
        $window.location.href = 'auth/github?page=' + $rootScope.pageName;
      };

      $scope.logout = function () {
        authService.logout()
          .then(function () {
            $scope.user = null;
          });
      };

      $scope.connect = function () {
        $window.location.href = '/git/connect';
      };

      $scope.$watch('user', function (newValue, oldValue) {
        $rootScope.isAuthenticated = newValue !== null;
        $scope.isAuthenticated = $rootScope.isAuthenticated;
        $rootScope.$broadcast('isAuthenticated', { isAuthenticated: $rootScope.isAuthenticated });
      });

    }
  ]);
})(angular.module('mdwiki.controllers'));


(function (controllers) {
  'use strict';

  controllers.controller('CommitMessageDialogCtrl', ['$scope', '$mdDialog', 'EditorService',
    function ($scope, $mdDialog, editorService) {
      $scope.pageName = '';
      $scope.commitMessage = 'Some changes for ' + $scope.pageName;

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
  ]);
})(angular.module('mdwiki.controllers'));


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
          $rootScope.$broadcast('beforeSave');
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
        deletePage(data.pageName);
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





(function (controllers, angular, document) {
  'use strict';

  controllers.controller('EditContentCtrl', ['$rootScope', '$scope', '$location', '$window', '$mdDialog',
    function ($rootScope, $scope, $location, $window, $mdDialog) {
      var nonEditablePaths = ['/search', '/git/connect'];

      $scope.isAuthenticated = false;
      $scope.isEditorVisible = false;
      $scope.canEditPage = false;
      $scope.showPopup = false;

      var isEditPagePossible = function (isAuthenticated, nonEditablePaths, path) {
        var canEditPage = isAuthenticated;

        if (canEditPage) {
          nonEditablePaths.forEach(function (nonEditablePath) {
            if (nonEditablePath === path) {
              canEditPage = false;
            }
          });
        }
        return canEditPage;
      };

      $scope.showOrHidePopup = function () {
        $scope.showPopup = !$scope.showPopup;
      };

      $scope.create = function (event) {
        $scope.showPopup = false;

        $mdDialog.show({
          controller: ['$scope', '$mdDialog', CreateNewPageController],
          templateUrl: 'createNewPageDialog',
          targetEvent: event,
        })
        .then(function(dialogResult) {
          if (!dialogResult.cancel) {
            $rootScope.$broadcast('edit', { pageName: dialogResult.pageName });
          }
        });
      };

      $scope.delete = function (event) {
        $scope.showPopup = false;

        if ($rootScope.pageName === 'index') {
          var alertDialog = $mdDialog.alert()
              .title('Delete start page?')
              .content('It is not a good idea to delete your start page!')
              .targetEvent(event)
              .ariaLabel('Delete start page forbidden')
              .ok('Ok');

          $mdDialog.show(alertDialog);

          return;
        }

        var confirmDialog = $mdDialog.confirm()
          .title('Delete current page?')
          .content('Are you sure that you want to delete the current page?')
          .targetEvent(event)
          .ariaLabel('Delete current page?')
          .ok('Ok')
          .cancel('Cancel');

        $mdDialog.show(confirmDialog)
          .then(function() {
            $rootScope.$broadcast('edit');
          });
      };

      $scope.edit = function () {
        $scope.showPopup = false;
        $rootScope.$broadcast('edit');
      };


      var isAuthenticatedUnregister = $rootScope.$on('isAuthenticated', function (event, data) {
        $scope.isAuthenticated = data.isAuthenticated;
        $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());
      });

      var isEditorVisibleUnregister = $rootScope.$on('isEditorVisible', function (event, data) {
        $scope.isEditorVisible = data.isEditorVisible;
      });

      var routeChangeSuccessUnregister = $rootScope.$on('$routeChangeSuccess', function (e, current, pre) {
        $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());
      });

      $scope.canEditPage = isEditPagePossible($scope.isAuthenticated, nonEditablePaths, $location.path());

      $scope.$on('$destroy', function () {
        isAuthenticatedUnregister();
        isEditorVisibleUnregister();
        routeChangeSuccessUnregister();
      });

    }
  ]);

  function CreateNewPageController($scope, $mdDialog) {
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.closeDialog = function (cancel) {
      $mdDialog.hide({
        cancel: cancel,
        pageName: $scope.pageName
      });
    };
  }

})(angular.module('mdwiki.controllers'), window.angular, window.document);


(function (controllers) {
  'use strict';

  controllers.controller('GitConnectCtrl', ['$rootScope', '$scope', '$location', '$mdToast', 'PageService', 'SettingsService', 'ServerConfigService',
    function ($rootScope, $scope, $location, $mdToast, pageService, settingsService, serverConfigService) {
      var settings = settingsService.get();
      $scope.provider = settings.provider || 'github';
      $scope.githubUser = settings.githubUser || 'mdwiki';
      $scope.repositoryName = settings.githubRepository || 'wiki';

      $scope.githubUserPlaceHolderText = 'Enter here your GitHub username';
      $scope.repositoryNamePlaceHolderText = 'Enter here the name of the repository';

      $scope.isBusy = false;
      $scope.hasError = false;

      $scope.connect = function (successMessage) {
        $scope.isBusy = true;

        var respositoryUrl = $scope.githubUser + '/' + $scope.repositoryName;

        var settings = {
          provider: $scope.provider,
          url: respositoryUrl,
          githubRepository: $scope.repositoryName,
          githubUser: $scope.githubUser
        };

        pageService.getPages(settings)
          .then(function (pages) {
            var startPage = pageService.findStartPage(pages);
            if (startPage !== undefined && startPage.length > 0) {
              settings.startPage = startPage;
              settingsService.put(settings);

              $mdToast.show(
                $mdToast.simple()
                  .content('Connected to github as user ' + $scope.githubUser)
                  .position('bottom left')
                  .hideDelay(5000)
              );

              $location.path('/');
              $rootScope.$broadcast('OnGitConnected', { settings: settings});
            } else {
              $mdToast.show(
                $mdToast.simple()
                  .content('No startpage was found!')
                  .position('bottom left')
                  .hideDelay(5000)
              );
            }
          })
          .catch(function (error) {
            $mdToast.show(
              $mdToast.simple()
                .content('An error occurred while connection to the git-repository: ' + error.message)
                .position('bottom left')
                .hideDelay(5000)
            );
          })
          .finally(function () {
            $scope.isBusy = false;
          });
      };

    }
  ]);
})(angular.module('mdwiki.controllers'));


(function (controllers) {
  'use strict';

  controllers.controller('PagesCtrl', ['$rootScope', '$scope', 'PageService', function ($rootScope, $scope, pageService) {
    $scope.pages = [];
    $rootScope.pages = $scope.pages;

    var updatePages = function (pages) {
      $scope.pages = pages || [];
      $rootScope.pages = $scope.pages;
    };

    pageService.getPages()
      .then(function (pages) {
        updatePages(pages);
        pageService.registerObserver(updatePages);
      });

    $scope.excludeDefaultPage = function (page) {
      var excludes = ['index', 'home', 'readme'];
      var excludePage = false;

      angular.forEach(excludes, function (exclude) {
        if (page.name.toLowerCase() === exclude) {
          excludePage = true;
        }
      });

      return !excludePage;
    };
  }]);
})(angular.module('mdwiki.controllers'));


(function (controllers) {
  'use strict';

  controllers.controller('SearchCtrl', ['$scope', '$location', '$route', 'SearchService', function ($scope, $location, $route, searchService) {
    $scope.textToSearch = '';
    $scope.searchResult = searchService.searchResult;
    $scope.message = '';

    $scope.search = function () {
      searchService.search($scope.textToSearch)
        .then(function (data) {
          $scope.message = 'Search successfully finished';
          searchService.searchResult = data;

          var newLocation = '/search';
          if ($location.path() === newLocation) {
            $route.reload();
          } else {
            $location.path(newLocation);
          }
        }, function (error) {
          var searchedText = error || '';
          $scope.message = 'An error occurred while searching for the text: ' + searchedText.toString();
        });
    };
  }]);
})(angular.module('mdwiki.controllers'));


(function (controllers) {
  'use strict';

  controllers.controller('SidebarCtrl', ['$mdSidenav', sidebarCtrl]);

  function sidebarCtrl($mdSidenav) {
    /*jshint validthis:true */
    this.toggleList = toggleList;
    this.isNotLockedOpen = isNotLockedOpen;

    function toggleList(id) {
      $mdSidenav(id).toggle();
    }

    function isNotLockedOpen(id) {
      return !$mdSidenav(id).isLockedOpen();
    }
  }
})(angular.module('mdwiki.controllers'));