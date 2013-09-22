$( "#datepicker-start" ).datepicker();
$( "#datepicker-end" ).datepicker();
$( "#slider" ).slider({
      value:100,
      min: 0,
      max: 500,
      step: 50,
      slide: function( event, ui ) {
        $( "#amount" ).val( "$" + ui.value );
      }
    });
    $( "#amount" ).val( "$" + $( "#slider" ).slider( "value" ) );
    


// Load map
var map = L.mapbox.map('map', 'examples.map-vyofok3q').setView([37.5, -118], 6);

// Make aquifer layer.
var layer = L.geoJson(null, { style: { color: '#333', weight: 1 }});
map.addLayer(layer);

// Load aquifers (topoJSON)
d3.json('../../data/topojson/dwr_basin_boundaries.json', function(error, data) {
  var basins = topojson.feature(data, data.objects.database);          
  layer.addData(basins);
})


// load all wells by default -- default date range
var address = '1400 Tenth St., Sacramento, CA, 95814';
var latitude = 37.000;
var longitude = -122.000;
var date_start = '7/1/2011';
var date_end = '7/1/2012';
var interval = 364;

var path = 'http://localhost:8080/api/v1';
var query = '';

// Geocode address.
// http://www.gisgraphy.com/documentation/user-guide.htm#geocodingwebservice

// on submit
// get address
// geocode it
// get lat lon
// get current date range
// default interval - 365
// construct search query
// get back results
// start map at the beginning

// plot wells
// add numbers to wells
// by subbasin, construct average number
// plot color
// set color of aquifer

// on change time slider, load selected increment
// update map