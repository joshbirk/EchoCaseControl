/* GLOBAL / PROCESS VARIABLES */
var port = process.env.PORT || 8080;
var clientId = process.env.clientId || '3MVG98SW_UPr.JFgvKybAL6TSV3wyJWVo.NFAtcge.7yppmiBdm60S_c6ab9dUonJR4eIFvQEyEatxUGEUp66';
var clientSecret = process.env.clientSecret || '1991862460972103310';
var redirectURI = process.env.redirectURI || 'https://heroku-echo-test.herokuapp.com/token';
var API = process.env.API || 'v32.0';
var oauth_timeout = process.env.oauth_timeout || 5400;
var DEBUG_ON = process.env.DEBUG_ON || true;

/* REQUIRED PACKAGES */

//alexa response transform
var alexa = require('alexa-nodekit');

//express for routing
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser());

//sync REST requests to embed inside Alexa responses
var sync_request = require('sync-request');

//convert OAuth requests to/from Salesforce to Amazon
var sfdc_amazon = require('sfdc-oauth-amazon-express');

//Salesforce REST wrapper
var nforce = require('nforce'),
    chatter =require('nforce-chatter')(nforce);

//Connected App credentials for OAUTH request
var org = nforce.createConnection({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectURI,
  apiVersion: API, 
  mode: 'single',
  plugins: ['chatter']
});

/* SETUP ROUTES */

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

sfdc_amazon.addRoutes(app,oauth_timeout,true);

var intent_functions = new Array();
intent_functions['GetLatestCases'] = GetLatestCases;
intent_functions['OpenCase'] = OpenCase;


/* Handle valid Echo requests from Salesforce */

/* START CONNECTION TO SALESFORCE.

1. Check for existing session.  If not found, prompt to complete OAuth in the app
2. Check for existing query and/or current case from Search Results object.

*/

function route_alexa_begin(req, res) {
   
   alexa.launchRequest(req.body);
   if(req.body.session == null || req.body.session.user == null || req.body.session.user.accessToken == null) {
        send_alexa_response(res, 'Please log into Salesforce', 'Salesforce', 'Not Logged In', 'Error: Not Logged In', true);
   } else {
   		send_alexa_response(res, 'Connected to Salesforce',  'Salesforce', 'Connection Attempt', 'Logged In (Single User)', false);
   }
   
   console.log('!----REQUEST SESSION--------!');
   console.log(req.body.session);
   

};


function route_alexa_intent(req, res) {

   if(req.body.session == null || req.body.session.user == null || req.body.session.user.accessToken == null) {
        send_alexa_response(res, 'Please log into Salesforce', 'Salesforce', 'Not Logged In', 'Error: Not Logged In', true);
   } else {
   	   intent = new alexa.intentRequest(req.body);
	   intent.oauth = sfdc_amazon.splitToken(req.body.session.user.accessToken);
	   console.log("INTENT>>>"+intent.intentName);
	   console.log("USERID>>>>"+req.body.session.user.userId);

	   intent_function = intent_functions[intent.intentName];
	   intent_function(req,res,intent);
   }

}

function OpenCase(req,res,intent) {
	var number = intent.slots.number.value;
	number = number.toString();
	console.log("CASE IDENTIFIER>>>>>"+number);
    org.apexRest({oauth:intent.oauth, uri:'EchoCaseSearch',method:'POST',body:'{"CaseIdentifier":"'+number+'"}'},
		function(err,result) {
			if(err) {
              console.log(err);
              send_alexa_error(res,'An error occured checking for recents cases: '+err);
            }
            else {
            	var speech = 'Opened Case '+result.get('Subject__c');
            	send_alexa_response(res, speech, 'Salesforce', 'Open Case', 'Success', false);
            }

		});
}


function GetLatestCases(req,res,intent) {
	org.apexRest({oauth:intent.oauth, uri:'EchoCaseSearch'},
		function(err,result) {
			if(err) {
              console.log(err);
              send_alexa_error(res,'An error occured checking for recents cases: '+err);
            }
            else {
            	var speech = "Here are your latest cases. ";
            	for(var i = 0; i < result.length; i++) {
                      speech += 'Case Number ';
                      speech += i+1;
                      speech += '. .';
                      speech += result[i].Subject__c;
                      speech += '. .';
                      if(i != result.length-1) {speech += 'Next case,'};
                    }
                    send_alexa_response(res, speech, 'Salesforce', 'Get Latest Cases', 'Success', false);
            }

		});
}


var server = app.listen(port, function () {

  console.log('Salesforce Case Echo running on '+port);
  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: '+add);
  });

});




/* UTILIY FUNCTIONS */
function send_alexa_error(res,message) {

	send_alexa_response(res, 'An error occured during that request.  Please see the app log.', 'Salesforce', 'Error', message, true);

}

function send_alexa_response(res, speech, title, subtitle, content, endSession) {
    alexa.response(speech, 
           {
            title: title,
            subtitle: subtitle,
            content: content
           }, endSession, function (error, response) {
           if(error) {
             console.log({message: error});
             return res.status(400).jsonp({message: error});
           }
           return res.jsonp(response);
         });
}