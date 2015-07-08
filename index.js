var alexa = require('alexa-nodekit');
var express = require('express');
var app = express();
var port = process.env.PORT || 8080

// Route request and response ends up here.
function route_alexa(req, res) {
   console.log(req);
   if(req.body == null) {
        res.jsonp({message: 'no post body found'});
   }
   // Grab the necessary values from the Echo request.
   alexa.launchRequest(req.body);
   // Store the session and/or user data

   // Respond to the Echo
   alexa.response('Welcome to my app, you can say things like this or that', {
     title: 'Launch Card Title',
     subtitle: 'Launch Card Subtitle',
     content: 'Launch Card Content'
   }, false, function (error, response) {
     if(error) {
       return res.status(400).jsonp({message: error});
     }
     return res.jsonp(response);
   });
};


app.get('/', function (req, res) {
  route_alexa(req,res);
});

var server = app.listen(port, function () {

  console.log('Heroku Echo Hello World running on '+port);

});