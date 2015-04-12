(function (angular) {
  'use strict';

  var mdwiki = angular.module('mdwiki', [
    'ngRoute',
    'ngSanitize',
    'ngAnimate',
    'ngMaterial',
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

      $mdIconProvider.icon('menu' , './images/svg/menu.svg' , 24);

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

  directives.directive('bsTooltip', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.tooltip({
          animation: true,
          placement: 'bottom',
          delay: { show: 100, hide: 100 }
        });
      }
    };
  });

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImRpcmVjdGl2ZXMuanMiLCJzZXJ2aWNlcy9hcGl1cmxidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL2F1dGhzZXJ2aWNlLmpzIiwic2VydmljZXMvZWRpdG9yc2VydmljZS5qcyIsInNlcnZpY2VzL2h0dHBoZWFkZXJidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL3BhZ2VzZXJ2aWNlLmpzIiwic2VydmljZXMvc2VhcmNoc2VydmljZS5qcyIsInNlcnZpY2VzL3NlcnZlcmNvbmZpZ3NlcnZpY2UuanMiLCJzZXJ2aWNlcy9zZXR0aW5nc3NlcnZpY2UuanMiLCJjb250cm9sbGVycy9hdXRoY3RybC5qcyIsImNvbnRyb2xsZXJzL2NvbW1pdG1lc3NhZ2VkaWFsb2djdHJsLmpzIiwiY29udHJvbGxlcnMvY29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9lZGl0Y29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9naXRjb25uZWN0Y3RybC5qcyIsImNvbnRyb2xsZXJzL3BhZ2VzY3RybC5qcyIsImNvbnRyb2xsZXJzL3NlYXJjaGN0cmwuanMiLCJjb250cm9sbGVycy9zaWRlYmFyY3RybC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFFBQVEsRUFBRSxPQUFPO0FBQUEsR0FDZixHQUFHLENBQUMsTUFBTTtBQUFBO0FBQUEsRUFFWCxHQUFHLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTTtBQUFBLEtBQ2hDLE9BQU87QUFBQSxLQUNQLFVBQVU7QUFBQSxLQUNWLFNBQVM7QUFBQSxLQUNULFVBQVU7QUFBQSxLQUNWLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSztBQUFBLEtBQ3JCLEVBQUUsQ0FBQyxVQUFVO0FBQUEsS0FDYixNQUFNLENBQUMsV0FBVztBQUFBLEtBQ2xCLE1BQU0sQ0FBQyxRQUFRO0FBQUEsS0FDZixNQUFNLENBQUMsVUFBVTtBQUFBLEtBQ2pCLE1BQU0sQ0FBQyxPQUFPO0FB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USxDQUFDLGVBQWUsQ0FBQyxFQUFFO0FBQUEsTUFDekIsTUFBTSxHQUFHLFNBQVMsQ0FBQyxFQUFFLEVBQUUsWUFBWTtBQUFBO0FBQUE7QUFBQSxHQUd0QyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxXQUFXIiwiZmlsZSI6InNjcmlwdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKGFuZ3VsYXIpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtZHdpa2kgPSBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpJywgW1xuICAgICduZ1JvdXRlJyxcbiAgICAnbmdTYW5pdGl6ZScsXG4gICAgJ25nQW5pbWF0ZScsXG4gICAgJ25nTWF0ZXJpYWwnLFxuICAgICdqbWRvYnJ5LmFuZ3VsYXItY2FjaGUnLFxuICAgICd1aS5jb2RlbWlycm9yJyxcbiAgICAnbWR3aWtpLmNvbnRyb2xsZXJzJyxcbiAgICAnbWR3aWtpLnNlcnZpY2VzJyxcbiAgICAnbWR3aWtpLmRpcmVjdGl2ZXMnLFxuICAgICdtZHdpa2kuZmlsdGVycycsXG4gIF0pLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywgJyRsb2NhdGlvblByb3ZpZGVyJywgJyRtZFRoZW1pbmdQcm92aWRlcicsICckbWRJY29uUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uICgkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRtZFRoZW1pbmdQcm92aWRlciwgJG1kSWNvblByb3ZpZGVyKSB7XG4gICAgICAkcm91dGVQcm92aWRlclxuICAgICAgICAud2hlbignL2dpdC9jb25uZWN0Jywge1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnLi92aWV3cy9naXRjb25uZWN0Lmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdHaXRDb25uZWN0Q3RybCdcbiAgICAgICAgfSlcbiAgICAgICAgLndoZW4oJy8nLCB7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICcuL3ZpZXdzL2NvbnRlbnQuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ0NvbnRlbnRDdHJsJ1xuICAgICAgICB9KVxuICAgICAgICAud2hlbignL3NlYXJjaCcsIHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJy4vdmlld3Mvc2VhcmNoUmVzdWx0Lmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDdHJsJ1xuICAgICAgICB9KVxuICAgICAgICAud2hlbignLzpwYWdlJywge1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnLi92aWV3cy9jb250ZW50Lmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb250ZW50Q3RybCdcbiAgICAgICAgfSkub3RoZXJ3aXNlKHtcbiAgICAgICAgICByZWRpcmVjdFRvOiAnL2luZGV4J1xuICAgICAgICB9KTtcblxuICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgICAkbWRJY29uUHJvdmlkZXIuaWNvbignbWVudScgLCAnLi9pbWFnZXMvc3ZnL21lbnUuc3ZnJyAsIDI0KTtcblxuICAgICAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wcmltYXJ5UGFsZXR0ZSgnYmx1ZScpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWNjZW50UGFsZXR0ZSgncmVkJyk7XG4gICAgfVxuICBdKTtcblxuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJywgW10pO1xuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJywgW10pO1xuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmRpcmVjdGl2ZXMnLCBbXSk7XG4gIGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuZmlsdGVycycsIFtdKTtcbn0pKGFuZ3VsYXIpO1xuXG4iLCIoZnVuY3Rpb24gKGRpcmVjdGl2ZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdic1Rvb2x0aXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQudG9vbHRpcCh7XG4gICAgICAgICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgICAgICAgIHBsYWNlbWVudDogJ2JvdHRvbScsXG4gICAgICAgICAgZGVsYXk6IHsgc2hvdzogMTAwLCBoaWRlOiAxMDAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgna2V5YmluZGluZycsIFsnJGRvY3VtZW50JywgJyRwYXJzZScsICckd2luZG93JywgZnVuY3Rpb24gKCRkb2N1bWVudCwgJHBhcnNlLCAkd2luZG93KSB7XG4gICAgdmFyIGlzTWFjID0gL01hY3xpUG9kfGlQaG9uZXxpUGFkLy50ZXN0KCR3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtKTtcblxuICAgIGZ1bmN0aW9uIGlzTW9kaWZpZXIobW9kaWZpZXIsIGV2ZW50LCBpc01hYykge1xuICAgICAgdmFyIGlzU2hpZnQgPSBldmVudC5zaGlmdEtleTtcbiAgICAgIHZhciBpc0FsdCA9IGV2ZW50LmFsdEtleTtcbiAgICAgIHZhciBpc0N0cmwgPSBpc01hYyA/IGV2ZW50Lm1ldGFLZXkgOiBldmVudC5jdHJsS2V5O1xuXG4gICAgICBpZiAobW9kaWZpZXIpIHtcbiAgICAgICAgc3dpdGNoIChtb2RpZmllcikge1xuICAgICAgICAgIGNhc2UgJ2N0cmwrc2hpZnQnOlxuICAgICAgICAgIGNhc2UgJ3NoaWZ0K2N0cmwnOlxuICAgICAgICAgICAgcmV0dXJuIGlzU2hpZnQgJiYgaXNDdHJsO1xuICAgICAgICAgIGNhc2UgJ2FsdCtzaGlmdCc6XG4gICAgICAgICAgY2FzZSAnc2hpZnQrYWx0JzpcbiAgICAgICAgICAgIHJldHVybiBpc1NoaWZ0ICYmIGlzQWx0O1xuICAgICAgICAgIGNhc2UgJ2N0cmwrYWx0JzpcbiAgICAgICAgICBjYXNlICdjbWQrYWx0JzpcbiAgICAgICAgICAgIHJldHVybiBpc0FsdCAmJiBpc0N0cmw7XG4gICAgICAgICAgY2FzZSAnY21kK2N0cmwnOlxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50Lm1ldGFLZXkgJiYgZXZlbnQuQ3RybEtleTtcbiAgICAgICAgICBjYXNlICdzaGlmdCc6XG4gICAgICAgICAgICByZXR1cm4gaXNTaGlmdDtcbiAgICAgICAgICBjYXNlICdjdHJsJzpcbiAgICAgICAgICBjYXNlICdjbWQnOlxuICAgICAgICAgICAgcmV0dXJuIGlzQ3RybDtcbiAgICAgICAgICBjYXNlICdhbHQnOlxuICAgICAgICAgICAgcmV0dXJuIGlzQWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmVyaWZ5S2V5Q29kZShldmVudCwgbW9kaWZpZXIsIGtleSkge1xuICAgICAgaWYgKFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQua2V5Q29kZSkgPT09IGtleSkge1xuICAgICAgICBpZiAobW9kaWZpZXIpIHtcbiAgICAgICAgICByZXR1cm4gaXNNb2RpZmllcihtb2RpZmllciwgZXZlbnQsIGlzTWFjKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2ZXJpZnlDb25kaXRpb24oJGV2YWwsIGNvbmRpdGlvbikge1xuICAgICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgICByZXR1cm4gJGV2YWwoY29uZGl0aW9uKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgbW9kaWZpZXI6ICdAbW9kaWZpZXInLFxuICAgICAgICBrZXk6ICdAa2V5JyxcbiAgICAgICAgY29uZGl0aW9uOiAnJicsXG4gICAgICAgIGludm9rZTogJyYnXG4gICAgICB9LFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCAkZWxlbWVudCwgYXR0cikge1xuICAgICAgICAkZG9jdW1lbnQuYmluZCgna2V5ZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmICh2ZXJpZnlLZXlDb2RlKGV2ZW50LCBzY29wZS5tb2RpZmllciwgc2NvcGUua2V5KSAmJlxuICAgICAgICAgICAgICB2ZXJpZnlDb25kaXRpb24oc2NvcGUuJGV2YWwsIHNjb3BlLmNvbmRpdGlvbikpIHtcbiAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5pbnZva2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfV0pO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdhdXRvRm9jdXMnLCBbJyR0aW1lb3V0JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0FDJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWxlbWVudFswXS5mb2N1cygpO1xuICAgICAgICAgIH0sIDUpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1dKTtcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgnYXV0b1NlbGVjdCcsIFsnJHRpbWVvdXQnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBQycsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdmb2N1cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlbGVtZW50WzBdLnNlbGVjdCgpO1xuICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5kaXJlY3RpdmVzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdBcGlVcmxCdWlsZGVyU2VydmljZScsIFsgJ1NldHRpbmdzU2VydmljZScsIGZ1bmN0aW9uIChzZXR0aW5nc1NlcnZpY2UpIHtcbiAgICB2YXIgYnVpbGQgPSBmdW5jdGlvbiAodXJsQmVmb3JlLCB1cmxBZnRlciwgc2V0dGluZ3MpIHtcbiAgICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwgc2V0dGluZ3NTZXJ2aWNlLmdldCgpO1xuXG4gICAgICBpZiAoc2V0dGluZ3MucHJvdmlkZXIgPT09ICdnaXRodWInKSB7XG4gICAgICAgIHJldHVybiB1cmxCZWZvcmUgKyBzZXR0aW5ncy5naXRodWJVc2VyICsgJy8nICsgc2V0dGluZ3MuZ2l0aHViUmVwb3NpdG9yeSArICcvJyArIHVybEFmdGVyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdXJsQmVmb3JlICsgdXJsQWZ0ZXI7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBidWlsZDogYnVpbGRcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdBdXRoU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCBmdW5jdGlvbiAoJGh0dHAsICRxKSB7XG4gICAgdmFyIGdldEF1dGhlbnRpY2F0ZWRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6ICcvYXV0aC91c2VyJyxcbiAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9LFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChhdXRoLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGF1dGgudXNlcik7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBsb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgIHVybDogJy9hdXRoL3VzZXInLFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGRhdGEpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9nb3V0OiBsb2dvdXQsXG4gICAgICBnZXRBdXRoZW50aWNhdGVkVXNlcjogZ2V0QXV0aGVudGljYXRlZFVzZXJcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzLCBDb2RlTWlycm9yKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdFZGl0b3JTZXJ2aWNlJywgWyckcm9vdFNjb3BlJywgJyRxJyxcbiAgICBmdW5jdGlvbigkcm9vdFNjb3BlLCAkcSkge1xuICAgICAgdmFyIGdldFNlbGVjdGVkVGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ0NvZGVNaXJyb3InLCBmdW5jdGlvbiAoY29kZW1pcnJvcikge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoY29kZW1pcnJvci5nZXRTZWxlY3Rpb24oKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U2VsZWN0ZWRUZXh0OiBnZXRTZWxlY3RlZFRleHRcbiAgICAgIH07XG4gICAgfVxuICBdKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSwgd2luZG93LkNvZGVNaXJyb3IpO1xuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnSHR0cEhlYWRlckJ1aWxkZXJTZXJ2aWNlJywgWyAnU2V0dGluZ3NTZXJ2aWNlJywgZnVuY3Rpb24gKHNldHRpbmdzU2VydmljZSkge1xuICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uIChjb250ZW50VHlwZSwgc2V0dGluZ3MpIHtcbiAgICAgIGNvbnRlbnRUeXBlID0gY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCBzZXR0aW5nc1NlcnZpY2UuZ2V0KCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdYLU1EV2lraS1Qcm92aWRlcic6IHNldHRpbmdzLnByb3ZpZGVyLFxuICAgICAgICAnWC1NRFdpa2ktVXJsJzogc2V0dGluZ3MudXJsXG4gICAgICB9O1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgYnVpbGQ6IGJ1aWxkXG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnUGFnZVNlcnZpY2UnLCBbJyRodHRwJywgJyRxJywgJ0FwaVVybEJ1aWxkZXJTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCAkcSwgdXJsQnVpbGRlcikge1xuICAgIHZhciB1cGRhdGVQYWdlc09ic2VydmVycyA9IFtdO1xuXG4gICAgdmFyIGdldFBhZ2UgPSBmdW5jdGlvbiAocGFnZSwgZm9ybWF0KSB7XG4gICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJ2h0bWwnO1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKSxcbiAgICAgICAgICByZXF1ZXN0VXJsID0gdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAncGFnZS8nICsgcGFnZSk7XG5cbiAgICAgIGlmIChmb3JtYXQgPT09ICdtYXJrZG93bicpXG4gICAgICB7XG4gICAgICAgIHJlcXVlc3RVcmwgKz0gJz9mb3JtYXQ9bWFya2Rvd24nO1xuICAgICAgfVxuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogcmVxdWVzdFVybFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChwYWdlQ29udGVudCwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYWdlQ29udGVudCk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gc3RhdHVzID09PSA0MDQgPyAnQ29udGVudCBub3QgZm91bmQnIDogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yOiAnICsgZXJyb3JNZXNzYWdlO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgc2F2ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUsIGNvbW1pdE1lc3NhZ2UsIG1hcmtkb3duKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgIHVybDogdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAncGFnZS8nICsgcGFnZU5hbWUpLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGNvbW1pdE1lc3NhZ2U6IGNvbW1pdE1lc3NhZ2UsXG4gICAgICAgICAgbWFya2Rvd246IG1hcmtkb3duXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAocGFnZUNvbnRlbnQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocGFnZUNvbnRlbnQpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZXJyb3JNZXNzYWdlLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IHN0YXR1cyA9PT0gNDA0ID8gJ0NvbnRlbnQgbm90IGZvdW5kJyA6ICdVbmV4cGVjdGVkIHNlcnZlciBlcnJvcjogJyArIGVycm9yTWVzc2FnZTtcbiAgICAgICAgZXJyb3IuY29kZSA9IHN0YXR1cztcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGRlbGV0ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgdXJsOiB1cmxCdWlsZGVyLmJ1aWxkKCcvYXBpLycsICdwYWdlLycgKyBwYWdlTmFtZSlcbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAocGFnZUNvbnRlbnQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocGFnZUNvbnRlbnQpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZXJyb3JNZXNzYWdlLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IHN0YXR1cyA9PT0gNDA0ID8gJ0NvbnRlbnQgbm90IGZvdW5kJyA6ICdVbmV4cGVjdGVkIHNlcnZlciBlcnJvcjogJyArIGVycm9yTWVzc2FnZTtcbiAgICAgICAgZXJyb3IuY29kZSA9IHN0YXR1cztcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGdldFBhZ2VzID0gZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAncGFnZXMnLCBzZXR0aW5ncyksXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBwYWdlcyA9IGRhdGEgfHwgW107XG5cbiAgICAgICAgbm90aWZ5T2JzZXJ2ZXJzKHBhZ2VzKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYWdlcyk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gc3RhdHVzID09PSA0MDQgPyAnQ29udGVudCBub3QgZm91bmQnIDogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yOiAnICsgZXJyb3JNZXNzYWdlO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgZmluZFN0YXJ0UGFnZSA9IGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgdmFyIHBhZ2VzVG9GaW5kID0gWydpbmRleCcsICdob21lJywgJ3JlYWRtZSddO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzVG9GaW5kLmxlbmd0aCA7IGkrKykge1xuICAgICAgICB2YXIgc3RhcnRQYWdlID0gZmluZFBhZ2UocGFnZXMsIHBhZ2VzVG9GaW5kW2ldKTtcbiAgICAgICAgaWYgKHN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkICYmIHN0YXJ0UGFnZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHN0YXJ0UGFnZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICB2YXIgZmluZFBhZ2UgPSBmdW5jdGlvbiAocGFnZXMsIHBhZ2VOYW1lKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwYWdlTmFtZSA9PT0gcGFnZXNbaV0ubmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHBhZ2VzW2ldLm5hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAnJztcbiAgICB9O1xuXG4gICAgdmFyIHJlZ2lzdGVyT2JzZXJ2ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgIHVwZGF0ZVBhZ2VzT2JzZXJ2ZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB2YXIgbm90aWZ5T2JzZXJ2ZXJzID0gZnVuY3Rpb24gKHBhZ2VzKSB7XG4gICAgICBhbmd1bGFyLmZvckVhY2godXBkYXRlUGFnZXNPYnNlcnZlcnMsIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayhwYWdlcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRTdGFydFBhZ2U6IGZpbmRTdGFydFBhZ2UsXG4gICAgICBnZXRQYWdlOiBnZXRQYWdlLFxuICAgICAgc2F2ZVBhZ2U6IHNhdmVQYWdlLFxuICAgICAgZGVsZXRlUGFnZTogZGVsZXRlUGFnZSxcbiAgICAgIGdldFBhZ2VzOiBnZXRQYWdlcyxcbiAgICAgIHJlZ2lzdGVyT2JzZXJ2ZXI6IHJlZ2lzdGVyT2JzZXJ2ZXJcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdTZWFyY2hTZXJ2aWNlJywgWyckaHR0cCcsICckcScsICdBcGlVcmxCdWlsZGVyU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgJHEsIHVybEJ1aWxkZXIpIHtcbiAgICB2YXIgc2VhcmNoU2VydmljZUluc3RhbmNlID0ge307XG4gICAgc2VhcmNoU2VydmljZUluc3RhbmNlLnNlYXJjaFJlc3VsdCA9ICcnO1xuXG4gICAgdmFyIHNlYXJjaCA9IGZ1bmN0aW9uICh0ZXh0VG9TZWFyY2gpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIHVybDogdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAnc2VhcmNoJyksXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBkYXRhOiB7IHRleHRUb1NlYXJjaDogdGV4dFRvU2VhcmNoIH1cbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoc2VhcmNoUmVzdWx0LCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHNlYXJjaFJlc3VsdCk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChzZWFyY2hlZFRleHQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChzZWFyY2hlZFRleHQpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2VhcmNoOiBzZWFyY2gsXG4gICAgICBzZWFyY2hTZXJ2aWNlSW5zdGFuY2U6IHNlYXJjaFNlcnZpY2VJbnN0YW5jZVxuICAgIH07XG5cbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnU2VydmVyQ29uZmlnU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCBmdW5jdGlvbiAoJGh0dHAsICRxKSB7XG4gICAgdmFyIGdldENvbmZpZyA9IGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogJy9hcGkvc2VydmVyY29uZmlnJyxcbiAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9LFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSBzdGF0dXMgPT09IDQwNCA/ICdDb250ZW50IG5vdCBmb3VuZCcgOiAnVW5leHBlY3RlZCBzZXJ2ZXIgZXJyb3InO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgZ2V0Q29uZmlnOiBnZXRDb25maWdcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdTZXR0aW5nc1NlcnZpY2UnLCBbJyRhbmd1bGFyQ2FjaGVGYWN0b3J5JywgZnVuY3Rpb24gKCRhbmd1bGFyQ2FjaGVGYWN0b3J5KSB7XG4gICAgdmFyIGNhY2hlID0gJGFuZ3VsYXJDYWNoZUZhY3RvcnkoJ21kd2lraScsIHsgc3RvcmFnZU1vZGU6ICdsb2NhbFN0b3JhZ2UnIH0pO1xuXG4gICAgdmFyIGdldERlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHByb3ZpZGVyOiAnZ2l0aHViJyxcbiAgICAgICAgZ2l0aHViVXNlcjogJ21kd2lraScsXG4gICAgICAgIGdpdGh1YlJlcG9zaXRvcnk6ICd3aWtpJyxcbiAgICAgICAgdXJsOiAnbWR3aWtpL3dpa2knLFxuICAgICAgICBzdGFydFBhZ2U6ICdpbmRleCdcbiAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBpc0RlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgcmV0dXJuIGFuZ3VsYXIuZXF1YWxzKHNldHRpbmdzLCB0aGlzLmdldERlZmF1bHRTZXR0aW5ncygpKTtcbiAgICB9O1xuXG4gICAgdmFyIGdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZXR0aW5ncyA9IGNhY2hlLmdldCgnc2V0dGluZ3MnKTtcbiAgICAgIGlmIChzZXR0aW5ncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNldHRpbmdzID0gdGhpcy5nZXREZWZhdWx0U2V0dGluZ3MoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICB9O1xuXG4gICAgdmFyIHB1dCA9IGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgY2FjaGUucHV0KCdzZXR0aW5ncycsIHNldHRpbmdzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogZ2V0LFxuICAgICAgcHV0OiBwdXQsXG4gICAgICBnZXREZWZhdWx0U2V0dGluZ3M6IGdldERlZmF1bHRTZXR0aW5ncyxcbiAgICAgIGlzRGVmYXVsdFNldHRpbmdzOiBpc0RlZmF1bHRTZXR0aW5nc1xuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0F1dGhDdHJsJywgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckd2luZG93JywgJ0F1dGhTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkd2luZG93LCBhdXRoU2VydmljZSkge1xuICAgICAgJHNjb3BlLmlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgJHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICBhdXRoU2VydmljZS5nZXRBdXRoZW50aWNhdGVkVXNlcigpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgJHNjb3BlLnVzZXIgPSB1c2VyIHx8IG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9ICdhdXRoL2dpdGh1Yj9wYWdlPScgKyAkcm9vdFNjb3BlLnBhZ2VOYW1lO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXV0aFNlcnZpY2UubG9nb3V0KClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9naXQvY29ubmVjdCc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuJHdhdGNoKCd1c2VyJywgZnVuY3Rpb24gKG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmlzQXV0aGVudGljYXRlZCA9IG5ld1ZhbHVlICE9PSBudWxsO1xuICAgICAgICAkc2NvcGUuaXNBdXRoZW50aWNhdGVkID0gJHJvb3RTY29wZS5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaXNBdXRoZW50aWNhdGVkJywgeyBpc0F1dGhlbnRpY2F0ZWQ6ICRyb290U2NvcGUuaXNBdXRoZW50aWNhdGVkIH0pO1xuICAgICAgfSk7XG5cbiAgICB9XG4gIF0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignQ29tbWl0TWVzc2FnZURpYWxvZ0N0cmwnLCBbJyRzY29wZScsICckbWREaWFsb2cnLCAnRWRpdG9yU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRzY29wZSwgJG1kRGlhbG9nLCBlZGl0b3JTZXJ2aWNlKSB7XG4gICAgICAkc2NvcGUucGFnZU5hbWUgPSAnJztcbiAgICAgICRzY29wZS5jb21taXRNZXNzYWdlID0gJ1NvbWUgY2hhbmdlcyBmb3IgJyArICRzY29wZS5wYWdlTmFtZTtcblxuICAgICAgZWRpdG9yU2VydmljZS5nZXRTZWxlY3RlZFRleHQoKS50aGVuKGZ1bmN0aW9uIChzZWxlY3RlZFRleHQpIHtcbiAgICAgICAgaWYgKHNlbGVjdGVkVGV4dCkge1xuICAgICAgICAgICRzY29wZS5jb21taXRNZXNzYWdlID0gc2VsZWN0ZWRUZXh0O1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJG1kRGlhbG9nLmhpZGUoKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmNsb3NlRGlhbG9nID0gZnVuY3Rpb24gKGNhbmNlbCkge1xuICAgICAgICAkbWREaWFsb2cuaGlkZSh7XG4gICAgICAgICAgY2FuY2VsOiBjYW5jZWwsXG4gICAgICAgICAgY29tbWl0TWVzc2FnZTogJHNjb3BlLmNvbW1pdE1lc3NhZ2VcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzLCBDb2RlTWlycm9yKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdDb250ZW50Q3RybCcsXG4gICAgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckcm91dGVQYXJhbXMnLCAnJGxvY2F0aW9uJywgJyRxJywgJyRtZFRvYXN0JywgJyRtZERpYWxvZycsXG4gICAgICdQYWdlU2VydmljZScsICdTZXR0aW5nc1NlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICRyb3V0ZVBhcmFtcywgJGxvY2F0aW9uLCAkcSwgJG1kVG9hc3QsICRtZERpYWxvZyxcbiAgICAgICAgICAgICAgcGFnZVNlcnZpY2UsIHNldHRpbmdzU2VydmljZSkge1xuICAgICAgJHNjb3BlLmNvbnRlbnQgPSAnJztcbiAgICAgICRzY29wZS5tYXJrZG93biA9ICcnO1xuICAgICAgJHNjb3BlLnBhZ2VOYW1lID0gJyc7XG4gICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJyc7XG4gICAgICAkc2NvcGUuaGFzRXJyb3IgPSBmYWxzZTtcbiAgICAgICRzY29wZS5yZWZyZXNoID0gZmFsc2U7XG4gICAgICAkc2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gZmFsc2U7XG4gICAgICAkc2NvcGUuY29tbWl0TWVzc2FnZSA9ICcnO1xuXG4gICAgICAkc2NvcGUuY29kZW1pcnJvciA9IHtcbiAgICAgICAgbGluZVdyYXBwaW5nIDogdHJ1ZSxcbiAgICAgICAgbGluZU51bWJlcnM6IHRydWUsXG4gICAgICAgIHJlYWRPbmx5OiAnbm9jdXJzb3InLFxuICAgICAgICBtb2RlOiAnbWFya2Rvd24nLFxuICAgICAgfTtcblxuICAgICAgdmFyIHNldHRpbmdzID0gc2V0dGluZ3NTZXJ2aWNlLmdldCgpO1xuICAgICAgdmFyIHN0YXJ0UGFnZSA9IHNldHRpbmdzLnN0YXJ0UGFnZSB8fCAnaW5kZXgnO1xuICAgICAgdmFyIHBhZ2VOYW1lID0gJHJvdXRlUGFyYW1zLnBhZ2UgfHwgc3RhcnRQYWdlO1xuXG4gICAgICAkc2NvcGUuY29kZW1pcnJvckxvYWRlZCA9IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgQ29kZU1pcnJvci5jb21tYW5kcy5zYXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnYmVmb3JlU2F2ZScpO1xuICAgICAgICB9O1xuICAgICAgfTtcblxuICAgICAgdmFyIHByZXBhcmVMaW5rcyA9IGZ1bmN0aW9uIChodG1sLCBzZXR0aW5ncykge1xuICAgICAgICB2YXIgJGRvbSA9ICQoJzxkaXY+JyArIGh0bWwgKyAnPC9kaXY+Jyk7XG5cbiAgICAgICAgJGRvbS5maW5kKCdhW2hyZWZePVwid2lraS9cIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgJGxpbmsgPSAkKHRoaXMpO1xuICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCAkbGluay5hdHRyKCdocmVmJykuc3Vic3RyaW5nKDQpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnByb3ZpZGVyID09PSAnZ2l0aHViJykge1xuICAgICAgICAgICRkb20uZmluZCgnYVtocmVmXj1cIi9zdGF0aWMvXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgJGxpbmsgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIG5ld0xpbmsgPSAnL3N0YXRpYy8nLmNvbmNhdChzZXR0aW5ncy5naXRodWJVc2VyLCAnLycsIHNldHRpbmdzLmdpdGh1YlJlcG9zaXRvcnksICcvJywgJGxpbmsuYXR0cignaHJlZicpLnN1YnN0cmluZygnL3N0YXRpYy8nLmxlbmd0aCkpO1xuICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0xpbmspO1xuICAgICAgICAgICAgJGxpbmsuYXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRkb20uZmluZCgnYVtocmVmXj1cIi9zdGF0aWMvXCJdJykuYXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkZG9tLmh0bWwoKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBnZXRQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgcGFnZVNlcnZpY2UuZ2V0UGFnZShwYWdlTmFtZSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGFnZUNvbnRlbnQpIHtcbiAgICAgICAgICAgICRzY29wZS5wYWdlTmFtZSA9IHBhZ2VOYW1lO1xuICAgICAgICAgICAgJHJvb3RTY29wZS5wYWdlTmFtZSA9IHBhZ2VOYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmNvbnRlbnQgPSBwcmVwYXJlTGlua3MocGFnZUNvbnRlbnQsIHNldHRpbmdzKTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChwYWdlTmFtZSA9PT0gc3RhcnRQYWdlICYmIGVycm9yLmNvZGUgPT09IDQwNCkge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL2dpdC9jb25uZWN0Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkc2NvcGUuZXJyb3JNZXNzYWdlID0gJ0NvbnRlbnQgbm90IGZvdW5kISc7XG4gICAgICAgICAgICAgICRzY29wZS5oYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNob3dPckhpZGVFZGl0b3IgPSBmdW5jdGlvbiAoaXNWaXNpYmxlKSB7XG4gICAgICAgICRzY29wZS5pc0VkaXRvclZpc2libGUgPSBpc1Zpc2libGU7XG4gICAgICAgICRyb290U2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gaXNWaXNpYmxlO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2lzRWRpdG9yVmlzaWJsZScsIHsgaXNFZGl0b3JWaXNpYmxlOiBpc1Zpc2libGUgfSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2hvd0VkaXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2hvd09ySGlkZUVkaXRvcih0cnVlKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBoaWRlRWRpdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJHJvdXRlUGFyYW1zLmVkaXQpIHtcbiAgICAgICAgICAkbG9jYXRpb24uc2VhcmNoKHt9KTtcbiAgICAgICAgfVxuICAgICAgICBzaG93T3JIaWRlRWRpdG9yKGZhbHNlKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBlZGl0UGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSkge1xuICAgICAgICBzaG93RWRpdG9yKCk7XG5cbiAgICAgICAgcGFnZVNlcnZpY2UuZ2V0UGFnZShwYWdlTmFtZSwgJ21hcmtkb3duJylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAobWFya2Rvd24pIHtcbiAgICAgICAgICAgICRzY29wZS5tYXJrZG93biA9IG1hcmtkb3duO1xuICAgICAgICAgICAgJHNjb3BlLnJlZnJlc2ggPSB0cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lID09PSBzdGFydFBhZ2UgJiYgZXJyb3IuY29kZSA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvZ2l0L2Nvbm5lY3QnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSAnQ29udGVudCBub3QgZm91bmQ6ICcgKyBlcnJvci5tZXNzYWdlO1xuICAgICAgICAgICAgICAkc2NvcGUuaGFzRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgdmFyIGNyZWF0ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgICAgcGFnZVNlcnZpY2Uuc2F2ZVBhZ2UocGFnZU5hbWUsICdjcmVhdGUgbmV3IHBhZ2UgJyArIHBhZ2VOYW1lLCAnIycgKyBwYWdlTmFtZSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGFnZUNvbnRlbnQpIHtcbiAgICAgICAgICAgICRzY29wZS5wYWdlTmFtZSA9IHBhZ2VOYW1lO1xuICAgICAgICAgICAgJHJvb3RTY29wZS5wYWdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgZmlsZU5hbWU6IHBhZ2VOYW1lICsgJy5tZCcsXG4gICAgICAgICAgICAgIG5hbWU6IHBhZ2VOYW1lLFxuICAgICAgICAgICAgICB0aXRsZTogcGFnZU5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy8nICsgcGFnZU5hbWUpLnNlYXJjaCgnZWRpdCcpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9ICdDcmVhdGUgbmV3IHBhZ2UgZmFpbGVkOiAnICsgZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICRzY29wZS5oYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgcmVtb3ZlUGFnZUZyb21QYWdlcyA9IGZ1bmN0aW9uIChwYWdlcywgcGFnZU5hbWUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTE7XG5cbiAgICAgICAgcGFnZXMuZm9yRWFjaChmdW5jdGlvbiAocGFnZSkge1xuICAgICAgICAgIGlmIChwYWdlLm5hbWUgPT09IHBhZ2VOYW1lKSB7XG4gICAgICAgICAgICBpbmRleCA9IHBhZ2VzLmluZGV4T2YocGFnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBwYWdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgZGVsZXRlUGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSkge1xuICAgICAgICBwYWdlU2VydmljZS5kZWxldGVQYWdlKHBhZ2VOYW1lKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlbW92ZVBhZ2VGcm9tUGFnZXMoJHJvb3RTY29wZS5wYWdlcywgcGFnZU5hbWUpO1xuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy8nKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvck1lc3NhZ2UgPSAnRGVsZXRlIHRoZSBjdXJyZW50IHBhZ2UgZmFpbGVkOiAnICsgZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgICRzY29wZS5oYXNFcnJvciA9IHRydWU7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2F2ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUsIGNvbW1pdE1lc3NhZ2UsIGNvbnRlbnQpIHtcbiAgICAgICAgcGFnZVNlcnZpY2Uuc2F2ZVBhZ2UocGFnZU5hbWUsIGNvbW1pdE1lc3NhZ2UsIGNvbnRlbnQpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHBhZ2VDb250ZW50KSB7XG4gICAgICAgICAgICAkc2NvcGUuY29udGVudCA9IHByZXBhcmVMaW5rcyhwYWdlQ29udGVudCwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgaGlkZUVkaXRvcigpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yTWVzc2FnZSA9ICdTYXZlIGN1cnJlbnQgcGFnZSBmYWlsZWQ6ICcgKyBlcnJvci5tZXNzYWdlO1xuICAgICAgICAgICAgJHNjb3BlLmhhc0Vycm9yID0gdHJ1ZTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jYW5jZWxFZGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBoaWRlRWRpdG9yKCk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc2F2ZUNoYW5nZXMgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJG1kRGlhbG9nJywgJ0VkaXRvclNlcnZpY2UnLCBDb21taXRNZXNzYWdlRGlhbG9nQ29udHJvbGxlcl0sXG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICdjb21taXRNZXNzYWdlRGlhbG9nJyxcbiAgICAgICAgICB0YXJnZXRFdmVudDogZXZlbnQsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgIGlmICghcmVzdWx0LmNhbmNlbCkge1xuICAgICAgICAgICAgc2F2ZVBhZ2UoJHNjb3BlLnBhZ2VOYW1lLCByZXN1bHQuY29tbWl0TWVzc2FnZSwgJHNjb3BlLm1hcmtkb3duKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNhdmVVbnJlZ2lzdGVyID0gJHJvb3RTY29wZS4kb24oJ3NhdmUnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgc2F2ZVBhZ2UoJHNjb3BlLnBhZ2VOYW1lLCBkYXRhLmNvbW1pdE1lc3NhZ2UsICRzY29wZS5tYXJrZG93bik7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGNyZWF0ZVVucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignY3JlYXRlJywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIGNyZWF0ZVBhZ2UoZGF0YS5wYWdlTmFtZSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGRlbGV0ZVVucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignZGVsZXRlJywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIGRlbGV0ZVBhZ2UoZGF0YS5wYWdlTmFtZSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGVkaXRVbnJlZ2lzdGVyID0gJHJvb3RTY29wZS4kb24oJ2VkaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGVkaXRQYWdlKCRzY29wZS5wYWdlTmFtZSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGNhbmNlbEVkaXRVbnJlZ2lzdGVyID0gJHJvb3RTY29wZS4kb24oJ2NhbmNlbEVkaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGhpZGVFZGl0b3IoKTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgdW5yZWdpc3Rlckhhc0Vycm9yID0gJHNjb3BlLiR3YXRjaCgnaGFzRXJyb3InLCBmdW5jdGlvbiAoaGFzRXJyb3IpIHtcbiAgICAgICAgaWYgKGhhc0Vycm9yKSB7XG4gICAgICAgICAgJHNjb3BlLmhhc0Vycm9yID0gZmFsc2U7XG5cbiAgICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICAgJG1kVG9hc3Quc2ltcGxlKClcbiAgICAgICAgICAgICAgLmNvbnRlbnQoJHNjb3BlLmVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gZml0JylcbiAgICAgICAgICAgICAgLmhpZGVEZWxheSgzMDAwKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FuY2VsRWRpdFVucmVnaXN0ZXIoKTtcbiAgICAgICAgY3JlYXRlVW5yZWdpc3RlcigpO1xuICAgICAgICBkZWxldGVVbnJlZ2lzdGVyKCk7XG4gICAgICAgIGVkaXRVbnJlZ2lzdGVyKCk7XG4gICAgICAgIHNhdmVVbnJlZ2lzdGVyKCk7XG4gICAgICAgIHVucmVnaXN0ZXJIYXNFcnJvcigpO1xuICAgICAgfSk7XG5cbiAgICAgIGdldFBhZ2UocGFnZU5hbWUpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJHJvdXRlUGFyYW1zLmVkaXQgJiYgJHJvb3RTY29wZS5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgICBlZGl0UGFnZShwYWdlTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGlkZUVkaXRvcigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG4gIGZ1bmN0aW9uIENvbW1pdE1lc3NhZ2VEaWFsb2dDb250cm9sbGVyKCRyb290U2NvcGUsICRzY29wZSwgJG1kRGlhbG9nLCBlZGl0b3JTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmNvbW1pdE1lc3NhZ2UgPSAnU29tZSBjaGFuZ2VzIGZvciAnICsgJHJvb3RTY29wZS5wYWdlTmFtZTtcblxuICAgIGVkaXRvclNlcnZpY2UuZ2V0U2VsZWN0ZWRUZXh0KCkudGhlbihmdW5jdGlvbiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgICBpZiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgICAgICRzY29wZS5jb21taXRNZXNzYWdlID0gc2VsZWN0ZWRUZXh0O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHNjb3BlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICRtZERpYWxvZy5oaWRlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICRtZERpYWxvZy5jYW5jZWwoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmNsb3NlRGlhbG9nID0gZnVuY3Rpb24gKGNhbmNlbCkge1xuICAgICAgJG1kRGlhbG9nLmhpZGUoe1xuICAgICAgICBjYW5jZWw6IGNhbmNlbCxcbiAgICAgICAgY29tbWl0TWVzc2FnZTogJHNjb3BlLmNvbW1pdE1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpLCB3aW5kb3cuQ29kZU1pcnJvcik7XG5cblxuXG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMsIGFuZ3VsYXIsIGRvY3VtZW50KSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdFZGl0Q29udGVudEN0cmwnLCBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyRsb2NhdGlvbicsICckd2luZG93JywgJyRtZERpYWxvZycsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJGxvY2F0aW9uLCAkd2luZG93LCAkbWREaWFsb2cpIHtcbiAgICAgIHZhciBub25FZGl0YWJsZVBhdGhzID0gWycvc2VhcmNoJywgJy9naXQvY29ubmVjdCddO1xuXG4gICAgICAkc2NvcGUuaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAkc2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gZmFsc2U7XG4gICAgICAkc2NvcGUuY2FuRWRpdFBhZ2UgPSBmYWxzZTtcbiAgICAgICRzY29wZS5zaG93UG9wdXAgPSBmYWxzZTtcblxuICAgICAgdmFyIGlzRWRpdFBhZ2VQb3NzaWJsZSA9IGZ1bmN0aW9uIChpc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsIHBhdGgpIHtcbiAgICAgICAgdmFyIGNhbkVkaXRQYWdlID0gaXNBdXRoZW50aWNhdGVkO1xuXG4gICAgICAgIGlmIChjYW5FZGl0UGFnZSkge1xuICAgICAgICAgIG5vbkVkaXRhYmxlUGF0aHMuZm9yRWFjaChmdW5jdGlvbiAobm9uRWRpdGFibGVQYXRoKSB7XG4gICAgICAgICAgICBpZiAobm9uRWRpdGFibGVQYXRoID09PSBwYXRoKSB7XG4gICAgICAgICAgICAgIGNhbkVkaXRQYWdlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbkVkaXRQYWdlO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNob3dPckhpZGVQb3B1cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnNob3dQb3B1cCA9ICEkc2NvcGUuc2hvd1BvcHVwO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmNyZWF0ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkc2NvcGUuc2hvd1BvcHVwID0gZmFsc2U7XG5cbiAgICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtZERpYWxvZycsIENyZWF0ZU5ld1BhZ2VDb250cm9sbGVyXSxcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2NyZWF0ZU5ld1BhZ2VEaWFsb2cnLFxuICAgICAgICAgIHRhcmdldEV2ZW50OiBldmVudCxcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGlhbG9nUmVzdWx0KSB7XG4gICAgICAgICAgaWYgKCFkaWFsb2dSZXN1bHQuY2FuY2VsKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2VkaXQnLCB7IHBhZ2VOYW1lOiBkaWFsb2dSZXN1bHQucGFnZU5hbWUgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJHNjb3BlLnNob3dQb3B1cCA9IGZhbHNlO1xuXG4gICAgICAgIGlmICgkcm9vdFNjb3BlLnBhZ2VOYW1lID09PSAnaW5kZXgnKSB7XG4gICAgICAgICAgdmFyIGFsZXJ0RGlhbG9nID0gJG1kRGlhbG9nLmFsZXJ0KClcbiAgICAgICAgICAgICAgLnRpdGxlKCdEZWxldGUgc3RhcnQgcGFnZT8nKVxuICAgICAgICAgICAgICAuY29udGVudCgnSXQgaXMgbm90IGEgZ29vZCBpZGVhIHRvIGRlbGV0ZSB5b3VyIHN0YXJ0IHBhZ2UhJylcbiAgICAgICAgICAgICAgLnRhcmdldEV2ZW50KGV2ZW50KVxuICAgICAgICAgICAgICAuYXJpYUxhYmVsKCdEZWxldGUgc3RhcnQgcGFnZSBmb3JiaWRkZW4nKVxuICAgICAgICAgICAgICAub2soJ09rJyk7XG5cbiAgICAgICAgICAkbWREaWFsb2cuc2hvdyhhbGVydERpYWxvZyk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY29uZmlybURpYWxvZyA9ICRtZERpYWxvZy5jb25maXJtKClcbiAgICAgICAgICAudGl0bGUoJ0RlbGV0ZSBjdXJyZW50IHBhZ2U/JylcbiAgICAgICAgICAuY29udGVudCgnQXJlIHlvdSBzdXJlIHRoYXQgeW91IHdhbnQgdG8gZGVsZXRlIHRoZSBjdXJyZW50IHBhZ2U/JylcbiAgICAgICAgICAudGFyZ2V0RXZlbnQoZXZlbnQpXG4gICAgICAgICAgLmFyaWFMYWJlbCgnRGVsZXRlIGN1cnJlbnQgcGFnZT8nKVxuICAgICAgICAgIC5vaygnT2snKVxuICAgICAgICAgIC5jYW5jZWwoJ0NhbmNlbCcpO1xuXG4gICAgICAgICRtZERpYWxvZy5zaG93KGNvbmZpcm1EaWFsb2cpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2VkaXQnKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuc2hvd1BvcHVwID0gZmFsc2U7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZWRpdCcpO1xuICAgICAgfTtcblxuXG4gICAgICB2YXIgaXNBdXRoZW50aWNhdGVkVW5yZWdpc3RlciA9ICRyb290U2NvcGUuJG9uKCdpc0F1dGhlbnRpY2F0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgJHNjb3BlLmlzQXV0aGVudGljYXRlZCA9IGRhdGEuaXNBdXRoZW50aWNhdGVkO1xuICAgICAgICAkc2NvcGUuY2FuRWRpdFBhZ2UgPSBpc0VkaXRQYWdlUG9zc2libGUoJHNjb3BlLmlzQXV0aGVudGljYXRlZCwgbm9uRWRpdGFibGVQYXRocywgJGxvY2F0aW9uLnBhdGgoKSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGlzRWRpdG9yVmlzaWJsZVVucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignaXNFZGl0b3JWaXNpYmxlJywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgICRzY29wZS5pc0VkaXRvclZpc2libGUgPSBkYXRhLmlzRWRpdG9yVmlzaWJsZTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgcm91dGVDaGFuZ2VTdWNjZXNzVW5yZWdpc3RlciA9ICRyb290U2NvcGUuJG9uKCckcm91dGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGUsIGN1cnJlbnQsIHByZSkge1xuICAgICAgICAkc2NvcGUuY2FuRWRpdFBhZ2UgPSBpc0VkaXRQYWdlUG9zc2libGUoJHNjb3BlLmlzQXV0aGVudGljYXRlZCwgbm9uRWRpdGFibGVQYXRocywgJGxvY2F0aW9uLnBhdGgoKSk7XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gaXNFZGl0UGFnZVBvc3NpYmxlKCRzY29wZS5pc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsICRsb2NhdGlvbi5wYXRoKCkpO1xuXG4gICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkVW5yZWdpc3RlcigpO1xuICAgICAgICBpc0VkaXRvclZpc2libGVVbnJlZ2lzdGVyKCk7XG4gICAgICAgIHJvdXRlQ2hhbmdlU3VjY2Vzc1VucmVnaXN0ZXIoKTtcbiAgICAgIH0pO1xuXG4gICAgfVxuICBdKTtcblxuICBmdW5jdGlvbiBDcmVhdGVOZXdQYWdlQ29udHJvbGxlcigkc2NvcGUsICRtZERpYWxvZykge1xuICAgICRzY29wZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbWREaWFsb2cuaGlkZSgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbWREaWFsb2cuY2FuY2VsKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5jbG9zZURpYWxvZyA9IGZ1bmN0aW9uIChjYW5jZWwpIHtcbiAgICAgICRtZERpYWxvZy5oaWRlKHtcbiAgICAgICAgY2FuY2VsOiBjYW5jZWwsXG4gICAgICAgIHBhZ2VOYW1lOiAkc2NvcGUucGFnZU5hbWVcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpLCB3aW5kb3cuYW5ndWxhciwgd2luZG93LmRvY3VtZW50KTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignR2l0Q29ubmVjdEN0cmwnLCBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyRsb2NhdGlvbicsICckbWRUb2FzdCcsICdQYWdlU2VydmljZScsICdTZXR0aW5nc1NlcnZpY2UnLCAnU2VydmVyQ29uZmlnU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJGxvY2F0aW9uLCAkbWRUb2FzdCwgcGFnZVNlcnZpY2UsIHNldHRpbmdzU2VydmljZSwgc2VydmVyQ29uZmlnU2VydmljZSkge1xuICAgICAgdmFyIHNldHRpbmdzID0gc2V0dGluZ3NTZXJ2aWNlLmdldCgpO1xuICAgICAgJHNjb3BlLnByb3ZpZGVyID0gc2V0dGluZ3MucHJvdmlkZXIgfHwgJ2dpdGh1Yic7XG4gICAgICAkc2NvcGUuZ2l0aHViVXNlciA9IHNldHRpbmdzLmdpdGh1YlVzZXIgfHwgJ21kd2lraSc7XG4gICAgICAkc2NvcGUucmVwb3NpdG9yeU5hbWUgPSBzZXR0aW5ncy5naXRodWJSZXBvc2l0b3J5IHx8ICd3aWtpJztcblxuICAgICAgJHNjb3BlLmdpdGh1YlVzZXJQbGFjZUhvbGRlclRleHQgPSAnRW50ZXIgaGVyZSB5b3VyIEdpdEh1YiB1c2VybmFtZSc7XG4gICAgICAkc2NvcGUucmVwb3NpdG9yeU5hbWVQbGFjZUhvbGRlclRleHQgPSAnRW50ZXIgaGVyZSB0aGUgbmFtZSBvZiB0aGUgcmVwb3NpdG9yeSc7XG5cbiAgICAgICRzY29wZS5pc0J1c3kgPSBmYWxzZTtcbiAgICAgICRzY29wZS5oYXNFcnJvciA9IGZhbHNlO1xuXG4gICAgICAkc2NvcGUuY29ubmVjdCA9IGZ1bmN0aW9uIChzdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuaXNCdXN5ID0gdHJ1ZTtcblxuICAgICAgICB2YXIgcmVzcG9zaXRvcnlVcmwgPSAkc2NvcGUuZ2l0aHViVXNlciArICcvJyArICRzY29wZS5yZXBvc2l0b3J5TmFtZTtcblxuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICAgICAgcHJvdmlkZXI6ICRzY29wZS5wcm92aWRlcixcbiAgICAgICAgICB1cmw6IHJlc3Bvc2l0b3J5VXJsLFxuICAgICAgICAgIGdpdGh1YlJlcG9zaXRvcnk6ICRzY29wZS5yZXBvc2l0b3J5TmFtZSxcbiAgICAgICAgICBnaXRodWJVc2VyOiAkc2NvcGUuZ2l0aHViVXNlclxuICAgICAgICB9O1xuXG4gICAgICAgIHBhZ2VTZXJ2aWNlLmdldFBhZ2VzKHNldHRpbmdzKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgICAgICAgdmFyIHN0YXJ0UGFnZSA9IHBhZ2VTZXJ2aWNlLmZpbmRTdGFydFBhZ2UocGFnZXMpO1xuICAgICAgICAgICAgaWYgKHN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkICYmIHN0YXJ0UGFnZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHNldHRpbmdzLnN0YXJ0UGFnZSA9IHN0YXJ0UGFnZTtcbiAgICAgICAgICAgICAgc2V0dGluZ3NTZXJ2aWNlLnB1dChzZXR0aW5ncyk7XG5cbiAgICAgICAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgICAgICAgLmNvbnRlbnQoJ0Nvbm5lY3RlZCB0byBnaXRodWIgYXMgdXNlciAnICsgJHNjb3BlLmdpdGh1YlVzZXIpXG4gICAgICAgICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBsZWZ0JylcbiAgICAgICAgICAgICAgICAgIC5oaWRlRGVsYXkoNTAwMClcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycpO1xuICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ09uR2l0Q29ubmVjdGVkJywgeyBzZXR0aW5nczogc2V0dGluZ3N9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICAgJG1kVG9hc3Quc2ltcGxlKClcbiAgICAgICAgICAgICAgICAgIC5jb250ZW50KCdObyBzdGFydHBhZ2Ugd2FzIGZvdW5kIScpXG4gICAgICAgICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBsZWZ0JylcbiAgICAgICAgICAgICAgICAgIC5oaWRlRGVsYXkoNTAwMClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgLmNvbnRlbnQoJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIGNvbm5lY3Rpb24gdG8gdGhlIGdpdC1yZXBvc2l0b3J5OiAnICsgZXJyb3IubWVzc2FnZSlcbiAgICAgICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBsZWZ0JylcbiAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDUwMDApXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmlzQnVzeSA9IGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgIH1cbiAgXSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdQYWdlc0N0cmwnLCBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJ1BhZ2VTZXJ2aWNlJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgcGFnZVNlcnZpY2UpIHtcbiAgICAkc2NvcGUucGFnZXMgPSBbXTtcbiAgICAkcm9vdFNjb3BlLnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXG4gICAgdmFyIHVwZGF0ZVBhZ2VzID0gZnVuY3Rpb24gKHBhZ2VzKSB7XG4gICAgICAkc2NvcGUucGFnZXMgPSBwYWdlcyB8fCBbXTtcbiAgICAgICRyb290U2NvcGUucGFnZXMgPSAkc2NvcGUucGFnZXM7XG4gICAgfTtcblxuICAgIHBhZ2VTZXJ2aWNlLmdldFBhZ2VzKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgICB1cGRhdGVQYWdlcyhwYWdlcyk7XG4gICAgICAgIHBhZ2VTZXJ2aWNlLnJlZ2lzdGVyT2JzZXJ2ZXIodXBkYXRlUGFnZXMpO1xuICAgICAgfSk7XG5cbiAgICAkc2NvcGUuZXhjbHVkZURlZmF1bHRQYWdlID0gZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICAgIHZhciBleGNsdWRlcyA9IFsnaW5kZXgnLCAnaG9tZScsICdyZWFkbWUnXTtcbiAgICAgIHZhciBleGNsdWRlUGFnZSA9IGZhbHNlO1xuXG4gICAgICBhbmd1bGFyLmZvckVhY2goZXhjbHVkZXMsIGZ1bmN0aW9uIChleGNsdWRlKSB7XG4gICAgICAgIGlmIChwYWdlLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gZXhjbHVkZSkge1xuICAgICAgICAgIGV4Y2x1ZGVQYWdlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiAhZXhjbHVkZVBhZ2U7XG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignU2VhcmNoQ3RybCcsIFsnJHNjb3BlJywgJyRsb2NhdGlvbicsICckcm91dGUnLCAnU2VhcmNoU2VydmljZScsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlLCBzZWFyY2hTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnRleHRUb1NlYXJjaCA9ICcnO1xuICAgICRzY29wZS5zZWFyY2hSZXN1bHQgPSBzZWFyY2hTZXJ2aWNlLnNlYXJjaFJlc3VsdDtcbiAgICAkc2NvcGUubWVzc2FnZSA9ICcnO1xuXG4gICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlYXJjaFNlcnZpY2Uuc2VhcmNoKCRzY29wZS50ZXh0VG9TZWFyY2gpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSAnU2VhcmNoIHN1Y2Nlc3NmdWxseSBmaW5pc2hlZCc7XG4gICAgICAgICAgc2VhcmNoU2VydmljZS5zZWFyY2hSZXN1bHQgPSBkYXRhO1xuXG4gICAgICAgICAgdmFyIG5ld0xvY2F0aW9uID0gJy9zZWFyY2gnO1xuICAgICAgICAgIGlmICgkbG9jYXRpb24ucGF0aCgpID09PSBuZXdMb2NhdGlvbikge1xuICAgICAgICAgICAgJHJvdXRlLnJlbG9hZCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aChuZXdMb2NhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICB2YXIgc2VhcmNoZWRUZXh0ID0gZXJyb3IgfHwgJyc7XG4gICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSAnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgc2VhcmNoaW5nIGZvciB0aGUgdGV4dDogJyArIHNlYXJjaGVkVGV4dC50b1N0cmluZygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdTaWRlYmFyQ3RybCcsIFsnJG1kU2lkZW5hdicsIHNpZGViYXJDdHJsXSk7XG5cbiAgZnVuY3Rpb24gc2lkZWJhckN0cmwoJG1kU2lkZW5hdikge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgdGhpcy50b2dnbGVMaXN0ID0gdG9nZ2xlTGlzdDtcbiAgICB0aGlzLmlzTm90TG9ja2VkT3BlbiA9IGlzTm90TG9ja2VkT3BlbjtcblxuICAgIGZ1bmN0aW9uIHRvZ2dsZUxpc3QoaWQpIHtcbiAgICAgICRtZFNpZGVuYXYoaWQpLnRvZ2dsZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzTm90TG9ja2VkT3BlbihpZCkge1xuICAgICAgcmV0dXJuICEkbWRTaWRlbmF2KGlkKS5pc0xvY2tlZE9wZW4oKTtcbiAgICB9XG4gIH1cbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSk7Il19