
var path = 'http://localhost:3000/watertable/v1?year=2000&year_end=2013&month=2&month_end=6&day=2&day_end=15&county=Alameda';

d3.json(path, function(error, wells) {

  // Various formatters.
  var formatNumber = d3.format(",d"),
      formatChange = d3.format("+,d"),
      formatDate = d3.time.format("%B %d, %Y"),
      formatTime = d3.time.format("%I:%M %p");


  // A nest operator, for grouping the well list.
  var nestByID = d3.nest()
      .key(function(d) { return d3.time.day(d.id); });

  // A little coercion, since the CSV is untyped.
  wells.forEach(function(d, i) {
    d.index = i;
    d.date = new Date(d.properties.year,d.properties.month, d.properties.day,0, 0);
    d.gs_to_ws = d.properties.gs_to_ws;
  });
  
  // Create the crossfilter for the relevant dimensions and groups.
  var well = crossfilter(wells),
      all = well.groupAll();
/*
      date = well.dimension(function(d) { return d.date; }),
      dates = date.group(d3.time.day),
      distance = well.dimension(function(d) { return Math.min(-1000, d.properties.gs_to_ws); }),
      distances = distance.group(function(d) { return Math.floor(d / 50) * 50; })
*/;


// http://eng.wealthfront.com/2012/09/explore-your-multivariate-data-with-crossfilter.html
// Use the crossfilter force.
var cf = crossfilter(wells);

// Create our dimension by political party.
var byParty = cf.dimension(function(p) { return p.id; });

var groupByParty = byParty.group();
groupByParty.top(Infinity).forEach(function(p, i) {
  console.log(p.key + ": " + p.value);
});


//byParty.filterExact("Whig");

byParty.top(Infinity).forEach(function(p, i) {
  console.log(p.id + ". " + p.properties.gs_to_ws);
});

byParty.filterAll();

groupByParty.top(Infinity).forEach(function(p, i) {
  console.log(p.key + ": " + p.value);
});



    var byTookOffice = cf.dimension(function(p) { console.log(p);return p.year; });
    
    console.log("Total # of wells: " + byTookOffice.top(Infinity).length);
    
    // filter to presidents starting after 1900.
    byTookOffice.filter([new Date(1900, 1, 1), Infinity]);
    
    console.log("# of wells starting after 1970: " + byTookOffice.top(Infinity).length);


    groupByParty.top(Infinity).forEach(function(p, i) {
      console.log(p.key + ": " + p.value);
    });
    
    //byTookOffice.filterAll();
    
    function barchart(id, groupByParty) {
      var woff = 115;
      var hoff = 0;
      var w = 400 + woff;
      var h = 100 + hoff;
    
      var parties = groupByParty.top(Infinity);
    
      var chart = d3.select(id)
        .append("svg")
          .attr("class", "chart")
          .attr("width", w)
          .attr("height", h)
        .append("g")
          .attr("transform", "translate(" + woff + "," + hoff + ")");
    
      var x = d3.scale.linear()
        .domain([0, d3.max(parties, function(v) { return v.value; })])
        .range([0, w-woff]);
    
      var y = d3.scale.ordinal()
        .domain(d3.range(parties.length))
        .rangeBands([0, h-hoff]);
    
      var refresh = function() {
        var bars = chart.selectAll("rect")
            .data(parties, function(v) { return v.key; });
    
        bars.enter().append("rect")
            .attr("height", y.rangeBand());
    
        bars.attr("y", function(d, i) { return i * y.rangeBand(); })
            .attr("width", function(v) { return x(v.value); });
    
        var partyLabels = chart.selectAll(".party-label")
            .data(parties, function(v) { return v.key; });
    
        partyLabels.enter().append("text")
            .attr("class", "party-label")
            .attr("x", function(v) { return 0; })
            .attr("y", function(d, i) { return y(i) + y.rangeBand() / 2; })
            .attr("dx", -3)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text(function(v) { return v.key; });
    
        var valueLabels = chart.selectAll(".value-label")
            .data(parties, function(v) { return v.key; });
    
        valueLabels.enter().append("text")
            .attr("class", "value-label")
            .attr("dy", ".35em")
            .attr("dx", -3);
    
        valueLabels
            .attr("y", function(d, i) { return y(i) + y.rangeBand() / 2; })
            .text(function(v) { return v.value; })
            .attr("x", function(v) { 
              if (v.value === 0) {
                return x(1);
              } else {
                return x(v.value); 
              }
            })
            .classed("white", function(v) { 
              return v.value !== 0;
            });
    
      };
    
      refresh();
    
      return {refresh: refresh};
    
    }


    var bars = barchart("#chart", groupByParty);
    
    $("#slider").change(function(ev) {
      var year = $(this).val();
      $("#start-year").text(year);

      byTookOffice.filter([new Date(2000, 1, 1), Infinity]);
      bars.refresh();
    });

/*





  var charts = [
    barChart()
        .dimension(distance)
        .group(distances)
      .x(d3.scale.linear()
        .domain([0, 2000])
        .rangeRound([0, 10 * 40])),

    barChart()
        .dimension(date)
        .group(dates)
        .round(d3.time.day.round)
      .x(d3.time.scale()
        .domain([new Date(2001, 0, 1), new Date(2001, 3, 1)])
        .rangeRound([0, 10 * 90]))
        .filter([new Date(2001, 1, 1), new Date(2001, 2, 1)])

  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });


  // Render the initial lists.
  var list = d3.selectAll(".list")
      .data([wellList]);

  // Render the total.
  d3.selectAll("#total")
      .text(formatNumber(well.size()));

  renderAll();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
    list.each(render);
    d3.select("#active").text(formatNumber(all.value()));
  }

  // Like d3.time.format, but faster.
  function parseDate(d) {
    return new Date(2001,
        d.substring(0, 2) - 1,
        d.substring(2, 4),
        d.substring(4, 6),
        d.substring(6, 8));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function wellList(div) {
    var wellsByID = nestByID.entries(date.top(100));

    div.each(function() {
      var date = d3.select(this).selectAll(".id")
          .data(wellsByID, function(d) { return d.key; });

      date.enter().append("div")
          .attr("class", "id")
        .append("div")
          .attr("class", "day")
          .text(function(d) { return formatDate(d.values[0].date); });

      date.exit().remove();

      var well = date.order().selectAll(".well")
          .data(function(d) { return d.values; }, function(d) { return d.index; });

      var wellEnter = well.enter().append("div")
          .attr("class", "well");

      wellEnter.append("div")
          .attr("class", "time")
          .text(function(d) { return formatTime(d.properties.date); });

      wellEnter.append("div")
          .attr("class", "distance")
          .text(function(d) { return formatNumber(d.properties.gs_to_ws) + " ft."; });

      well.exit().remove();

      well.order();
    });
  }

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }
*/
});