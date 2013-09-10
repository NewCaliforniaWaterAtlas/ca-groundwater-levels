// The Thread model
 
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var databaseSchema = new Schema({
    id:  String,
    properties: {
      year: String,
      month: String,
      day: String,
      county: String,
      gs_to_ws: Number,
    }

/*
        "geometry" : {
                "type" : "Point",
                "coordinates" : [
                        -121.9869,
                        37.5259
                ]
        },
        "type" : "Feature",
        "id" : "375259N1219869W001",
        "properties" : {
                "collecting" : "Alameda County Water District",
                "measurement_accuracy" : "0.1 Ft",
                "filetime" : "2013-08-02 20:33:25",
                "month" : "1",
                "county" : "Alameda",
                "comments" : "CASGEM",
                "year" : "2011",
                "gs_to_ws" : "35.900",
                "rp_elecation" : "37.000",
                "no_measurement" : "",
                "reading_ws" : "0.000",
                "measurement_method" : "ES - Electric sounder measurement",
                "filename" : "Alameda_06.21.1983-06.21.2013.csv",
                "rp_to_ws" : "35.900",
                "military_time_pst" : "00:00",
                "questionable_measurement" : "",
                "gs_elevation" : "37.000",
                "date" : "1/4/2011",
                "reading_ap" : "35.900",
                "day" : "4",
                "wse" : "1.100",
                "well" : "W001",
                "local_well_number" : "5S/1W-05H004"
        }
    
*/
    
    
    }, { collection: 'database' });

 
module.exports = mongoose.model('database', databaseSchema);