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
var map = L.mapbox.map('map', 'examples.map-vyofok3q').setView([37.5, -118], 8);

// Make aquifer layer.
var layer = L.geoJson(null, { style: { color: '#333', weight: 1 }});
map.addLayer(layer);

// Load aquifers (topoJSON)
/*
d3.json('../../data/topojson/dwr_basin_boundaries.json', function(error, data) {
  var basins = topojson.feature(data, data.objects.database);          
  layer.addData(basins);
});
*/


// load all wells by default -- default date range
var address = '1400 Tenth St., Sacramento, CA, 95814';
var latitude = 37.000;
var longitude = -122.000;
var date_start = '7/1/2011';
var date_end = '7/1/2012';
var interval = 180;
var limit = 100;
var format = 'json';
var path = 'http://localhost:8080/api/v1?';


var query = 'latitude='  + latitude
          + '&longitude=' + longitude
          + '&limit=' + limit
          + '&interval=' + interval
          + '&date_start=' + date_start
          + '&date_end=' + date_end
          + '&format=' + format;

var wellsQuery = path + query;

console.log(wellsQuery);


/* Initialize the SVG layer */
map._initPathRoot()     

/* We simply pick up the SVG from the map object */
var svg = d3.select("#map").select("svg"),

//var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "wells");

/* Define the d3 projection */
var path = d3.geo.path().projection(function project(x) {
    var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  });

var labelPaddingX = 8;
var labelPaddingY = 12;

/* Load and project/redraw on zoom */
d3.json(wellsQuery, function(collection) {
    console.log(collection);
    var feature = g.selectAll("path")
      .data(collection)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "well");
  
    var featureLabel = g.selectAll("text")
    .data(collection)
    .enter()
    .append("svg:text")
    .text(function(d){
        return d.properties.gs_to_ws;
    })
    .attr("x", function(d){
        return path.centroid(d)[0] + labelPaddingX;
    })
    .attr("y", function(d){
        return  path.centroid(d)[1] + labelPaddingY;
    })
    .attr("class","well-label");
 

  map.on("viewreset", function reset() {
    feature.attr("d",path)
   
    featureLabel.attr("x", function(d){
        return path.centroid(d)[0] + labelPaddingX;
    })
    featureLabel.attr("y", function(d){
        return  path.centroid(d)[1] + labelPaddingY;
    })
  })
});



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

// on change time slider, load selected interval
// update map