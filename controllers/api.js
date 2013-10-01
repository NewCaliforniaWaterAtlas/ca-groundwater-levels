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
var csv = require('json-csv');
var Database = require('../models/database.js');
  
exports.list = function(req, res) {
  exports.getResults(req,res);
}

exports.buildDateRange = function (interval, date_start, date_end){

  moment().format();
  // 1, 2, 3, 4, 6 --- / 12  intervals
  
  var intervals = [];
 
  // Build intervals for date range queries.  
  var a = moment(date_start);
  var b = moment(date_end);

  var duration = moment.duration(interval, 'months');


  for (var m = a; m.isBefore(b); m.add(duration)) {
    var year = m.format('YYYY');
    var day = m.format('D');
    var month = m.format('M')-1;
    
    date = new Date(year, month, day);
    intervals.push(date);  // new Date(2012, 7, 14) -- necessary to lookup date in mongodb
  }
  
  bDate = new Date(b.format('YYYY'), b.format('M')-1, b.format('D'))
  intervals.push(bDate);
  return intervals;
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

  var _id, latitude, longitude, interval, date_start, date_end, intervals, limit, callback, gw_basin, hydrologic_unit
  var datacube = {
    fields: {},
    query: {},
    results: []
  };
  var queries = []; 
  var JSONStream = require('JSONStream');  
  var query = {};

  // Load all records for a well.  
  if(req.query.id !== undefined) {
    _id = req.query.id;
  }

  // Search for county, basin, or watershed.
  if(req.query.county !== undefined) {
    query["properties.county"] = req.query.county;
    // @TODO add lowercase search .toLower()?
  }

  if(req.query.gw_basin_code !== undefined) {
    query["properties.gw_basin_code"] = req.query.gw_basin_code;
  }

  if(req.query.hydrologic_unit !== undefined) {
    query["properties.hydrologic_unit"] = req.query.hydrologic_unit;
  }

  // Get lat & lon.
  if((req.query.latitude !== undefined) && (req.query.longitude !== undefined)) {
    latitude = parseInt(req.query.latitude);
    longitude = parseInt(req.query.longitude); 
  }
  // Get limit to number of records per query.
  if(req.query.limit !== undefined) {
    limit = parseInt(req.query.limit); // interval is in number of days.
    if(limit >= 500) {
      //limit = 500; // Faux rate limiting.
    }
  }
  else {
    limit = 100; // Default limit.
  }

  // Get interval amount.
  if(req.query.interval !== undefined) {
    interval = parseInt(req.query.interval); // interval is in number of days.
  }
  else {
    interval = 365;
  }

  // Get date ranges.
  if(req.query.date_start !== undefined) {
    date_start = req.query.date_start; // interval is in number of days.

  }
  else {
    date_start_m = moment().subtract('days', 365);
    date_start = date_start_m.format('M/D/YYYY');//last year
  }

  if(req.query.date_end !== undefined) {
    date_end = req.query.date_end; // interval is in number of days.
  }
  else {
    date_end_m = moment();
    date_end = date_end_m.format('M/D/YYYY');
  }
  
  console.log(date_start);
  console.log(date_end);
  intervals = exports.buildDateRange(interval, date_start, date_end);
  console.log(intervals);
  
  
  // Ignore records without a depth reading
/*   query["properties.gs_to_ws"] = {$ne: "null"}; */
/*   query["properties.gs_basin_name"] = {$ne: "null"}; */

  // For all date ranges, do multiple callbacks and store result.
  // http://stackoverflow.com/questions/13221262/handling-asynchronous-database-queries-in-node-js-and-mongodb
  if(intervals.length > 1) {
    for(var r = 0; r < intervals.length-1; r++) {    
      queries.push((function(r){
          return function(callback) {
          
          query["properties.isodate"] = {"$gte" : intervals[r], "$lte": intervals[r+1]};
 
          // Get results near point.
          if(latitude !== undefined && longitude !== undefined) {
              // Have to filter results by location then do extra query.
              Database.collection.geoNear(longitude, latitude, {query: query, num: limit, uniqueDocs: true }, function(err, results) { 
                if(results.results !== undefined) {
                  if(results.results.length > 1) {
                    var nodistance = [];
                    for (var i in results.results){
                      obj = results.results[i].obj;
                      nodistance.push(obj);
                    }
                    datacube.results.push(nodistance);
                  }
                  else {
                   /*  datacube.push(['']); */
                  }
                  
                  datacube.query.dates = intervals;
                  callback(); // @TODO is this the closure?
                }
            });
          }
          // Not a geographic search.
          // http://localhost:3000/watertable/v1/depth?limit=500
          else if(req.query.averages == "true") {
            
            query['properties.gs_to_ws'] = {$ne: "NULL"};

            Database.aggregate([
              { $match: query },
              { $group: {
                 '_id': "$properties.gw_basin_code",
                 'averageGStoWS' : { '$avg' : "$properties.gs_to_ws" },
                 'name' : { $addToSet : "$properties.gw_basin_name" },
                 'min' : {'$min' : "$properties.gs_to_ws" },
                 'max' : {'$max' : "$properties.gs_to_ws" }
                }
              }
               
              ],{limit: limit},function(err, results) {
              console.log(err);
              if(results !== undefined) {
                if(results.length > 1) {
                  datacube.results.push(results);
                }
                else {
/*                   datacube.push(['none']); */
                }
              }
              
              datacube.query.dates = intervals;
              callback();
            } );
          }
          else {
            console.log(query);
            Database.find(query).limit(limit).exec(function(err, results) {
              if(results !== undefined) {
                if(results.length > 1) {
                  datacube.results.push(results);
                }
                else {
/*                   datacube.push(['none']); */
                }
              }
              datacube.query.dates = intervals;
              callback();
            });
          }
        }
        })(r));
    }
  
    async.series(queries, function(){
      // This function executes after all the queries have returned
      console.log('done');

      if(req.query.format == 'csv') {

          var csvOutput = '';

          data_csv = [];

          for (i = 0; i < datacube.length; i++) {
            data_csv = data_csv.concat(datacube[i]);
          }    
          console.log(data_csv);
          var args = {
              //required: array of data
              data: data_csv,
          
              //field definitions for CSV export
              fields : [
                {
                  name : 'obj.properties.gs_to_ws',
                  label : 'gs_to_ws',
                  filter : function(value) { return value; }
                },
                {
                  name : 'obj.id',
                  label : 'id',
                  filter : function(value) { return value; }
                },
                {
                  name : 'obj.geometry.coordinates',
                  label : 'latitude',
                  filter : function(value) { return value[1]; }
                },
                {
                  name : 'obj.geometry.coordinates',
                  label : 'longitude',
                  filter : function(value) { return value[0]; }
                }

              ]
            };
  

          var callback = function(err,csv) {
            //csv contains string of converted data in CSV format. 
res.setHeader('Content-type', 'text/csv'); 
            res.send(csv);  
          }

          csv.toCSV(args, callback);
        
      }
      else {
        // Send GeoJSON.
        res.send(datacube);
      }
      
    });

  }
}



