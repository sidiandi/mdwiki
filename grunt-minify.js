module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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
          'public/js/scripts.min.js': ['public/js/scripts.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['cssmin', 'uglify']);

};
