module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    "jsbeautifier": {
      src: ['*.js', 'bin/**/*.js', 'creds/*', 'batches/*.json'],
      options: {
        js: {
          indentSize: 2
        }

      },
    },
    watch: {
      files: ['*.js', 'bin/**/*.js', 'creds/*', 'batches/*.json'],
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
