(function (angular) {
  'use strict';

  var mdwiki = angular.module('mdwiki', [
    'ngRoute',
    'ngSanitize',
    'ngAnimate',
    'ngMaterial',
    'ngTouch',
    'jmdobry.angular-cache',
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

  directives.directive('autoFocus', ['$timeout',
    function ($timeout) {
      return {
        restrict: 'AC',
        link: function (scope, element) {
          $timeout(function () {
            element[0].focus();
          }, 5);
        }
      };
    }
  ]);

  directives.directive('onEnter', [
    function () {
      return {
        restrict: 'A',
        link: function (scope, element, attr) {
          element.bind('keydown', function (event) {
            if (event.keyCode === 13) {
              scope.$apply(function () {
                scope.$eval(attr.onEnter);
              });
            }
          });
        }
      };
    }
  ]);

  directives.directive('onMouseenter', [
    function () {
      return {
        restrict: 'A',
        link: function (scope, element, attr) {
          element.mouseenter(function () {
            scope.$apply(function () {
              scope.$eval(attr.onMouseenter);
            });
          });
        }
      };
    }
  ]);

  directives.directive('onMouseout', ['$timeout',
    function ($timeout) {
      return {
        restrict: 'A',
        link: function (scope, element, attr) {
          element.mouseleave(function () {
            $timeout(function () {
              scope.$apply(function () {
                scope.$eval(attr.onMouseout);
              });
            }, 50);
          });
        }
      };
    }
  ]);

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


(function (angular, SimpleMDE, CodeMirror) {
  'use strict';

  angular.module('mdwiki.directives')
    .directive('mdEditor', mdEditor);

  mdEditor.$inject = ['$timeout'];

  function mdEditor ($timeout) {
    return {
      scope: {
        markdown: '='
      },
      restrict: 'E',
      replace: true,
      templateUrl: 'js/directives/md-editor/md-editor.tpl.html',
      link: function (scope, element, attributes) {
        var textArea = element.find('textarea')[0];
        var options = {
          element: textArea,
          spellChecker: false,
          status: false,
          previewRender: false
        };
        var simpleMDE = new SimpleMDE(options);
        CodeMirror.commands.save = saveChanges;

        scope.cancelEdit = cancelEdit;
        scope.saveChanges = saveChanges;

        function cancelEdit() {
          scope.$emit('cancelEdit');
        }

        function saveChanges($event) {
          scope.markdown = simpleMDE.value();

          var args = {
            commitMessage: simpleMDE.codemirror.getSelection(),
            markdown: scope.markdown,
            event: $event
          };
          scope.$emit('saveChanges', args);
        }

        scope.$watch('markdown', function (value) {
          if (value) {
            simpleMDE.value(value);
          }
        });
      }
    };
  }
})(window.angular, window.SimpleMDE, window.CodeMirror);

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


(function (services) {
  'use strict';

  services.factory('EditorService', ['$rootScope', '$q',
    function($rootScope, $q) {
      var getSelectedText = function () {
        var deferred = $q.defer();

        deferred.resolve('');

        return deferred.promise;
      };

      return {
        getSelectedText: getSelectedText
      };
    }
  ]);
})(angular.module('mdwiki.services'));

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

(function (controllers, angular, document) {
  'use strict';

  controllers.controller('EditContentCtrl', ['$rootScope', '$scope', '$location', '$window', '$mdDialog', '$mdToast', 'PageService',
    function ($rootScope, $scope, $location, $window, $mdDialog, $mdToast, pageService) {
      var nonEditablePaths = ['/search', '/git/connect'];

      $scope.isAuthenticated = false;
      $scope.isEditorVisible = false;
      $scope.canEditPage = false;
      $scope.popupIsVisible = false;

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

      var showError = function (errorMessage) {
        $mdToast.show(
          $mdToast.simple()
            .content(errorMessage)
            .position('bottom fit')
            .hideDelay(3000)
        );
      };

      var createPage = function (pageName) {
        pageService.savePage(pageName, 'create new page ' + pageName, '#' + pageName)
          .then(function (pageContent) {
            $location.path('/' + pageName).search('edit');
          })
          .catch(function (error) {
            showError('Create new page failed: ' + error.message);
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
            showError('Delete the current page has been failed: ' + error.message);
          });
      };

      $scope.showOrHidePopup = function () {
        $scope.popupIsVisible = !$scope.popupIsVisible;
      };

      $scope.showPopup = function () {
        $scope.popupIsVisible = true;
      };

      $scope.hidePopup = function () {
        $scope.popupIsVisible = false;
      };

      $scope.create = function (event) {
        $scope.hidePopup();

        $mdDialog.show({
          controller: ['$scope', '$mdDialog', CreateNewPageController],
          templateUrl: 'createNewPageDialog',
          targetEvent: event,
        })
        .then(function(dialogResult) {
          if (!dialogResult.cancel) {
            createPage(dialogResult.pageName);
          }
        });
      };

      $scope.delete = function (event) {
        $scope.hidePopup();

        if ($rootScope.pageName === 'index') {
          var alertDialog = $mdDialog.alert()
              .title('Delete start page?')
              .content('It\'s not a good idea to delete your start page!')
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
            deletePage($rootScope.pageName);
          });
      };

      $scope.edit = function () {
        $scope.popupIsVisible = false;
        $location.path('/' + $rootScope.pageName).search('edit');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImRpcmVjdGl2ZXMuanMiLCJkaXJlY3RpdmVzL21kLWVkaXRvci9tZC1lZGl0b3IuanMiLCJzZXJ2aWNlcy9hcGl1cmxidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL2F1dGhzZXJ2aWNlLmpzIiwic2VydmljZXMvZWRpdG9yc2VydmljZS5qcyIsInNlcnZpY2VzL2h0dHBoZWFkZXJidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL3BhZ2VzZXJ2aWNlLmpzIiwic2VydmljZXMvc2VhcmNoc2VydmljZS5qcyIsInNlcnZpY2VzL3NlcnZlcmNvbmZpZ3NlcnZpY2UuanMiLCJzZXJ2aWNlcy9zZXR0aW5nc3NlcnZpY2UuanMiLCJjb250cm9sbGVycy9hdXRoY3RybC5qcyIsImNvbnRyb2xsZXJzL2NvbW1pdG1lc3NhZ2VkaWFsb2djdHJsLmpzIiwiY29udHJvbGxlcnMvY29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9lZGl0Y29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9naXRjb25uZWN0Y3RybC5qcyIsImNvbnRyb2xsZXJzL3BhZ2VzY3RybC5qcyIsImNvbnRyb2xsZXJzL3NlYXJjaGN0cmwuanMiLCJjb250cm9sbGVycy9zaWRlYmFyY3RybC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDckIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDZjtBQUNBLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3pDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDZCxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ2pCLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDaEIsSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNqQixJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2Qs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QUM7QUFDUDtBQUNBLE1BQU0sQ0FBQyxJQUFJLEVBQUU7QUFDYixRQUFRLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFO0FBQ3RCLFFBQVEsR0FBRyxDQUFDLENBQUMsVUFBVTtBQUN2QixNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDaEUsUUFBUSxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtBQUN0QyxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0QsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHO0FBQ2hDLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQzFHLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzVCLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDL0IsTUFBTSxHQUFHO0FBQ1Q7QUFDQSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0FBQzlCLElBQUksRUFBRTtBQUNOO0FBQ0EsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO0FBQ2hDO0FBQ0EsTUFBTSxDQUFDLElBQUksRUFBRTtBQUNiLFFBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7QUFDdEIsUUFBUSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtBQUMzRCxRQUFRLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ3hELFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLFVBQVUsYUFBYSxDQUFDLENBQUMsYUFBYSxDQUFDO0FBQ3ZDLFVBQVUsUUFBUSxDQUFDLENBQUMsUUFBUTtBQUM1QixRQUFRLENBQUM7QUFDVCxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDaEUsUUFBUSxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtBQUN0QyxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0QsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHO0FBQ2hDLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQzFHLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzVCLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDL0IsTUFBTSxHQUFHO0FBQ1Q7QUFDQSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0FBQzlCLElBQUksRUFBRTtBQUNOO0FBQ0EsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO0FBQ2hDO0FBQ0EsTUFBTSxDQUFDLElBQUksRUFBRTtBQUNiLFFBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDekIsUUFBUSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUMxRCxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDaEUsUUFBUSxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtBQUN0QyxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0QsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHO0FBQ2hDLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQzFHLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzVCLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDL0IsTUFBTSxHQUFHO0FBQ1Q7QUFDQSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0FBQzlCLElBQUksRUFBRTtBQUNOO0FBQ0EsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO0FBQ2hDO0FBQ0EsTUFBTSxDQUFDLElBQUksRUFBRTtBQUNiLFFBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7QUFDdEIsUUFBUSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFO0FBQzFELFFBQVEsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdkQsTUFBTSxFQUFFO0FBQ1IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ3pELFFBQVEsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHO0FBQy9CO0FBQ0EsUUFBUSxlQUFlLENBQUMsS0FBSyxFQUFFO0FBQy9CLFFBQVEsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDaEMsTUFBTSxFQUFFO0FBQ1IsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQy9ELFFBQVEsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRztBQUNoQyxRQUFRLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUM1QixRQUFRLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztBQUMxRyxRQUFRLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQy9CLE1BQU0sR0FBRztBQUNUO0FBQ0EsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztBQUM5QixJQUFJLEVBQUU7QUFDTjtBQUNBLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMxQyxNQUFNLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRztBQUNwRDtBQUNBLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JELFFBQVEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUc7QUFDeEQsUUFBUSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RCxVQUFVLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDM0IsUUFBUSxDQUFDO0FBQ1QsTUFBTSxDQUFDO0FBQ1AsTUFBTSxNQUFNLENBQUMsR0FBRztBQUNoQixJQUFJLEVBQUU7QUFDTjtBQUNBLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMvQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDOUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFDdkQsVUFBVSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUM7QUFDL0IsUUFBUSxDQUFDO0FBQ1QsTUFBTSxDQUFDO0FBQ1AsTUFBTSxNQUFN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UyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRTtBQUNwRCxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDO0FBQ3BEO0FBQ0EsTUFBTSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3BELFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJO0FBQ2hEO0FBQ0EsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN4RCxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUU7QUFDOUIsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHO0FBQzlELFFBQVEsR0FBRztBQUNYO0FBQ0EsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDN0MsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxNQUFNLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3RCxZQUFZLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUU7QUFDaEMsWUFBWSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FB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R0FBRztBQUMzQjtBQUNBLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ3hCLFVBQVUsVUFBVSxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLHVCQUF1QixFQUFFO0FBQ3ZFLFVBQVUsV0FBVyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRTtBQUM3QyxVQUFVLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUM3QixRQUFRLEVBQUU7QUFDVixRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLFVBQVUsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDckMsWUFBWSxVQUFVLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRTtBQUM5QyxVQUFVLENBQUM7QUFDWCxRQUFRLEdBQUc7QUFDWCxNQUFNLEVBQUU7QUFDUjtBQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHO0FBQzNCO0FBQ0EsUUFBUSxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7QUFDOUMsVUFBVSxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUU7QUFDN0MsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRztBQUMxQyxjQUFjLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUc7QUFDMUUsY0FBYyxDQUFDLFdB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Y2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKGFuZ3VsYXIpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtZHdpa2kgPSBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpJywgW1xuICAgICduZ1JvdXRlJyxcbiAgICAnbmdTYW5pdGl6ZScsXG4gICAgJ25nQW5pbWF0ZScsXG4gICAgJ25nTWF0ZXJpYWwnLFxuICAgICduZ1RvdWNoJyxcbiAgICAnam1kb2JyeS5hbmd1bGFyLWNhY2hlJyxcbiAgICAnbWR3aWtpLmNvbnRyb2xsZXJzJyxcbiAgICAnbWR3aWtpLnNlcnZpY2VzJyxcbiAgICAnbWR3aWtpLmRpcmVjdGl2ZXMnLFxuICAgICdtZHdpa2kuZmlsdGVycycsXG4gIF0pLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywgJyRsb2NhdGlvblByb3ZpZGVyJywgJyRtZFRoZW1pbmdQcm92aWRlcicsICckbWRJY29uUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uICgkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRtZFRoZW1pbmdQcm92aWRlciwgJG1kSWNvblByb3ZpZGVyKSB7XG4gICAgICAkcm91dGVQcm92aWRlclxuICAgICAgICAud2hlbignL2dpdC9jb25uZWN0Jywge1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnLi92aWV3cy9naXRjb25uZWN0Lmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdHaXRDb25uZWN0Q3RybCdcbiAgICAgICAgfSlcbiAgICAgICAgLndoZW4oJy8nLCB7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICcuL3ZpZXdzL2NvbnRlbnQuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ0NvbnRlbnRDdHJsJ1xuICAgICAgICB9KVxuICAgICAgICAud2hlbignL3NlYXJjaCcsIHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJy4vdmlld3Mvc2VhcmNoUmVzdWx0Lmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDdHJsJ1xuICAgICAgICB9KVxuICAgICAgICAud2hlbignLzpwYWdlJywge1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnLi92aWV3cy9jb250ZW50Lmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb250ZW50Q3RybCdcbiAgICAgICAgfSkub3RoZXJ3aXNlKHtcbiAgICAgICAgICByZWRpcmVjdFRvOiAnL2luZGV4J1xuICAgICAgICB9KTtcblxuICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgICAkbWRUaGVtaW5nUHJvdmlkZXIudGhlbWUoJ2RlZmF1bHQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnByaW1hcnlQYWxldHRlKCdibHVlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hY2NlbnRQYWxldHRlKCdyZWQnKTtcbiAgICB9XG4gIF0pO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnLCBbXSk7XG4gIGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnLCBbXSk7XG4gIGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuZGlyZWN0aXZlcycsIFtdKTtcbiAgYW5ndWxhci5tb2R1bGUoJ21kd2lraS5maWx0ZXJzJywgW10pO1xufSkoYW5ndWxhcik7XG5cbiIsIihmdW5jdGlvbiAoZGlyZWN0aXZlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgZGlyZWN0aXZlcy5kaXJlY3RpdmUoJ2tleWJpbmRpbmcnLCBbJyRkb2N1bWVudCcsICckcGFyc2UnLCAnJHdpbmRvdycsIGZ1bmN0aW9uICgkZG9jdW1lbnQsICRwYXJzZSwgJHdpbmRvdykge1xuICAgIHZhciBpc01hYyA9IC9NYWN8aVBvZHxpUGhvbmV8aVBhZC8udGVzdCgkd2luZG93Lm5hdmlnYXRvci5wbGF0Zm9ybSk7XG5cbiAgICBmdW5jdGlvbiBpc01vZGlmaWVyKG1vZGlmaWVyLCBldmVudCwgaXNNYWMpIHtcbiAgICAgIHZhciBpc1NoaWZ0ID0gZXZlbnQuc2hpZnRLZXk7XG4gICAgICB2YXIgaXNBbHQgPSBldmVudC5hbHRLZXk7XG4gICAgICB2YXIgaXNDdHJsID0gaXNNYWMgPyBldmVudC5tZXRhS2V5IDogZXZlbnQuY3RybEtleTtcblxuICAgICAgaWYgKG1vZGlmaWVyKSB7XG4gICAgICAgIHN3aXRjaCAobW9kaWZpZXIpIHtcbiAgICAgICAgICBjYXNlICdjdHJsK3NoaWZ0JzpcbiAgICAgICAgICBjYXNlICdzaGlmdCtjdHJsJzpcbiAgICAgICAgICAgIHJldHVybiBpc1NoaWZ0ICYmIGlzQ3RybDtcbiAgICAgICAgICBjYXNlICdhbHQrc2hpZnQnOlxuICAgICAgICAgIGNhc2UgJ3NoaWZ0K2FsdCc6XG4gICAgICAgICAgICByZXR1cm4gaXNTaGlmdCAmJiBpc0FsdDtcbiAgICAgICAgICBjYXNlICdjdHJsK2FsdCc6XG4gICAgICAgICAgY2FzZSAnY21kK2FsdCc6XG4gICAgICAgICAgICByZXR1cm4gaXNBbHQgJiYgaXNDdHJsO1xuICAgICAgICAgIGNhc2UgJ2NtZCtjdHJsJzpcbiAgICAgICAgICAgIHJldHVybiBldmVudC5tZXRhS2V5ICYmIGV2ZW50LkN0cmxLZXk7XG4gICAgICAgICAgY2FzZSAnc2hpZnQnOlxuICAgICAgICAgICAgcmV0dXJuIGlzU2hpZnQ7XG4gICAgICAgICAgY2FzZSAnY3RybCc6XG4gICAgICAgICAgY2FzZSAnY21kJzpcbiAgICAgICAgICAgIHJldHVybiBpc0N0cmw7XG4gICAgICAgICAgY2FzZSAnYWx0JzpcbiAgICAgICAgICAgIHJldHVybiBpc0FsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZlcmlmeUtleUNvZGUoZXZlbnQsIG1vZGlmaWVyLCBrZXkpIHtcbiAgICAgIGlmIChTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LmtleUNvZGUpID09PSBrZXkpIHtcbiAgICAgICAgaWYgKG1vZGlmaWVyKSB7XG4gICAgICAgICAgcmV0dXJuIGlzTW9kaWZpZXIobW9kaWZpZXIsIGV2ZW50LCBpc01hYyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmVyaWZ5Q29uZGl0aW9uKCRldmFsLCBjb25kaXRpb24pIHtcbiAgICAgIGlmIChjb25kaXRpb24pIHtcbiAgICAgICAgcmV0dXJuICRldmFsKGNvbmRpdGlvbik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1vZGlmaWVyOiAnQG1vZGlmaWVyJyxcbiAgICAgICAga2V5OiAnQGtleScsXG4gICAgICAgIGNvbmRpdGlvbjogJyYnLFxuICAgICAgICBpbnZva2U6ICcmJ1xuICAgICAgfSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgJGVsZW1lbnQsIGF0dHIpIHtcbiAgICAgICAgJGRvY3VtZW50LmJpbmQoJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBpZiAodmVyaWZ5S2V5Q29kZShldmVudCwgc2NvcGUubW9kaWZpZXIsIHNjb3BlLmtleSkgJiZcbiAgICAgICAgICAgICAgdmVyaWZ5Q29uZGl0aW9uKHNjb3BlLiRldmFsLCBzY29wZS5jb25kaXRpb24pKSB7XG4gICAgICAgICAgICBzY29wZS4kYXBwbHkoc2NvcGUuaW52b2tlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1dKTtcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgnYXV0b0ZvY3VzJywgWyckdGltZW91dCcsXG4gICAgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0FDJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWxlbWVudFswXS5mb2N1cygpO1xuICAgICAgICAgIH0sIDUpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbiAgZGlyZWN0aXZlcy5kaXJlY3RpdmUoJ29uRW50ZXInLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG4gICAgICAgICAgZWxlbWVudC5iaW5kKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kZXZhbChhdHRyLm9uRW50ZXIpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdvbk1vdXNlZW50ZXInLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG4gICAgICAgICAgZWxlbWVudC5tb3VzZWVudGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHIub25Nb3VzZWVudGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbiAgZGlyZWN0aXZlcy5kaXJlY3RpdmUoJ29uTW91c2VvdXQnLCBbJyR0aW1lb3V0JyxcbiAgICBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuICAgICAgICAgIGVsZW1lbnQubW91c2VsZWF2ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGV2YWwoYXR0ci5vbk1vdXNlb3V0KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgnYXV0b1NlbGVjdCcsIFsnJHRpbWVvdXQnLCBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBQycsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKCdmb2N1cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlbGVtZW50WzBdLnNlbGVjdCgpO1xuICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5kaXJlY3RpdmVzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGFuZ3VsYXIsIFNpbXBsZU1ERSwgQ29kZU1pcnJvcikge1xuICAndXNlIHN0cmljdCc7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ21kd2lraS5kaXJlY3RpdmVzJylcbiAgICAuZGlyZWN0aXZlKCdtZEVkaXRvcicsIG1kRWRpdG9yKTtcblxuICBtZEVkaXRvci4kaW5qZWN0ID0gWyckdGltZW91dCddO1xuXG4gIGZ1bmN0aW9uIG1kRWRpdG9yICgkdGltZW91dCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY29wZToge1xuICAgICAgICBtYXJrZG93bjogJz0nXG4gICAgICB9LFxuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RpcmVjdGl2ZXMvbWQtZWRpdG9yL21kLWVkaXRvci50cGwuaHRtbCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdmFyIHRleHRBcmVhID0gZWxlbWVudC5maW5kKCd0ZXh0YXJlYScpWzBdO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICBlbGVtZW50OiB0ZXh0QXJlYSxcbiAgICAgICAgICBzcGVsbENoZWNrZXI6IGZhbHNlLFxuICAgICAgICAgIHN0YXR1czogZmFsc2UsXG4gICAgICAgICAgcHJldmlld1JlbmRlcjogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNpbXBsZU1ERSA9IG5ldyBTaW1wbGVNREUob3B0aW9ucyk7XG4gICAgICAgIENvZGVNaXJyb3IuY29tbWFuZHMuc2F2ZSA9IHNhdmVDaGFuZ2VzO1xuXG4gICAgICAgIHNjb3BlLmNhbmNlbEVkaXQgPSBjYW5jZWxFZGl0O1xuICAgICAgICBzY29wZS5zYXZlQ2hhbmdlcyA9IHNhdmVDaGFuZ2VzO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNhbmNlbEVkaXQoKSB7XG4gICAgICAgICAgc2NvcGUuJGVtaXQoJ2NhbmNlbEVkaXQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNhdmVDaGFuZ2VzKCRldmVudCkge1xuICAgICAgICAgIHNjb3BlLm1hcmtkb3duID0gc2ltcGxlTURFLnZhbHVlKCk7XG5cbiAgICAgICAgICB2YXIgYXJncyA9IHtcbiAgICAgICAgICAgIGNvbW1pdE1lc3NhZ2U6IHNpbXBsZU1ERS5jb2RlbWlycm9yLmdldFNlbGVjdGlvbigpLFxuICAgICAgICAgICAgbWFya2Rvd246IHNjb3BlLm1hcmtkb3duLFxuICAgICAgICAgICAgZXZlbnQ6ICRldmVudFxuICAgICAgICAgIH07XG4gICAgICAgICAgc2NvcGUuJGVtaXQoJ3NhdmVDaGFuZ2VzJywgYXJncyk7XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS4kd2F0Y2goJ21hcmtkb3duJywgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBzaW1wbGVNREUudmFsdWUodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufSkod2luZG93LmFuZ3VsYXIsIHdpbmRvdy5TaW1wbGVNREUsIHdpbmRvdy5Db2RlTWlycm9yKTtcbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ0FwaVVybEJ1aWxkZXJTZXJ2aWNlJywgWyAnU2V0dGluZ3NTZXJ2aWNlJywgZnVuY3Rpb24gKHNldHRpbmdzU2VydmljZSkge1xuICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uICh1cmxCZWZvcmUsIHVybEFmdGVyLCBzZXR0aW5ncykge1xuICAgICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCBzZXR0aW5nc1NlcnZpY2UuZ2V0KCk7XG5cbiAgICAgIGlmIChzZXR0aW5ncy5wcm92aWRlciA9PT0gJ2dpdGh1YicpIHtcbiAgICAgICAgcmV0dXJuIHVybEJlZm9yZSArIHNldHRpbmdzLmdpdGh1YlVzZXIgKyAnLycgKyBzZXR0aW5ncy5naXRodWJSZXBvc2l0b3J5ICsgJy8nICsgdXJsQWZ0ZXI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1cmxCZWZvcmUgKyB1cmxBZnRlcjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1aWxkOiBidWlsZFxuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ0F1dGhTZXJ2aWNlJywgWyckaHR0cCcsICckcScsIGZ1bmN0aW9uICgkaHR0cCwgJHEpIHtcbiAgICB2YXIgZ2V0QXV0aGVudGljYXRlZFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogJy9hdXRoL3VzZXInLFxuICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ30sXG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGF1dGgsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoYXV0aC51c2VyKTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgdXJsOiAnL2F1dGgvdXNlcicsXG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoZGF0YSk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBsb2dvdXQ6IGxvZ291dCxcbiAgICAgIGdldEF1dGhlbnRpY2F0ZWRVc2VyOiBnZXRBdXRoZW50aWNhdGVkVXNlclxuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ0VkaXRvclNlcnZpY2UnLCBbJyRyb290U2NvcGUnLCAnJHEnLFxuICAgIGZ1bmN0aW9uKCRyb290U2NvcGUsICRxKSB7XG4gICAgICB2YXIgZ2V0U2VsZWN0ZWRUZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoJycpO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U2VsZWN0ZWRUZXh0OiBnZXRTZWxlY3RlZFRleHRcbiAgICAgIH07XG4gICAgfVxuICBdKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdIdHRwSGVhZGVyQnVpbGRlclNlcnZpY2UnLCBbICdTZXR0aW5nc1NlcnZpY2UnLCBmdW5jdGlvbiAoc2V0dGluZ3NTZXJ2aWNlKSB7XG4gICAgdmFyIGJ1aWxkID0gZnVuY3Rpb24gKGNvbnRlbnRUeXBlLCBzZXR0aW5ncykge1xuICAgICAgY29udGVudFR5cGUgPSBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHNldHRpbmdzU2VydmljZS5nZXQoKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ1gtTURXaWtpLVByb3ZpZGVyJzogc2V0dGluZ3MucHJvdmlkZXIsXG4gICAgICAgICdYLU1EV2lraS1VcmwnOiBzZXR0aW5ncy51cmxcbiAgICAgIH07XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBidWlsZDogYnVpbGRcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdQYWdlU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCAnQXBpVXJsQnVpbGRlclNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsICRxLCB1cmxCdWlsZGVyKSB7XG4gICAgdmFyIHVwZGF0ZVBhZ2VzT2JzZXJ2ZXJzID0gW107XG5cbiAgICB2YXIgZ2V0UGFnZSA9IGZ1bmN0aW9uIChwYWdlLCBmb3JtYXQpIHtcbiAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCAnaHRtbCc7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpLFxuICAgICAgICAgIHJlcXVlc3RVcmwgPSB1cmxCdWlsZGVyLmJ1aWxkKCcvYXBpLycsICdwYWdlLycgKyBwYWdlKTtcblxuICAgICAgaWYgKGZvcm1hdCA9PT0gJ21hcmtkb3duJylcbiAgICAgIHtcbiAgICAgICAgcmVxdWVzdFVybCArPSAnP2Zvcm1hdD1tYXJrZG93bic7XG4gICAgICB9XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgdXJsOiByZXF1ZXN0VXJsXG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKHBhZ2VDb250ZW50LCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHBhZ2VDb250ZW50KTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGVycm9yTWVzc2FnZSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSBzdGF0dXMgPT09IDQwNCA/ICdDb250ZW50IG5vdCBmb3VuZCcgOiAnVW5leHBlY3RlZCBzZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvck1lc3NhZ2U7XG4gICAgICAgIGVycm9yLmNvZGUgPSBzdGF0dXM7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBzYXZlUGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSwgY29tbWl0TWVzc2FnZSwgbWFya2Rvd24pIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgdXJsOiB1cmxCdWlsZGVyLmJ1aWxkKCcvYXBpLycsICdwYWdlLycgKyBwYWdlTmFtZSksXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgY29tbWl0TWVzc2FnZTogY29tbWl0TWVzc2FnZSxcbiAgICAgICAgICBtYXJrZG93bjogbWFya2Rvd25cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChwYWdlQ29udGVudCwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYWdlQ29udGVudCk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gc3RhdHVzID09PSA0MDQgPyAnQ29udGVudCBub3QgZm91bmQnIDogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yOiAnICsgZXJyb3JNZXNzYWdlO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgZGVsZXRlUGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICB1cmw6IHVybEJ1aWxkZXIuYnVpbGQoJy9hcGkvJywgJ3BhZ2UvJyArIHBhZ2VOYW1lKVxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChwYWdlQ29udGVudCwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYWdlQ29udGVudCk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gc3RhdHVzID09PSA0MDQgPyAnQ29udGVudCBub3QgZm91bmQnIDogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yOiAnICsgZXJyb3JNZXNzYWdlO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0UGFnZXMgPSBmdW5jdGlvbiAoc2V0dGluZ3MpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgdXJsOiB1cmxCdWlsZGVyLmJ1aWxkKCcvYXBpLycsICdwYWdlcycsIHNldHRpbmdzKSxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgdmFyIHBhZ2VzID0gZGF0YSB8fCBbXTtcblxuICAgICAgICBub3RpZnlPYnNlcnZlcnMocGFnZXMpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHBhZ2VzKTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGVycm9yTWVzc2FnZSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4gICAgICAgIGVycm9yLmNvZGUgPSBzdGF0dXM7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSBzdGF0dXMgPT09IDQwNCA/ICdDb250ZW50IG5vdCBmb3VuZCcgOiAnVW5leHBlY3RlZCBzZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvck1lc3NhZ2U7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBmaW5kU3RhcnRQYWdlID0gZnVuY3Rpb24gKHBhZ2VzKSB7XG4gICAgICB2YXIgcGFnZXNUb0ZpbmQgPSBbJ2luZGV4JywgJ2hvbWUnLCAncmVhZG1lJ107XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXNUb0ZpbmQubGVuZ3RoIDsgaSsrKSB7XG4gICAgICAgIHZhciBzdGFydFBhZ2UgPSBmaW5kUGFnZShwYWdlcywgcGFnZXNUb0ZpbmRbaV0pO1xuICAgICAgICBpZiAoc3RhcnRQYWdlICE9PSB1bmRlZmluZWQgJiYgc3RhcnRQYWdlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gc3RhcnRQYWdlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gJyc7XG4gICAgfTtcblxuICAgIHZhciBmaW5kUGFnZSA9IGZ1bmN0aW9uIChwYWdlcywgcGFnZU5hbWUpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBhZ2VOYW1lID09PSBwYWdlc1tpXS5uYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICByZXR1cm4gcGFnZXNbaV0ubmFtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICB2YXIgcmVnaXN0ZXJPYnNlcnZlciA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgdXBkYXRlUGFnZXNPYnNlcnZlcnMucHVzaChjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIHZhciBub3RpZnlPYnNlcnZlcnMgPSBmdW5jdGlvbiAocGFnZXMpIHtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaCh1cGRhdGVQYWdlc09ic2VydmVycywgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKHBhZ2VzKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmluZFN0YXJ0UGFnZTogZmluZFN0YXJ0UGFnZSxcbiAgICAgIGdldFBhZ2U6IGdldFBhZ2UsXG4gICAgICBzYXZlUGFnZTogc2F2ZVBhZ2UsXG4gICAgICBkZWxldGVQYWdlOiBkZWxldGVQYWdlLFxuICAgICAgZ2V0UGFnZXM6IGdldFBhZ2VzLFxuICAgICAgcmVnaXN0ZXJPYnNlcnZlcjogcmVnaXN0ZXJPYnNlcnZlclxuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ1NlYXJjaFNlcnZpY2UnLCBbJyRodHRwJywgJyRxJywgJ0FwaVVybEJ1aWxkZXJTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCAkcSwgdXJsQnVpbGRlcikge1xuICAgIHZhciBzZWFyY2hTZXJ2aWNlSW5zdGFuY2UgPSB7fTtcbiAgICBzZWFyY2hTZXJ2aWNlSW5zdGFuY2Uuc2VhcmNoUmVzdWx0ID0gJyc7XG5cbiAgICB2YXIgc2VhcmNoID0gZnVuY3Rpb24gKHRleHRUb1NlYXJjaCkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgdXJsOiB1cmxCdWlsZGVyLmJ1aWxkKCcvYXBpLycsICdzZWFyY2gnKSxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGRhdGE6IHsgdGV4dFRvU2VhcmNoOiB0ZXh0VG9TZWFyY2ggfVxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChzZWFyY2hSZXN1bHQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoc2VhcmNoUmVzdWx0KTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKHNlYXJjaGVkVGV4dCwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHNlYXJjaGVkVGV4dCk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBzZWFyY2g6IHNlYXJjaCxcbiAgICAgIHNlYXJjaFNlcnZpY2VJbnN0YW5jZTogc2VhcmNoU2VydmljZUluc3RhbmNlXG4gICAgfTtcblxuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdTZXJ2ZXJDb25maWdTZXJ2aWNlJywgWyckaHR0cCcsICckcScsIGZ1bmN0aW9uICgkaHR0cCwgJHEpIHtcbiAgICB2YXIgZ2V0Q29uZmlnID0gZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgdXJsOiAnL2FwaS9zZXJ2ZXJjb25maWcnLFxuICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ30sXG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoZGF0YSk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IHN0YXR1cyA9PT0gNDA0ID8gJ0NvbnRlbnQgbm90IGZvdW5kJyA6ICdVbmV4cGVjdGVkIHNlcnZlciBlcnJvcic7XG4gICAgICAgIGVycm9yLmNvZGUgPSBzdGF0dXM7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBnZXRDb25maWc6IGdldENvbmZpZ1xuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ1NldHRpbmdzU2VydmljZScsIFsnJGFuZ3VsYXJDYWNoZUZhY3RvcnknLCBmdW5jdGlvbiAoJGFuZ3VsYXJDYWNoZUZhY3RvcnkpIHtcbiAgICB2YXIgY2FjaGUgPSAkYW5ndWxhckNhY2hlRmFjdG9yeSgnbWR3aWtpJywgeyBzdG9yYWdlTW9kZTogJ2xvY2FsU3RvcmFnZScgfSk7XG5cbiAgICB2YXIgZ2V0RGVmYXVsdFNldHRpbmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcHJvdmlkZXI6ICdnaXRodWInLFxuICAgICAgICBnaXRodWJVc2VyOiAnbWR3aWtpJyxcbiAgICAgICAgZ2l0aHViUmVwb3NpdG9yeTogJ3dpa2knLFxuICAgICAgICB1cmw6ICdtZHdpa2kvd2lraScsXG4gICAgICAgIHN0YXJ0UGFnZTogJ2luZGV4J1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIGlzRGVmYXVsdFNldHRpbmdzID0gZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICByZXR1cm4gYW5ndWxhci5lcXVhbHMoc2V0dGluZ3MsIHRoaXMuZ2V0RGVmYXVsdFNldHRpbmdzKCkpO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNldHRpbmdzID0gY2FjaGUuZ2V0KCdzZXR0aW5ncycpO1xuICAgICAgaWYgKHNldHRpbmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2V0dGluZ3MgPSB0aGlzLmdldERlZmF1bHRTZXR0aW5ncygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNldHRpbmdzO1xuICAgIH07XG5cbiAgICB2YXIgcHV0ID0gZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICBjYWNoZS5wdXQoJ3NldHRpbmdzJywgc2V0dGluZ3MpO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgZ2V0OiBnZXQsXG4gICAgICBwdXQ6IHB1dCxcbiAgICAgIGdldERlZmF1bHRTZXR0aW5nczogZ2V0RGVmYXVsdFNldHRpbmdzLFxuICAgICAgaXNEZWZhdWx0U2V0dGluZ3M6IGlzRGVmYXVsdFNldHRpbmdzXG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignQXV0aEN0cmwnLCBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyR3aW5kb3cnLCAnQXV0aFNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICR3aW5kb3csIGF1dGhTZXJ2aWNlKSB7XG4gICAgICAkc2NvcGUuaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAkc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgIGF1dGhTZXJ2aWNlLmdldEF1dGhlbnRpY2F0ZWRVc2VyKClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAkc2NvcGUudXNlciA9IHVzZXIgfHwgbnVsbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJ2F1dGgvZ2l0aHViP3BhZ2U9JyArICRyb290U2NvcGUucGFnZU5hbWU7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBhdXRoU2VydmljZS5sb2dvdXQoKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnL2dpdC9jb25uZWN0JztcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS4kd2F0Y2goJ3VzZXInLCBmdW5jdGlvbiAobmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gICAgICAgICRyb290U2NvcGUuaXNBdXRoZW50aWNhdGVkID0gbmV3VmFsdWUgIT09IG51bGw7XG4gICAgICAgICRzY29wZS5pc0F1dGhlbnRpY2F0ZWQgPSAkcm9vdFNjb3BlLmlzQXV0aGVudGljYXRlZDtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdpc0F1dGhlbnRpY2F0ZWQnLCB7IGlzQXV0aGVudGljYXRlZDogJHJvb3RTY29wZS5pc0F1dGhlbnRpY2F0ZWQgfSk7XG4gICAgICB9KTtcblxuICAgIH1cbiAgXSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdDb21taXRNZXNzYWdlRGlhbG9nQ3RybCcsIFsnJHNjb3BlJywgJyRtZERpYWxvZycsICdFZGl0b3JTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHNjb3BlLCAkbWREaWFsb2csIGVkaXRvclNlcnZpY2UpIHtcbiAgICAgICRzY29wZS5wYWdlTmFtZSA9ICcnO1xuICAgICAgJHNjb3BlLmNvbW1pdE1lc3NhZ2UgPSAnU29tZSBjaGFuZ2VzIGZvciAnICsgJHNjb3BlLnBhZ2VOYW1lO1xuXG4gICAgICBlZGl0b3JTZXJ2aWNlLmdldFNlbGVjdGVkVGV4dCgpLnRoZW4oZnVuY3Rpb24gKHNlbGVjdGVkVGV4dCkge1xuICAgICAgICBpZiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgICAgICAgJHNjb3BlLmNvbW1pdE1lc3NhZ2UgPSBzZWxlY3RlZFRleHQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkbWREaWFsb2cuaGlkZSgpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkbWREaWFsb2cuY2FuY2VsKCk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuY2xvc2VEaWFsb2cgPSBmdW5jdGlvbiAoY2FuY2VsKSB7XG4gICAgICAgICRtZERpYWxvZy5oaWRlKHtcbiAgICAgICAgICBjYW5jZWw6IGNhbmNlbCxcbiAgICAgICAgICBjb21taXRNZXNzYWdlOiAkc2NvcGUuY29tbWl0TWVzc2FnZVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfVxuICBdKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0NvbnRlbnRDdHJsJyxcbiAgICBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyRyb3V0ZVBhcmFtcycsICckbG9jYXRpb24nLCAnJHEnLCAnJHdpbmRvdycsXG4gICAgICckbWRUb2FzdCcsICckbWREaWFsb2cnLCAnUGFnZVNlcnZpY2UnLCAnU2V0dGluZ3NTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkcm91dGVQYXJhbXMsICRsb2NhdGlvbiwgJHEsICR3aW5kb3csXG4gICAgICAgICAgICAgICRtZFRvYXN0LCAkbWREaWFsb2csIHBhZ2VTZXJ2aWNlLCBzZXR0aW5nc1NlcnZpY2UpIHtcbiAgICAgICRzY29wZS5jb250ZW50ID0gJyc7XG4gICAgICAkc2NvcGUubWFya2Rvd24gPSAnJztcbiAgICAgICRzY29wZS5wYWdlTmFtZSA9ICcnO1xuICAgICAgJHNjb3BlLnJlZnJlc2ggPSBmYWxzZTtcbiAgICAgICRzY29wZS5pc0VkaXRvclZpc2libGUgPSBmYWxzZTtcblxuICAgICAgdmFyIHNldHRpbmdzID0gc2V0dGluZ3NTZXJ2aWNlLmdldCgpO1xuICAgICAgdmFyIHN0YXJ0UGFnZSA9IHNldHRpbmdzLnN0YXJ0UGFnZSB8fCAnaW5kZXgnO1xuICAgICAgdmFyIHBhZ2VOYW1lID0gJHJvdXRlUGFyYW1zLnBhZ2UgfHwgc3RhcnRQYWdlO1xuXG4gICAgICB2YXIgcHJlcGFyZUxpbmtzID0gZnVuY3Rpb24gKGh0bWwsIHNldHRpbmdzKSB7XG4gICAgICAgIHZhciAkZG9tID0gJCgnPGRpdj4nICsgaHRtbCArICc8L2Rpdj4nKTtcblxuICAgICAgICAkZG9tLmZpbmQoJ2FbaHJlZl49XCJ3aWtpL1wiXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciAkbGluayA9ICQodGhpcyk7XG4gICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsICRsaW5rLmF0dHIoJ2hyZWYnKS5zdWJzdHJpbmcoNCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoc2V0dGluZ3MucHJvdmlkZXIgPT09ICdnaXRodWInKSB7XG4gICAgICAgICAgJGRvbS5maW5kKCdhW2hyZWZePVwiL3N0YXRpYy9cIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciAkbGluayA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgbmV3TGluayA9ICcvc3RhdGljLycuY29uY2F0KHNldHRpbmdzLmdpdGh1YlVzZXIsICcvJywgc2V0dGluZ3MuZ2l0aHViUmVwb3NpdG9yeSwgJy8nLCAkbGluay5hdHRyKCdocmVmJykuc3Vic3RyaW5nKCcvc3RhdGljLycubGVuZ3RoKSk7XG4gICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3TGluayk7XG4gICAgICAgICAgICAkbGluay5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJGRvbS5maW5kKCdhW2hyZWZePVwiL3N0YXRpYy9cIl0nKS5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICRkb20uaHRtbCgpO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNob3dFcnJvciA9IGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgLmNvbnRlbnQoZXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gZml0JylcbiAgICAgICAgICAgIC5oaWRlRGVsYXkoMzAwMClcbiAgICAgICAgKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBnZXRQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgcGFnZVNlcnZpY2UuZ2V0UGFnZShwYWdlTmFtZSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGFnZUNvbnRlbnQpIHtcbiAgICAgICAgICAgICRzY29wZS5wYWdlTmFtZSA9IHBhZ2VOYW1lO1xuICAgICAgICAgICAgJHJvb3RTY29wZS5wYWdlTmFtZSA9IHBhZ2VOYW1lO1xuICAgICAgICAgICAgJHNjb3BlLmNvbnRlbnQgPSBwcmVwYXJlTGlua3MocGFnZUNvbnRlbnQsIHNldHRpbmdzKTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChwYWdlTmFtZSA9PT0gc3RhcnRQYWdlICYmIGVycm9yLmNvZGUgPT09IDQwNCkge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL2dpdC9jb25uZWN0Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzaG93RXJyb3IoJ0NvbnRlbnQgbm90IGZvdW5kIScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBzaG93T3JIaWRlRWRpdG9yID0gZnVuY3Rpb24gKGlzVmlzaWJsZSkge1xuICAgICAgICAkc2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gaXNWaXNpYmxlO1xuICAgICAgICAkcm9vdFNjb3BlLmlzRWRpdG9yVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdpc0VkaXRvclZpc2libGUnLCB7IGlzRWRpdG9yVmlzaWJsZTogaXNWaXNpYmxlIH0pO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNob3dFZGl0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNob3dPckhpZGVFZGl0b3IodHJ1ZSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgaGlkZUVkaXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCRyb3V0ZVBhcmFtcy5lZGl0KSB7XG4gICAgICAgICAgJGxvY2F0aW9uLnNlYXJjaCh7fSk7XG4gICAgICAgIH1cbiAgICAgICAgc2hvd09ySGlkZUVkaXRvcihmYWxzZSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgZWRpdFBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgICAgc2hvd0VkaXRvcigpO1xuXG4gICAgICAgIHBhZ2VTZXJ2aWNlLmdldFBhZ2UocGFnZU5hbWUsICdtYXJrZG93bicpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKG1hcmtkb3duKSB7XG4gICAgICAgICAgICAkc2NvcGUubWFya2Rvd24gPSBtYXJrZG93bjtcbiAgICAgICAgICAgICRzY29wZS5yZWZyZXNoID0gdHJ1ZTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChwYWdlTmFtZSA9PT0gc3RhcnRQYWdlICYmIGVycm9yLmNvZGUgPT09IDQwNCkge1xuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnL2dpdC9jb25uZWN0Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzaG93RXJyb3IoJ0NvbnRlbnQgbm90IGZvdW5kOiAnICsgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2F2ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUsIGNvbW1pdE1lc3NhZ2UsIGNvbnRlbnQpIHtcbiAgICAgICAgcGFnZVNlcnZpY2Uuc2F2ZVBhZ2UocGFnZU5hbWUsIGNvbW1pdE1lc3NhZ2UsIGNvbnRlbnQpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHBhZ2VDb250ZW50KSB7XG4gICAgICAgICAgICAkc2NvcGUuY29udGVudCA9IHByZXBhcmVMaW5rcyhwYWdlQ29udGVudCwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgaGlkZUVkaXRvcigpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgc2hvd0Vycm9yKCdTYXZlIGN1cnJlbnQgcGFnZSBmYWlsZWQ6ICcgKyBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIHNhdmVDaGFuZ2VzKGV2ZW50LCBjb21taXRNZXNzYWdlLCBtYXJrZG93bikge1xuICAgICAgICAkbWREaWFsb2cuc2hvdyh7XG4gICAgICAgICAgY29udHJvbGxlcjogQ29tbWl0TWVzc2FnZURpYWxvZ0NvbnRyb2xsZXIsXG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICdjb21taXRNZXNzYWdlRGlhbG9nJyxcbiAgICAgICAgICBsb2NhbHM6IHtcbiAgICAgICAgICAgIGNvbW1pdE1lc3NhZ2U6IGNvbW1pdE1lc3NhZ2UgfHwgJ1NvbWUgY2hhbmdlcyBmb3IgJyArICRzY29wZS5wYWdlTmFtZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGFyZ2V0RXZlbnQ6IGV2ZW50XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgIGlmICghcmVzdWx0LmNhbmNlbCkge1xuICAgICAgICAgICAgc2F2ZVBhZ2UoJHNjb3BlLnBhZ2VOYW1lLCByZXN1bHQuY29tbWl0TWVzc2FnZSwgbWFya2Rvd24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgICRzY29wZS5uYXZpZ2F0ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbikge1xuICAgICAgICBpZiAoJHdpbmRvdy5oaXN0b3J5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdiYWNrJykge1xuICAgICAgICAgICR3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHdpbmRvdy5oaXN0b3J5LmZvcndhcmQoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLiRvbignY2FuY2VsRWRpdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBoaWRlRWRpdG9yKCk7XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLiRvbignc2F2ZUNoYW5nZXMnLCBmdW5jdGlvbihldmVudCwgYXJncyl7XG4gICAgICAgIHNhdmVDaGFuZ2VzKGFyZ3MuZXZlbnQsIGFyZ3MuY29tbWl0TWVzc2FnZSwgYXJncy5tYXJrZG93bik7XG4gICAgICB9KTtcblxuICAgICAgZ2V0UGFnZShwYWdlTmFtZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkcm91dGVQYXJhbXMuZWRpdCAmJiAkcm9vdFNjb3BlLmlzQXV0aGVudGljYXRlZCkge1xuICAgICAgICAgIGVkaXRQYWdlKHBhZ2VOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoaWRlRWRpdG9yKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbiAgZnVuY3Rpb24gQ29tbWl0TWVzc2FnZURpYWxvZ0NvbnRyb2xsZXIoJHNjb3BlLCAkbWREaWFsb2csIGNvbW1pdE1lc3NhZ2UpIHtcbiAgICAkc2NvcGUuY29tbWl0TWVzc2FnZSA9IGNvbW1pdE1lc3NhZ2U7XG5cbiAgICAkc2NvcGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgJG1kRGlhbG9nLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2xvc2VEaWFsb2cgPSBmdW5jdGlvbiAoY2FuY2VsKSB7XG4gICAgICAkbWREaWFsb2cuaGlkZSh7XG4gICAgICAgIGNhbmNlbDogY2FuY2VsLFxuICAgICAgICBjb21taXRNZXNzYWdlOiAkc2NvcGUuY29tbWl0TWVzc2FnZVxuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuXG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycywgYW5ndWxhciwgZG9jdW1lbnQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0VkaXRDb250ZW50Q3RybCcsIFsnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJGxvY2F0aW9uJywgJyR3aW5kb3cnLCAnJG1kRGlhbG9nJywgJyRtZFRvYXN0JywgJ1BhZ2VTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkbG9jYXRpb24sICR3aW5kb3csICRtZERpYWxvZywgJG1kVG9hc3QsIHBhZ2VTZXJ2aWNlKSB7XG4gICAgICB2YXIgbm9uRWRpdGFibGVQYXRocyA9IFsnL3NlYXJjaCcsICcvZ2l0L2Nvbm5lY3QnXTtcblxuICAgICAgJHNjb3BlLmlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmlzRWRpdG9yVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gZmFsc2U7XG4gICAgICAkc2NvcGUucG9wdXBJc1Zpc2libGUgPSBmYWxzZTtcblxuICAgICAgdmFyIGlzRWRpdFBhZ2VQb3NzaWJsZSA9IGZ1bmN0aW9uIChpc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsIHBhdGgpIHtcbiAgICAgICAgdmFyIGNhbkVkaXRQYWdlID0gaXNBdXRoZW50aWNhdGVkO1xuXG4gICAgICAgIGlmIChjYW5FZGl0UGFnZSkge1xuICAgICAgICAgIG5vbkVkaXRhYmxlUGF0aHMuZm9yRWFjaChmdW5jdGlvbiAobm9uRWRpdGFibGVQYXRoKSB7XG4gICAgICAgICAgICBpZiAobm9uRWRpdGFibGVQYXRoID09PSBwYXRoKSB7XG4gICAgICAgICAgICAgIGNhbkVkaXRQYWdlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbkVkaXRQYWdlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNob3dFcnJvciA9IGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgLmNvbnRlbnQoZXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gZml0JylcbiAgICAgICAgICAgIC5oaWRlRGVsYXkoMzAwMClcbiAgICAgICAgKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBjcmVhdGVQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lKSB7XG4gICAgICAgIHBhZ2VTZXJ2aWNlLnNhdmVQYWdlKHBhZ2VOYW1lLCAnY3JlYXRlIG5ldyBwYWdlICcgKyBwYWdlTmFtZSwgJyMnICsgcGFnZU5hbWUpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHBhZ2VDb250ZW50KSB7XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycgKyBwYWdlTmFtZSkuc2VhcmNoKCdlZGl0Jyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBzaG93RXJyb3IoJ0NyZWF0ZSBuZXcgcGFnZSBmYWlsZWQ6ICcgKyBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHZhciByZW1vdmVQYWdlRnJvbVBhZ2VzID0gZnVuY3Rpb24gKHBhZ2VzLCBwYWdlTmFtZSkge1xuICAgICAgICB2YXIgaW5kZXggPSAtMTtcblxuICAgICAgICBwYWdlcy5mb3JFYWNoKGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgICAgICAgaWYgKHBhZ2UubmFtZSA9PT0gcGFnZU5hbWUpIHtcbiAgICAgICAgICAgIGluZGV4ID0gcGFnZXMuaW5kZXhPZihwYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgcGFnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGRlbGV0ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgICAgcGFnZVNlcnZpY2UuZGVsZXRlUGFnZShwYWdlTmFtZSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZW1vdmVQYWdlRnJvbVBhZ2VzKCRyb290U2NvcGUucGFnZXMsIHBhZ2VOYW1lKTtcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvJyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBzaG93RXJyb3IoJ0RlbGV0ZSB0aGUgY3VycmVudCBwYWdlIGhhcyBiZWVuIGZhaWxlZDogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNob3dPckhpZGVQb3B1cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnBvcHVwSXNWaXNpYmxlID0gISRzY29wZS5wb3B1cElzVmlzaWJsZTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zaG93UG9wdXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5wb3B1cElzVmlzaWJsZSA9IHRydWU7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUucG9wdXBJc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jcmVhdGUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJHNjb3BlLmhpZGVQb3B1cCgpO1xuXG4gICAgICAgICRtZERpYWxvZy5zaG93KHtcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbWREaWFsb2cnLCBDcmVhdGVOZXdQYWdlQ29udHJvbGxlcl0sXG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICdjcmVhdGVOZXdQYWdlRGlhbG9nJyxcbiAgICAgICAgICB0YXJnZXRFdmVudDogZXZlbnQsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGRpYWxvZ1Jlc3VsdCkge1xuICAgICAgICAgIGlmICghZGlhbG9nUmVzdWx0LmNhbmNlbCkge1xuICAgICAgICAgICAgY3JlYXRlUGFnZShkaWFsb2dSZXN1bHQucGFnZU5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICRzY29wZS5oaWRlUG9wdXAoKTtcblxuICAgICAgICBpZiAoJHJvb3RTY29wZS5wYWdlTmFtZSA9PT0gJ2luZGV4Jykge1xuICAgICAgICAgIHZhciBhbGVydERpYWxvZyA9ICRtZERpYWxvZy5hbGVydCgpXG4gICAgICAgICAgICAgIC50aXRsZSgnRGVsZXRlIHN0YXJ0IHBhZ2U/JylcbiAgICAgICAgICAgICAgLmNvbnRlbnQoJ0l0XFwncyBub3QgYSBnb29kIGlkZWEgdG8gZGVsZXRlIHlvdXIgc3RhcnQgcGFnZSEnKVxuICAgICAgICAgICAgICAudGFyZ2V0RXZlbnQoZXZlbnQpXG4gICAgICAgICAgICAgIC5hcmlhTGFiZWwoJ0RlbGV0ZSBzdGFydCBwYWdlIGZvcmJpZGRlbicpXG4gICAgICAgICAgICAgIC5vaygnT2snKTtcblxuICAgICAgICAgICRtZERpYWxvZy5zaG93KGFsZXJ0RGlhbG9nKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nID0gJG1kRGlhbG9nLmNvbmZpcm0oKVxuICAgICAgICAgIC50aXRsZSgnRGVsZXRlIGN1cnJlbnQgcGFnZT8nKVxuICAgICAgICAgIC5jb250ZW50KCdBcmUgeW91IHN1cmUgdGhhdCB5b3Ugd2FudCB0byBkZWxldGUgdGhlIGN1cnJlbnQgcGFnZT8nKVxuICAgICAgICAgIC50YXJnZXRFdmVudChldmVudClcbiAgICAgICAgICAuYXJpYUxhYmVsKCdEZWxldGUgY3VycmVudCBwYWdlPycpXG4gICAgICAgICAgLm9rKCdPaycpXG4gICAgICAgICAgLmNhbmNlbCgnQ2FuY2VsJyk7XG5cbiAgICAgICAgJG1kRGlhbG9nLnNob3coY29uZmlybURpYWxvZylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbGV0ZVBhZ2UoJHJvb3RTY29wZS5wYWdlTmFtZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnBvcHVwSXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKCcvJyArICRyb290U2NvcGUucGFnZU5hbWUpLnNlYXJjaCgnZWRpdCcpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGlzQXV0aGVudGljYXRlZFVucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignaXNBdXRoZW50aWNhdGVkJywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgICRzY29wZS5pc0F1dGhlbnRpY2F0ZWQgPSBkYXRhLmlzQXV0aGVudGljYXRlZDtcbiAgICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gaXNFZGl0UGFnZVBvc3NpYmxlKCRzY29wZS5pc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsICRsb2NhdGlvbi5wYXRoKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBpc0VkaXRvclZpc2libGVVbnJlZ2lzdGVyID0gJHJvb3RTY29wZS4kb24oJ2lzRWRpdG9yVmlzaWJsZScsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgICAgICAkc2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gZGF0YS5pc0VkaXRvclZpc2libGU7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHJvdXRlQ2hhbmdlU3VjY2Vzc1VucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignJHJvdXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChlLCBjdXJyZW50LCBwcmUpIHtcbiAgICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gaXNFZGl0UGFnZVBvc3NpYmxlKCRzY29wZS5pc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsICRsb2NhdGlvbi5wYXRoKCkpO1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jYW5FZGl0UGFnZSA9IGlzRWRpdFBhZ2VQb3NzaWJsZSgkc2NvcGUuaXNBdXRoZW50aWNhdGVkLCBub25FZGl0YWJsZVBhdGhzLCAkbG9jYXRpb24ucGF0aCgpKTtcblxuICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlzQXV0aGVudGljYXRlZFVucmVnaXN0ZXIoKTtcbiAgICAgICAgaXNFZGl0b3JWaXNpYmxlVW5yZWdpc3RlcigpO1xuICAgICAgICByb3V0ZUNoYW5nZVN1Y2Nlc3NVbnJlZ2lzdGVyKCk7XG4gICAgICB9KTtcblxuICAgIH1cbiAgXSk7XG5cbiAgZnVuY3Rpb24gQ3JlYXRlTmV3UGFnZUNvbnRyb2xsZXIoJHNjb3BlLCAkbWREaWFsb2cpIHtcbiAgICAkc2NvcGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgJG1kRGlhbG9nLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2xvc2VEaWFsb2cgPSBmdW5jdGlvbiAoY2FuY2VsKSB7XG4gICAgICAkbWREaWFsb2cuaGlkZSh7XG4gICAgICAgIGNhbmNlbDogY2FuY2VsLFxuICAgICAgICBwYWdlTmFtZTogJHNjb3BlLnBhZ2VOYW1lXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSwgd2luZG93LmFuZ3VsYXIsIHdpbmRvdy5kb2N1bWVudCk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0dpdENvbm5lY3RDdHJsJywgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckbG9jYXRpb24nLCAnJG1kVG9hc3QnLCAnUGFnZVNlcnZpY2UnLCAnU2V0dGluZ3NTZXJ2aWNlJywgJ1NlcnZlckNvbmZpZ1NlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICRsb2NhdGlvbiwgJG1kVG9hc3QsIHBhZ2VTZXJ2aWNlLCBzZXR0aW5nc1NlcnZpY2UsIHNlcnZlckNvbmZpZ1NlcnZpY2UpIHtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHNldHRpbmdzU2VydmljZS5nZXQoKTtcbiAgICAgICRzY29wZS5wcm92aWRlciA9IHNldHRpbmdzLnByb3ZpZGVyIHx8ICdnaXRodWInO1xuICAgICAgJHNjb3BlLmdpdGh1YlVzZXIgPSBzZXR0aW5ncy5naXRodWJVc2VyIHx8ICdtZHdpa2knO1xuICAgICAgJHNjb3BlLnJlcG9zaXRvcnlOYW1lID0gc2V0dGluZ3MuZ2l0aHViUmVwb3NpdG9yeSB8fCAnd2lraSc7XG5cbiAgICAgICRzY29wZS5naXRodWJVc2VyUGxhY2VIb2xkZXJUZXh0ID0gJ0VudGVyIGhlcmUgeW91ciBHaXRIdWIgdXNlcm5hbWUnO1xuICAgICAgJHNjb3BlLnJlcG9zaXRvcnlOYW1lUGxhY2VIb2xkZXJUZXh0ID0gJ0VudGVyIGhlcmUgdGhlIG5hbWUgb2YgdGhlIHJlcG9zaXRvcnknO1xuXG4gICAgICAkc2NvcGUuaXNCdXN5ID0gZmFsc2U7XG4gICAgICAkc2NvcGUuaGFzRXJyb3IgPSBmYWxzZTtcblxuICAgICAgJHNjb3BlLmNvbm5lY3QgPSBmdW5jdGlvbiAoc3VjY2Vzc01lc3NhZ2UpIHtcbiAgICAgICAgJHNjb3BlLmlzQnVzeSA9IHRydWU7XG5cbiAgICAgICAgdmFyIHJlc3Bvc2l0b3J5VXJsID0gJHNjb3BlLmdpdGh1YlVzZXIgKyAnLycgKyAkc2NvcGUucmVwb3NpdG9yeU5hbWU7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICAgIHByb3ZpZGVyOiAkc2NvcGUucHJvdmlkZXIsXG4gICAgICAgICAgdXJsOiByZXNwb3NpdG9yeVVybCxcbiAgICAgICAgICBnaXRodWJSZXBvc2l0b3J5OiAkc2NvcGUucmVwb3NpdG9yeU5hbWUsXG4gICAgICAgICAgZ2l0aHViVXNlcjogJHNjb3BlLmdpdGh1YlVzZXJcbiAgICAgICAgfTtcblxuICAgICAgICBwYWdlU2VydmljZS5nZXRQYWdlcyhzZXR0aW5ncylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGFnZXMpIHtcbiAgICAgICAgICAgIHZhciBzdGFydFBhZ2UgPSBwYWdlU2VydmljZS5maW5kU3RhcnRQYWdlKHBhZ2VzKTtcbiAgICAgICAgICAgIGlmIChzdGFydFBhZ2UgIT09IHVuZGVmaW5lZCAmJiBzdGFydFBhZ2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBzZXR0aW5ncy5zdGFydFBhZ2UgPSBzdGFydFBhZ2U7XG4gICAgICAgICAgICAgIHNldHRpbmdzU2VydmljZS5wdXQoc2V0dGluZ3MpO1xuXG4gICAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICAgJG1kVG9hc3Quc2ltcGxlKClcbiAgICAgICAgICAgICAgICAgIC5jb250ZW50KCdDb25uZWN0ZWQgdG8gZ2l0aHViIGFzIHVzZXIgJyArICRzY29wZS5naXRodWJVc2VyKVxuICAgICAgICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gbGVmdCcpXG4gICAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDUwMDApXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy8nKTtcbiAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdPbkdpdENvbm5lY3RlZCcsIHsgc2V0dGluZ3M6IHNldHRpbmdzfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgICAuY29udGVudCgnTm8gc3RhcnRwYWdlIHdhcyBmb3VuZCEnKVxuICAgICAgICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gbGVmdCcpXG4gICAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDUwMDApXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgICAgIC5jb250ZW50KCdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBjb25uZWN0aW9uIHRvIHRoZSBnaXQtcmVwb3NpdG9yeTogJyArIGVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gbGVmdCcpXG4gICAgICAgICAgICAgICAgLmhpZGVEZWxheSg1MDAwKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pc0J1c3kgPSBmYWxzZTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICB9XG4gIF0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignUGFnZXNDdHJsJywgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICdQYWdlU2VydmljZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsIHBhZ2VTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnBhZ2VzID0gW107XG4gICAgJHJvb3RTY29wZS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblxuICAgIHZhciB1cGRhdGVQYWdlcyA9IGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgJHNjb3BlLnBhZ2VzID0gcGFnZXMgfHwgW107XG4gICAgICAkcm9vdFNjb3BlLnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuICAgIH07XG5cbiAgICBwYWdlU2VydmljZS5nZXRQYWdlcygpXG4gICAgICAudGhlbihmdW5jdGlvbiAocGFnZXMpIHtcbiAgICAgICAgdXBkYXRlUGFnZXMocGFnZXMpO1xuICAgICAgICBwYWdlU2VydmljZS5yZWdpc3Rlck9ic2VydmVyKHVwZGF0ZVBhZ2VzKTtcbiAgICAgIH0pO1xuXG4gICAgJHNjb3BlLmV4Y2x1ZGVEZWZhdWx0UGFnZSA9IGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgICB2YXIgZXhjbHVkZXMgPSBbJ2luZGV4JywgJ2hvbWUnLCAncmVhZG1lJ107XG4gICAgICB2YXIgZXhjbHVkZVBhZ2UgPSBmYWxzZTtcblxuICAgICAgYW5ndWxhci5mb3JFYWNoKGV4Y2x1ZGVzLCBmdW5jdGlvbiAoZXhjbHVkZSkge1xuICAgICAgICBpZiAocGFnZS5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGV4Y2x1ZGUpIHtcbiAgICAgICAgICBleGNsdWRlUGFnZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gIWV4Y2x1ZGVQYWdlO1xuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ1NlYXJjaEN0cmwnLCBbJyRzY29wZScsICckbG9jYXRpb24nLCAnJHJvdXRlJywgJ1NlYXJjaFNlcnZpY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZSwgc2VhcmNoU2VydmljZSkge1xuICAgICRzY29wZS50ZXh0VG9TZWFyY2ggPSAnJztcbiAgICAkc2NvcGUuc2VhcmNoUmVzdWx0ID0gc2VhcmNoU2VydmljZS5zZWFyY2hSZXN1bHQ7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSAnJztcblxuICAgICRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWFyY2hTZXJ2aWNlLnNlYXJjaCgkc2NvcGUudGV4dFRvU2VhcmNoKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gJ1NlYXJjaCBzdWNjZXNzZnVsbHkgZmluaXNoZWQnO1xuICAgICAgICAgIHNlYXJjaFNlcnZpY2Uuc2VhcmNoUmVzdWx0ID0gZGF0YTtcblxuICAgICAgICAgIHZhciBuZXdMb2NhdGlvbiA9ICcvc2VhcmNoJztcbiAgICAgICAgICBpZiAoJGxvY2F0aW9uLnBhdGgoKSA9PT0gbmV3TG9jYXRpb24pIHtcbiAgICAgICAgICAgICRyb3V0ZS5yZWxvYWQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgobmV3TG9jYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgdmFyIHNlYXJjaGVkVGV4dCA9IGVycm9yIHx8ICcnO1xuICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIHNlYXJjaGluZyBmb3IgdGhlIHRleHQ6ICcgKyBzZWFyY2hlZFRleHQudG9TdHJpbmcoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignU2lkZWJhckN0cmwnLCBbJyRtZFNpZGVuYXYnLCBzaWRlYmFyQ3RybF0pO1xuXG4gIGZ1bmN0aW9uIHNpZGViYXJDdHJsKCRtZFNpZGVuYXYpIHtcbiAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgIHRoaXMudG9nZ2xlTGlzdCA9IHRvZ2dsZUxpc3Q7XG4gICAgdGhpcy5pc05vdExvY2tlZE9wZW4gPSBpc05vdExvY2tlZE9wZW47XG5cbiAgICBmdW5jdGlvbiB0b2dnbGVMaXN0KGlkKSB7XG4gICAgICAkbWRTaWRlbmF2KGlkKS50b2dnbGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc05vdExvY2tlZE9wZW4oaWQpIHtcbiAgICAgIHJldHVybiAhJG1kU2lkZW5hdihpZCkuaXNMb2NrZWRPcGVuKCk7XG4gICAgfVxuICB9XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpOyJdfQ==