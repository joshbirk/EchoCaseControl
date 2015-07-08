var alexa = require('alexa-nodekit');

var port = process.env.PORT || 8080
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser());


// Route request and response ends up here.
function route_alexa(req, res) {
   if(req.body == null) {
        return res.jsonp({message: 'no post body found'});
   }
   console.log('forming alexa response');
   alexa.launchRequest(req.body);
   alexa.response('Hello World', {
     title: 'Heroku',
     subtitle: 'Hello World',
     content: '<h1>Hello World!</h1>',
     shouldEndSession: true
   }, false, function (error, response) {
     if(error) {
       console.log({message: error});
       return res.status(400).jsonp({message: error});
     }
     return res.jsonp(response);
   });
};


app.get('/', function (req, res) {
  res.jsonp({status: 'running'});
});

app.post('/echo', function (req, res) {
  if(req.body == null) {
        console.log("WARN: No Post Body Detected");
   }
  route_alexa(req,res);
});

var server = app.listen(port, function () {

  console.log('Heroku Echo Hello World running on '+port);

});