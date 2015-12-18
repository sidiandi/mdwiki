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


(function (angular) {
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

        scope.$watch('markdown', function (value) {

        });
      }
    };
  }
})(window.angular);

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

      $scope.navigate = function (direction) {
        if ($window.history.length === 0) {
          return;
        }

        if (direction === 'back') {
          $window.history.back();
        } else {
          $window.history.forward();
        }
      };

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImRpcmVjdGl2ZXMuanMiLCJkaXJlY3RpdmVzL21kLWVkaXRvci9tZC1lZGl0b3IuanMiLCJzZXJ2aWNlcy9hcGl1cmxidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL2F1dGhzZXJ2aWNlLmpzIiwic2VydmljZXMvZWRpdG9yc2VydmljZS5qcyIsInNlcnZpY2VzL2h0dHBoZWFkZXJidWlsZGVyc2VydmljZS5qcyIsInNlcnZpY2VzL3BhZ2VzZXJ2aWNlLmpzIiwic2VydmljZXMvc2VhcmNoc2VydmljZS5qcyIsInNlcnZpY2VzL3NlcnZlcmNvbmZpZ3NlcnZpY2UuanMiLCJzZXJ2aWNlcy9zZXR0aW5nc3NlcnZpY2UuanMiLCJjb250cm9sbGVycy9hdXRoY3RybC5qcyIsImNvbnRyb2xsZXJzL2NvbW1pdG1lc3NhZ2VkaWFsb2djdHJsLmpzIiwiY29udHJvbGxlcnMvY29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9lZGl0Y29udGVudGN0cmwuanMiLCJjb250cm9sbGVycy9naXRjb25uZWN0Y3RybC5qcyIsImNvbnRyb2xsZXJzL3BhZ2VzY3RybC5qcyIsImNvbnRyb2xsZXJzL3NlYXJjaGN0cmwuanMiLCJjb250cm9sbGVycy9zaWRlYmFyY3RybC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDckIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDZjtBQUNBLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3pDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDZCxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ2pCLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDaEIsSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNqQixJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2Qs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LENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0QsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHO0FBQ2hDLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQzFHLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzVCLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDL0IsTUFBTSxHQUFHO0FBQ1Q7QUFDQSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0FBQzlCLElBQUksRUFBRTtBQUNOO0FBQ0EsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO0FBQ2hDO0FBQ0EsTUFBTSxDQUFDLElBQUksRUFBRTtBQUNiLFFBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7QUFDdEIsUUFBUSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtBQUMzRCxRQUFRLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ3hELFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLFVBQVUsYUFBYSxDQUFDLENBQUMsYUFBYSxDQUFDO0FBQ3ZDLFVBQVUsUUFBUSxDQUFDLENBQUMsUUFBUTtBQUM1QixRQUFRLENBQUM7QUFDVCxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDaEUsUUFBUSxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtBQUN0QyxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0QsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHO0FBQ2hDLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQzFHLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzVCLFFBQVEsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDL0IsTUFBTSxHQUFHO0FBQ1Q7QUFDQSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0FBQzlCLElBQUksRUFBRTtBQUNOO0FBQ0EsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzFDLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO0FBQ2hDO0FBQ0EsTUFBTSxDQUFDLElBQUksRUFBRTtBQUNiLFFBQVEsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7QUFDekIsUUFBUSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUMxRCxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDaEUsUUFBUSxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtBQUN0QyxNQUFNLEVBQUU7QUFDUixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0QsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHO0FBQ2hDLFFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0FBQzFHLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFD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RSxDQUFDLElBQUksQ0FBQztBQUNyQyxRQUFRLEdBQUc7QUFDWDtBQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztBQUMxRSxNQUFNLEVBQUU7QUFDUjtBQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbkMsUUFBUSxXQUFXLENBQUMsTUFBTSxFQUFFO0FBQzVCLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzdCLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDL0IsVUFBVSxHQUFHO0FBQ2IsTUFBTSxFQUFFO0FBQ1I7QUFDQSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFO0FBQy9DLE1BQU0sRUFBRTtBQUNSO0FBQ0EsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMzRCxRQUFRLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDdkQsUUFBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENB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VyxDQUFDLENBQUMsQ0FBQztBQUN6QixFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRTtBQUNmO0FBQ0EsRUFBRSxXQUFXLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsV0FBVyxHQUFHO0FBQ3JFO0FBQ0EsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDOUIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7QUFDakMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUM7QUFDM0M7QUFDQSxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QixNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxNQUFNLEdBQUc7QUFDOUIsSUFBSSxDQUFDO0FBQ0w7QUFDQSxJQUFJLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNsQyxNQUFNLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsWUFBWSxHQUFHO0FBQzVDLElBQUksQ0FBQztBQUNMLEVBQUUsQ0FBQztBQUNILEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsV0FBVyIsImZpbGUiOiJzY3JpcHRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIChhbmd1bGFyKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbWR3aWtpID0gYW5ndWxhci5tb2R1bGUoJ21kd2lraScsIFtcbiAgICAnbmdSb3V0ZScsXG4gICAgJ25nU2FuaXRpemUnLFxuICAgICduZ0FuaW1hdGUnLFxuICAgICduZ01hdGVyaWFsJyxcbiAgICAnbmdUb3VjaCcsXG4gICAgJ2ptZG9icnkuYW5ndWxhci1jYWNoZScsXG4gICAgJ21kd2lraS5jb250cm9sbGVycycsXG4gICAgJ21kd2lraS5zZXJ2aWNlcycsXG4gICAgJ21kd2lraS5kaXJlY3RpdmVzJyxcbiAgICAnbWR3aWtpLmZpbHRlcnMnLFxuICBdKS5jb25maWcoWyckcm91dGVQcm92aWRlcicsICckbG9jYXRpb25Qcm92aWRlcicsICckbWRUaGVtaW5nUHJvdmlkZXInLCAnJG1kSWNvblByb3ZpZGVyJyxcbiAgICBmdW5jdGlvbiAoJHJvdXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIsICRtZEljb25Qcm92aWRlcikge1xuICAgICAgJHJvdXRlUHJvdmlkZXJcbiAgICAgICAgLndoZW4oJy9naXQvY29ubmVjdCcsIHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJy4vdmlld3MvZ2l0Y29ubmVjdC5odG1sJyxcbiAgICAgICAgICBjb250cm9sbGVyOiAnR2l0Q29ubmVjdEN0cmwnXG4gICAgICAgIH0pXG4gICAgICAgIC53aGVuKCcvJywge1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnLi92aWV3cy9jb250ZW50Lmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb250ZW50Q3RybCdcbiAgICAgICAgfSlcbiAgICAgICAgLndoZW4oJy9zZWFyY2gnLCB7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICcuL3ZpZXdzL3NlYXJjaFJlc3VsdC5odG1sJyxcbiAgICAgICAgICBjb250cm9sbGVyOiAnU2VhcmNoQ3RybCdcbiAgICAgICAgfSlcbiAgICAgICAgLndoZW4oJy86cGFnZScsIHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJy4vdmlld3MvY29udGVudC5odG1sJyxcbiAgICAgICAgICBjb250cm9sbGVyOiAnQ29udGVudEN0cmwnXG4gICAgICAgIH0pLm90aGVyd2lzZSh7XG4gICAgICAgICAgcmVkaXJlY3RUbzogJy9pbmRleCdcbiAgICAgICAgfSk7XG5cbiAgICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcblxuICAgICAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wcmltYXJ5UGFsZXR0ZSgnYmx1ZScpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWNjZW50UGFsZXR0ZSgncmVkJyk7XG4gICAgfVxuICBdKTtcblxuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJywgW10pO1xuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJywgW10pO1xuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmRpcmVjdGl2ZXMnLCBbXSk7XG4gIGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuZmlsdGVycycsIFtdKTtcbn0pKGFuZ3VsYXIpO1xuXG4iLCIoZnVuY3Rpb24gKGRpcmVjdGl2ZXMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdrZXliaW5kaW5nJywgWyckZG9jdW1lbnQnLCAnJHBhcnNlJywgJyR3aW5kb3cnLCBmdW5jdGlvbiAoJGRvY3VtZW50LCAkcGFyc2UsICR3aW5kb3cpIHtcbiAgICB2YXIgaXNNYWMgPSAvTWFjfGlQb2R8aVBob25lfGlQYWQvLnRlc3QoJHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0pO1xuXG4gICAgZnVuY3Rpb24gaXNNb2RpZmllcihtb2RpZmllciwgZXZlbnQsIGlzTWFjKSB7XG4gICAgICB2YXIgaXNTaGlmdCA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgICAgdmFyIGlzQWx0ID0gZXZlbnQuYWx0S2V5O1xuICAgICAgdmFyIGlzQ3RybCA9IGlzTWFjID8gZXZlbnQubWV0YUtleSA6IGV2ZW50LmN0cmxLZXk7XG5cbiAgICAgIGlmIChtb2RpZmllcikge1xuICAgICAgICBzd2l0Y2ggKG1vZGlmaWVyKSB7XG4gICAgICAgICAgY2FzZSAnY3RybCtzaGlmdCc6XG4gICAgICAgICAgY2FzZSAnc2hpZnQrY3RybCc6XG4gICAgICAgICAgICByZXR1cm4gaXNTaGlmdCAmJiBpc0N0cmw7XG4gICAgICAgICAgY2FzZSAnYWx0K3NoaWZ0JzpcbiAgICAgICAgICBjYXNlICdzaGlmdCthbHQnOlxuICAgICAgICAgICAgcmV0dXJuIGlzU2hpZnQgJiYgaXNBbHQ7XG4gICAgICAgICAgY2FzZSAnY3RybCthbHQnOlxuICAgICAgICAgIGNhc2UgJ2NtZCthbHQnOlxuICAgICAgICAgICAgcmV0dXJuIGlzQWx0ICYmIGlzQ3RybDtcbiAgICAgICAgICBjYXNlICdjbWQrY3RybCc6XG4gICAgICAgICAgICByZXR1cm4gZXZlbnQubWV0YUtleSAmJiBldmVudC5DdHJsS2V5O1xuICAgICAgICAgIGNhc2UgJ3NoaWZ0JzpcbiAgICAgICAgICAgIHJldHVybiBpc1NoaWZ0O1xuICAgICAgICAgIGNhc2UgJ2N0cmwnOlxuICAgICAgICAgIGNhc2UgJ2NtZCc6XG4gICAgICAgICAgICByZXR1cm4gaXNDdHJsO1xuICAgICAgICAgIGNhc2UgJ2FsdCc6XG4gICAgICAgICAgICByZXR1cm4gaXNBbHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2ZXJpZnlLZXlDb2RlKGV2ZW50LCBtb2RpZmllciwga2V5KSB7XG4gICAgICBpZiAoU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC5rZXlDb2RlKSA9PT0ga2V5KSB7XG4gICAgICAgIGlmIChtb2RpZmllcikge1xuICAgICAgICAgIHJldHVybiBpc01vZGlmaWVyKG1vZGlmaWVyLCBldmVudCwgaXNNYWMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZlcmlmeUNvbmRpdGlvbigkZXZhbCwgY29uZGl0aW9uKSB7XG4gICAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICAgIHJldHVybiAkZXZhbChjb25kaXRpb24pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICBzY29wZToge1xuICAgICAgICBtb2RpZmllcjogJ0Btb2RpZmllcicsXG4gICAgICAgIGtleTogJ0BrZXknLFxuICAgICAgICBjb25kaXRpb246ICcmJyxcbiAgICAgICAgaW52b2tlOiAnJidcbiAgICAgIH0sXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsICRlbGVtZW50LCBhdHRyKSB7XG4gICAgICAgICRkb2N1bWVudC5iaW5kKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKHZlcmlmeUtleUNvZGUoZXZlbnQsIHNjb3BlLm1vZGlmaWVyLCBzY29wZS5rZXkpICYmXG4gICAgICAgICAgICAgIHZlcmlmeUNvbmRpdGlvbihzY29wZS4kZXZhbCwgc2NvcGUuY29uZGl0aW9uKSkge1xuICAgICAgICAgICAgc2NvcGUuJGFwcGx5KHNjb3BlLmludm9rZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG5cbiAgZGlyZWN0aXZlcy5kaXJlY3RpdmUoJ2F1dG9Gb2N1cycsIFsnJHRpbWVvdXQnLFxuICAgIGZ1bmN0aW9uICgkdGltZW91dCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBQycsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVsZW1lbnRbMF0uZm9jdXMoKTtcbiAgICAgICAgICB9LCA1KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdvbkVudGVyJywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuICAgICAgICAgIGVsZW1lbnQuYmluZCgna2V5ZG93bicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGV2YWwoYXR0ci5vbkVudGVyKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICBdKTtcblxuICBkaXJlY3RpdmVzLmRpcmVjdGl2ZSgnb25Nb3VzZWVudGVyJywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuICAgICAgICAgIGVsZW1lbnQubW91c2VlbnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBzY29wZS4kZXZhbChhdHRyLm9uTW91c2VlbnRlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIF0pO1xuXG4gIGRpcmVjdGl2ZXMuZGlyZWN0aXZlKCdvbk1vdXNlb3V0JywgWyckdGltZW91dCcsXG4gICAgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcbiAgICAgICAgICBlbGVtZW50Lm1vdXNlbGVhdmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHIub25Nb3VzZW91dCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG5cbiAgZGlyZWN0aXZlcy5kaXJlY3RpdmUoJ2F1dG9TZWxlY3QnLCBbJyR0aW1lb3V0JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQUMnLFxuICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuYmluZCgnZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZWxlbWVudFswXS5zZWxlY3QoKTtcbiAgICAgICAgICB9LCAxMCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuZGlyZWN0aXZlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChhbmd1bGFyKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmRpcmVjdGl2ZXMnKVxuICAgIC5kaXJlY3RpdmUoJ21kRWRpdG9yJywgbWRFZGl0b3IpO1xuXG4gIG1kRWRpdG9yLiRpbmplY3QgPSBbJyR0aW1lb3V0J107XG5cbiAgZnVuY3Rpb24gbWRFZGl0b3IgKCR0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1hcmtkb3duOiAnPSdcbiAgICAgIH0sXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnanMvZGlyZWN0aXZlcy9tZC1lZGl0b3IvbWQtZWRpdG9yLnRwbC5odG1sJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cmlidXRlcykge1xuXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnbWFya2Rvd24nLCBmdW5jdGlvbiAodmFsdWUpIHtcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59KSh3aW5kb3cuYW5ndWxhcik7XG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdBcGlVcmxCdWlsZGVyU2VydmljZScsIFsgJ1NldHRpbmdzU2VydmljZScsIGZ1bmN0aW9uIChzZXR0aW5nc1NlcnZpY2UpIHtcbiAgICB2YXIgYnVpbGQgPSBmdW5jdGlvbiAodXJsQmVmb3JlLCB1cmxBZnRlciwgc2V0dGluZ3MpIHtcbiAgICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwgc2V0dGluZ3NTZXJ2aWNlLmdldCgpO1xuXG4gICAgICBpZiAoc2V0dGluZ3MucHJvdmlkZXIgPT09ICdnaXRodWInKSB7XG4gICAgICAgIHJldHVybiB1cmxCZWZvcmUgKyBzZXR0aW5ncy5naXRodWJVc2VyICsgJy8nICsgc2V0dGluZ3MuZ2l0aHViUmVwb3NpdG9yeSArICcvJyArIHVybEFmdGVyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdXJsQmVmb3JlICsgdXJsQWZ0ZXI7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBidWlsZDogYnVpbGRcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdBdXRoU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCBmdW5jdGlvbiAoJGh0dHAsICRxKSB7XG4gICAgdmFyIGdldEF1dGhlbnRpY2F0ZWRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6ICcvYXV0aC91c2VyJyxcbiAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9LFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChhdXRoLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGF1dGgudXNlcik7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZGF0YSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIHZhciBsb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgIHVybDogJy9hdXRoL3VzZXInLFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGRhdGEpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgbG9nb3V0OiBsb2dvdXQsXG4gICAgICBnZXRBdXRoZW50aWNhdGVkVXNlcjogZ2V0QXV0aGVudGljYXRlZFVzZXJcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdFZGl0b3JTZXJ2aWNlJywgWyckcm9vdFNjb3BlJywgJyRxJyxcbiAgICBmdW5jdGlvbigkcm9vdFNjb3BlLCAkcSkge1xuICAgICAgdmFyIGdldFNlbGVjdGVkVGV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCcnKTtcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGdldFNlbGVjdGVkVGV4dDogZ2V0U2VsZWN0ZWRUZXh0XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnSHR0cEhlYWRlckJ1aWxkZXJTZXJ2aWNlJywgWyAnU2V0dGluZ3NTZXJ2aWNlJywgZnVuY3Rpb24gKHNldHRpbmdzU2VydmljZSkge1xuICAgIHZhciBidWlsZCA9IGZ1bmN0aW9uIChjb250ZW50VHlwZSwgc2V0dGluZ3MpIHtcbiAgICAgIGNvbnRlbnRUeXBlID0gY29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCBzZXR0aW5nc1NlcnZpY2UuZ2V0KCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdYLU1EV2lraS1Qcm92aWRlcic6IHNldHRpbmdzLnByb3ZpZGVyLFxuICAgICAgICAnWC1NRFdpa2ktVXJsJzogc2V0dGluZ3MudXJsXG4gICAgICB9O1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgYnVpbGQ6IGJ1aWxkXG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnUGFnZVNlcnZpY2UnLCBbJyRodHRwJywgJyRxJywgJ0FwaVVybEJ1aWxkZXJTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCAkcSwgdXJsQnVpbGRlcikge1xuICAgIHZhciB1cGRhdGVQYWdlc09ic2VydmVycyA9IFtdO1xuXG4gICAgdmFyIGdldFBhZ2UgPSBmdW5jdGlvbiAocGFnZSwgZm9ybWF0KSB7XG4gICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJ2h0bWwnO1xuICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKSxcbiAgICAgICAgICByZXF1ZXN0VXJsID0gdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAncGFnZS8nICsgcGFnZSk7XG5cbiAgICAgIGlmIChmb3JtYXQgPT09ICdtYXJrZG93bicpXG4gICAgICB7XG4gICAgICAgIHJlcXVlc3RVcmwgKz0gJz9mb3JtYXQ9bWFya2Rvd24nO1xuICAgICAgfVxuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogcmVxdWVzdFVybFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChwYWdlQ29udGVudCwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYWdlQ29udGVudCk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gc3RhdHVzID09PSA0MDQgPyAnQ29udGVudCBub3QgZm91bmQnIDogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yOiAnICsgZXJyb3JNZXNzYWdlO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgc2F2ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUsIGNvbW1pdE1lc3NhZ2UsIG1hcmtkb3duKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgIHVybDogdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAncGFnZS8nICsgcGFnZU5hbWUpLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGNvbW1pdE1lc3NhZ2U6IGNvbW1pdE1lc3NhZ2UsXG4gICAgICAgICAgbWFya2Rvd246IG1hcmtkb3duXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAocGFnZUNvbnRlbnQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocGFnZUNvbnRlbnQpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZXJyb3JNZXNzYWdlLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IHN0YXR1cyA9PT0gNDA0ID8gJ0NvbnRlbnQgbm90IGZvdW5kJyA6ICdVbmV4cGVjdGVkIHNlcnZlciBlcnJvcjogJyArIGVycm9yTWVzc2FnZTtcbiAgICAgICAgZXJyb3IuY29kZSA9IHN0YXR1cztcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGRlbGV0ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgdXJsOiB1cmxCdWlsZGVyLmJ1aWxkKCcvYXBpLycsICdwYWdlLycgKyBwYWdlTmFtZSlcbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAocGFnZUNvbnRlbnQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocGFnZUNvbnRlbnQpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZXJyb3JNZXNzYWdlLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoKTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IHN0YXR1cyA9PT0gNDA0ID8gJ0NvbnRlbnQgbm90IGZvdW5kJyA6ICdVbmV4cGVjdGVkIHNlcnZlciBlcnJvcjogJyArIGVycm9yTWVzc2FnZTtcbiAgICAgICAgZXJyb3IuY29kZSA9IHN0YXR1cztcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG4gICAgdmFyIGdldFBhZ2VzID0gZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAncGFnZXMnLCBzZXR0aW5ncyksXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgICB9KVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBwYWdlcyA9IGRhdGEgfHwgW107XG5cbiAgICAgICAgbm90aWZ5T2JzZXJ2ZXJzKHBhZ2VzKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwYWdlcyk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gc3RhdHVzID09PSA0MDQgPyAnQ29udGVudCBub3QgZm91bmQnIDogJ1VuZXhwZWN0ZWQgc2VydmVyIGVycm9yOiAnICsgZXJyb3JNZXNzYWdlO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICB2YXIgZmluZFN0YXJ0UGFnZSA9IGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgdmFyIHBhZ2VzVG9GaW5kID0gWydpbmRleCcsICdob21lJywgJ3JlYWRtZSddO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzVG9GaW5kLmxlbmd0aCA7IGkrKykge1xuICAgICAgICB2YXIgc3RhcnRQYWdlID0gZmluZFBhZ2UocGFnZXMsIHBhZ2VzVG9GaW5kW2ldKTtcbiAgICAgICAgaWYgKHN0YXJ0UGFnZSAhPT0gdW5kZWZpbmVkICYmIHN0YXJ0UGFnZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHN0YXJ0UGFnZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICB2YXIgZmluZFBhZ2UgPSBmdW5jdGlvbiAocGFnZXMsIHBhZ2VOYW1lKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwYWdlTmFtZSA9PT0gcGFnZXNbaV0ubmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHBhZ2VzW2ldLm5hbWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAnJztcbiAgICB9O1xuXG4gICAgdmFyIHJlZ2lzdGVyT2JzZXJ2ZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgIHVwZGF0ZVBhZ2VzT2JzZXJ2ZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB2YXIgbm90aWZ5T2JzZXJ2ZXJzID0gZnVuY3Rpb24gKHBhZ2VzKSB7XG4gICAgICBhbmd1bGFyLmZvckVhY2godXBkYXRlUGFnZXNPYnNlcnZlcnMsIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayhwYWdlcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRTdGFydFBhZ2U6IGZpbmRTdGFydFBhZ2UsXG4gICAgICBnZXRQYWdlOiBnZXRQYWdlLFxuICAgICAgc2F2ZVBhZ2U6IHNhdmVQYWdlLFxuICAgICAgZGVsZXRlUGFnZTogZGVsZXRlUGFnZSxcbiAgICAgIGdldFBhZ2VzOiBnZXRQYWdlcyxcbiAgICAgIHJlZ2lzdGVyT2JzZXJ2ZXI6IHJlZ2lzdGVyT2JzZXJ2ZXJcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdTZWFyY2hTZXJ2aWNlJywgWyckaHR0cCcsICckcScsICdBcGlVcmxCdWlsZGVyU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgJHEsIHVybEJ1aWxkZXIpIHtcbiAgICB2YXIgc2VhcmNoU2VydmljZUluc3RhbmNlID0ge307XG4gICAgc2VhcmNoU2VydmljZUluc3RhbmNlLnNlYXJjaFJlc3VsdCA9ICcnO1xuXG4gICAgdmFyIHNlYXJjaCA9IGZ1bmN0aW9uICh0ZXh0VG9TZWFyY2gpIHtcbiAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIHVybDogdXJsQnVpbGRlci5idWlsZCgnL2FwaS8nLCAnc2VhcmNoJyksXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBkYXRhOiB7IHRleHRUb1NlYXJjaDogdGV4dFRvU2VhcmNoIH1cbiAgICAgIH0pXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoc2VhcmNoUmVzdWx0LCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHNlYXJjaFJlc3VsdCk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uIChzZWFyY2hlZFRleHQsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChzZWFyY2hlZFRleHQpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2VhcmNoOiBzZWFyY2gsXG4gICAgICBzZWFyY2hTZXJ2aWNlSW5zdGFuY2U6IHNlYXJjaFNlcnZpY2VJbnN0YW5jZVxuICAgIH07XG5cbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5zZXJ2aWNlcycpKTtcblxuIiwiKGZ1bmN0aW9uIChzZXJ2aWNlcykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgc2VydmljZXMuZmFjdG9yeSgnU2VydmVyQ29uZmlnU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCBmdW5jdGlvbiAoJGh0dHAsICRxKSB7XG4gICAgdmFyIGdldENvbmZpZyA9IGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogJy9hcGkvc2VydmVyY29uZmlnJyxcbiAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbid9LFxuICAgICAgfSlcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSBzdGF0dXMgPT09IDQwNCA/ICdDb250ZW50IG5vdCBmb3VuZCcgOiAnVW5leHBlY3RlZCBzZXJ2ZXIgZXJyb3InO1xuICAgICAgICBlcnJvci5jb2RlID0gc3RhdHVzO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgZ2V0Q29uZmlnOiBnZXRDb25maWdcbiAgICB9O1xuICB9XSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLnNlcnZpY2VzJykpO1xuXG4iLCIoZnVuY3Rpb24gKHNlcnZpY2VzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBzZXJ2aWNlcy5mYWN0b3J5KCdTZXR0aW5nc1NlcnZpY2UnLCBbJyRhbmd1bGFyQ2FjaGVGYWN0b3J5JywgZnVuY3Rpb24gKCRhbmd1bGFyQ2FjaGVGYWN0b3J5KSB7XG4gICAgdmFyIGNhY2hlID0gJGFuZ3VsYXJDYWNoZUZhY3RvcnkoJ21kd2lraScsIHsgc3RvcmFnZU1vZGU6ICdsb2NhbFN0b3JhZ2UnIH0pO1xuXG4gICAgdmFyIGdldERlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHByb3ZpZGVyOiAnZ2l0aHViJyxcbiAgICAgICAgZ2l0aHViVXNlcjogJ21kd2lraScsXG4gICAgICAgIGdpdGh1YlJlcG9zaXRvcnk6ICd3aWtpJyxcbiAgICAgICAgdXJsOiAnbWR3aWtpL3dpa2knLFxuICAgICAgICBzdGFydFBhZ2U6ICdpbmRleCdcbiAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBpc0RlZmF1bHRTZXR0aW5ncyA9IGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgcmV0dXJuIGFuZ3VsYXIuZXF1YWxzKHNldHRpbmdzLCB0aGlzLmdldERlZmF1bHRTZXR0aW5ncygpKTtcbiAgICB9O1xuXG4gICAgdmFyIGdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZXR0aW5ncyA9IGNhY2hlLmdldCgnc2V0dGluZ3MnKTtcbiAgICAgIGlmIChzZXR0aW5ncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNldHRpbmdzID0gdGhpcy5nZXREZWZhdWx0U2V0dGluZ3MoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICB9O1xuXG4gICAgdmFyIHB1dCA9IGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgY2FjaGUucHV0KCdzZXR0aW5ncycsIHNldHRpbmdzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogZ2V0LFxuICAgICAgcHV0OiBwdXQsXG4gICAgICBnZXREZWZhdWx0U2V0dGluZ3M6IGdldERlZmF1bHRTZXR0aW5ncyxcbiAgICAgIGlzRGVmYXVsdFNldHRpbmdzOiBpc0RlZmF1bHRTZXR0aW5nc1xuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuc2VydmljZXMnKSk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0F1dGhDdHJsJywgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckd2luZG93JywgJ0F1dGhTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkd2luZG93LCBhdXRoU2VydmljZSkge1xuICAgICAgJHNjb3BlLmlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgJHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICBhdXRoU2VydmljZS5nZXRBdXRoZW50aWNhdGVkVXNlcigpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgJHNjb3BlLnVzZXIgPSB1c2VyIHx8IG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR3aW5kb3cubG9jYXRpb24uaHJlZiA9ICdhdXRoL2dpdGh1Yj9wYWdlPScgKyAkcm9vdFNjb3BlLnBhZ2VOYW1lO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXV0aFNlcnZpY2UubG9nb3V0KClcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJy9naXQvY29ubmVjdCc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuJHdhdGNoKCd1c2VyJywgZnVuY3Rpb24gKG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmlzQXV0aGVudGljYXRlZCA9IG5ld1ZhbHVlICE9PSBudWxsO1xuICAgICAgICAkc2NvcGUuaXNBdXRoZW50aWNhdGVkID0gJHJvb3RTY29wZS5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaXNBdXRoZW50aWNhdGVkJywgeyBpc0F1dGhlbnRpY2F0ZWQ6ICRyb290U2NvcGUuaXNBdXRoZW50aWNhdGVkIH0pO1xuICAgICAgfSk7XG5cbiAgICB9XG4gIF0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignQ29tbWl0TWVzc2FnZURpYWxvZ0N0cmwnLCBbJyRzY29wZScsICckbWREaWFsb2cnLCAnRWRpdG9yU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRzY29wZSwgJG1kRGlhbG9nLCBlZGl0b3JTZXJ2aWNlKSB7XG4gICAgICAkc2NvcGUucGFnZU5hbWUgPSAnJztcbiAgICAgICRzY29wZS5jb21taXRNZXNzYWdlID0gJ1NvbWUgY2hhbmdlcyBmb3IgJyArICRzY29wZS5wYWdlTmFtZTtcblxuICAgICAgZWRpdG9yU2VydmljZS5nZXRTZWxlY3RlZFRleHQoKS50aGVuKGZ1bmN0aW9uIChzZWxlY3RlZFRleHQpIHtcbiAgICAgICAgaWYgKHNlbGVjdGVkVGV4dCkge1xuICAgICAgICAgICRzY29wZS5jb21taXRNZXNzYWdlID0gc2VsZWN0ZWRUZXh0O1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJG1kRGlhbG9nLmhpZGUoKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmNsb3NlRGlhbG9nID0gZnVuY3Rpb24gKGNhbmNlbCkge1xuICAgICAgICAkbWREaWFsb2cuaGlkZSh7XG4gICAgICAgICAgY2FuY2VsOiBjYW5jZWwsXG4gICAgICAgICAgY29tbWl0TWVzc2FnZTogJHNjb3BlLmNvbW1pdE1lc3NhZ2VcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cbiAgXSk7XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpO1xuXG4iLCIoZnVuY3Rpb24gKGNvbnRyb2xsZXJzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBjb250cm9sbGVycy5jb250cm9sbGVyKCdDb250ZW50Q3RybCcsXG4gICAgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckcm91dGVQYXJhbXMnLCAnJGxvY2F0aW9uJywgJyRxJywgJyR3aW5kb3cnLFxuICAgICAnJG1kVG9hc3QnLCAnJG1kRGlhbG9nJywgJ1BhZ2VTZXJ2aWNlJywgJ1NldHRpbmdzU2VydmljZScsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJHJvdXRlUGFyYW1zLCAkbG9jYXRpb24sICRxLCAkd2luZG93LFxuICAgICAgICAgICAgICAkbWRUb2FzdCwgJG1kRGlhbG9nLCBwYWdlU2VydmljZSwgc2V0dGluZ3NTZXJ2aWNlKSB7XG4gICAgICAkc2NvcGUuY29udGVudCA9ICcnO1xuICAgICAgJHNjb3BlLm1hcmtkb3duID0gJyc7XG4gICAgICAkc2NvcGUucGFnZU5hbWUgPSAnJztcbiAgICAgICRzY29wZS5yZWZyZXNoID0gZmFsc2U7XG4gICAgICAkc2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gZmFsc2U7XG5cbiAgICAgIHZhciBzZXR0aW5ncyA9IHNldHRpbmdzU2VydmljZS5nZXQoKTtcbiAgICAgIHZhciBzdGFydFBhZ2UgPSBzZXR0aW5ncy5zdGFydFBhZ2UgfHwgJ2luZGV4JztcbiAgICAgIHZhciBwYWdlTmFtZSA9ICRyb3V0ZVBhcmFtcy5wYWdlIHx8IHN0YXJ0UGFnZTtcblxuICAgICAgdmFyIHByZXBhcmVMaW5rcyA9IGZ1bmN0aW9uIChodG1sLCBzZXR0aW5ncykge1xuICAgICAgICB2YXIgJGRvbSA9ICQoJzxkaXY+JyArIGh0bWwgKyAnPC9kaXY+Jyk7XG5cbiAgICAgICAgJGRvbS5maW5kKCdhW2hyZWZePVwid2lraS9cIl0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgJGxpbmsgPSAkKHRoaXMpO1xuICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCAkbGluay5hdHRyKCdocmVmJykuc3Vic3RyaW5nKDQpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLnByb3ZpZGVyID09PSAnZ2l0aHViJykge1xuICAgICAgICAgICRkb20uZmluZCgnYVtocmVmXj1cIi9zdGF0aWMvXCJdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgJGxpbmsgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIG5ld0xpbmsgPSAnL3N0YXRpYy8nLmNvbmNhdChzZXR0aW5ncy5naXRodWJVc2VyLCAnLycsIHNldHRpbmdzLmdpdGh1YlJlcG9zaXRvcnksICcvJywgJGxpbmsuYXR0cignaHJlZicpLnN1YnN0cmluZygnL3N0YXRpYy8nLmxlbmd0aCkpO1xuICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0xpbmspO1xuICAgICAgICAgICAgJGxpbmsuYXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRkb20uZmluZCgnYVtocmVmXj1cIi9zdGF0aWMvXCJdJykuYXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkZG9tLmh0bWwoKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBzaG93RXJyb3IgPSBmdW5jdGlvbiAoZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgJG1kVG9hc3Quc2ltcGxlKClcbiAgICAgICAgICAgIC5jb250ZW50KGVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgIC5wb3NpdGlvbignYm90dG9tIGZpdCcpXG4gICAgICAgICAgICAuaGlkZURlbGF5KDMwMDApXG4gICAgICAgICk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgZ2V0UGFnZSA9IGZ1bmN0aW9uIChwYWdlTmFtZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIHBhZ2VTZXJ2aWNlLmdldFBhZ2UocGFnZU5hbWUpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHBhZ2VDb250ZW50KSB7XG4gICAgICAgICAgICAkc2NvcGUucGFnZU5hbWUgPSBwYWdlTmFtZTtcbiAgICAgICAgICAgICRyb290U2NvcGUucGFnZU5hbWUgPSBwYWdlTmFtZTtcbiAgICAgICAgICAgICRzY29wZS5jb250ZW50ID0gcHJlcGFyZUxpbmtzKHBhZ2VDb250ZW50LCBzZXR0aW5ncyk7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAocGFnZU5hbWUgPT09IHN0YXJ0UGFnZSAmJiBlcnJvci5jb2RlID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9naXQvY29ubmVjdCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2hvd0Vycm9yKCdDb250ZW50IG5vdCBmb3VuZCEnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9O1xuXG4gICAgICB2YXIgc2hvd09ySGlkZUVkaXRvciA9IGZ1bmN0aW9uIChpc1Zpc2libGUpIHtcbiAgICAgICAgJHNjb3BlLmlzRWRpdG9yVmlzaWJsZSA9IGlzVmlzaWJsZTtcbiAgICAgICAgJHJvb3RTY29wZS5pc0VkaXRvclZpc2libGUgPSBpc1Zpc2libGU7XG4gICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnaXNFZGl0b3JWaXNpYmxlJywgeyBpc0VkaXRvclZpc2libGU6IGlzVmlzaWJsZSB9KTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBzaG93RWRpdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzaG93T3JIaWRlRWRpdG9yKHRydWUpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGhpZGVFZGl0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkcm91dGVQYXJhbXMuZWRpdCkge1xuICAgICAgICAgICRsb2NhdGlvbi5zZWFyY2goe30pO1xuICAgICAgICB9XG4gICAgICAgIHNob3dPckhpZGVFZGl0b3IoZmFsc2UpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGVkaXRQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lKSB7XG4gICAgICAgIHNob3dFZGl0b3IoKTtcblxuICAgICAgICBwYWdlU2VydmljZS5nZXRQYWdlKHBhZ2VOYW1lLCAnbWFya2Rvd24nKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChtYXJrZG93bikge1xuICAgICAgICAgICAgJHNjb3BlLm1hcmtkb3duID0gbWFya2Rvd247XG4gICAgICAgICAgICAkc2NvcGUucmVmcmVzaCA9IHRydWU7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAocGFnZU5hbWUgPT09IHN0YXJ0UGFnZSAmJiBlcnJvci5jb2RlID09PSA0MDQpIHtcbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9naXQvY29ubmVjdCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2hvd0Vycm9yKCdDb250ZW50IG5vdCBmb3VuZDogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNhdmVQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lLCBjb21taXRNZXNzYWdlLCBjb250ZW50KSB7XG4gICAgICAgIHBhZ2VTZXJ2aWNlLnNhdmVQYWdlKHBhZ2VOYW1lLCBjb21taXRNZXNzYWdlLCBjb250ZW50KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChwYWdlQ29udGVudCkge1xuICAgICAgICAgICAgJHNjb3BlLmNvbnRlbnQgPSBwcmVwYXJlTGlua3MocGFnZUNvbnRlbnQsIHNldHRpbmdzKTtcbiAgICAgICAgICAgIGhpZGVFZGl0b3IoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNob3dFcnJvcignU2F2ZSBjdXJyZW50IHBhZ2UgZmFpbGVkOiAnICsgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuY2FuY2VsRWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaGlkZUVkaXRvcigpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNhdmVDaGFuZ2VzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICRtZERpYWxvZy5zaG93KHtcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJyRtZERpYWxvZycsICdFZGl0b3JTZXJ2aWNlJywgQ29tbWl0TWVzc2FnZURpYWxvZ0NvbnRyb2xsZXJdLFxuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnY29tbWl0TWVzc2FnZURpYWxvZycsXG4gICAgICAgICAgdGFyZ2V0RXZlbnQ6IGV2ZW50LFxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICBpZiAoIXJlc3VsdC5jYW5jZWwpIHtcbiAgICAgICAgICAgIHNhdmVQYWdlKCRzY29wZS5wYWdlTmFtZSwgcmVzdWx0LmNvbW1pdE1lc3NhZ2UsICRzY29wZS5tYXJrZG93bik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5uYXZpZ2F0ZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICAgICAgaWYgKCR3aW5kb3cuaGlzdG9yeS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnYmFjaycpIHtcbiAgICAgICAgICAkd2luZG93Lmhpc3RvcnkuYmFjaygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICR3aW5kb3cuaGlzdG9yeS5mb3J3YXJkKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGdldFBhZ2UocGFnZU5hbWUpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJHJvdXRlUGFyYW1zLmVkaXQgJiYgJHJvb3RTY29wZS5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgICBlZGl0UGFnZShwYWdlTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaGlkZUVkaXRvcigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG4gIGZ1bmN0aW9uIENvbW1pdE1lc3NhZ2VEaWFsb2dDb250cm9sbGVyKCRyb290U2NvcGUsICRzY29wZSwgJG1kRGlhbG9nLCBlZGl0b3JTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmNvbW1pdE1lc3NhZ2UgPSAnU29tZSBjaGFuZ2VzIGZvciAnICsgJHJvb3RTY29wZS5wYWdlTmFtZTtcblxuICAgIGVkaXRvclNlcnZpY2UuZ2V0U2VsZWN0ZWRUZXh0KCkudGhlbihmdW5jdGlvbiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgICBpZiAoc2VsZWN0ZWRUZXh0KSB7XG4gICAgICAgICRzY29wZS5jb21taXRNZXNzYWdlID0gc2VsZWN0ZWRUZXh0O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHNjb3BlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICRtZERpYWxvZy5oaWRlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICRtZERpYWxvZy5jYW5jZWwoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmNsb3NlRGlhbG9nID0gZnVuY3Rpb24gKGNhbmNlbCkge1xuICAgICAgJG1kRGlhbG9nLmhpZGUoe1xuICAgICAgICBjYW5jZWw6IGNhbmNlbCxcbiAgICAgICAgY29tbWl0TWVzc2FnZTogJHNjb3BlLmNvbW1pdE1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuXG5cblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycywgYW5ndWxhciwgZG9jdW1lbnQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0VkaXRDb250ZW50Q3RybCcsIFsnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJGxvY2F0aW9uJywgJyR3aW5kb3cnLCAnJG1kRGlhbG9nJywgJyRtZFRvYXN0JywgJ1BhZ2VTZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHNjb3BlLCAkbG9jYXRpb24sICR3aW5kb3csICRtZERpYWxvZywgJG1kVG9hc3QsIHBhZ2VTZXJ2aWNlKSB7XG4gICAgICB2YXIgbm9uRWRpdGFibGVQYXRocyA9IFsnL3NlYXJjaCcsICcvZ2l0L2Nvbm5lY3QnXTtcblxuICAgICAgJHNjb3BlLmlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmlzRWRpdG9yVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gZmFsc2U7XG4gICAgICAkc2NvcGUucG9wdXBJc1Zpc2libGUgPSBmYWxzZTtcblxuICAgICAgdmFyIGlzRWRpdFBhZ2VQb3NzaWJsZSA9IGZ1bmN0aW9uIChpc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsIHBhdGgpIHtcbiAgICAgICAgdmFyIGNhbkVkaXRQYWdlID0gaXNBdXRoZW50aWNhdGVkO1xuXG4gICAgICAgIGlmIChjYW5FZGl0UGFnZSkge1xuICAgICAgICAgIG5vbkVkaXRhYmxlUGF0aHMuZm9yRWFjaChmdW5jdGlvbiAobm9uRWRpdGFibGVQYXRoKSB7XG4gICAgICAgICAgICBpZiAobm9uRWRpdGFibGVQYXRoID09PSBwYXRoKSB7XG4gICAgICAgICAgICAgIGNhbkVkaXRQYWdlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbkVkaXRQYWdlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHNob3dFcnJvciA9IGZ1bmN0aW9uIChlcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgJG1kVG9hc3Quc2hvdyhcbiAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgLmNvbnRlbnQoZXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gZml0JylcbiAgICAgICAgICAgIC5oaWRlRGVsYXkoMzAwMClcbiAgICAgICAgKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBjcmVhdGVQYWdlID0gZnVuY3Rpb24gKHBhZ2VOYW1lKSB7XG4gICAgICAgIHBhZ2VTZXJ2aWNlLnNhdmVQYWdlKHBhZ2VOYW1lLCAnY3JlYXRlIG5ldyBwYWdlICcgKyBwYWdlTmFtZSwgJyMnICsgcGFnZU5hbWUpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHBhZ2VDb250ZW50KSB7XG4gICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycgKyBwYWdlTmFtZSkuc2VhcmNoKCdlZGl0Jyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBzaG93RXJyb3IoJ0NyZWF0ZSBuZXcgcGFnZSBmYWlsZWQ6ICcgKyBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHZhciByZW1vdmVQYWdlRnJvbVBhZ2VzID0gZnVuY3Rpb24gKHBhZ2VzLCBwYWdlTmFtZSkge1xuICAgICAgICB2YXIgaW5kZXggPSAtMTtcblxuICAgICAgICBwYWdlcy5mb3JFYWNoKGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgICAgICAgaWYgKHBhZ2UubmFtZSA9PT0gcGFnZU5hbWUpIHtcbiAgICAgICAgICAgIGluZGV4ID0gcGFnZXMuaW5kZXhPZihwYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgcGFnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIGRlbGV0ZVBhZ2UgPSBmdW5jdGlvbiAocGFnZU5hbWUpIHtcbiAgICAgICAgcGFnZVNlcnZpY2UuZGVsZXRlUGFnZShwYWdlTmFtZSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZW1vdmVQYWdlRnJvbVBhZ2VzKCRyb290U2NvcGUucGFnZXMsIHBhZ2VOYW1lKTtcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvJyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBzaG93RXJyb3IoJ0RlbGV0ZSB0aGUgY3VycmVudCBwYWdlIGhhcyBiZWVuIGZhaWxlZDogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNob3dPckhpZGVQb3B1cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnBvcHVwSXNWaXNpYmxlID0gISRzY29wZS5wb3B1cElzVmlzaWJsZTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zaG93UG9wdXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5wb3B1cElzVmlzaWJsZSA9IHRydWU7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUucG9wdXBJc1Zpc2libGUgPSBmYWxzZTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jcmVhdGUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJHNjb3BlLmhpZGVQb3B1cCgpO1xuXG4gICAgICAgICRtZERpYWxvZy5zaG93KHtcbiAgICAgICAgICBjb250cm9sbGVyOiBbJyRzY29wZScsICckbWREaWFsb2cnLCBDcmVhdGVOZXdQYWdlQ29udHJvbGxlcl0sXG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICdjcmVhdGVOZXdQYWdlRGlhbG9nJyxcbiAgICAgICAgICB0YXJnZXRFdmVudDogZXZlbnQsXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGRpYWxvZ1Jlc3VsdCkge1xuICAgICAgICAgIGlmICghZGlhbG9nUmVzdWx0LmNhbmNlbCkge1xuICAgICAgICAgICAgY3JlYXRlUGFnZShkaWFsb2dSZXN1bHQucGFnZU5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuZGVsZXRlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICRzY29wZS5oaWRlUG9wdXAoKTtcblxuICAgICAgICBpZiAoJHJvb3RTY29wZS5wYWdlTmFtZSA9PT0gJ2luZGV4Jykge1xuICAgICAgICAgIHZhciBhbGVydERpYWxvZyA9ICRtZERpYWxvZy5hbGVydCgpXG4gICAgICAgICAgICAgIC50aXRsZSgnRGVsZXRlIHN0YXJ0IHBhZ2U/JylcbiAgICAgICAgICAgICAgLmNvbnRlbnQoJ0l0XFwncyBub3QgYSBnb29kIGlkZWEgdG8gZGVsZXRlIHlvdXIgc3RhcnQgcGFnZSEnKVxuICAgICAgICAgICAgICAudGFyZ2V0RXZlbnQoZXZlbnQpXG4gICAgICAgICAgICAgIC5hcmlhTGFiZWwoJ0RlbGV0ZSBzdGFydCBwYWdlIGZvcmJpZGRlbicpXG4gICAgICAgICAgICAgIC5vaygnT2snKTtcblxuICAgICAgICAgICRtZERpYWxvZy5zaG93KGFsZXJ0RGlhbG9nKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nID0gJG1kRGlhbG9nLmNvbmZpcm0oKVxuICAgICAgICAgIC50aXRsZSgnRGVsZXRlIGN1cnJlbnQgcGFnZT8nKVxuICAgICAgICAgIC5jb250ZW50KCdBcmUgeW91IHN1cmUgdGhhdCB5b3Ugd2FudCB0byBkZWxldGUgdGhlIGN1cnJlbnQgcGFnZT8nKVxuICAgICAgICAgIC50YXJnZXRFdmVudChldmVudClcbiAgICAgICAgICAuYXJpYUxhYmVsKCdEZWxldGUgY3VycmVudCBwYWdlPycpXG4gICAgICAgICAgLm9rKCdPaycpXG4gICAgICAgICAgLmNhbmNlbCgnQ2FuY2VsJyk7XG5cbiAgICAgICAgJG1kRGlhbG9nLnNob3coY29uZmlybURpYWxvZylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRlbGV0ZVBhZ2UoJHJvb3RTY29wZS5wYWdlTmFtZSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuZWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnBvcHVwSXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgICRsb2NhdGlvbi5wYXRoKCcvJyArICRyb290U2NvcGUucGFnZU5hbWUpLnNlYXJjaCgnZWRpdCcpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGlzQXV0aGVudGljYXRlZFVucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignaXNBdXRoZW50aWNhdGVkJywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgICRzY29wZS5pc0F1dGhlbnRpY2F0ZWQgPSBkYXRhLmlzQXV0aGVudGljYXRlZDtcbiAgICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gaXNFZGl0UGFnZVBvc3NpYmxlKCRzY29wZS5pc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsICRsb2NhdGlvbi5wYXRoKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBpc0VkaXRvclZpc2libGVVbnJlZ2lzdGVyID0gJHJvb3RTY29wZS4kb24oJ2lzRWRpdG9yVmlzaWJsZScsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICAgICAgICAkc2NvcGUuaXNFZGl0b3JWaXNpYmxlID0gZGF0YS5pc0VkaXRvclZpc2libGU7XG4gICAgICB9KTtcblxuICAgICAgdmFyIHJvdXRlQ2hhbmdlU3VjY2Vzc1VucmVnaXN0ZXIgPSAkcm9vdFNjb3BlLiRvbignJHJvdXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChlLCBjdXJyZW50LCBwcmUpIHtcbiAgICAgICAgJHNjb3BlLmNhbkVkaXRQYWdlID0gaXNFZGl0UGFnZVBvc3NpYmxlKCRzY29wZS5pc0F1dGhlbnRpY2F0ZWQsIG5vbkVkaXRhYmxlUGF0aHMsICRsb2NhdGlvbi5wYXRoKCkpO1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jYW5FZGl0UGFnZSA9IGlzRWRpdFBhZ2VQb3NzaWJsZSgkc2NvcGUuaXNBdXRoZW50aWNhdGVkLCBub25FZGl0YWJsZVBhdGhzLCAkbG9jYXRpb24ucGF0aCgpKTtcblxuICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlzQXV0aGVudGljYXRlZFVucmVnaXN0ZXIoKTtcbiAgICAgICAgaXNFZGl0b3JWaXNpYmxlVW5yZWdpc3RlcigpO1xuICAgICAgICByb3V0ZUNoYW5nZVN1Y2Nlc3NVbnJlZ2lzdGVyKCk7XG4gICAgICB9KTtcblxuICAgIH1cbiAgXSk7XG5cbiAgZnVuY3Rpb24gQ3JlYXRlTmV3UGFnZUNvbnRyb2xsZXIoJHNjb3BlLCAkbWREaWFsb2cpIHtcbiAgICAkc2NvcGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgJG1kRGlhbG9nLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgJG1kRGlhbG9nLmNhbmNlbCgpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2xvc2VEaWFsb2cgPSBmdW5jdGlvbiAoY2FuY2VsKSB7XG4gICAgICAkbWREaWFsb2cuaGlkZSh7XG4gICAgICAgIGNhbmNlbDogY2FuY2VsLFxuICAgICAgICBwYWdlTmFtZTogJHNjb3BlLnBhZ2VOYW1lXG4gICAgICB9KTtcbiAgICB9O1xuICB9XG5cbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSwgd2luZG93LmFuZ3VsYXIsIHdpbmRvdy5kb2N1bWVudCk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ0dpdENvbm5lY3RDdHJsJywgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckbG9jYXRpb24nLCAnJG1kVG9hc3QnLCAnUGFnZVNlcnZpY2UnLCAnU2V0dGluZ3NTZXJ2aWNlJywgJ1NlcnZlckNvbmZpZ1NlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICRsb2NhdGlvbiwgJG1kVG9hc3QsIHBhZ2VTZXJ2aWNlLCBzZXR0aW5nc1NlcnZpY2UsIHNlcnZlckNvbmZpZ1NlcnZpY2UpIHtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHNldHRpbmdzU2VydmljZS5nZXQoKTtcbiAgICAgICRzY29wZS5wcm92aWRlciA9IHNldHRpbmdzLnByb3ZpZGVyIHx8ICdnaXRodWInO1xuICAgICAgJHNjb3BlLmdpdGh1YlVzZXIgPSBzZXR0aW5ncy5naXRodWJVc2VyIHx8ICdtZHdpa2knO1xuICAgICAgJHNjb3BlLnJlcG9zaXRvcnlOYW1lID0gc2V0dGluZ3MuZ2l0aHViUmVwb3NpdG9yeSB8fCAnd2lraSc7XG5cbiAgICAgICRzY29wZS5naXRodWJVc2VyUGxhY2VIb2xkZXJUZXh0ID0gJ0VudGVyIGhlcmUgeW91ciBHaXRIdWIgdXNlcm5hbWUnO1xuICAgICAgJHNjb3BlLnJlcG9zaXRvcnlOYW1lUGxhY2VIb2xkZXJUZXh0ID0gJ0VudGVyIGhlcmUgdGhlIG5hbWUgb2YgdGhlIHJlcG9zaXRvcnknO1xuXG4gICAgICAkc2NvcGUuaXNCdXN5ID0gZmFsc2U7XG4gICAgICAkc2NvcGUuaGFzRXJyb3IgPSBmYWxzZTtcblxuICAgICAgJHNjb3BlLmNvbm5lY3QgPSBmdW5jdGlvbiAoc3VjY2Vzc01lc3NhZ2UpIHtcbiAgICAgICAgJHNjb3BlLmlzQnVzeSA9IHRydWU7XG5cbiAgICAgICAgdmFyIHJlc3Bvc2l0b3J5VXJsID0gJHNjb3BlLmdpdGh1YlVzZXIgKyAnLycgKyAkc2NvcGUucmVwb3NpdG9yeU5hbWU7XG5cbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xuICAgICAgICAgIHByb3ZpZGVyOiAkc2NvcGUucHJvdmlkZXIsXG4gICAgICAgICAgdXJsOiByZXNwb3NpdG9yeVVybCxcbiAgICAgICAgICBnaXRodWJSZXBvc2l0b3J5OiAkc2NvcGUucmVwb3NpdG9yeU5hbWUsXG4gICAgICAgICAgZ2l0aHViVXNlcjogJHNjb3BlLmdpdGh1YlVzZXJcbiAgICAgICAgfTtcblxuICAgICAgICBwYWdlU2VydmljZS5nZXRQYWdlcyhzZXR0aW5ncylcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAocGFnZXMpIHtcbiAgICAgICAgICAgIHZhciBzdGFydFBhZ2UgPSBwYWdlU2VydmljZS5maW5kU3RhcnRQYWdlKHBhZ2VzKTtcbiAgICAgICAgICAgIGlmIChzdGFydFBhZ2UgIT09IHVuZGVmaW5lZCAmJiBzdGFydFBhZ2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBzZXR0aW5ncy5zdGFydFBhZ2UgPSBzdGFydFBhZ2U7XG4gICAgICAgICAgICAgIHNldHRpbmdzU2VydmljZS5wdXQoc2V0dGluZ3MpO1xuXG4gICAgICAgICAgICAgICRtZFRvYXN0LnNob3coXG4gICAgICAgICAgICAgICAgJG1kVG9hc3Quc2ltcGxlKClcbiAgICAgICAgICAgICAgICAgIC5jb250ZW50KCdDb25uZWN0ZWQgdG8gZ2l0aHViIGFzIHVzZXIgJyArICRzY29wZS5naXRodWJVc2VyKVxuICAgICAgICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gbGVmdCcpXG4gICAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDUwMDApXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy8nKTtcbiAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdPbkdpdENvbm5lY3RlZCcsIHsgc2V0dGluZ3M6IHNldHRpbmdzfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICAgICAgICRtZFRvYXN0LnNpbXBsZSgpXG4gICAgICAgICAgICAgICAgICAuY29udGVudCgnTm8gc3RhcnRwYWdlIHdhcyBmb3VuZCEnKVxuICAgICAgICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gbGVmdCcpXG4gICAgICAgICAgICAgICAgICAuaGlkZURlbGF5KDUwMDApXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAkbWRUb2FzdC5zaG93KFxuICAgICAgICAgICAgICAkbWRUb2FzdC5zaW1wbGUoKVxuICAgICAgICAgICAgICAgIC5jb250ZW50KCdBbiBlcnJvciBvY2N1cnJlZCB3aGlsZSBjb25uZWN0aW9uIHRvIHRoZSBnaXQtcmVwb3NpdG9yeTogJyArIGVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgLnBvc2l0aW9uKCdib3R0b20gbGVmdCcpXG4gICAgICAgICAgICAgICAgLmhpZGVEZWxheSg1MDAwKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5pc0J1c3kgPSBmYWxzZTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICB9XG4gIF0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignUGFnZXNDdHJsJywgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICdQYWdlU2VydmljZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsIHBhZ2VTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLnBhZ2VzID0gW107XG4gICAgJHJvb3RTY29wZS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblxuICAgIHZhciB1cGRhdGVQYWdlcyA9IGZ1bmN0aW9uIChwYWdlcykge1xuICAgICAgJHNjb3BlLnBhZ2VzID0gcGFnZXMgfHwgW107XG4gICAgICAkcm9vdFNjb3BlLnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuICAgIH07XG5cbiAgICBwYWdlU2VydmljZS5nZXRQYWdlcygpXG4gICAgICAudGhlbihmdW5jdGlvbiAocGFnZXMpIHtcbiAgICAgICAgdXBkYXRlUGFnZXMocGFnZXMpO1xuICAgICAgICBwYWdlU2VydmljZS5yZWdpc3Rlck9ic2VydmVyKHVwZGF0ZVBhZ2VzKTtcbiAgICAgIH0pO1xuXG4gICAgJHNjb3BlLmV4Y2x1ZGVEZWZhdWx0UGFnZSA9IGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgICB2YXIgZXhjbHVkZXMgPSBbJ2luZGV4JywgJ2hvbWUnLCAncmVhZG1lJ107XG4gICAgICB2YXIgZXhjbHVkZVBhZ2UgPSBmYWxzZTtcblxuICAgICAgYW5ndWxhci5mb3JFYWNoKGV4Y2x1ZGVzLCBmdW5jdGlvbiAoZXhjbHVkZSkge1xuICAgICAgICBpZiAocGFnZS5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGV4Y2x1ZGUpIHtcbiAgICAgICAgICBleGNsdWRlUGFnZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gIWV4Y2x1ZGVQYWdlO1xuICAgIH07XG4gIH1dKTtcbn0pKGFuZ3VsYXIubW9kdWxlKCdtZHdpa2kuY29udHJvbGxlcnMnKSk7XG5cbiIsIihmdW5jdGlvbiAoY29udHJvbGxlcnMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGNvbnRyb2xsZXJzLmNvbnRyb2xsZXIoJ1NlYXJjaEN0cmwnLCBbJyRzY29wZScsICckbG9jYXRpb24nLCAnJHJvdXRlJywgJ1NlYXJjaFNlcnZpY2UnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9jYXRpb24sICRyb3V0ZSwgc2VhcmNoU2VydmljZSkge1xuICAgICRzY29wZS50ZXh0VG9TZWFyY2ggPSAnJztcbiAgICAkc2NvcGUuc2VhcmNoUmVzdWx0ID0gc2VhcmNoU2VydmljZS5zZWFyY2hSZXN1bHQ7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSAnJztcblxuICAgICRzY29wZS5zZWFyY2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWFyY2hTZXJ2aWNlLnNlYXJjaCgkc2NvcGUudGV4dFRvU2VhcmNoKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gJ1NlYXJjaCBzdWNjZXNzZnVsbHkgZmluaXNoZWQnO1xuICAgICAgICAgIHNlYXJjaFNlcnZpY2Uuc2VhcmNoUmVzdWx0ID0gZGF0YTtcblxuICAgICAgICAgIHZhciBuZXdMb2NhdGlvbiA9ICcvc2VhcmNoJztcbiAgICAgICAgICBpZiAoJGxvY2F0aW9uLnBhdGgoKSA9PT0gbmV3TG9jYXRpb24pIHtcbiAgICAgICAgICAgICRyb3V0ZS5yZWxvYWQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgobmV3TG9jYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgdmFyIHNlYXJjaGVkVGV4dCA9IGVycm9yIHx8ICcnO1xuICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gJ0FuIGVycm9yIG9jY3VycmVkIHdoaWxlIHNlYXJjaGluZyBmb3IgdGhlIHRleHQ6ICcgKyBzZWFyY2hlZFRleHQudG9TdHJpbmcoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgfV0pO1xufSkoYW5ndWxhci5tb2R1bGUoJ21kd2lraS5jb250cm9sbGVycycpKTtcblxuIiwiKGZ1bmN0aW9uIChjb250cm9sbGVycykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgY29udHJvbGxlcnMuY29udHJvbGxlcignU2lkZWJhckN0cmwnLCBbJyRtZFNpZGVuYXYnLCBzaWRlYmFyQ3RybF0pO1xuXG4gIGZ1bmN0aW9uIHNpZGViYXJDdHJsKCRtZFNpZGVuYXYpIHtcbiAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgIHRoaXMudG9nZ2xlTGlzdCA9IHRvZ2dsZUxpc3Q7XG4gICAgdGhpcy5pc05vdExvY2tlZE9wZW4gPSBpc05vdExvY2tlZE9wZW47XG5cbiAgICBmdW5jdGlvbiB0b2dnbGVMaXN0KGlkKSB7XG4gICAgICAkbWRTaWRlbmF2KGlkKS50b2dnbGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc05vdExvY2tlZE9wZW4oaWQpIHtcbiAgICAgIHJldHVybiAhJG1kU2lkZW5hdihpZCkuaXNMb2NrZWRPcGVuKCk7XG4gICAgfVxuICB9XG59KShhbmd1bGFyLm1vZHVsZSgnbWR3aWtpLmNvbnRyb2xsZXJzJykpOyJdfQ==