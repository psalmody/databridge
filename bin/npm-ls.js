//outputs npm ls --json
module.exports = function(moduleCallback) {
  require('child_process').exec('npm ls --json', function(err, stdout, stderr) {
    if (err) return moduleCallback(err)
    moduleCallback(null, JSON.parse(stdout));
  });
}
