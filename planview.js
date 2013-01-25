
function planview (restore) {
  if (restore) { 
    d3.selectAll("section")
      .style("visibility", "visible");
    d3.selectAll(".planview").remove();
    return;
  }
  d3.selectAll("section")
    .style("visibility", "hidden")

  container = d3.select("body")
    .append("div")
      .classed("planview", true)
      .style("width", "100%")
      .style("height", "100%")
      .style("position", "absolute") // some of these don't seem to be
                                     // applied by the style sheet in
                                     // time to do the calculation, so explicit

  var segments = d3.selectAll("#editable-street-section .segment:not([type=separator])")

  var features = [],
      width = 0,
      height;

  segments.each(function (t) { dbg=this; features.push({
                    name: this.dataset.name,
                    left: this.offsetLeft,
                    width: this.clientWidth,
                    color: this.dataset.color,
                    texture: this.dataset.texture || null,
                    rulerWidth: this.dataset.width
                  })
                })
  
  streetLines = [];
  
  var svg = container.append("svg");

  features.map(function (e,i,c) { 
    if (e.texture) {
      //c[i].texture = 
      svg.append("pattern")
            .attr("id", e.texture) 
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 100)
            .attr("height", 100)
            .append("image")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 100)
            .attr("height", 100)
            .attr("xlink:href", "images/"+e.texture+'.png');
    }
    width += e.width;
    if (c[i-1] && c[i+1]) {
      if (c[i].color === c[i+1].color) {
        streetLines.push(e.left+e.width);
      }
    }
  })

  var maxwidth = container.node().clientWidth,
      maxheight = container.node().clientHeight;

  height = .7 * maxheight;

  svg.style("top", Math.round(.15 * maxheight));
  svg.style("left", Math.round((maxwidth - width)/2));

  svg.selectAll("rect")
    .data(features)
    .enter()
    .append("rect")
    .attr("x", function (d) { return d.left; })
    .attr("y", 0)
    .attr("height", height)
    .attr("width", function (d) { return d.width; })
    .attr("fill", function (d) { return d.texture? "url(#"+d.texture+")": d.color; })
 
  paintedLines = d3.svg.line()

  dbg=svg.selectAll("line")
    .data(streetLines)
    .enter()
    .append("line")
      .attr("x1", function (d) { return d; })
      .attr("x2", function (d) { return d; })
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke-dasharray", "5, 5")
      .attr("stroke", "rgba(200,200,0,.5)")
}

var togglePlanView = 1;

d3.select("#planview-toggle")
  .on("click", function () { 
    planview(++togglePlanView % 2);
    d3.select(this).text(function () {
      return ["Back", "Plan view"][(togglePlanView % 2)] 
    })
  })
