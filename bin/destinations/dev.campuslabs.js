module.exports = function(options, opfile, columns, log, timer, moduleCallback) {


  var request = require('request'),
    fs = require('fs'),
    async = require('async'),
    clcreds = require('../../creds/campuslabs.js');


  var OAuth = require('oauth');
  var OAuth2 = OAuth.OAuth2;
  var oauth2 = new OAuth2(clcreds.clientId, clcreds.clientSecret, 'https://authorization.campuslabs.com/', null, 'token', null);

  async.waterfall([
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
            "accounts": [{
              "externalId": "uaa_student_affairs",
              "firstName": "UAA",
              "lastName": "Student Affairs",
              "email": "uaa_studentaffairs@uaa.alaska.edu"
            }]
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
      log.group('Finished').log(timer.now.str());
      moduleCallback(null, opfile);
    })

  /*oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
  }, function(e, access_token, refresh_token, results) {
    //console.log(e, access_token, refresh_token, results);

    request.post({
      url: 'https://accounts.api.campuslabs.com/accounts/import', //WORKS!
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      form: {
        "accounts": [{
          "externalId": "uaa_student_affairs",
          "firstName": "UAA",
          "lastName": "Student Affairs",
          "email": "uaa_studentaffairs@uaa.alaska.edu"
        }]
      }
    }, function(e, r, body) {
      console.log('Error: ', e);
      console.log('Status: ', r.statusCode);
      console.log('Reponse body: ', body);
    })
  })*/

}
