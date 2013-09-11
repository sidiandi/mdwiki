module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: [
        '.jshintrc',
        'gruntfile.js',
        'app.js',
        'public/js/**/*.js',
        'api/**/*.js',
        'lib/**/*.js',
        'test/**/*.js',
        'test_client/**/*.js',
        '!node_modules/**/*.js',
        '!node_modules/**/*.json',
        '!public/**/*.json',
        '!public/js/lib/**/*.js',
        '!test_client/lib/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
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
        files: ['public/js/**/*.js', '!public/js/lib/**/*.js', 'test_client/**/*Specs.js'],
        tasks: ['jshint', 'karma:unit']
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

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest', 'karma', 'watch']);

  // Test task
  grunt.registerTask('test', ['jshint', 'mochaTest', 'karma']);

};
