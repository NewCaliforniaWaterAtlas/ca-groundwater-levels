#!/bin/env node

var mapApp = {};
mapApp.tally = {};
mapApp.tally.storage = 0;
mapApp.tally.diversion = 0;
  
var http = require('http');
var fs      = require('fs');
var express = require('express');
var EngineProvider = require('./engine').EngineProvider;
var engine         = new EngineProvider();
var _ = require('underscore')._;
var request = require('request');
var async = require('async');

/////////////////////////////////////////////////////////////////////////////////////////////
// utility functions
/////////////////////////////////////////////////////////////////////////////////////////////

mapApp.addCommas = function(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	tail = x[1];
	if(tail !== undefined){
	 tail = tail.substring(0, 2);
	}
	x2 = x.length > 1 ? '.' + tail : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
};


/**
 *  Define the sample application.
 */
var App = function() {

    //  Scope.
    var self = this;

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_INTERNAL_IP;
        self.port      = process.env.OPENSHIFT_INTERNAL_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_INTERNAL_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': ''};
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./public/index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        // Routes for /health, /asciimo and /
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };


        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };

    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = module.exports = express.createServer();


          self.app.configure(function(){
            self.app.use(express.bodyParser());
            self.app.use(express.cookieParser());
            self.app.use(express.methodOverride());
            self.app.use(self.app.router);
            self.app.use(express.static(__dirname + '/public'));
          });

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

//////////////  get

/**
 * Search database by passing it a mongo search object.
 */
self.app.post('/data', function(req, res, options){
  var blob = req.body;

  if(!blob.options.limit){
    var limit = {'limit': 0};
  }
  else {
    var limit = blob.options.limit;
  }

  engine.find_many_by(blob,function(error, results) {
    if(!results || error) {
      console.log("agent query error");
      res.send("[]");
      return;
    }
    res.send(results);
  },{}, limit);
});

/** 
 * Search function for typeahead
 */
self.app.get('/search/all', function(req, res, options){

  var regex = {$regex: req.query.value, $options: 'i'};

  var query = {};

  engine.find_many_by({query: query, options: {'limit': 0}},function(error, results) {
    if(!results || error) {

      res.send("[]");
      return;
    }
    res.send(results);

  },{});
});

/*
self.app.get('/search/id', function(req, res, options){

  var regex = {$regex: '^' + req.query.value, $options: 'i'};

  var query = { $and: [ {'kind': 'right'},{'coordinates': {$exists: true}}, {'properties.id': regex}]};

  engine.find_many_by({query: query, options: {'limit': 0}},function(error, results) {
    if(!results || error) {

      res.send("[]");
      return;
    }
    res.send(results);

  },{});
});
*/




//////////////   end get
    };

    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};


/**
 *  main():  Main code.
 */
var zapp = new App();
zapp.initialize();
zapp.start();
