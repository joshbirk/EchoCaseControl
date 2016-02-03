var alexa = require('alexa-nodekit');

var port = process.env.PORT || 8080
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var sync_request = require('sync-request');
app.use(bodyParser());

var LIFX_token = 'cb8c8dbb2b50db8e9518f6a767647793673aeb24f642051c642b00a630afba4e';

var current_cases = [];
var current_case = {};

var nforce = require('nforce'),
    chatter =require('nforce-chatter')(nforce);

var org = nforce.createConnection({
  clientId: '3MVG98SW_UPr.JFgvKybAL6TSV3wyJWVo.NFAtcge.7yppmiBdm60S_c6ab9dUonJR4eIFvQEyEatxUGEUp66',
  clientSecret: '1991862460972103310',
  redirectUri: 'https://heroku-echo-test.herokuapp.com/login',
  apiVersion: 'v32.0', 
  mode: 'single',
  autoRefresh: true,
  plugins: ['chatter']
});

/*
org.authenticate({ username: 'df15sessions@dev.org', password: 'demo1234'}, function(err, resp){
  if(!err) {
  //    console.log('ORG: ' + org.oauth);
    console.log('!----SALESFORCE SESSION-----!');
    console.log(org.oauth);
    }
});
*/


// Route request and response ends up here.
function route_alexa_begin(req, res) {
   if(req.body == null) {
        return res.jsonp({message: 'no post body found'});
   }
   alexa.launchRequest(req.body);
   send_alexa_response(res, 'Connected to Salesforce',  'Salesforce', 'Connection Attempt', 'Logged In (Single User)', false);

   console.log('!----REQUEST SESSION--------!');
   console.log(req.body.session);
   

};

