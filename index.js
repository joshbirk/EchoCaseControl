var alexa = require('alexa-nodekit');
var express = require('express');
var app = express();
var port = process.env.PORT || 8080

// Route request and response ends up here.
function route_alexa(req, res) {
//   if(req.body == null) {
//        return res.jsonp({message: 'no post body found'});
//   }
   console.log('forming alexa response');
   alexa.launchRequest(req.body);
   alexa.response('Hello World', {
     title: 'Heroku',
     subtitle: 'Hello World',
     content: 'Hello World!'
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
  route_alexa(req,res);
});

var server = app.listen(port, function () {

  console.log('Heroku Echo Hello World running on '+port);

});