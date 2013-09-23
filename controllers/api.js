/* 

  https://gist.github.com/fwielstra/1025038
  
  The API controller
   Exports 3 methods:
   * post - Creates a new database
   * list - Returns a list of databases
   * show - Displays a database and its posts
*/
 
/* Mongo Indexes to create -----------------------------------------------------

  Create geospatial index: http://docs.mongodb.org/manual/core/geospatial-indexes/
  db.database.ensureIndex( { "geometry.coordinates": "2d" } )
  db.database.ensureIndex( { "id": 1 } )
  db.posts.ensureIndex({"properties.isodate": 1});

  http://mongoosejs.com/docs/queries.html

*/

var moment = require('moment');
var async = require('async');
var moment_range = require('moment-range');

var Database = require('../models/database.js');
//var Depth = require('../models/depth.js');
var Post = require('../models/post.js');
 
exports.post = function(req, res) {
    new Database({id: req.body.id}).save();
}
  
exports.list = function(req, res) {
  exports.getResults(req,res);
}

exports.buildDateRange = function (increment, date_start, date_end){

  moment().format(); // @TODO necessary??

  var increments = [];
 
  // Build increments for date range queries.  
  var a = moment(date_start);
  var b = moment(date_end);

  for (var m = a; m.isBefore(b); m.add('days', increment)) {
    var year = m.format('YYYY');
    var day = m.format('D');
    var month = m.format('M');
    
    date = new Date(year, month, day);
    increments.push(date);  // new Date(2012, 7, 14) -- necessary to lookup date in mongodb
  }

  return increments;
}

