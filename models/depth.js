// The Thread model
 
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var depth_2013 = new Schema({
    _id:  String,
    average: Number,
    geometry: {
      coordinates: [],
      type: String
    }
    }, { collection: 'depth_2013' });

module.exports = mongoose.model('depth_2013', depth_2013);