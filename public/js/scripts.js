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
          previewRender: false,
          toolbar: [
            'bold',
            'italic',
            'strikethrough',
            'heading',
            '|',
            'horizontal-rule',
            'quote',
            'unordered-list',
            'ordered-list',
            '|',
            'link',
            'image',
            'code',
            '|',
            'preview',
            'guide'
          ]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImRpcmVjdGl2ZXMuanMiLCJkaXJlY3RpdmVzL21kLWVkaXRvci9tZC1lZGl0b3IuanMiLCJzZXJ2aWNlcy9hcGl1cmxidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL2F1dGhzZXJ2aWNlLmpzIiwic2VydmljZXMvZWRpdG9yc2VydmljZS5qcyIsInNlcnZpY2VzL2h0dHBoZWFkZXJidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL3BhZ2VzZXJ2aWNlLmpzIiwic2VydmljZXMvc2VhcmNoc2VydmljZS5qcyIsInNlcnZpY2VzL3NlcnZlcmNvbmZpZ3NlcnZpY2UuanMiLCJzZXJ2aWNlcy9zZXR0aW5nc3NlcnZpY2UuanMiLCJjb250cm9sbGVycy9hdXRoY3RybC5qcyIsImNvbnRyb2xsZXJzL2NvbW1pdG1lc3NhZ2VkaWFsb2djdHJsLmpzIiwiY29udHJvbGxlcnMvY29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9lZGl0Y29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9naXRjb25uZWN0Y3RybC5qcyIsImNvbnRyb2xsZXJzL3BhZ2VzY3RybC5qcyIsImNvbnRyb2xsZXJzL3NlYXJjaGN0cmwuanMiLCJjb250cm9sbGVycy9zaWRlYmFyY3RybC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDckIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDZjtBQUNBLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3pDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDZCxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ2pCLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDaEIsSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNqQixJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2Qs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QUFDdkMsVUFBVSxRQUFRLENBQUMsQ0FBQyxRQUFRO0FBQzVCLFFBQVEsQ0FBQztBQUNULE1BQU0sRUFBRTtBQUNSLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNoRSxRQUFRLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO0FBQ3RDLE1BQU0sRUFBRTtBQUNSLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUMvRCxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUc7QUFDaEMsUUFBUSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFDMUcsUUFBUSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDNUIsUUFBUSxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUMvQixNQUFNLEdBQUc7QUFDVDtBQUNBLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7QUFDOUIsSUFBSSxFQUFFO0FBQ047QUFDQSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDMUMsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUc7QUFDaEM7QUFDQSxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ2IsUUFBUSxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUN6QixRQUFRLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQzFELE1BQU0sRUFBRTtBQUNSLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNoRSxRQUFRLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFO0FBQ3RDLE1BQU0sRUFBRTtBQUNSLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUMvRCxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUc7QUFDaEMsUUFBUSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFDMUcsUUFBUSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDNUIsUUFBUSxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUMvQixNQUFNLEdBQUc7QUFDVDtBQUNBLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7QUFDOUIsSUFBSSxFQUFFO0FBQ047QUFDQSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDeEMsTUFBTSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUc7QUFDaEM7QUFDQSxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ2IsUUFBUSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtBQUN0QixRQUFRLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUU7QUFDMUQsUUFBUSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN2RCxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDekQsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUc7QUFDL0I7QUFDQSxRQUFRLGVBQWUsQ0FBQyxLQUFLLEVBQUU7QUFDL0IsUUFBUSxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtBQUNoQyxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0QsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHO0FBQ2hDLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzVCLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQzFHLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDL0IsTUFBTSxHQUFHO0FBQ1Q7QUFDQSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0FBQzlCLElBQUksRUFBRTtBQUNOO0FBQ0EsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHO0FBQ3BEO0FBQ0EsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDckQsUUFBUSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRztBQUN4RCxRQUFRLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlELFVBQVUsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUMzQixRQUFRLENBQUM7QUFDVCxNQUFNLENB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QyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO0FBQzFFLE1BQU0sRUFBRTtBQUNSO0FBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNuQyxRQUFRLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDNUIsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0IsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUMvQixVQUFVLEdBQUc7QUFDYixNQUFNLEVBQUU7QUFDUjtBQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDcEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUU7QUFDL0MsTUFBTSxFQUFFO0FBQ1I7QUFDQSxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzNELFFBQVEsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztBQUN2RCxRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDO0FBQzVELFFBQVEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRztBQUNsRyxNQUFNLEdB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RSxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQzFCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHO0FBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDN0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNyQztBQUNBLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEdBQUcsR0FBRztBQUMzQyxNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFO0FBQ3BELE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUM7QUFDcEQ7QUFDQSxNQUFNLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDcEQsUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUk7QUFDaEQ7QUFDQSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FB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QUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzlCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQ2pDLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0FBQzNDO0FBQ0EsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0IsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxHQUFHO0FBQzlCLElBQUksQ0FBQztBQUNMO0FBQ0EsSUFBSSxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbEMsTUFBTSxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLFlBQVksR0FBRztBQUM1QyxJQUFJLENBQUM7QUFDTCxFQUFFLENBQUM7QUFDSCxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFdBQVciLCJmaWxlIjoic2NyaXB0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoYW5ndWxhcikge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1kd2lraSA9IGFuZ3VsYXIubW9kdWxlKCdtZHdpa2knLCBbXG4gICAgJ25nUm91dGUnLFxuICAgICduZ1Nhbml0aXplJyxcbiAgICAnbmdBbmltYXRlJyxcbiAgICAnbmdNYXRlcmlhbCcsXG4gICAgJ25nVG91Y2gnLFxuICAgICdqbWRvYnJ5LmFuZ3VsYXItY2FjaGUnLFxuICAgICdtZHdpa2kuY29udHJvbGxlcnMnLFxuICAgICdtZHdpa2kuc2VydmljZXMnLFxuICAgICdtZHdpa2kuZGlyZWN0aXZlcycsXG4gICAgJ21kd2lraS5maWx0ZXJzJyxcbiAgXSkuY29uZmlnKFsnJHJvdXRlUHJvdmlkZXInLCAnJGxvY2F0aW9uUHJvdmlkZXInLCAnJG1kVGhlbWluZ1Byb3ZpZGVyJywgJyRtZEljb25Qcm92aWRlcicsXG4gICAgZnVuY3Rpb24gKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJG1kVGhlbWluZ1Byb3ZpZGVyLCAkbWRJY29uUHJvdmlkZXIpIHtcbiAgICAgICRyb3V0ZVByb3ZpZGVyXG4gICAgICAgIC53aGVuKCcvZ2l0L2Nvbm5lY3QnLCB7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICcuL3ZpZXdzL2dpdGNvbm5lY3QuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ0dpdENvbm5lY3RDdHJsJ1xuICAgICAgICB9KVxuICAgICAgICAud2hlbignLycsIHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJy4vdmlld3MvY29udGVudC5odG1sJyxcbiAgICAgICAgICBjb250cm9sbGVyOiAnQ29udGVudEN0cmwnXG4gICAgICAgIH0pXG4gICAgICAgIC53aGVuKCcvc2VhcmNoJywge1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnLi92aWV3cy9zZWFyY2hSZXN1bHQuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaEN0cmwnXG4gICAgICAgIH0pXG4gICAgICAgIC53aGVuKCcvOnBhZ2UnLCB7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICcuL3ZpZXdzL2NvbnRlbnQuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ0NvbnRlbnRDdHJsJ1xuICAgICAgICB9KS5vdGhlcndpc2Uoe1xuICAgICAgICAgIHJlZGlyZWN0VG86ICcvaW5kZXgnXG4gICAgICAgIH0pO1xuXG4gICAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cbiAgICAgICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAucHJpbWFyeVBhbGV0dGUoJ2JsdWUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFjY2VudFBhbGV0dGUoJ3JlZCcpO1xuICAgIH1cbiAgXSk7XG5cbiAgYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycsIFtdKTtcbiAgYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycsIFtdKTtcbiAgYW5ndWxhci5tb2R1bGUoJ21kd2lraS5kaXJlY3RpdmVzJywgW10pO1xuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmZpbHRlcnMnLCBbXSk7XG59KShhbmd1bGFyKTtcblxuIiwiKGZ1bmN0aW9uIChkaXJlY3RpdmVzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgna2V5YmluZGluZycsIFsnJGRvY3VtZW50JywgJyRwYXJzZScsICckd2luZG93JywgZnVuY3Rpb24gKCRkb2N1bWVudCwgJHBhcnNlLCAkd2luZG93KSB7XG4gICAgdmFyIGlzTWFjID0gL01hY3xpUG9kfGlQaG9uZXxpUGFkLy50ZXN0KCR3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtKTtcblxuICAgIGZ1bmN0aW9uIGlzTW9kaWZpZXIobW9kaWZpZXIsIGV2ZW50LCBpc01hYykge1xuICAgICAgdmFyIGlzU2hpZnQgPSBldmVudC5zaGlmdEtleTtcbiAgICAgIHZhciBpc0FsdCA9IGV2ZW50LmFsdEtleTtcbiAgICAgIHZhciBpc0N0cmwgPSBpc01hYyA/IGV2ZW50Lm1ldGFLZXkgOiBldmVudC5jdHJsS2V5O1xuXG4gICAgICBpZiAobW9kaWZpZXIpIHtcbiAgICAgICAgc3dpdGNoIChtb2RpZmllcikge1xuICAgICAgICAgIGNhc2UgJ2N0cmwrc2hpZnQnOlxuICAgICAgICAgIGNhc2UgJ3NoaWZ0K2N0cmwnOlxuICAgICAgICAgICAgcmV0dXJuIGlzU2hpZnQgJiYgaXNDdHJsO1xuICAgICAgICAgIGNhc2UgJ2FsdCtzaGlmdCc6XG4gICAgICAgICAgY2FzZSAnc2hpZnQrYWx0JzpcbiAgICAgICAgICAgIHJldHVybiBpc1NoaWZ0ICYmIGlzQWx0O1xuICAgICAgICAgIGNhc2UgJ2N0cmwrYWx0JzpcbiAgICAgICAgICBjYXNlICdjbWQrYWx0JzpcbiAgICAgICAgICAgIHJldHVybiBpc0FsdCAmJiBpc0N0cmw7XG4gICAgICAgICAgY2FzZSAnY21kK2N0cmwnOlxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50Lm1ldGFLZXkgJiYgZXZlbnQuQ3RybEtleTtcbiAgICAgICAgICBjYXNlICdzaGlmdCc6XG4gICAgICAgICAgICByZXR1cm4gaXNTaGlmdDtcbiAgICAgICAgICBjYXNlICdjdHJsJzpcbiAgICAgICAgICBjYXNlICdjbWQnOlxuICAgICAgICAgICAgcmV0dXJuIGlzQ3RybDtcbiAgICAgICAgICBjYXNlICdhbHQnOlxuICAgICAgICAgICAgcmV0dXJuIGlzQWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmVyaWZ5S2V5Q29kZShldmVudCwgbW9kaWZpZXIsIGtleSkge1xuICAgICAgaWYgKFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQua2V5Q29kZSkgPT09IGtleSkge1xuICAgICAgICBpZiAobW9kaWZpZXIpIHtcbiAgICAgICAgICByZXR1cm4gaXNNb2RpZmllcihtb2RpZmllciwgZXZlbnQsIGlzTWFjKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2ZXJpZnlDb25kaXRpb24oJGV2YWwsIGNvbmRpdGlvbikge1xuICAgICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgICByZXR1cm4gJGV2YWwoY29uZGl0aW9uKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgbW9kaWZpZXI6ICdAbW9kaWZpZXInLFxuICAgICAgICBrZXk6ICdAa2V5JyxcbiAgICAgICAgY29uZGl0aW9uOiAnJicsXG4gICAgICAgIGludm9rZTogJyYnXG4gICAgICB9LFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCAkZWxlbWVudCwgYXR0cikge1xuICAgICAgICAkZG9jdW1lbnQuYmluZCgna2V5ZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmICh2ZXJpZnlLZXlDb2RlKGV2ZW50LCBzY29wZS5tb2RpZmllciwgc2NvcGUua2V5KSAmJlxuICAgICAgICAgICAgICB2ZXJpZnlDb25kaXRpb24oc2NvcGUuJGV2YWwsIHNjb3BlLmNvbmRpdGlvbikpIHtcbiAgICAgICAgICAgIHNjb3BlLiRhcHBseShzY29wZS5pbnZva2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfV0pO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdhdXRvRm9jdXMnLCBbJyR0aW1lb3V0JyxcbiAgICBmdW5jdGlvbiAoJHRpbWVvdXQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQUMnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBlbGVtZW50WzBdLmZvY3VzKCk7XG4gICAgICAgICAgfSwgNSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgnb25FbnRlcicsIFtcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcbiAgICAgICAgICBlbGVtZW50LmJpbmQoJ2tleWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHIub25FbnRlcik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbiAgZGlyZWN0aXZlcy5kaXJlY3RpdmUoJ29uTW91c2VlbnRlcicsIFtcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcbiAgICAgICAgICBlbGVtZW50Lm1vdXNlZW50ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGV2YWwoYXR0ci5vbk1vdXNlZW50ZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgnb25Nb3VzZW91dCcsIFsnJHRpbWVvdXQnLFxuICAgIGZ1bmN0aW9uICgkdGltZW91dCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG4gICAgICAgICAgZWxlbWVudC5tb3VzZWxlYXZlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kZXZhbChhdHRyLm9uTW91c2VvdXQpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdhdXRvU2VsZWN0JywgWyckdGltZW91dCcsIGZ1bmN0aW9uICgkdGltZW91dCkge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0FDJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xuICAgICAgICBlbGVtZW50LmJpbmQoJ2ZvY3VzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVsZW1lbnRbMF0uc2VsZWN0KCk7XG4gICAgICAgICAgfSwgMTApO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmRpcmVjdGl2ZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoYW5ndWxhciwgU2ltcGxlTURFLCBDb2RlTWlycm9yKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmRpcmVjdGl2ZXMnKVxuICAgIC5kaXJlY3RpdmUoJ21kRWRpdG9yJywgbWRFZGl0b3IpO1xuXG4gIG1kRWRpdG9yLiRpbmplY3QgPSBbJyR0aW1lb3V0J107XG5cbiAgZnVuY3Rpb24gbWRFZGl0b3IgKCR0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1hcmtkb3duOiAnPSdcbiAgICAgIH0sXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvZGlyZWN0aXZlcy9tZC1lZGl0b3IvbWQtZWRpdG9yLnRwbC5odG1sJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcykge1xuICAgICAgICB2YXIgdGV4dEFyZWEgPSBlbGVtZW50LmZpbmQoJ3RleHRhcmVhJylbMF07XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgIGVsZW1lbnQ6IHRleHRBcmVhLFxuICAgICAgICAgIHNwZWxsQ2hlY2tlcjogZmFsc2UsXG4gICAgICAgICAgc3RhdHVzOiBmYWxzZSxcbiAgICAgICAgICBwcmV2aWV3UmVuZGVyOiBmYWxzZSxcbiAgICAgICAgICB0b29sYmFyOiBbXG4gICAgICAgICAgICAnYm9sZCcsXG4gICAgICAgICAgICAnaXRhbGljJyxcbiAgICAgICAgICAgICdzdHJpa2V0aHJvdWdoJyxcbiAgICAgICAgICAgICdoZWFkaW5nJyxcbiAgICAgICAgICAgICd8JyxcbiAgICAgICAgICAgICdob3Jpem9udGFsLXJ1bGUnLFxuICAgICAgICAgICAgJ3F1b3RlJyxcbiAgICAgICAgICAgICd1bm9yZGVyZWQtbGlzdCcsXG4gICAgICAgICAgICAnb3JkZXJlZC1saXN0JyxcbiAgICAgICAgICAgICd8JyxcbiAgICAgICAgICAgICdsaW5rJyxcbiAgICAgICAgICAgICdpbWFnZScsXG4gICAgICAgICAgICAnY29kZScsXG4gICAgICAgICAgICAnfCcsXG4gICAgICAgICAgICAncHJldmlldycsXG4gICAgICAgICAgICAnZ3VpZGUnXG4gICAgICAgICAgXVxuICAgICAgICB9O1xuICAgICAgICB2YXIgc2ltcGxlTURFID0gbmV3IFNpbXBsZU1ERShvcHRpb25zKTtcbiAgICAgICAgQ29kZU1pcnJvci5jb21tYW5kcy5zYXZlID0gc2F2ZUNoYW5nZXM7XG5cbiAgICAgICAgc2NvcGUuY2FuY2VsRWRpdCA9IGNhbmNlbEVkaXQ7XG4gICAgICAgIHNjb3BlLnNhdmVDaGFuZ2VzID0gc2F2ZUNoYW5nZXM7XG5cbiAgICAgICAgZnVuY3Rpb24gY2FuY2VsRWRpdCgpIHtcbiAgICAgICAgICBzY29wZS4kZW1pdCgnY2FuY2VsRWRpdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2F2ZUNoYW5nZXMoJGV2ZW50KSB7XG4gICAgICAgICAgc2NvcGUubWFya2Rvd24gPSBzaW1wbGVNREUudmFsdWUoKTtcblxuICAgICAgICAgIHZhciBhcmdzID0ge1xuICAgICAgICAgICAgY29tbWl0TWVzc2FnZTogc2ltcGxlTURFLmNvZGVtaXJyb3IuZ2V0U2VsZWN0aW9uKCksXG4gICAgICAgICAgICBtYXJrZG93bjogc2NvcGUubWFya2Rvd24sXG4gICAgICAgICAgICBldmVudDogJGV2ZW50XG4gICAgICAgICAgfTtcbiAgICAgICAgICBzY29wZS4kZW1pdCgnc2F2ZUNoYW5nZXMnLCBhcmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnbWFya2Rvd24nLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgIHNpbXBsZU1ERS52YWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59KSh3aW5kb3cuYW5ndWxhciwgd2luZG93LlNpbXBsZU1ERSwgd2luZG93LkNvZGVNaXJyb3IpO1xuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnQXBpVXJsQnVpbGRlclNlcnZpY2UnLCBbICdTZXR0aW5nc1NlcnZpY2UnLCBmdW5jdGlvbiAoc2V0dGluZ3NTZXJ2aWNlKSB7XG4gICAgdmFyIGJ1aWxkID0gZnVuY3Rpb24gKHVybEJlZm9yZSwgdXJsQWZ0ZXIsIHNldHRpbmdzKSB7XG4gICAgICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHNldHRpbmdzU2VydmljZS5nZXQoKTtcblxuICAgICAgaWYgKHNldHRpbmdzLnByb3ZpZGVyID09PSAnZ2l0aHViJykge1xuICAgICAgICByZXR1cm4gdXJsQmVmb3JlICsgc2V0dGluZ3MuZ2l0aHViVXNlciArICcvJyArIHNldHRpbmdzLmdpdGh1YlJlcG9zaXRvcnkgKyAnLycgKyB1cmxBZnRlcjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHVybEJlZm9yZSArIHVybEFmdGVyO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgYnVpbGQ6IGJ1aWxkXG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnQXV0aFNlcnZpY2UnLCBbJyRodHRwJywgJyRxJywgZnVuY3Rpb24gKCRodHRwLCAkcSkge1xuICAgIHZhciBnZXRBdXRoZW50aWNhdGVkVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgdXJsOiAnL2F1dGgvdXNlcicsXG4gICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfSxcbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoYXV0aCwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShhdXRoLnVzZXIpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGRhdGEpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgbG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICB1cmw6ICcvYXV0aC91c2VyJyxcbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShkYXRhKTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxvZ291dDogbG9nb3V0LFxuICAgICAgZ2V0QXV0aGVudGljYXRlZFVzZXI6IGdldEF1dGhlbnRpY2F0ZWRVc2VyXG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnRWRpdG9yU2VydmljZScsIFsnJHJvb3RTY29wZScsICckcScsXG4gICAgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHEpIHtcbiAgICAgIHZhciBnZXRTZWxlY3RlZFRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgnJyk7XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBnZXRTZWxlY3RlZFRleHQ6IGdldFNlbGVjdGVkVGV4dFxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ0h0dHBIZWFkZXJCdWlsZGVyU2VydmljZScsIFsgJ1NldHRpbmdzU2VydmljZScsIGZ1bmN0aW9uIChzZXR0aW5nc1NlcnZpY2UpIHtcbiAgICB2YXIgYnVpbGQgPSBmdW5jdGlvbiAoY29udGVudFR5cGUsIHNldHRpbmdzKSB7XG4gICAgICBjb250ZW50VHlwZSA9IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwgc2V0dGluZ3NTZXJ2aWNlLmdldCgpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnWC1NRFdpa2ktUHJvdmlkZXInOiBzZXR0aW5ncy5wcm92aWRlcixcbiAgICAgICAgJ1gtTURXaWtpLVVybCc6IHNldHRpbmdzLnVybFxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1aWxkOiBidWlsZFxuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ1BhZ2VTZXJ2aWNlJywgWyckaHR0cCcsICckcScsICdBcGlVcmxCdWlsZGVyU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgJHEsIHVybEJ1aWxkZXIpIHtcbiAgICB2YXIgdXBkYXRlUGFnZXNPYnNlcnZlcnMgPSBbXTtcblxuICAgIHZhciBnZXRQYWdlID0gZnVuY3Rpb24gKHBhZ2UsIGZvcm1hdCkge1xuICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICdodG1sJztcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCksXG4gICAgICAgICAgcmVxdWVzdFVybCA9IHVybEJ1aWxkZXIuYnVpbGQoJy9hcGkvJywgJ3BhZ2UvJyArIHBhZ2UpO1xuXG4gICAgICBpZiAoZm9ybWF0ID09PSAnbWFya2Rvd24nKVxuICAgICAge1xuICAgICAgICByZXF1ZXN0VXJsICs9ICc/Zm9ybWF0PW1hcmtkb3duJztcbiAgICAgIH1cblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6IHJlcXVlc3RVcmxcbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAocGFnZUNvbnRlbnQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocGFnZUNvbnRlbnQpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZXJyb3JNZXNzYWdlLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IHN0YXR1cyA9PT0gNDA0ID8gJ0NvbnRlbnQgbm90IGZvdW5kJyA6ICdVbmV4cGVjdGVkIHNlcnZlciBlcnJvcjogJyArIGVycm9yTWVzc2FnZTtcbiAgICAgICAgZXJyb3IuY29kZSA9IHN0YXR1cztcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIHNhdmVQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lLCBjb21taXRNZXNzYWdlLCBtYXJrZG93bikge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICB1cmw6IHVybEJ1aWxkZXIuYnVpbGQoJy9hcGkvJywgJ3BhZ2UvJyArIHBhZ2VOYW1lKSxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBjb21taXRNZXNzYWdlOiBjb21taXRNZXNzYWdlLFxuICAgICAgICAgIG1hcmtkb3duOiBtYXJrZG93blxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKHBhZ2VDb250ZW50LCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHBhZ2VDb250ZW50KTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGVycm9yTWVzc2FnZSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSBzdGF0dXMgPT09IDQwNCA/ICdDb250ZW50IG5vdCBmb3VuZCcgOiAnVW5leHBlY3RlZCBzZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvck1lc3NhZ2U7XG4gICAgICAgIGVycm9yLmNvZGUgPSBzdGF0dXM7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBkZWxldGVQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgIHVybDogdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAncGFnZS8nICsgcGFnZU5hbWUpXG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKHBhZ2VDb250ZW50LCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHBhZ2VDb250ZW50KTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGVycm9yTWVzc2FnZSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSBzdGF0dXMgPT09IDQwNCA/ICdDb250ZW50IG5vdCBmb3VuZCcgOiAnVW5leHBlY3RlZCBzZXJ2ZXIgZXJyb3I6ICcgKyBlcnJvck1lc3NhZ2U7XG4gICAgICAgIGVycm9yLmNvZGUgPSBzdGF0dXM7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBnZXRQYWdlcyA9IGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6IHVybEJ1aWxkZXIuYnVpbGQoJy9hcGkvJywgJ3BhZ2VzJywgc2V0dGluZ3MpLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgcGFnZXMgPSBkYXRhIHx8IFtdO1xuXG4gICAgICAgIG5vdGlmeU9ic2VydmVycyhwYWdlcyk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocGFnZXMpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZXJyb3JNZXNzYWdlLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgZXJyb3IuY29kZSA9IHN0YXR1cztcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IHN0YXR1cyA9PT0gNDA0ID8gJ0NvbnRlbnQgbm90IGZvdW5kJyA6ICdVbmV4cGVjdGVkIHNlcnZlciBlcnJvcjogJyArIGVycm9yTWVzc2FnZTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGZpbmRTdGFydFBhZ2UgPSBmdW5jdGlvbiAocGFnZXMpIHtcbiAgICAgIHZhciBwYWdlc1RvRmluZCA9IFsnaW5kZXgnLCAnaG9tZScsICdyZWFkbWUnXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlc1RvRmluZC5sZW5ndGggOyBpKyspIHtcbiAgICAgICAgdmFyIHN0YXJ0UGFnZSA9IGZpbmRQYWdlKHBhZ2VzLCBwYWdlc1RvRmluZFtpXSk7XG4gICAgICAgIGlmIChzdGFydFBhZ2UgIT09IHVuZGVmaW5lZCAmJiBzdGFydFBhZ2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBzdGFydFBhZ2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAnJztcbiAgICB9O1xuXG4gICAgdmFyIGZpbmRQYWdlID0gZnVuY3Rpb24gKHBhZ2VzLCBwYWdlTmFtZSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGFnZU5hbWUgPT09IHBhZ2VzW2ldLm5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgIHJldHVybiBwYWdlc1tpXS5uYW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gJyc7XG4gICAgfTtcblxuICAgIHZhciByZWdpc3Rlck9ic2VydmVyID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICB1cGRhdGVQYWdlc09ic2VydmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgdmFyIG5vdGlmeU9ic2VydmVycyA9IGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgYW5ndWxhci5mb3JFYWNoKHVwZGF0ZVBhZ2VzT2JzZXJ2ZXJzLCBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2socGFnZXMpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBmaW5kU3RhcnRQYWdlOiBmaW5kU3RhcnRQYWdlLFxuICAgICAgZ2V0UGFnZTogZ2V0UGFnZSxcbiAgICAgIHNhdmVQYWdlOiBzYXZlUGFnZSxcbiAgICAgIGRlbGV0ZVBhZ2U6IGRlbGV0ZVBhZ2UsXG4gICAgICBnZXRQYWdlczogZ2V0UGFnZXMsXG4gICAgICByZWdpc3Rlck9ic2VydmVyOiByZWdpc3Rlck9ic2VydmVyXG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnU2VhcmNoU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCAnQXBpVXJsQnVpbGRlclNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsICRxLCB1cmxCdWlsZGVyKSB7XG4gICAgdmFyIHNlYXJjaFNlcnZpY2VJbnN0YW5jZSA9IHt9O1xuICAgIHNlYXJjaFNlcnZpY2VJbnN0YW5jZS5zZWFyY2hSZXN1bHQgPSAnJztcblxuICAgIHZhciBzZWFyY2ggPSBmdW5jdGlvbiAodGV4dFRvU2VhcmNoKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB1cmw6IHVybEJ1aWxkZXIuYnVpbGQoJy9hcGkvJywgJ3NlYXJjaCcpLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgZGF0YTogeyB0ZXh0VG9TZWFyY2g6IHRleHRUb1NlYXJjaCB9XG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKHNlYXJjaFJlc3VsdCwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShzZWFyY2hSZXN1bHQpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoc2VhcmNoZWRUZXh0LCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3Qoc2VhcmNoZWRUZXh0KTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNlYXJjaDogc2VhcmNoLFxuICAgICAgc2VhcmNoU2VydmljZUluc3RhbmNlOiBzZWFyY2hTZXJ2aWNlSW5zdGFuY2VcbiAgICB9O1xuXG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoc2VydmljZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHNlcnZpY2VzLmZhY3RvcnkoJ1NlcnZlckNvbmZpZ1NlcnZpY2UnLCBbJyRodHRwJywgJyRxJywgZnVuY3Rpb24gKCRodHRwLCAkcSkge1xuICAgIHZhciBnZXRDb25maWcgPSBmdW5jdGlvbiAocGFnZSkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6ICcvYXBpL3NlcnZlcmNvbmZpZycsXG4gICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfSxcbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShkYXRhKTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gc3RhdHVzID09PSA0MDQgPyAnQ29udGVudCBub3QgZm91bmQnIDogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yJztcbiAgICAgICAgZXJyb3IuY29kZSA9IHN0YXR1cztcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGdldENvbmZpZzogZ2V0Q29uZmlnXG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnU2V0dGluZ3NTZXJ2aWNlJywgWyckYW5ndWxhckNhY2hlRmFjdG9yeScsIGZ1bmN0aW9uICgkYW5ndWxhckNhY2hlRmFjdG9yeSkge1xuICAgIHZhciBjYWNoZSA9ICRhbmd1bGFyQ2FjaGVGYWN0b3J5KCdtZHdpa2knLCB7IHN0b3JhZ2VNb2RlOiAnbG9jYWxTdG9yYWdlJyB9KTtcblxuICAgIHZhciBnZXREZWZhdWx0U2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwcm92aWRlcjogJ2dpdGh1YicsXG4gICAgICAgIGdpdGh1YlVzZXI6ICdtZHdpa2knLFxuICAgICAgICBnaXRodWJSZXBvc2l0b3J5OiAnd2lraScsXG4gICAgICAgIHVybDogJ21kd2lraS93aWtpJyxcbiAgICAgICAgc3RhcnRQYWdlOiAnaW5kZXgnXG4gICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgaXNEZWZhdWx0U2V0dGluZ3MgPSBmdW5jdGlvbiAoc2V0dGluZ3MpIHtcbiAgICAgIHJldHVybiBhbmd1bGFyLmVxdWFscyhzZXR0aW5ncywgdGhpcy5nZXREZWZhdWx0U2V0dGluZ3MoKSk7XG4gICAgfTtcblxuICAgIHZhciBnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2V0dGluZ3MgPSBjYWNoZS5nZXQoJ3NldHRpbmdzJyk7XG4gICAgICBpZiAoc2V0dGluZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzZXR0aW5ncyA9IHRoaXMuZ2V0RGVmYXVsdFNldHRpbmdzKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgfTtcblxuICAgIHZhciBwdXQgPSBmdW5jdGlvbiAoc2V0dGluZ3MpIHtcbiAgICAgIGNhY2hlLnB1dCgnc2V0dGluZ3MnLCBzZXR0aW5ncyk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IGdldCxcbiAgICAgIHB1dDogcHV0LFxuICAgICAgZ2V0RGVmYXVsdFNldHRpbmdzOiBnZXREZWZhdWx0U2V0dGluZ3MsXG4gICAgICBpc0RlZmF1bHRTZXR0aW5nczogaXNEZWZhdWx0U2V0dGluZ3NcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdBdXRoQ3RybCcsIFsnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJHdpbmRvdycsICdBdXRoU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJHdpbmRvdywgYXV0aFNlcnZpY2UpIHtcbiAgICAgICRzY29wZS5pc0F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICRzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgYXV0aFNlcnZpY2UuZ2V0QXV0aGVudGljYXRlZFVzZXIoKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICRzY29wZS51c2VyID0gdXNlciB8fCBudWxsO1xuICAgICAgICB9KTtcblxuICAgICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnYXV0aC9naXRodWI/cGFnZT0nICsgJHJvb3RTY29wZS5wYWdlTmFtZTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGF1dGhTZXJ2aWNlLmxvZ291dCgpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvZ2l0L2Nvbm5lY3QnO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLiR3YXRjaCgndXNlcicsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgICAgICAgJHJvb3RTY29wZS5pc0F1dGhlbnRpY2F0ZWQgPSBuZXdWYWx1ZSAhPT0gbnVsbDtcbiAgICAgICAgJHNjb3BlLmlzQXV0aGVudGljYXRlZCA9ICRyb290U2NvcGUuaXNBdXRoZW50aWNhdGVkO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2lzQXV0aGVudGljYXRlZCcsIHsgaXNBdXRoZW50aWNhdGVkOiAkcm9vdFNjb3BlLmlzQXV0aGVudGljYXRlZCB9KTtcbiAgICAgIH0pO1xuXG4gICAgfVxuICBdKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0NvbW1pdE1lc3NhZ2VEaWFsb2dDdHJsJywgWyckc2NvcGUnLCAnJG1kRGlhbG9nJywgJ0VkaXRvclNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkc2NvcGUsICRtZERpYWxvZywgZWRpdG9yU2VydmljZSkge1xuICAgICAgJHNjb3BlLnBhZ2VOYW1lID0gJyc7XG4gICAgICAkc2NvcGUuY29tbWl0TWVzc2FnZSA9ICdTb21lIGNoYW5nZXMgZm9yICcgKyAkc2NvcGUucGFnZU5hbWU7XG5cbiAgICAgIGVkaXRvclNlcnZpY2UuZ2V0U2VsZWN0ZWRUZXh0KCkudGhlbihmdW5jdGlvbiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgICAgIGlmIChzZWxlY3RlZFRleHQpIHtcbiAgICAgICAgICAkc2NvcGUuY29tbWl0TWVzc2FnZSA9IHNlbGVjdGVkVGV4dDtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRtZERpYWxvZy5oaWRlKCk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRtZERpYWxvZy5jYW5jZWwoKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jbG9zZURpYWxvZyA9IGZ1bmN0aW9uIChjYW5jZWwpIHtcbiAgICAgICAgJG1kRGlhbG9nLmhpZGUoe1xuICAgICAgICAgIGNhbmNlbDogY2FuY2VsLFxuICAgICAgICAgIGNvbW1pdE1lc3NhZ2U6ICRzY29wZS5jb21taXRNZXNzYWdlXG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9XG4gIF0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignQ29udGVudEN0cmwnLFxuICAgIFsnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJHJvdXRlUGFyYW1zJywgJyRsb2NhdGlvbicsICckcScsICckd2luZG93JyxcbiAgICAgJyRtZFRvYXN0JywgJyRtZERpYWxvZycsICdQYWdlU2VydmljZScsICdTZXR0aW5nc1NlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICRyb3V0ZVBhcmFtcywgJGxvY2F0aW9uLCAkcSwgJHdpbmRvdyxcbiAgICAgICAgICAgICAgJG1kVG9hc3QsICRtZERpYWxvZywgcGFnZVNlcnZpY2UsIHNldHRpbmdzU2VydmljZSkge1xuICAgICAgJHNjb3BlLmNvbnRlbnQgPSAnJztcbiAgICAgICRzY29wZS5tYXJrZG93biA9ICcnO1xuICAgICAgJHNjb3BlLnBhZ2VOYW1lID0gJyc7XG4gICAgICAkc2NvcGUucmVmcmVzaCA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmlzRWRpdG9yVmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgICB2YXIgc2V0dGluZ3MgPSBzZXR0aW5nc1NlcnZpY2UuZ2V0KCk7XG4gICAgICB2YXIgc3RhcnRQYWdlID0gc2V0dGluZ3Muc3RhcnRQYWdlIHx8ICdpbmRleCc7XG4gICAgICB2YXIgcGFnZU5hbWUgPSAkcm91dGVQYXJhbXMucGFnZSB8fCBzdGFydFBhZ2U7XG5cbiAgICAgIHZhciBwcmVwYXJlTGlua3MgPSBmdW5jdGlvbiAoaHRtbCwgc2V0dGluZ3MpIHtcbiAgICAgICAgdmFyICRkb20gPSAkKCc8ZGl2PicgKyBodG1sICsgJzwvZGl2PicpO1xuXG4gICAgICAgICRkb20uZmluZCgnYVtocmVmXj1cIndpa2kvXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyICRsaW5rID0gJCh0aGlzKTtcbiAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgJGxpbmsuYXR0cignaHJlZicpLnN1YnN0cmluZyg0KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzZXR0aW5ncy5wcm92aWRlciA9PT0gJ2dpdGh1YicpIHtcbiAgICAgICAgICAkZG9tLmZpbmQoJ2FbaHJlZl49XCIvc3RhdGljL1wiXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyICRsaW5rID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBuZXdMaW5rID0gJy9zdGF0aWMvJy5jb25jYXQoc2V0dGluZ3MuZ2l0aHViVXNlciwgJy8nLCBzZXR0aW5ncy5naXRodWJSZXBvc2l0b3J5LCAnLycsICRsaW5rLmF0dHIoJ2hyZWYnKS5zdWJzdHJpbmcoJy9zdGF0aWMvJy5sZW5ndGgpKTtcbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCBuZXdMaW5rKTtcbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ3RhcmdldCcsICdfYmxhbmsnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkZG9tLmZpbmQoJ2FbaHJlZl49XCIvc3RhdGljL1wiXScpLmF0dHIoJ3RhcmdldCcsICdfYmxhbmsnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJGRvbS5odG1sKCk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2hvd0Vycm9yID0gZnVuY3Rpb24gKGVycm9yTWVzc2FnZSkge1xuICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAuY29udGVudChlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBmaXQnKVxuICAgICAgICAgICAgLmhpZGVEZWxheSgzMDAwKVxuICAgICAgICApO1xuICAgICAgfTtcblxuICAgICAgdmFyIGdldFBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICBwYWdlU2VydmljZS5nZXRQYWdlKHBhZ2VOYW1lKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChwYWdlQ29udGVudCkge1xuICAgICAgICAgICAgJHNjb3BlLnBhZ2VOYW1lID0gcGFnZU5hbWU7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLnBhZ2VOYW1lID0gcGFnZU5hbWU7XG4gICAgICAgICAgICAkc2NvcGUuY29udGVudCA9IHByZXBhcmVMaW5rcyhwYWdlQ29udGVudCwgc2V0dGluZ3MpO1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lID09PSBzdGFydFBhZ2UgJiYgZXJyb3IuY29kZSA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvZ2l0L2Nvbm5lY3QnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNob3dFcnJvcignQ29udGVudCBub3QgZm91bmQhJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNob3dPckhpZGVFZGl0b3IgPSBmdW5jdGlvbiAoaXNWaXNpYmxlKSB7XG4gICAgICAgICRzY29wZS5pc0VkaXRvclZpc2libGUgPSBpc1Zpc2libGU7XG4gICAgICAgICRyb290U2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gaXNWaXNpYmxlO1xuICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2lzRWRpdG9yVmlzaWJsZScsIHsgaXNFZGl0b3JWaXNpYmxlOiBpc1Zpc2libGUgfSk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2hvd0VkaXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2hvd09ySGlkZUVkaXRvcih0cnVlKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBoaWRlRWRpdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJHJvdXRlUGFyYW1zLmVkaXQpIHtcbiAgICAgICAgICAkbG9jYXRpb24uc2VhcmNoKHt9KTtcbiAgICAgICAgfVxuICAgICAgICBzaG93T3JIaWRlRWRpdG9yKGZhbHNlKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBlZGl0UGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSkge1xuICAgICAgICBzaG93RWRpdG9yKCk7XG5cbiAgICAgICAgcGFnZVNlcnZpY2UuZ2V0UGFnZShwYWdlTmFtZSwgJ21hcmtkb3duJylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAobWFya2Rvd24pIHtcbiAgICAgICAgICAgICRzY29wZS5tYXJrZG93biA9IG1hcmtkb3duO1xuICAgICAgICAgICAgJHNjb3BlLnJlZnJlc2ggPSB0cnVlO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lID09PSBzdGFydFBhZ2UgJiYgZXJyb3IuY29kZSA9PT0gNDA0KSB7XG4gICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvZ2l0L2Nvbm5lY3QnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNob3dFcnJvcignQ29udGVudCBub3QgZm91bmQ6ICcgKyBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBzYXZlUGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSwgY29tbWl0TWVzc2FnZSwgY29udGVudCkge1xuICAgICAgICBwYWdlU2VydmljZS5zYXZlUGFnZShwYWdlTmFtZSwgY29tbWl0TWVzc2FnZSwgY29udGVudClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGFnZUNvbnRlbnQpIHtcbiAgICAgICAgICAgICRzY29wZS5jb250ZW50ID0gcHJlcGFyZUxpbmtzKHBhZ2VDb250ZW50LCBzZXR0aW5ncyk7XG4gICAgICAgICAgICBoaWRlRWRpdG9yKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBzaG93RXJyb3IoJ1NhdmUgY3VycmVudCBwYWdlIGZhaWxlZDogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gc2F2ZUNoYW5nZXMoZXZlbnQsIGNvbW1pdE1lc3NhZ2UsIG1hcmtkb3duKSB7XG4gICAgICAgICRtZERpYWxvZy5zaG93KHtcbiAgICAgICAgICBjb250cm9sbGVyOiBDb21taXRNZXNzYWdlRGlhbG9nQ29udHJvbGxlcixcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2NvbW1pdE1lc3NhZ2VEaWFsb2cnLFxuICAgICAgICAgIGxvY2Fsczoge1xuICAgICAgICAgICAgY29tbWl0TWVzc2FnZTogY29tbWl0TWVzc2FnZSB8fCAnU29tZSBjaGFuZ2VzIGZvciAnICsgJHNjb3BlLnBhZ2VOYW1lXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0YXJnZXRFdmVudDogZXZlbnRcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgaWYgKCFyZXN1bHQuY2FuY2VsKSB7XG4gICAgICAgICAgICBzYXZlUGFnZSgkc2NvcGUucGFnZU5hbWUsIHJlc3VsdC5jb21taXRNZXNzYWdlLCBtYXJrZG93bik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLm5hdmlnYXRlID0gZnVuY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmICgkd2luZG93Lmhpc3RvcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2JhY2snKSB7XG4gICAgICAgICAgJHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkd2luZG93Lmhpc3RvcnkuZm9yd2FyZCgpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuJG9uKCdjYW5jZWxFZGl0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGhpZGVFZGl0b3IoKTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuJG9uKCdzYXZlQ2hhbmdlcycsIGZ1bmN0aW9uKGV2ZW50LCBhcmdzKXtcbiAgICAgICAgc2F2ZUNoYW5nZXMoYXJncy5ldmVudCwgYXJncy5jb21taXRNZXNzYWdlLCBhcmdzLm1hcmtkb3duKTtcbiAgICAgIH0pO1xuXG4gICAgICBnZXRQYWdlKHBhZ2VOYW1lKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCRyb3V0ZVBhcmFtcy5lZGl0ICYmICRyb290U2NvcGUuaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgICAgICAgZWRpdFBhZ2UocGFnZU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhpZGVFZGl0b3IoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICBdKTtcblxuICBmdW5jdGlvbiBDb21taXRNZXNzYWdlRGlhbG9nQ29udHJvbGxlcigkc2NvcGUsICRtZERpYWxvZywgY29tbWl0TWVzc2FnZSkge1xuICAgICRzY29wZS5jb21taXRNZXNzYWdlID0gY29tbWl0TWVzc2FnZTtcblxuICAgICRzY29wZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbWREaWFsb2cuaGlkZSgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbWREaWFsb2cuY2FuY2VsKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5jbG9zZURpYWxvZyA9IGZ1bmN0aW9uIChjYW5jZWwpIHtcbiAgICAgICRtZERpYWxvZy5oaWRlKHtcbiAgICAgICAgY2FuY2VsOiBjYW5jZWwsXG4gICAgICAgIGNvbW1pdE1lc3NhZ2U6ICRzY29wZS5jb21taXRNZXNzYWdlXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSk7XG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzLCBhbmd1bGFyLCBkb2N1bWVudCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignRWRpdENvbnRlbnRDdHJsJywgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckbG9jYXRpb24nLCAnJHdpbmRvdycsICckbWREaWFsb2cnLCAnJG1kVG9hc3QnLCAnUGFnZVNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICRsb2NhdGlvbiwgJHdpbmRvdywgJG1kRGlhbG9nLCAkbWRUb2FzdCwgcGFnZVNlcnZpY2UpIHtcbiAgICAgIHZhciBub25FZGl0YWJsZVBhdGhzID0gWycvc2VhcmNoJywgJy9naXQvY29ubmVjdCddO1xuXG4gICAgICAkc2NvcGUuaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAkc2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gZmFsc2U7XG4gICAgICAkc2NvcGUuY2FuRWRpdFBhZ2UgPSBmYWxzZTtcbiAgICAgICRzY29wZS5wb3B1cElzVmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgICB2YXIgaXNFZGl0UGFnZVBvc3NpYmxlID0gZnVuY3Rpb24gKGlzQXV0aGVudGljYXRlZCwgbm9uRWRpdGFibGVQYXRocywgcGF0aCkge1xuICAgICAgICB2YXIgY2FuRWRpdFBhZ2UgPSBpc0F1dGhlbnRpY2F0ZWQ7XG5cbiAgICAgICAgaWYgKGNhbkVkaXRQYWdlKSB7XG4gICAgICAgICAgbm9uRWRpdGFibGVQYXRocy5mb3JFYWNoKGZ1bmN0aW9uIChub25FZGl0YWJsZVBhdGgpIHtcbiAgICAgICAgICAgIGlmIChub25FZGl0YWJsZVBhdGggPT09IHBhdGgpIHtcbiAgICAgICAgICAgICAgY2FuRWRpdFBhZ2UgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FuRWRpdFBhZ2U7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2hvd0Vycm9yID0gZnVuY3Rpb24gKGVycm9yTWVzc2FnZSkge1xuICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAuY29udGVudChlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBmaXQnKVxuICAgICAgICAgICAgLmhpZGVEZWxheSgzMDAwKVxuICAgICAgICApO1xuICAgICAgfTtcblxuICAgICAgdmFyIGNyZWF0ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgICAgcGFnZVNlcnZpY2Uuc2F2ZVBhZ2UocGFnZU5hbWUsICdjcmVhdGUgbmV3IHBhZ2UgJyArIHBhZ2VOYW1lLCAnIycgKyBwYWdlTmFtZSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGFnZUNvbnRlbnQpIHtcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvJyArIHBhZ2VOYW1lKS5zZWFyY2goJ2VkaXQnKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNob3dFcnJvcignQ3JlYXRlIG5ldyBwYWdlIGZhaWxlZDogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgdmFyIHJlbW92ZVBhZ2VGcm9tUGFnZXMgPSBmdW5jdGlvbiAocGFnZXMsIHBhZ2VOYW1lKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xuXG4gICAgICAgIHBhZ2VzLmZvckVhY2goZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICAgICAgICBpZiAocGFnZS5uYW1lID09PSBwYWdlTmFtZSkge1xuICAgICAgICAgICAgaW5kZXggPSBwYWdlcy5pbmRleE9mKHBhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBwYWdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB2YXIgZGVsZXRlUGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSkge1xuICAgICAgICBwYWdlU2VydmljZS5kZWxldGVQYWdlKHBhZ2VOYW1lKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlbW92ZVBhZ2VGcm9tUGFnZXMoJHJvb3RTY29wZS5wYWdlcywgcGFnZU5hbWUpO1xuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy8nKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNob3dFcnJvcignRGVsZXRlIHRoZSBjdXJyZW50IHBhZ2UgaGFzIGJlZW4gZmFpbGVkOiAnICsgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc2hvd09ySGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUucG9wdXBJc1Zpc2libGUgPSAhJHNjb3BlLnBvcHVwSXNWaXNpYmxlO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNob3dQb3B1cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnBvcHVwSXNWaXNpYmxlID0gdHJ1ZTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5oaWRlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5wb3B1cElzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmNyZWF0ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkc2NvcGUuaGlkZVBvcHVwKCk7XG5cbiAgICAgICAgJG1kRGlhbG9nLnNob3coe1xuICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHNjb3BlJywgJyRtZERpYWxvZycsIENyZWF0ZU5ld1BhZ2VDb250cm9sbGVyXSxcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2NyZWF0ZU5ld1BhZ2VEaWFsb2cnLFxuICAgICAgICAgIHRhcmdldEV2ZW50OiBldmVudCxcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oZGlhbG9nUmVzdWx0KSB7XG4gICAgICAgICAgaWYgKCFkaWFsb2dSZXN1bHQuY2FuY2VsKSB7XG4gICAgICAgICAgICBjcmVhdGVQYWdlKGRpYWxvZ1Jlc3VsdC5wYWdlTmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5kZWxldGUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJHNjb3BlLmhpZGVQb3B1cCgpO1xuXG4gICAgICAgIGlmICgkcm9vdFNjb3BlLnBhZ2VOYW1lID09PSAnaW5kZXgnKSB7XG4gICAgICAgICAgdmFyIGFsZXJ0RGlhbG9nID0gJG1kRGlhbG9nLmFsZXJ0KClcbiAgICAgICAgICAgICAgLnRpdGxlKCdEZWxldGUgc3RhcnQgcGFnZT8nKVxuICAgICAgICAgICAgICAuY29udGVudCgnSXRcXCdzIG5vdCBhIGdvb2QgaWRlYSB0byBkZWxldGUgeW91ciBzdGFydCBwYWdlIScpXG4gICAgICAgICAgICAgIC50YXJnZXRFdmVudChldmVudClcbiAgICAgICAgICAgICAgLmFyaWFMYWJlbCgnRGVsZXRlIHN0YXJ0IHBhZ2UgZm9yYmlkZGVuJylcbiAgICAgICAgICAgICAgLm9rKCdPaycpO1xuXG4gICAgICAgICAgJG1kRGlhbG9nLnNob3coYWxlcnREaWFsb2cpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2cgPSAkbWREaWFsb2cuY29uZmlybSgpXG4gICAgICAgICAgLnRpdGxlKCdEZWxldGUgY3VycmVudCBwYWdlPycpXG4gICAgICAgICAgLmNvbnRlbnQoJ0FyZSB5b3Ugc3VyZSB0aGF0IHlvdSB3YW50IHRvIGRlbGV0ZSB0aGUgY3VycmVudCBwYWdlPycpXG4gICAgICAgICAgLnRhcmdldEV2ZW50KGV2ZW50KVxuICAgICAgICAgIC5hcmlhTGFiZWwoJ0RlbGV0ZSBjdXJyZW50IHBhZ2U/JylcbiAgICAgICAgICAub2soJ09rJylcbiAgICAgICAgICAuY2FuY2VsKCdDYW5jZWwnKTtcblxuICAgICAgICAkbWREaWFsb2cuc2hvdyhjb25maXJtRGlhbG9nKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVsZXRlUGFnZSgkcm9vdFNjb3BlLnBhZ2VOYW1lKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5lZGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUucG9wdXBJc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy8nICsgJHJvb3RTY29wZS5wYWdlTmFtZSkuc2VhcmNoKCdlZGl0Jyk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgaXNBdXRoZW50aWNhdGVkVW5yZWdpc3RlciA9ICRyb290U2NvcGUuJG9uKCdpc0F1dGhlbnRpY2F0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgJHNjb3BlLmlzQXV0aGVudGljYXRlZCA9IGRhdGEuaXNBdXRoZW50aWNhdGVkO1xuICAgICAgICAkc2NvcGUuY2FuRWRpdFBhZ2UgPSBpc0VkaXRQYWdlUG9zc2libGUoJHNjb3BlLmlzQXV0aGVudGljYXRlZCwgbm9uRWRpdGFibGVQYXRocywgJGxvY2F0aW9uLnBhdGgoKSk7XG4gICAgICB9KTtcblxuICAgICAgdmFyIGlzRWRpdG9yVmlzaWJsZVVucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignaXNFZGl0b3JWaXNpYmxlJywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgICRzY29wZS5pc0VkaXRvclZpc2libGUgPSBkYXRhLmlzRWRpdG9yVmlzaWJsZTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgcm91dGVDaGFuZ2VTdWNjZXNzVW5yZWdpc3RlciA9ICRyb290U2NvcGUuJG9uKCckcm91dGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGUsIGN1cnJlbnQsIHByZSkge1xuICAgICAgICAkc2NvcGUuY2FuRWRpdFBhZ2UgPSBpc0VkaXRQYWdlUG9zc2libGUoJHNjb3BlLmlzQXV0aGVudGljYXRlZCwgbm9uRWRpdGFibGVQYXRocywgJGxvY2F0aW9uLnBhdGgoKSk7XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gaXNFZGl0UGFnZVBvc3NpYmxlKCRzY29wZS5pc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsICRsb2NhdGlvbi5wYXRoKCkpO1xuXG4gICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkVW5yZWdpc3RlcigpO1xuICAgICAgICBpc0VkaXRvclZpc2libGVVbnJlZ2lzdGVyKCk7XG4gICAgICAgIHJvdXRlQ2hhbmdlU3VjY2Vzc1VucmVnaXN0ZXIoKTtcbiAgICAgIH0pO1xuXG4gICAgfVxuICBdKTtcblxuICBmdW5jdGlvbiBDcmVhdGVOZXdQYWdlQ29udHJvbGxlcigkc2NvcGUsICRtZERpYWxvZykge1xuICAgICRzY29wZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbWREaWFsb2cuaGlkZSgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAkbWREaWFsb2cuY2FuY2VsKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5jbG9zZURpYWxvZyA9IGZ1bmN0aW9uIChjYW5jZWwpIHtcbiAgICAgICRtZERpYWxvZy5oaWRlKHtcbiAgICAgICAgY2FuY2VsOiBjYW5jZWwsXG4gICAgICAgIHBhZ2VOYW1lOiAkc2NvcGUucGFnZU5hbWVcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpLCB3aW5kb3cuYW5ndWxhciwgd2luZG93LmRvY3VtZW50KTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignR2l0Q29ubmVjdEN0cmwnLCBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyRsb2NhdGlvbicsICckbWRUb2FzdCcsICdQYWdlU2VydmljZScsICdTZXR0aW5nc1NlcnZpY2UnLCAnU2VydmVyQ29uZmlnU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJGxvY2F0aW9uLCAkbWRUb2FzdCwgcGFnZVNlcnZpY2UsIHNldHRpbmdzU2VydmljZSwgc2VydmVyQ29uZmlnU2VydmljZSkge1xuICAgICAgdmFyIHNldHRpbmdzID0gc2V0dGluZ3NTZXJ2aWNlLmdldCgpO1xuICAgICAgJHNjb3BlLnByb3ZpZGVyID0gc2V0dGluZ3MucHJvdmlkZXIgfHwgJ2dpdGh1Yic7XG4gICAgICAkc2NvcGUuZ2l0aHViVXNlciA9IHNldHRpbmdzLmdpdGh1YlVzZXIgfHwgJ21kd2lraSc7XG4gICAgICAkc2NvcGUucmVwb3NpdG9yeU5hbWUgPSBzZXR0aW5ncy5naXRodWJSZXBvc2l0b3J5IHx8ICd3aWtpJztcblxuICAgICAgJHNjb3BlLmdpdGh1YlVzZXJQbGFjZUhvbGRlclRleHQgPSAnRW50ZXIgaGVyZSB5b3VyIEdpdEh1YiB1c2VybmFtZSc7XG4gICAgICAkc2NvcGUucmVwb3NpdG9yeU5hbWVQbGFjZUhvbGRlclRleHQgPSAnRW50ZXIgaGVyZSB0aGUgbmFtZSBvZiB0aGUgcmVwb3NpdG9yeSc7XG5cbiAgICAgICRzY29wZS5pc0J1c3kgPSBmYWxzZTtcbiAgICAgICRzY29wZS5oYXNFcnJvciA9IGZhbHNlO1xuXG4gICAgICAkc2NvcGUuY29ubmVjdCA9IGZ1bmN0aW9uIChzdWNjZXNzTWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuaXNCdXN5ID0gdHJ1ZTtcblxuICAgICAgICB2YXIgcmVzcG9zaXRvcnlVcmwgPSAkc2NvcGUuZ2l0aHViVXNlciArICcvJyArICRzY29wZS5yZXBvc2l0b3J5TmFtZTtcblxuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICAgICAgcHJvdmlkZXI6ICRzY29wZS5wcm92aWRlcixcbiAgICAgICAgICB1cmw6IHJlc3Bvc2l0b3J5VXJsLFxuICAgICAgICAgIGdpdGh1YlJlcG9zaXRvcnk6ICRzY29wZS5yZXBvc2l0b3J5TmFtZSxcbiAgICAgICAgICBnaXRodWJVc2VyOiAkc2NvcGUuZ2l0aHViVXNlclxuICAgICAgICB9O1xuXG4gICAgICAgIHBhZ2VTZXJ2aWNlLmdldFBhZ2VzKHNldHRpbmdzKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgICAgICAgdmFyIHN0YXJ0UGFnZSA9IHBhZ2VTZXJ2aWNlLmZpbmRTdGFydFBhZ2UocGFnZXMpO1xuICAgICAgICAgICAgaWYgKHN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkICYmIHN0YXJ0UGFnZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHNldHRpbmdzLnN0YXJ0UGFnZSA9IHN0YXJ0UGFnZTtcbiAgICAgICAgICAgICAgc2V0dGluZ3NTZXJ2aWNlLnB1dChzZXR0aW5ncyk7XG5cbiAgICAgICAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgICAgICAgLmNvbnRlbnQoJ0Nvbm5lY3RlZCB0byBnaXRodWIgYXMgdXNlciAnICsgJHNjb3BlLmdpdGh1YlVzZXIpXG4gICAgICAgICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBsZWZ0JylcbiAgICAgICAgICAgICAgICAgIC5oaWRlRGVsYXkoNTAwMClcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycpO1xuICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ09uR2l0Q29ubmVjdGVkJywgeyBzZXR0aW5nczogc2V0dGluZ3N9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICAgJG1kVG9hc3Quc2ltcGxlKClcbiAgICAgICAgICAgICAgICAgIC5jb250ZW50KCdObyBzdGFydHBhZ2Ugd2FzIGZvdW5kIScpXG4gICAgICAgICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBsZWZ0JylcbiAgICAgICAgICAgICAgICAgIC5oaWRlRGVsYXkoNTAwMClcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgLmNvbnRlbnQoJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIGNvbm5lY3Rpb24gdG8gdGhlIGdpdC1yZXBvc2l0b3J5OiAnICsgZXJyb3IubWVzc2FnZSlcbiAgICAgICAgICAgICAgICAucG9zaXRpb24oJ2JvdHRvbSBsZWZ0JylcbiAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDUwMDApXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmlzQnVzeSA9IGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgIH1cbiAgXSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdQYWdlc0N0cmwnLCBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJ1BhZ2VTZXJ2aWNlJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgcGFnZVNlcnZpY2UpIHtcbiAgICAkc2NvcGUucGFnZXMgPSBbXTtcbiAgICAkcm9vdFNjb3BlLnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXG4gICAgdmFyIHVwZGF0ZVBhZ2VzID0gZnVuY3Rpb24gKHBhZ2VzKSB7XG4gICAgICAkc2NvcGUucGFnZXMgPSBwYWdlcyB8fCBbXTtcbiAgICAgICRyb290U2NvcGUucGFnZXMgPSAkc2NvcGUucGFnZXM7XG4gICAgfTtcblxuICAgIHBhZ2VTZXJ2aWNlLmdldFBhZ2VzKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgICB1cGRhdGVQYWdlcyhwYWdlcyk7XG4gICAgICAgIHBhZ2VTZXJ2aWNlLnJlZ2lzdGVyT2JzZXJ2ZXIodXBkYXRlUGFnZXMpO1xuICAgICAgfSk7XG5cbiAgICAkc2NvcGUuZXhjbHVkZURlZmF1bHRQYWdlID0gZnVuY3Rpb24gKHBhZ2UpIHtcbiAgICAgIHZhciBleGNsdWRlcyA9IFsnaW5kZXgnLCAnaG9tZScsICdyZWFkbWUnXTtcbiAgICAgIHZhciBleGNsdWRlUGFnZSA9IGZhbHNlO1xuXG4gICAgICBhbmd1bGFyLmZvckVhY2goZXhjbHVkZXMsIGZ1bmN0aW9uIChleGNsdWRlKSB7XG4gICAgICAgIGlmIChwYWdlLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gZXhjbHVkZSkge1xuICAgICAgICAgIGV4Y2x1ZGVQYWdlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiAhZXhjbHVkZVBhZ2U7XG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignU2VhcmNoQ3RybCcsIFsnJHNjb3BlJywgJyRsb2NhdGlvbicsICckcm91dGUnLCAnU2VhcmNoU2VydmljZScsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2NhdGlvbiwgJHJvdXRlLCBzZWFyY2hTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnRleHRUb1NlYXJjaCA9ICcnO1xuICAgICRzY29wZS5zZWFyY2hSZXN1bHQgPSBzZWFyY2hTZXJ2aWNlLnNlYXJjaFJlc3VsdDtcbiAgICAkc2NvcGUubWVzc2FnZSA9ICcnO1xuXG4gICAgJHNjb3BlLnNlYXJjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlYXJjaFNlcnZpY2Uuc2VhcmNoKCRzY29wZS50ZXh0VG9TZWFyY2gpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSAnU2VhcmNoIHN1Y2Nlc3NmdWxseSBmaW5pc2hlZCc7XG4gICAgICAgICAgc2VhcmNoU2VydmljZS5zZWFyY2hSZXN1bHQgPSBkYXRhO1xuXG4gICAgICAgICAgdmFyIG5ld0xvY2F0aW9uID0gJy9zZWFyY2gnO1xuICAgICAgICAgIGlmICgkbG9jYXRpb24ucGF0aCgpID09PSBuZXdMb2NhdGlvbikge1xuICAgICAgICAgICAgJHJvdXRlLnJlbG9hZCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aChuZXdMb2NhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICB2YXIgc2VhcmNoZWRUZXh0ID0gZXJyb3IgfHwgJyc7XG4gICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSAnQW4gZXJyb3Igb2NjdXJyZWQgd2hpbGUgc2VhcmNoaW5nIGZvciB0aGUgdGV4dDogJyArIHNlYXJjaGVkVGV4dC50b1N0cmluZygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdTaWRlYmFyQ3RybCcsIFsnJG1kU2lkZW5hdicsIHNpZGViYXJDdHJsXSk7XG5cbiAgZnVuY3Rpb24gc2lkZWJhckN0cmwoJG1kU2lkZW5hdikge1xuICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgdGhpcy50b2dnbGVMaXN0ID0gdG9nZ2xlTGlzdDtcbiAgICB0aGlzLmlzTm90TG9ja2VkT3BlbiA9IGlzTm90TG9ja2VkT3BlbjtcblxuICAgIGZ1bmN0aW9uIHRvZ2dsZUxpc3QoaWQpIHtcbiAgICAgICRtZFNpZGVuYXYoaWQpLnRvZ2dsZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzTm90TG9ja2VkT3BlbihpZCkge1xuICAgICAgcmV0dXJuICEkbWRTaWRlbmF2KGlkKS5pc0xvY2tlZE9wZW4oKTtcbiAgICB9XG4gIH1cbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSk7Il19