/*
  // Get results by location.
  // For each date range, get results in that range.

  @TODO build ranges

  // Do with crossfilter?
  // Aggregate by id
  // Build average gs_to_ws for that time period
  // Push results to object
  
*/
exports.getResults = function(req,res) {

  var _id, latitude, longitude, increment, date_start, date_end, increments, limit, callback,
  query = {};
  
  if(req.query.id !== undefined) {
    _id = req.query.id;
    console.log(_id);
  }

  if(req.query.county !== undefined) {
    query["properties.county"] = req.query.county;
    // @TODO add lowercase search .toLower()?
  }

  if((req.query.latitude !== undefined) && (req.query.longitude !== undefined)) {
    latitude = parseInt(req.query.latitude);
    longitude = parseInt(req.query.longitude); 
  }

  if(req.query.limit !== undefined) {
    limit = parseInt(req.query.limit); // Increment is in number of days.
    if(limit >= 500) {
      //limit = 500;
    }
  }
  else {
    limit = 100;
  }

  if(req.query.range == 'false') {
    // ignore date range default behavior, return all records matching specific month, day or year requests @experimental (?)
  }
  else {    
    if(req.query.increment !== undefined) {
      increment = parseInt(req.query.increment); // Increment is in number of days.
      console.log(increment);
    }
    else {
      increment = 365;
    }
  
    if(req.query.date_start !== undefined) {
      date_start = req.query.date_start; // Increment is in number of days.
  
    }
    else {
      date_start_m = moment().subtract('days', 365);
      date_start = date_start_m.format('M/D/YYYY');//last year
    }
  
    if(req.query.date_end !== undefined) {
      date_end = req.query.date_end; // Increment is in number of days.
  
    }
    else {
      date_end_m = moment();
      date_end = date_end_m.format('M/D/YYYY');
    }
    //console.log(date_start);
    //console.log(date_end);
  
    increments = exports.buildDateRange(increment, date_start, date_end);
    console.log(increments);  
  }

  // Ignore records without a depth reading
  // @TODO THis is broken?
/*
  if(req.query.depth !== undefined){
    query["properties.gs_to_ws"] = {$ne: "NULL"};
  }
*/
      
    // @TODO make data cube by iterating to get multiple sets of results.
    var group = { 
          _id : "$id", 
          average : { $avg : "$properties.gs_to_ws" },
          well : {"$addToSet": {
              geometry: "$geometry"
              }
          }
        }
    ;  
  

  // http://localhost:3000/watertable/v1/depth?latitude=38.7647&longitude=-121.8404?&limit=500&&increment=180&date_start=1/1/2010&date_end=12/31/2012&depth=true

  // If multiple date ranges, do multiple callbacks and store result.
  // http://stackoverflow.com/questions/13221262/handling-asynchronous-database-queries-in-node-js-and-mongodb
  if(increments.length > 1) {
    var datacube = [];
    
//    query["properties.isodate"] = {"$gte" : increments[r], "$lte": increments[r+1]};


/*
    for(var r = 0; r < increments.length - 1; r++) {      // @TODO test upper limit

      // Get results near point.
      if(latitude !== undefined && longitude !== undefined) {
        datacube[increments[r] + "_" + increments[r+1]] = Database.collection.geoNear(longitude, latitude, {query: query, num: limit, includeLocs:false}, callback);
      }
      // Not a geographic search.
      // http://localhost:3000/watertable/v1/depth?limit=500
      else {
        console.log(query);
        datacube[increments[r] + "_" + increments[r+1]] = Database.find(query).limit(limit).exec(callback);
      }

      console.log(r);
    }
*/


//----------------

    var queries = []; 

/*
  // Test async query
  for(var r = 0; r < increments.length -1; r++) {   
    queries.push((function(j){
        return function(callback) {
        Database.find({}).limit(10).exec(function(err, results) {
          console.log('results');
          console.log(results.length);
          if(results.length > 1) {
            datacube.push(results);
          }
          else {
            datacube.push(['none']);
          }
          callback();
        });
      }
      })(r));
  }
*/

    JSONStream = require('JSONStream');

/*
  json.on('data', function(doc) {
    // this will get called for each JSON object (available here as 'doc') that JSONStream parses
  })
*/

    for(var r = 0; r < increments.length-1; r++) {
      
      queries.push((function(r){
          return function(callback) {
          
          query["properties.isodate"] = {"$gte" : increments[r], "$lte": increments[r+1]};
 
          // Get results near point.
          if(latitude !== undefined && longitude !== undefined) {
              Database.collection.geoNear(longitude, latitude, {query: query, num: limit, includeLocs:false}, function(err, results) {
  
              if(results.results !== undefined) {
                  console.log('results');
                if(results.results.length > 1) {
                  console.log(results.results.length);
                  datacube.push(results.results);
                }
                else {
                  datacube.push(['none']);
                }
                callback(); // @TODO is this the closure?
              }
            });
          }
          // Not a geographic search.
          // http://localhost:3000/watertable/v1/depth?limit=500
          else {
          console.log(query);
            Database.find(query).limit(limit).exec(function(err, results) {
              console.log('results');
              if(results.length > 1) {
                datacube.push(results);
              }
              else {
                datacube.push(['none']);
              }
              callback();
            });
          }
        }
        })(r));
    }
  
  
    async.series(queries, function(){
      // This function executes after all the queries have returned
      console.log('done');
      res.send(datacube);
    });


  }
  else {

    callback = function(err, results) {
      res.send(results);
    };
    
    query["properties.isodate"] = {"$gte" : increments[0]};

    // Get results near point.
    if(latitude !== undefined && longitude !== undefined) {
      Database.collection.geoNear(longitude, latitude, {query: query, num: limit, includeLocs:false}, callback);
    }
    // Not a geographic search.
    // http://localhost:3000/watertable/v1/depth?limit=500
    else {
      console.log(query);
      Database.find(query).limit(limit).exec(callback);
    }  
  }
  
  

}

exports.getAverageDepth = function(req,res) {

  exports.getResults(req,res);
  
  
  // @TODO move all of this to the primary query… (put in a function)

  // REFERENCE:
  // Not working.
/*
  var near =  
  {
  $near:{
    "near":[longitude,latitude],
    "distanceField":"d",
    "maxDistance":0.008
  }};
  
  var match = {$match: {'properties.isodate':{"$gte" : increments[0], "$lte": increments[1] }}};

  // Works
  var group = 
  { $group : { 
          _id : "$id", 
          average : { $avg : "$properties.gs_to_ws" },
          well : {"$addToSet": {
              geometry: "$geometry"
              }
          }
        }
  }

   var pipeline = [match, group];
  
  var options = {};

  //Database.
  Database.aggregate(pipeline, options, callback);

  // Works
  //query = {'properties.isodate': {"$gte" : increments[0], "$lte": increments[1] }}; 
  //Database.find(query).exec(callback);
*/
};


// Load records by id
exports.showID = (function(req, res) {
    Database.findOne({id: req.params.id}, function(error, database) {
        var posts = Post.find({database: database._id}, function(error, posts) {
          res.send([{database: database, posts: posts}]);
        });
    })
});


// Load records by year
exports.showYear = (function(req, res) {

});

// Load records by county
exports.showCounty = (function(req, res) {
  var query = {"properties.county": req.params.county};
  var limit = 100;
  var callback = function(err, databases) {
    res.send(databases);
  };
  
  Database.find(query).limit(limit).exec(callback);
});


