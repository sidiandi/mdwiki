module.exports = function (grunt) {
  'use strict';

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
        'test_client/**/*.js',
        '!test_client/lib/**/*.js'
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
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
          //sourceMap: 'public/js/scripts.min.map.js'
        },
        files: {
          'public/js/scripts.min.js': ['public/js/scripts.js'],
        }
      }
    },

    concat: {
      js: {
        src: [
          'public/js/lib/jquery.js',
          'public/js/lib/bootstrap.js',
          //'public/js/lib/underscore.js',
          'public/js/lib/angular/angular.js',
          'public/js/lib/angular/angular-route.js',
          'public/js/lib/angular/angular-sanitize.js',
          'public/js/lib/angular/angular-animate.js',
          'public/js/app.js',
          'public/js/directives.js',
          'public/js/filters.js',
          'public/js/services/*.js',
          'public/js/controllers/*.js',
        ],
        dest: 'public/js/scripts.js'
      },
      css: {
        src: [
          'public/css/bootstrap.css',
          'public/css/font-awesome.css',
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
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true,
      }
    },

    watch: {
      options: {
        livereload: true,
      },

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
      },

      livereload: {
        files: ['public/**/*.html'],
        tasks: [],
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest', 'karma', 'watch']);

  // Test task
  grunt.registerTask('test', ['jshint', 'mochaTest', 'karma']);

  // deploy task
  grunt.registerTask('deploy', ['jshint', 'mochaTest', 'karma', 'concat', 'cssmin', 'uglify']);

};