// Load records by id
exports.showID = (function(req, res) {
    Database.findOne({id: req.params.id}, function(error, database) {
        var posts = Post.find({database: database._id}, function(error, posts) {
          res.send([{database: database, posts: posts}]);
        });
    })
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











// OLD


/*
  // Test async query
  for(var r = 0; r < intervals.length -1; r++) {   
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
  
  var match = {$match: {'properties.isodate':{"$gte" : intervals[0], "$lte": intervals[1] }}};

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
  //query = {'properties.isodate': {"$gte" : intervals[0], "$lte": intervals[1] }}; 
  //Database.find(query).exec(callback);
*/
};


    
    //    query["properties.isodate"] = {"$gte" : intervals[r], "$lte": intervals[r+1]};


    /*
    for(var r = 0; r < intervals.length - 1; r++) {      // @TODO test upper limit

      // Get results near point.
      if(latitude !== undefined && longitude !== undefined) {
        datacube[intervals[r] + "_" + intervals[r+1]] = Database.collection.geoNear(longitude, latitude, {query: query, num: limit, includeLocs:false}, callback);
      }
      // Not a geographic search.
      // http://localhost:3000/watertable/v1/depth?limit=500
      else {
        console.log(query);
        datacube[intervals[r] + "_" + intervals[r+1]] = Database.find(query).limit(limit).exec(callback);
      }

      console.log(r);
    }
    */
    
    
/*
      
  else {

    callback = function(err, results) {
      // Convert to averages.
      
      res.send(results);
    };
    // Get results from the last year.
    query["properties.isodate"] = {"$gte" : intervals[0]};

    // Get results near point.
    if(latitude !== undefined && longitude !== undefined) {
      Database.collection.geoNear(longitude, latitude, {query: query, num: limit, includeLocs:false}, callback);
    }
    // Not a geographic search.
    // http://localhost:3000/watertable/v1/depth?limit=500
    else {
      console.log("tesT" + query);
      // raw results of queries in the date range.
      Database.find(query).limit(limit).exec(callback);
    }  
  }
*/


/*
    var group = { 
          _id : "$id", 
          average : { $avg : "$properties.gs_to_ws" },
          well : {"$addToSet": {
              geometry: "$geometry"
              }
          }
        }
    ;  
  
*/
