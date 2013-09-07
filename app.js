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
 
// Set up the RESTful API, handler methods are defined in api.js

var apiName = "watertable";
var apiVersion = "v1";
var apiPath = '/' + apiName + '/' + apiVersion;
var api = require('./controllers/api.js');


app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Get all records
// http://localhost:3000/watertable/v1
app.get(apiPath, api.list);

// Look up records by id
// http://localhost:3000/watertable/v1/id/375259N1219869W001.json
app.get(apiPath + '/id/:id.:format?', api.showID);

// ??
app.post(apiPath, api.post);

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);