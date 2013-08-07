module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: [
        '.jshintrc',
        'gruntfile.js',
        'public/js/**/*.js',
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

    watch: {
      options: {
        livereload: true,
      },

      jsfiles: {
        files: ['<%= jshint.files %>'],
        tasks: ['default']
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

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest', 'watch']);

  // Dev task
  grunt.registerTask('dev', ['jshint', 'mochaTest', 'watch']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);
};
