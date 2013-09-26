var address = '1400 Tenth St., Sacramento, CA, 95814';
var latitude = 37.000;
var longitude = -122.000;
var date_start = '7/1/2011';
var date_end = '7/1/2012';
var interval = 180;
var limit = 1000;
var format = 'json';
var apiPath = 'http://localhost:8080/api/v1?';

var labelPaddingX = 8;
var labelPaddingY = 12;

// Load map
var map = L.mapbox.map('map', 'examples.map-vyofok3q').setView([latitude, longitude], 6);

// Make aquifer layer.
var layer = L.geoJson(null, { style: { color: '#333', weight: 1 }});
map.addLayer(layer);


// Load aquifers (topoJSON)
/* Initialize the SVG layer */
map._initPathRoot()     


/* Define the d3 projection */
var path = d3.geo.path().projection(function project(x) {
    var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    return [point.x, point.y];
  });

var query = 
          //'latitude='  + latitude
          //+ '&longitude=' + longitude
          //+ "&" +
          'limit=' + limit
          + '&interval=' + interval
          + '&date_start=' + date_start
          + '&date_end=' + date_end
          + '&format=' + format;

var wellsQuery = apiPath + query;
var averagesQuery = apiPath + query + '&averages=' + "true";


var color_domain = [-1000, -100, -50, -25, -10, -5, 0, 10, 100];
var ext_color_domain = [-1500, -1000, -100, -50, -25, -10, -5, 0, 10, 100];
var legend_labels = ["< -1000", "-100", "-50", "-25", "-10", "-5", "0", "10", "> 100"];
var color = d3.scale.threshold()
.domain(color_domain)
.range(["#adfcad", "#ffcb40", "#ffba00", "#ff7d73", "#ff4e40", "#ff1300"]);

queue()
    .defer(d3.json, "./../data/topojson/dwr_basin_boundaries.json")
    .defer(d3.json, averagesQuery)
    .await(ready);


function ready(error, data1, data2) {
  differences = processDifferences(data2);
  buildSubBasins(data1, differences);
};

function buildSubBasins(data, differences) {
  var basins = topojson.feature(data, data.objects.database);
  console.log(basins);
 // layer.addData(basins);

  var svg = d3.select("#map").select("svg"),
    g = svg.append("g").attr("class", "basins");

   var basinsSVG = g.append("g")
  .attr("class", "basin")
  .selectAll("path")
  .data(basins.features)
  .enter().append("path")
  .attr("d", path)
  .style("fill", function(d) {

    if(d.id !== undefined){
          if(differences[d.id] !== undefined){
            console.log(differences[d.id].change);
          } 


    }
/*
    if(gwbasin !== undefined){
    if(differences[gwbasin] !== undefined){
    console.log(differences[gwbasin].change);
    }}
*/
/*     color() */
    return /* color(rateById[d.properties.GWBASIN]);  */ '#ffaa00';
  })
  .style("opacity", 0.8);
  
  
    map.on("viewreset", function reset() {

      basinsSVG.attr("d",path);

/*
      feature.attr("d",path);
   
      featureLabel.attr("x", function(d){
          return path.centroid(d)[0] + labelPaddingX;
      });
      
      featureLabel.attr("y", function(d){
          return  path.centroid(d)[1] + labelPaddingY;
      });
*/
  });

};

function processDifferences(data) {
  var differences = [];
  var data0 = d3.map(data[0]);
  var data1 = d3.map(data[1]);

  d0map = data[0].map(function(d){
    var int2 = data[1].filter(function(g) { 
      return g;
    })[0];
    
    if(d._id !== undefined && d._id !== null && d._id !== ''){
    id_upper = d._id.toUpperCase();
    differences[id_upper] = {
      start: d.averageGStoWS,
      change:  int2.averageGStoWS - d.averageGStoWS,
      end: int2.averageGStoWS
    };
    }
  });
console.log(differences);
  return differences;  
};



/* We simply pick up the SVG from the map object */
/*
var svg = d3.select("#map").select("svg"),
    g = svg.append("g").attr("class", "wells");

*/

// Calculate changes in average by interval.
/*
d3.json(averagesQuery, function(data) {
  var differences = [];
  var data0 = d3.map(data[0]);
  var data1 = d3.map(data[1]);

  
  d0map = data[0].map(function(d){
    console.log(d._id);
    

    var int2 = data[1].filter(function(g) { 
      return g;
    })[0];
    
    differences[d._id] = {
      start: d.averageGStoWS,
      change:  int2.averageGStoWS - d.averageGStoWS,
      end: int2.averageGStoWS
    };

  });
  console.log(differences);

  var color_domain = [50, 150, 350, 750, 1500]
  var ext_color_domain = [0, 50, 150, 350, 750, 1500]
  var legend_labels = ["< 50", "50+", "150+", "350+", "750+", "> 1500"]              
  var color = d3.scale.threshold()
  .domain(color_domain)
  .range(["#adfcad", "#ffcb40", "#ffba00", "#ff7d73", "#ff4e40", "#ff1300"]);


    
//    averageNextInterval = data[1]
  


  console.log(data);
});
*/

/* Load and project/redraw on zoom */
/*
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

*/
/*

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
    
*/


/*
d3.json('../../data/topojson/dwr_basin_boundaries.json', function(error, data) {
  var basins = topojson.feature(data,data.objects.database);
  layer.addData(basins);  
});
*/

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