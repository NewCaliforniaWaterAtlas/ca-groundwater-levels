var date_start = '1/1/2009', date_end = '12/31/2012', increment = 700, limit = 50, latitude = 38.7647, longitude = -121.8404;

var url = 'http://localhost:3000/watertable/v1/depth?' 
  /*   + '&latitude=' + latitude  */
  /*   + '&longitude=' + longitude  */
    + '&limit=' + limit 
    + '&increment=' + increment 
    + '&date_start=' + date_start 
    + '&date_end=' + date_end 
  /*   + '&depth=true' */
 /*    + '&county=' + county; */


var w = 650,
    h = 500;

var projection = d3.geo.azimuthal()
    .mode("equidistant")
    .origin([-0.0858295, 51.523])
    .scale(180000*1);

var path = d3.geo.path()
    .projection(projection);
    
var svg = d3.select("body").insert("svg")
    .attr("width", w)
    .attr("height", h)

var g = svg.append("g");

// Executing the data to be added to map from an existing JSON file. Data source: geofabrik.de


d3.json('../data/uk.json', function(json) {
    console.log(json);

     g.selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path).style("fill", "gray")   
      .on("mouseover", function(e){d3.select(this).style("fill", "orange")})
      .on("mouseout", function(e){d3.select(this).style("fill", "gray")}) 
      .append("title").text(function (d) { return "ID: " + d.id + ". GS to WS: " + d.properties.gs_to_ws; })
      

    
d3.json(url, function(error, data) {
     g.selectAll("circle")
      .data(data[0])
      .enter()
      .append("circle")
      .attr("cx", function(d) {
              return projection ([d.geometry.coordinates[1], d.geometry.coordinates[0]]) [0];      
      })
      .attr("cy", function(d) {
              return projection ([d.geometry.coordinates[1], d.geometry.coordinates[0]]) [1];      
      })
      .attr("r", 5)
      .style("fill", "purple")
      .style("opacity", 0.65)
      .on("mouseover", function(){d3.select(this).style("fill", "orange").attr("r", 30).append("title").text(function (d) { return   "ID: " + d.id + ". GS to WS: " + d.properties.gs_to_ws;}) ;})
      .on("mouseout", function(){d3.select(this).style("fill", "purple").attr("r", 15);})
      .transition()
      .delay(100)
      .duration(1000)    
      .attr("r", 15)   
      }
   ); 

  
    });