module.exports = function (grunt) {
  // See http://www.jshint.com/docs/#strict
  'use strict';

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
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
    watch: {
      jsfiles: {
        files: ['<%= jshint.files %>'],
        tasks: ['default'],
        options: {
          livereload: true
        },
      },
      htmlfiles: {
        options: {
          livereload: true
        }
      }
    },
    'mocha-hack': {
      options: {
        globals: ['should'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      },

      all: { src: ['test/**/*.js']}
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-hack');
  grunt.loadNpmTasks('grunt-contrib-qunit');
//  grunt.loadNpmTasks('grunt-contrib-clean');
//  grunt.loadNpmTasks('grunt-exec');


  // Default task.
  grunt.registerTask('default', ['jshint', 'mocha-hack', 'qunit']);

  // Dev task
  grunt.registerTask('dev', ['jshint', 'mocha-hack', 'qunit']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);
};
