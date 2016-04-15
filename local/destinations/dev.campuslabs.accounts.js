module.exports = function(options, opfile, columns, log, timer, moduleCallback) {


  var request = require('request'),
    fs = require('fs'),
    async = require('async'),
    clcreds = require('../../creds/campuslabs.js'),
    accounts = [];


  var OAuth = require('oauth');
  var OAuth2 = OAuth.OAuth2;
  var oauth2 = new OAuth2(clcreds.clientId, clcreds.clientSecret, 'https://authorization.campuslabs.com/', null, 'token', null);

  async.waterfall([
      //read opfile
      function(cb) {
        log.log('Reading file and formatting as JSON');
        fs.readFile(opfile.filename, 'utf-8', function(err, data) {
          if (err) return cb(err);
          data = data.split('\n');
          if (data[0].replace(/\t/g, '') !== 'ExternalIDFirstNameLastNameEmail') return cb('Improper input - columns don\'t match right format for campuslabs account import.');
          data.shift();
          for (var i = 0; i < data.length; i++) {
            var r = data[i].split('\t');
            accounts.push({
              externalId: r[0],
              firstName: r[1],
              lastName: r[2],
              email: r[3]
            });
          }
          log.log('Setup JSON for ' + accounts.length + ' users.');
          cb(null);
        })

      },
      function(cb) {
        log.group('oauth').log('Getting authorization token.');
        oauth2.getOAuthAccessToken('', {
          'grant_type': 'client_credentials'
        }, function(e, accessToken, refreshToken, results) {
          if (e) return cb(e);
          cb(null, accessToken)
        });
      },
      function(accessToken, cb) {
        log.group('POST').log('Received authorization token. Sending data.');
        request.post({
          url: 'https://accounts.api.campuslabs.com/accounts/import', //WORKS!
          headers: {
            'Authorization': 'Bearer ' + accessToken
          },
          form: {
            "accounts": accounts
              /*[{
                            "externalId": "uaa_student_affairs",
                            "firstName": "UAA",
                            "lastName": "Student Affairs",
                            "email": "uaa_studentaffairs@uaa.alaska.edu"
                          }]*/
          }
        }, function(e, r, body) {
          if (e) return cb(e);
          cb(null, r, body);
        });
      },
      function(r, body, cb) {
        if (r.statusCode != 200) return cb('Returned status: ' + r.statusCode + '\nServer said ' + body);
        log.log('Post successful.');
        log.log('Status: ' + r.statusCode);
        log.log('Response body follows.');
        log.log(body);
        cb(null);
      }
    ],
    function(err) {
      if (err) return moduleCallback(err);
      log.group('Finished destination').log(timer.now.str());
      moduleCallback(null, opfile);
    })
}
