// mongo
var MongoDB = require('./mongo').MongoDB;

function enginecallback() {
  console.log("engine::authed");
}


EngineProvider = function() {
  var credentials = require('./credentials.js'); 
  this.db = new MongoDB(credentials); //openshift
  console.log("server::engine database is " + this.db );
};

EngineProvider.prototype.save = function(blob,handler) {

  var _id =           blob["_id"];

  // Search for existing by ID
  var search = 0;
  if(_id) search = {_id: _id.toHexString()};

  // If no ID yet then save as a new object and return it
  if(!search) {
    this.db.save(blob,handler);
    return;
  }

  // If an ID does exist then recycle it or fail
  var mydatabase = this.db;
  this.db.find_one_by(search, function(error, agent) {
    if(error) { handler(error,0); return; }
    if(agent) {
      _id = agent._id;
      for(var property in blob) {
        if(blob.hasOwnProperty(property) && blob[property]) {
          agent[property] = blob[property];
        }
      }
            
      mydatabase.update(agent,handler);
      return;
    }
    if(_id) {
      handler("Could not find specified by id " + _id,0);
      return;
    }

  });

};

EngineProvider.prototype.count_all_by = function(hash,callback) {
  return this.db.count_all_by(hash,callback);
}

EngineProvider.prototype.find_one_by_id = function(id,handler) {
  this.db.find_one_by_id(id,handler);
};

EngineProvider.prototype.findAll = function(handler) {
  this.db.find(handler);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////
// query
/////////////////////////////////////////////////////////////////////////////////////////////////////

EngineProvider.prototype.find_many_by = function(blob,handler,arg1,options) {
/*   console.log(options); */
  this.db.find_many_by(blob,handler,arg1, options);
};

exports.EngineProvider = EngineProvider;

