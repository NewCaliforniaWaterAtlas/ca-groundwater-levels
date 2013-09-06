// The main application script, ties everything together.
 
var express = require('express');
var mongoose = require('mongoose');
var app = module.exports = express.createServer();
 
// connect to Mongo when the app initializes
mongoose.connect('mongodb://localhost/watertable');

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
 
// set up the RESTful API, handler methods are defined in api.js
var api = require('./controllers/api.js');
app.post('/database', api.post);
app.get('/database/:id.:format?', api.show);
app.get('/database', api.list);
 
app.listen(3000);
console.log("Express server listening on port %d", app.address().port);