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

*/

var Database = require('../models/database.js');
var Post = require('../models/post.js');
 
exports.post = function(req, res) {
    new Database({id: req.body.id}).save();
}

  
  /*
    http://mongoosejs.com/docs/queries.html
  */
  
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
    console.log(date_start)
    console.log(date_end)  
    query["properties.isodate"] = {$gte: date_start, $lt: date_end};
    // @TODO Mongo Date, convert date to timestamp
  }

/*
  gs_to_ws
  rp_elecation
  reading_ws
  rp_to_ws
  gs_elevation
  reading_ap
  wse
*/
  Database.find(query).limit(100).exec(callback);
}
 
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