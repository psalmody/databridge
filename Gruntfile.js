module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    "jsbeautifier": {
      src: ['*.js', 'bin/*.js'],
      options: {
        js: {
          indentSize: 2
        }

      },
    },
    watch: {
      files: ['*.js', 'bin/*.js'],
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
