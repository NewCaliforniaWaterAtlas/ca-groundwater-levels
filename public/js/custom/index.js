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