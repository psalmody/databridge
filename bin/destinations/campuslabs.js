var request = require('request'),
  fs = require('fs'),
  clcreds = require('../../creds/campuslabs.js');


var OAuth = require('oauth');
var OAuth2 = OAuth.OAuth2;
var oauth2 = new OAuth2(clcreds.clientId, clcreds.clientSecret, 'https://authorization.campuslabs.com/', null, 'token', null);
oauth2.getOAuthAccessToken('', {
  'grant_type': 'client_credentials'
}, function(e, access_token, refresh_token, results) {
  console.log(e, access_token, refresh_token, results);

  request.post({
    url: 'https://alaska.campuslabs.com/accounts/import',
    headers: {
      'access_token': access_token
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
    console.log(e, r, body);
  })
})
