module.exports = function(grunt) {

  var projectFiles = ['package.json', '*.js', 'bin/**/*.js', 'local/**/*.js', 'local/**/*.json', 'local/*.js*', 'spec/**/*.js'];

  // Project configuration.
  grunt.initConfig({
    'jsbeautifier': {
      src: projectFiles,
      options: {
        js: {
          indentSize: 2
        }

      },
    },
    watch: {
      files: projectFiles,
      tasks: ['default'],
      options: {
        livereload: true
      }
    },
    lineending: {
      dist: {
        options: {
          overwrite: true,
          eol: 'lf'
        },
        files: {
          '': projectFiles
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-lineending');



  // Default task(s).
  grunt.registerTask('default', ['jsbeautifier']);
};
