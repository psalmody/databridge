module.exports = function(grunt) {

  var projectFiles = ['*.js', 'bin/**/*.js', 'creds/*', 'batches/*.json', 'spec/**/*.js'];

  // Project configuration.
  grunt.initConfig({
    "jsbeautifier": {
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsbeautifier');



  // Default task(s).
  grunt.registerTask('default', ['jsbeautifier']);
};
