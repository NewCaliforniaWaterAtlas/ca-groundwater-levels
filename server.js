#!/bin/env node
//  OpenShift sample Node application

var http = require('http');
var fs      = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var request = require('request');

//var EngineProvider = require('./engine').EngineProvider;
//var engine = new EngineProvider();
//var _ = require('underscore')._;
//var async = require('async');

/**
 *  Define the sample application.
 */
var App = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '','levels.html': '','aquifers.html': '', 'api-versions.html': ''  };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./public/index.html');
        self.zcache['aquifers.html'] = fs.readFileSync('./public/aquifers.html');
        self.zcache['levels.html'] = fs.readFileSync('./public/levels.html');
        self.zcache['api-versions.html'] = fs.readFileSync('./public/api-versions.html');
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

        self.routes['/levels'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('levels.html') );
        };

        self.routes['/aquifers'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('aquifers.html') );
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };

        // Get all records
        // http://localhost:3000/watertable/v1
        var api = require('./controllers/api.js');

        // connect to Mongo when the app initializes
/*         mongoose.connect('mongodb://localhost/watertable'); */
        var credentials = require('./credentials.js');        
        mongoose.connect('mongodb://' + credentials.mongo_user + ':' + credentials.mongo_password + '@' + credentials.mongo_host + ':' + credentials.mongo_port + '/' + credentials.mongo_db);

        self.routes['/api/v1'] = api.list;
        self.routes['/api/v1/id/:id.:format?'] = api.showID;
        self.routes['/api/v1/depth?'] = api.getAverageDepth;

        self.routes['/api'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('api-versions.html') );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
//        self.app = module.exports = express.createServer();

        
        self.app = express.createServer();


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

        self.app.all('*', function(req, res, next) {
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
          res.header('Access-Control-Allow-Headers', 'Content-Type');
          next();
        });
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

};   /* Application.  */



/**
 *  main():  Main code.
 */
var zapp = new App();
zapp.initialize();
zapp.start();

