/* The API controller
   Exports 3 methods:
   * post - Creates a new database
   * list - Returns a list of databases
   * show - Displays a database and its posts
*/
 
/* Mongo Indexes to create -----------------------------------------------------
 db.database.ensureIndex( { "geometry.coordinates": "2d" } )
*/

// https://gist.github.com/fwielstra/1025038

var Database = require('../models/database.js');
var Post = require('../models/post.js');
 
exports.post = function(req, res) {
    new Database({id: req.body.id}).save();
}
 
exports.list = function(req, res) {
  var callback = function(err, databases) {
    res.send(databases);
  };

  Database.find({}).limit(100).exec(callback);
  
/*
  http://mongoosejs.com/docs/queries.html
*/

}
 
// first locates a database by id, then locates the replies by database ID.
exports.show = (function(req, res) {
    Database.findOne({id: req.params.id}, function(error, database) {
        var posts = Post.find({database: database._id}, function(error, posts) {
          res.send([{database: database, posts: posts}]);
        });
    })
});