function route_alexa_intent(req, res) {
   if(req.body == null) {
        return res.jsonp({message: 'no post body found'});
   }

   
   if(req.body.session == null || req.body.session.user == null || req.body.session.user.accessToken == null) {
        send_alexa_response(res, 'Please log into Salesforce', 'Salesforce', 'Not Logged In', 'Error: Not Logged In', true);
   }

   oauth = {access_token : req.body.session.user.accessToken.split(" ")[0],
            instance_url : req.body.session.user.accessToken.split(" ")[1]}
   
//   console.log(auth);
   alexa.intentRequest(req.body);
   console.log(alexa.intentName);

   if(alexa.intentName == 'AddPost') {
      var post = alexa.slots.post.value;
      
      if(current_case._fields == null) {
          
          send_alexa_response(res, 'No case currently opened', 'Salesforce', 'Post to Chatter', 'Error: no current case', true);
                    
      } else  { 
          /*
          AddPost chatter {follow up call|post}
AddPost chatter {next meeting|post}
AddPost chatter {cannot replicate|post}
AddPost chatter {missing info|post}
*/
          if(post == 'follow up') {
            post = 'We need to follow up with the customer';
          }

          if(post == 'next') {
            post = 'This needs to be prioritized at the next meeting';
          }

          if(post == 'cannot replicate') {
            post = 'I cannot replicate this issue with the current information';
          }

          if(post == 'missing info') {
            post = 'This case is incomplete, we need more information';
          }

          current_case.set("CloseMe__c",false);
          current_case.set("OpenMe__c",false);
          current_case.set("UpdateMe__c",true);
          current_case.set("Nonce__c",randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));
          org.update({ sobject: current_case, oauth: oauth},function(err,resp){
              console.log('update sent');
          });

          org.chatter.postFeedItem({id: current_case.get('Id'), text: post}, function(err, resp) {
              if(err) {
                console.log(err);
                res.jsonp(err);
              //  send_alexa_response(res, 'An error occurred on the post', 'Salesforce', 'Post to Chatter', 'Error: '+err, true);
              } else {
                  send_alexa_response(res, 'Posted to Chatter', 'Salesforce', 'Post to Chatter', 'Posted to Chatter: '+post, true);
              
              }
          });
                  
      } 

   } else if(alexa.intentName == 'HoldCase') {
      
      if(current_case._fields == null) {
          
          send_alexa_response(res, 'No case currently opened', 'Salesforce', 'Post to Chatter', 'Error: no current case', true);
                    
      } else { 
          
          current_case.set("OpenMe__c",false);
          current_case.set("UpdateMe__c",false);
          current_case.set("CloseMe__c",true);
          current_case.set("Nonce__c",randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));
          org.update({ sobject: current_case, oauth: oauth},function(err,resp){
               if(err) {
                console.log(err);
                res.jsonp(err);
               } else {
                send_alexa_response(res, 'Case held', 'Salesforce', 'Case Held', 'This just closes the browser, tbh', true);
              }
          });
                  
      } 

   } else if(alexa.intentName == 'CompleteCase') {
      
      if(current_case._fields == null) {
          
          send_alexa_response(res, 'No case currently opened', 'Salesforce', 'Post to Chatter', 'Error: no current case', true);
                    
      } else { 
          
          current_case.set("Status","Closed");
          current_case.set("OpenMe__c",false);
          current_case.set("UpdateMe__c",false);
          current_case.set("CloseMe__c",true);
          current_case.set("Nonce__c",randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));
          org.update({ sobject: current_case, oauth: oauth},function(err,resp){
               if(err) {
                console.log(err);
                res.jsonp(err);
               } else {
                send_alexa_response(res, 'Case set to closed and completed', 'Salesforce', 'Status Change', 'Status set to closed', true);
               }
          });
                  
      } 

   }  else if(alexa.intentName == 'GetCurrentCase') {
      
      if(current_case._fields == null) {
          
          send_alexa_response(res, 'No case currently opened', 'Salesforce', 'Post to Chatter', 'Error: no current case', true);
                    
      } else { 
          
          current_case.set("CloseMe__c",false);
          current_case.set("UpdateMe__c",false);
          current_case.set("OpenMe__c",true);
          current_case.set("Nonce__c",randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));
          org.update({ sobject: current_case, oauth: oauth},function(err,resp){
               if(err) {
                console.log(err);
                res.jsonp(err);
               } else {
                send_alexa_response(res, 'Opening current case', 'Salesforce', 'Case Openes', 'This just opens the browser, tbh', true);
                }
          });
                  
      } 

   //   send_alexa_response(res, 'Opening case number '+number, 'Salesforce', 'Case open attempt', 'Opening case number '+number, true);
   } else if(alexa.intentName == 'UpdateCase') {
      var update = alexa.slots.update.value;
      update = update.charAt(0).toUpperCase() + update.slice(1);
      console.log(update);

      if(current_case._fields == null) {
          
          send_alexa_response(res, 'No case currently opened', 'Salesforce', 'Post to Chatter', 'Error: no current case', true);
                    
      } else  { 
          
          current_case.set("CloseMe__c",false);
          current_case.set("OpenMe__c",false);
          current_case.set("UpdateMe__c",true);
          current_case.set("Nonce__c",randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));
          
          if(update == 'Hi') { update = 'High'; } //really, Alexa?

          if(update == 'Low' || update == 'Medium' || update == 'High') {
              current_case.set("Priority",update);
              org.update({ sobject: current_case, oauth: oauth},function(err,resp){
               if(err) {
                console.log(err);
                res.jsonp(err);
               } else {
                send_alexa_response(res, 'Priority set to '+update, 'Salesforce', 'Priority Change', 'Priority set to'+update, true);
               }
               });
          }  

          if(update == 'Closed' || update == 'New' || update == 'Working') {
              current_case.set("Status",update);
              org.update({ sobject: current_case, oauth: oauth},function(err,resp){
               if(err) {
                console.log(err);
                res.jsonp(err);
               } else {
                send_alexa_response(res, 'Status set to '+update, 'Salesforce', 'Status Change', 'Status set to'+update, true);
               }
               });
          } 
                  
      } 

   //   send_alexa_response(res, 'Opening case number '+number, 'Salesforce', 'Case open attempt', 'Opening case number '+number, true);
   } else if(alexa.intentName == 'OpenCase') {
      var number = alexa.slots.number.value;
      number = number - 1;
      if(number in current_cases) {
          current_case = current_cases[number];
          current_case.set("Nonce__c",randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));
          current_case.set("CloseMe__c",false);
          current_case.set("UpdateMe__c",false);
          current_case.set("OpenMe__c",true);
          org.update({ sobject: current_case, oauth: oauth},function(err,resp){
                      console.log('open sent');
                    });
          send_alexa_response(res, 'Case Opened, '+current_case.get("subject"), 'Salesforce', 'Opening Case', 'Case Opened, '+current_case._fields.subject, true);
                    
      } else  { //this is a specific Case number
          org.query({ query: 'SELECT ID, Subject, Priority, Status, OpenMe__c, UpdateMe__c, CloseMe__c FROM Case WHERE CaseNumber = \''+number+'\'', oauth: org.oauth }, 
          function(err, result){
            if(err) {
              console.log(err);
              send_alexa_response(res, 'An error occurred on that search', 'Salesforce', 'Get Latest Cases', 'Error: check logs', true);
            } else {
               if(result.records.length == 0) {

                    send_alexa_response(res, 'No cases were found', 'Salesforce', 'Open Case', 'No cases found.', true);

                } else {
                    current_case = result.records[0];
                    console.log(current_case);
                    current_case.set("CloseMe__c",false);
                    current_case.set("UpdateMe__c",false);
                    current_case.set("OpenMe__c",true);
                    current_case.set("Nonce__c",randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'));
                    org.update({ sobject: current_case, oauth: oauth},function(err,resp){
                      console.log('open sent');
                    });
                    send_alexa_response(res, 'Case Opened, '+current_case.get("subject"), 'Salesforce', 'Opening Case', 'Case Opened, '+current_case._fields.subject, true);
                }
            }
          });
                  
      } 

   //   send_alexa_response(res, 'Opening case number '+number, 'Salesforce', 'Case open attempt', 'Opening case number '+number, true);
   }

   else if(alexa.intentName == 'GetLatestCases') {
      current_cases = [];
      org.query({ query: 'SELECT ID, Subject, Priority,  Status, OpenMe__c, UpdateMe__c, CloseMe__c FROM Case ORDER BY CreatedDate DESC LIMIT 5', oauth: oauth }, 
        function(err, result){
            if(err) {
              console.log(err);
              res.jsonp(err);
              //send_alexa_response(res, 'An error occurred on that search', 'Salesforce', 'Get Latest Cases', 'Error: check logs', true);
            }
            else {
            //    console.log(result.records);
                if(result.records.length == 0) {

                    send_alexa_response(res, 'No cases were found', 'Salesforce', 'Get Latest Cases', 'No cases found.', true);

                } else {
                    current_cases = result.records;
                    var speech = 'Here are your latest cases. ';
                    for(var i = 0; i < result.records.length; i++) {
                      speech += 'Case Number ';
                      speech += i+1;
                      speech += '. .';
                      speech += result.records[i]._fields.subject;
                      speech += '. .';
                      if(i != result.records.length-1) {speech += 'Next case,'};
                    }
                    var cycles = i;
                    send_alexa_response(res, speech, 'Salesforce', 'Get Latest Cases', 'Success', true);
             /*       var sr = sync_request('POST', 'https://api.lifx.com/v1beta1/lights/all/effects/breathe',
                      {
                        headers: {'Authorization':'Bearer cb8c8dbb2b50db8e9518f6a767647793673aeb24f642051c642b00a630afba4e'},
                        body: JSON.stringify({
                                  "color": "kelvin:2500 brightness:0.25",
                                  "from_color": "kelvin:9000 brightness:1.0",
                                  "period": 5,
                                  "cycles": 5,
                                  "persist": false,
                                  "power_on": true
                              })
                      });
                    console.log(sr.getBody()); */
                    
                      
              }
          }
      });
   } else {
      send_alexa_response(res, 'I did not understand that.', 'Salesforce', 'Error', 'No intent found', true)
   }
   
};

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

app.get('/login',function (req, res) {
  res.sendfile('login.html');
});

app.post('/token',function (req, res) {
  console.log(req.body);
  var sr = sync_request('POST', 'https://login.salesforce.com/services/oauth2/token',
                      {
                        
                        headers: {'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},
  /*                      body: JSON.stringify({grant_type: req.body.grant_type,
                                              code: req.body.code,
                                              client_id: req.body.client_id,
                                              client_secret: req.body.client_secret,
                                              redirect_uri: req.body.redirect_uri
                                            }) */
                      //TODO: FLIP OUT CODE FOR REFRESHTOKEN
                      body: 'grant_type='+req.body.grant_type+'&code='+req.body.code+'&refresh_token='+req.body.refresh_token+'&client_id='+req.body.client_id+'&client_secret='+req.body.client_secret+'&redirect_uri='+req.body.redirect_uri
                      });
  console.log(sr.getBody('utf8'));
  response = JSON.parse(sr.getBody('utf8'));
  
  response.access_token = response.access_token + " " + response.instance_url;
  response.expires_in = 10800;

  res.jsonp(response);
});

var server = app.listen(port, function () {

  console.log('Heroku Echo Hello World running on '+port);
  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: '+add);
  });

});





function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

