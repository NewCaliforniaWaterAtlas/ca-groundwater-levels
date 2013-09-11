var date_start = '1/1/2011', date_end = '12/31/2012', increment = 365, limit = 50, latitude = 38.7647, longitude = -121.8404;

var path = 'http://localhost:3000/watertable/v1/depth?' 
  /*   + '&latitude=' + latitude  */
  /*   + '&longitude=' + longitude  */
    + '&limit=' + limit 
    + '&increment=' + increment 
    + '&date_start=' + date_start 
    + '&date_end=' + date_end 
  /*   + '&depth=true' */
 /*    + '&county=' + county; */


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

var nest;
var row;
// Load all data.
d3.json(path, function(rows) {
  row = rows[0]; // for now just get the first item of the datacube
  
  var format = d3.time.format("%m/%d/%Y"); // Match the format of the well record properties.date field.
  nest  = d3.nest()
    .key(function(d) { return d.properties.county; })
    .key(function(d) { return d.id; })
    .entries(row); // organize the object by county and well
    
     for(countyIndex in nest) {
      var countyObject = nest[countyIndex];
      var countyName = countyObject.key;
      
      var wells = countyObject.values;
      var buildHorizons = [];

      // Insert County Name.
      d3.select("body")
        .append("div").text(countyName);

        wells.forEach(function(well) {
          // console.log(well);
          var wellID = well.key;
          var wellReadings = well.values;
          var numberReadings = wells.length;
          var readingsValues = []; // get values to visualize.
          for(i in wellReadings) {
            var buildHorizon = context.metric(function(start, stop, step, callback) {
                  /*
                  rows = wellReadings.map(function(d) { 
                      return [format.parse(reading.properties.date), +reading.properties.gs_to_ws]; })
                        .filter(function(d) { return d[1]; }).reverse();
                  var date = rows[0][0], 
                    compare = rows[4][1], 
                    value = rows[0][1], 
                    values = [value];
                  rows.forEach(function(d) {
                    while ((date = d3.time.day.offset(date, 1)) < d[0]) values.push(value);
                    values.push(value = (d[1] - compare) / compare);
                  });
                  callback(null, values.slice(-context.size()));
                  */
              var values = [1, 35, 124,136,124,135];
                start = +start;
                stop = +stop;
                while (start < stop) {
                  start += step;
              
                  values.push(Math.random());
                }
                
                callback(null, values);
                }, wellID);
            
            console.log(buildHorizon);
            buildHorizons.push(buildHorizons);
            
            // Draw horizon.
            d3.select("body").selectAll(".horizon")
                .data(buildHorizon)
              .enter().insert("div", ".bottom")
                .attr("class", "horizon")
              .call(context.horizon()
                .format(d3.format("+,.2p")));
       }
        });

     }


});




context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
});

