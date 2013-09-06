// The Thread model
 
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var databaseSchema = new Schema({
    id:  String,
}, { collection: 'database' });
 
module.exports = mongoose.model('database', databaseSchema);