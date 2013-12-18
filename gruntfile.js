module.exports = function (grunt) {
  'use strict';

  // Load Grunt tasks declared in the package.json file
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: [
        '.jshintrc',
        'gruntfile.js',
        'app.js',
        'api/**/*.js',
        'lib/**/*.js',
        'test/**/*.js',
        'public/js/app.js',
        'public/js/directives.js',
        'public/js/filters.js',
        'public/js/services/*.js',
        'public/js/controllers/*.js',
        'test_client/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    cssmin: {
      minify: {
        expand: true,
        cwd: 'public/css/',
        src: ['styles.css'],
        dest: 'public/css/',
        ext: '.min.css'
      }
    },

    uglify: {
      scripts: {
        options: {
          // the banner is inserted at the top of the output
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        },
        files: {
          'public/js/scripts.min.js': ['public/js/scripts.js'],
        }
      }
    },

    concat: {
      js: {
        src: [
          'bower/jquery/jquery.js',
          'bower/bootstrap/dist/js/bootstrap.js',
          'bower/angular/angular.js',
          'bower/angular-animate/angular-animate.js',
          'bower/angular-animate/angular-animate.js',
          'bower/angular-resource/angular-resource.js',
          'bower/angular-resource/angular-resource.js',
          'bower/angular-route/angular-route.js',
          'bower/angular-sanitize/angular-sanitize.js',
          'bower/angular-touch/angular-touch.js',
          'bower/angular-cache/dist/angular-cache.js',
          'public/js/app.js',
          'public/js/directives.js',
          'public/js/services/*.js',
          'public/js/controllers/*.js',
        ],
        dest: 'public/js/scripts.js'
      },
      css: {
        src: [
          'bower/bootstrap/dist/css/bootstrap.css',
          'bower/font-awesome/css/font-awesome.css',
          'public/css/customstyles.css'
        ],
        dest: 'public/css/styles.css'
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'should',
          timeout: 3000,
          ui: 'bdd'
        },
        src: ['test/**/*.js']
      }
    },

    karma: {
      dev: {
        configFile: 'karma.conf.js',
        singleRun: false,
        browsers: ['ChromeCanary'],
      },
      unit: {
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS'],
        singleRun: true
      }
    },

    nodemon: {
      dev: {
        options: {
          file: './app.js',
          args: [],
          nodeArgs: ['--debug'],
          watchedExtensions: ['js'],
          watchedFolders: ['api', 'lib'],
          delayTime: 1,
          legacyWatch: true,
          env: {
            PORT: '3000'
          },
          cwd: __dirname
        }
      },
      prod: {
        options: {
          file: './app.js',
          args: [],
          nodeArgs: [],
          ignoredFiles: ['README.md', 'node_modules/**'],
          watchedExtensions: ['js'],
          watchedFolders: ['api', 'lib'],
          delayTime: 1,
          legacyWatch: true,
          env: {
            PORT: '3000',
            NODE_ENV: 'production'
          },
          cwd: __dirname
        }
      },
    },

    watch: {
      mocha: {
        files: ['app.js', 'api/**/*.js', 'lib/**/*.js', 'test/**/*.js'],
        tasks: ['jshint', 'mochaTest']
      },

      karma: {
        files: ['public/js/**/*.js', '!public/js/scripts.js', '!public/js/scripts.min.js', '!public/js/lib/**/*.js', 'test_client/**/*Specs.js'],
        tasks: ['jshint', 'karma:unit', 'concat:js', 'uglify']
      },

      styles: {
        files: ['public/css/customstyles.css'],
        tasks: ['concat:css', 'cssmin']
      }
    },

    concurrent: {
      target: {
        tasks: ['karma:unit', 'nodemon:dev', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    exec: {
      mkGenDocsDir: {
        command: 'mkdir -p docs/generated'
      },
      coverageMocha: {
        command: 'mocha --require blanket --reporter html-cov --slow 0 test/**/*.js > docs/generated/coverage.html'
      },
      coverageKarma: {
        command: 'karma start karma-coverage.conf.js'
      },
      analysisClient: {
        command: 'plato -r -d docs/generated/analysis/client -l .jshintrc -t "MDWiki Client" -x .json public/js/app.js public/js/directives.js public/js/services/*.js public/js/controllers/*.js'
      },
      analysisServer: {
        command: 'plato -r -d docs/generated/analysis/server -l .jshintrc -t "MDWiki Server" -x .json app.js api/*.js lib/*.js'
      },
      copyFonts: {
        command: 'cp -R ./bower/font-awesome/fonts/ ./public/font'
      }
    },
    clean: {
      tests: {
        src: ["docs"]
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest', 'concat', 'minify', 'concurrent']);

  // Test task
  grunt.registerTask('test', ['jshint', 'mochaTest', 'karma:unit']);

  // Minify tasks
  grunt.registerTask('minify', ['cssmin', 'uglify']);

  // deploy task
  grunt.registerTask('deploy', ['concat', 'minify', 'exec:copyFonts']);

  // Coverage tasks
  grunt.registerTask('coverage', ['clean', 'exec:mkGenDocsDir', 'exec:coverageMocha', 'exec:coverageKarma', 'exec:analysisClient', 'exec:analysisServer']);

};
