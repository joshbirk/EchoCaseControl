var alexa = require('alexa-nodekit');

var port = process.env.PORT || 8080
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser());

var nforce = require('nforce');
var org = nforce.createConnection({
  clientId: '3MVG9sG9Z3Q1RlbdgwDkzM3OQ0rbyEhv3U2zHLecnp1hMpmc.j.ng7mO.tlVC0ArPDeY.4JG0RlwfMPNONz4s',
  clientSecret: '1308854095208667500',
  redirectUri: 'imp://nothinghere',
  apiVersion: 'v30.0',  // optional, defaults to current salesforce API version
  environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
  mode: 'single' // optional, 'single' or 'multi' user mode, multi default
});


org.authenticate({ username: 'josh@light.test', password: 'test1234'}, function(err, resp){
  if(!err) console.log('Cached Token: ' + org.oauth.access_token)
});

// Route request and response ends up here.
function route_alexa_begin(req, res) {
   if(req.body == null) {
        return res.jsonp({message: 'no post body found'});
   }
   alexa.launchRequest(req.body);
   send_alexa_response('Connected to Salesforce', null, false)
};

function route_alexa_intent(req, res) {
   if(req.body == null) {
        return res.jsonp({message: 'no post body found'});
   }
   alexa.intentRequest(req.body);
   if(alexa.intentName == 'GetLatestCases') {
      org.query({ query: 'SELECT ID, Subject FROM Cases LIMIT 5 ORDERY CreationDate ASC', oauth: oauth }, 
        function(err, records){
            if(err) throw err;
            else {
              var speech = 'Here are your five latest cases. ';
              for(var i = 0; i < records.length; i++) {
                speech += i;
                speech += ' ';
                speech += records[i].Subject;
              }

              send_alexa_response(speech, null, true);

            }
          });


   }
   
};

function send_alexa_response(speech, card, endSession) {
    alexa.response(speech, card, endSession, function (error, response) {
           if(error) {
             console.log({message: error});
             return res.status(400).jsonp({message: error});
           }
           return res.jsonp(response);
         });
}


app.get('/', function (req, res) {
  res.jsonp({status: 'running'});
});

app.post('/echo', function (req, res) {
  if(req.body == null) {
        console.log("WARN: No Post Body Detected");
   }
  if(req.body.request.intent == null) {
    route_alexa_begin(req,res);
  } else {
    route_alexa_intent(req,res);
  }
});

var server = app.listen(port, function () {

  console.log('Heroku Echo Hello World running on '+port);

});