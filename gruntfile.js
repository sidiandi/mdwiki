module.exports = function (grunt) {
  // See http://www.jshint.com/docs/#strict
  "use strict";

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    jshint: {
      files: ['**/*.js', '**/*.json', '.jshintrc', '!node_modules/**/*.js', '!node_modules/**/*.json', '!public/**/*.js', '!public/**/*.json', '!frontendtests/lib/**/*.js', '!frontendtests/lib/**/*.json'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['default']
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
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-exec');


  // Default task.
  grunt.registerTask('default', ['jshint', 'mocha-hack', 'qunit']);

  // Dev task
  grunt.registerTask('dev', ['jshint', 'mocha-hack', 'qunit']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);
};
