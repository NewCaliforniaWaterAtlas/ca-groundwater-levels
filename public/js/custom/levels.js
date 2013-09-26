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
    

// load all wells by default -- default date range
var address = '1400 Tenth St., Sacramento, CA, 95814';
var latitude = 37.000;
var longitude = -122.000;
var date_start = '7/1/2011';
var date_end = '7/1/2012';
var interval = 180;
var limit = 1000;
var format = 'json';
var path = 'http://localhost:8080/api/v1?';

// Load map
var map = L.mapbox.map('map', 'examples.map-vyofok3q').setView([latitude, longitude], 6);

// Make aquifer layer.
var layer = L.geoJson(null, { style: { color: '#333', weight: 1 }});
map.addLayer(layer);

// Load aquifers (topoJSON)
d3.json('../../data/topojson/dwr_basin_boundaries.json', function(error, data) {
  var basins = topojson.feature(data, data.objects.database);          
  layer.addData(basins);
});





var query = 
          /*
'latitude='  + latitude
          + '&longitude=' + longitude
          + 
*/
          '&limit=' + limit
          + '&interval=' + interval
          + '&date_start=' + date_start
          + '&date_end=' + date_end
          + '&format=' + format;

var wellsQuery = path + query;

console.log(wellsQuery);

/* Initialize the SVG layer */
map._initPathRoot()     

/* We simply pick up the SVG from the map object */
/*
var svg = d3.select("#map").select("svg"),
    g = svg.append("g").attr("class", "wells");

*/

var svg = d3.select("#map").select("svg"),
    g = svg;

/* Define the d3 projection */
var path = d3.geo.path().projection(function project(x) {
    var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  });

var labelPaddingX = 8;
var labelPaddingY = 12;

/* Load and project/redraw on zoom */
d3.json(wellsQuery, function(data) {

    if(data.length > 1) {
      if(data[0].length > 1){
      var nest = d3.nest()
      .key(function(d) { return d.properties.gw_basin_name; }) // average reading by basin name. 
      .rollup(function(d) {
        return {
          averageGStoWS: d3.mean(d, function(g) { return g.properties.gs_to_ws; }),
          geometry: d[0].geometry,
          type: d[0].type,
          properties: d[0].properties,
          id: d[0].id,
          _id: d[0]._id,
        }
      })
      .map(data[0]);
  
      
      nestValues = d3.values(nest);
      console.log(nestValues.length);    
  
      console.log(nest);
  
      var feature = g.selectAll("path")
        .data(nestValues)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "well");
  
      var featureLabel = g.selectAll("text")
        .data(nestValues)
      .enter()
      .append("svg:text")
      .text(function(d){
          return Math.floor(d.averageGStoWS) + " " + d.properties.gw_basin_name;
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

  }}
});



// Move d to be adjacent to the cluster node.
function cluster(alpha) {
  var max = {};

  // Find the largest node for each cluster.
  nodes.forEach(function(d) {
    if (!(d.color in max) || (d.radius > max[d.color].radius)) {
      max[d.color] = d;
    }
  });

  return function(d) {
    var node = max[d.color],
        l,
        r,
        x,
        y,
        i = -1;

    if (node == d) return;

    x = d.x - node.x;
    y = d.y - node.y;
    l = Math.sqrt(x * x + y * y);
    r = d.radius + node.radius;
    if (l != r) {
      l = (l - r) / l * alpha;
      d.x -= x *= l;
      d.y -= y *= l;
      node.x += x;
      node.y += y;
    }
  };
}

// Resolves collisions between d and all other circles.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + radius.domain()[1] + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
    });
  };
}




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