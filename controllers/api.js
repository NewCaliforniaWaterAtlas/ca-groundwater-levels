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
  db.posts.ensureIndex({isodate: 1});

  http://mongoosejs.com/docs/queries.html

*/

var moment = require('moment');
var moment_range = require('moment-range');

var Database = require('../models/database.js');
//var Depth = require('../models/depth.js');
var Post = require('../models/post.js');
 
exports.post = function(req, res) {
    new Database({id: req.body.id}).save();
}
  
exports.list = function(req, res) {
  var callback = function(err, databases) {
    res.send(databases);
  };

  var query = {};

  var year_start;
  var month_start = '1';
  var day_start = '1';
  var year_end;
  var month_end = '12'
  var day_end;


  if(req.query.county !== undefined) {
    query["properties.county"] = req.query.county;
    // @TODO add lowercase search
  }


  if(req.query.year !== undefined) {
    year_start = req.query.year;
    //query["properties.year"] = req.query.year;
  }
  
  if(req.query.month !== undefined) {
    month_start = req.query.month;
    //query["properties.month"] = req.query.month;
  }

  if(req.query.day !== undefined) {
    day_start = req.query.day;
    //query["properties.day"] = req.query.day;
  }

  // If date range, override date behavior
  if(req.query.year_end !== undefined) {
    year_end = req.query.year_end;
  }

  if(req.query.month !== undefined) {
    month_end = req.query.month_end;
  }

  if(req.query.day !== undefined) {
    day_end = req.query.day_end;
  }
  else {

    if(month_end !== undefined) {
      switch(month_end){
        case 2:
          day_end = '28'; // @TODO deal with leap years
        case 4:
        case 6:
        case 9:
        case 11:
          day_end = '30';
        default:
          day_end = '31';          
      }
    }
  }
  
  // sample: http://localhost:3000/watertable/v1?year=2011&year_end=2013&month=2&month_end=6&day=2&day_end=15&county=Alameda
  // http://localhost:3000/watertable/v1?year=2011&year_end=2013&month=2&month_end=6&day=2&day_end=15&county=Alameda&id=375260N1219868W001&zoom=5&latitude=37.5259&longitude=-121.9869

  // If process as date range
  if(req.query.range == 'false') {
    // ignore date range default behavior, return all records matching specific month, day or year requests @experimental (?)
  }
  else {
    date_start = new Date(year_start,month_start,day_start,0,0);
    date_end = new Date(year_end,month_end,day_end,0,0);
    query["properties.isodate"] = {$gte: date_start, $lt: date_end};
  }

  Database.find(query).exec(callback);
}

function buildDateRange(increment, date_start, date_end){

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

exports.getAverageDepth = function(req,res) {

  // http://localhost:3000/watertable/v1/depth?latitude=38.7647&longitude=-121.8404?&limit=500&&increment=180&date_start=1/1/2010&date_end=12/31/2012

  var _id, latitude, longitude, increment, date_start, date_end, increments, query, limit;

  var callback = function(err, results) {
    res.send(results);
  };
  
  if(req.query.id !== undefined) {
    _id = req.query.id;
    console.log(_id);
  }

  if((req.query.latitude !== undefined) && (req.query.longitude !== undefined)) {
    latitude = parseInt(req.query.latitude);
    longitude = parseInt(req.query.longitude); 
  }
  
  if(req.query.increment !== undefined) {
    increment = parseInt(req.query.increment); // Increment is in number of days.
    console.log(increment);
  }
  else {
    increment = 365;
  }

  if(req.query.limit !== undefined) {
    limit = parseInt(req.query.limit); // Increment is in number of days.
    if(limit >= 500) {
      limit = 500;
    }
  }
  else {
    limit = 100;
  }

  if(req.query.date_start !== undefined) {
    date_start = req.query.date_start; // Increment is in number of days.

  }
  else {
    date_start = 365;//last year
  }

  if(req.query.date_end !== undefined) {
    date_end = req.query.date_end; // Increment is in number of days.

  }
  else {
    date_end = 365; //now @TODO from momentjs
  }
  //  console.log(date_start);
  //  console.log(date_end);

  increments = buildDateRange(increment, date_start, date_end);
  //console.log(increments);

  // Get results by location.
  // For each date range, get results in that range.
  // Aggregate by id
  // Build average gs_to_ws for that time period
  // Add coordinates
  // Push results to object
  
  // @TODO the command just doesn't work… upgrade to mongo 2.4?

  
  query = {
    "properties.gs_to_ws": {$ne: "NULL"},
    "properties.isodate":  {"$gte" : increments[0], "$lte": increments[1] }
  };
      
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
  


  // Get results near point.
  if(latitude !== undefined && longitude !== undefined) {
    Database.collection.geoNear(longitude, latitude, {query: query, num: limit, includeLocs:false}, callback);
  }




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


