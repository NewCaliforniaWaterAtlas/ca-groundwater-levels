


var date_start = '1/1/2011', date_end = '12/31/2012', increment = 365, limit = 50, latitude = 38.7647, longitude = -121.8404;



// http://nickqizhu.github.io/dc.js/
// cubism: https://github.com/square/cube/blob/master/static/cubism.v1.js
// http://xaranke.github.io/blog/cubism-intro/
// http://vimeo.com/42176902

var context = cubism.context()
    .serverDelay(new Date(2012, 4, 2) - Date.now())
    .step(864e5)
    .size(1280)
    .stop();


d3.select("#demo").selectAll(".axis")
    .data(["top", "bottom"])
  .enter().append("div")
    .attr("class", function(d) { return d + " axis"; })
    .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

d3.select("body").append("div")
    .attr("class", "rule")
    .call(context.rule());


context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
});


var path = 'http://localhost:3000/watertable/v1/depth?' 
  /*   + '&latitude=' + latitude  */
  /*   + '&longitude=' + longitude  */
    + '&limit=' + limit 
    + '&increment=' + increment 
    + '&date_start=' + date_start 
    + '&date_end=' + date_end 
  /*   + '&depth=true' */
 /*    + '&county=' + county; */

var format = d3.time.format("%m/%d/%Y"); // strict date formatting, https://github.com/mbostock/d3/wiki/Time-Formatting








function wells() {
  
  return context.metric(function(start, stop, step, callback) {

    d3.json(path, function(rows) {
      var row = rows[0];


      // @TODO locs turn on change object depth.
      var nest  = d3.nest()
        .key(function(d) { return d.properties.county; })
        .key(function(d) { return d.id; })
        .map(row, d3.map);
        
       console.log(nest); 
    });

  }, name);
}

/*
d3.select("body").selectAll(".horizon")
    .data(nest
.map(nest))
  .enter().insert("div", ".bottom")
    .attr("class", "horizon")
  .call(context.horizon()
    .format(d3.format("+,.2p")));

      
      for(county in nest) {
        for(well in county){
          console.log(nest[county]);
        }
      }
*/
    
/*
d3.select("body").selectAll(".horizon").data([county
      ]).enter().insert("div", ".bottom")
    .attr("class", "horizon")
  .call(context.horizon()
    .format(d3.format("+,.2p")));
        }
      }  
*/






/*
function(d) { 
          console.log(d);
          return [format.parse(d.properties.date), +d.properties.gs_to_ws]
                 .filter(function(d) { return d[1]; }).reverse();
          
          var date = rows[0][0], 
              compare = rows[limit - 1][1], 
              value = rows[0][1], 
              values = [value];
  
          rows.forEach(function(d) {
            while ((date = d3.time.day.offset(date, 1)) < d[0]) values.push(value);
            values.push(value = (d[1] - compare) / compare);
          });
          callback(null, values.slice(-context.size()));
        }
*/



