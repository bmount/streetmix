
function planview (restore) {
  if (restore) { 
    d3.select("#street-section-canvas")
      .transition().duration(1000)
      .style("top", "50%")
    d3.selectAll(".nonplan").transition().duration(1000).style("opacity", 1);
    d3.selectAll(".planview")
      .transition().duration(1000)
      .style("opacity", 0);
    if (main && main.draggingStatus.planview) main.draggingStatus.planview = false;
    return;
  }
  
  d3.selectAll(".planview").remove();
  
  main.draggingStatus.planview = true;
  
  d3.selectAll(".nonplan").transition().duration(1000).style("opacity", 0);

  var streetCanvas = d3.select("#street-section-canvas");
  
  streetCanvas.transition().duration(1000).style("top", "-5%");

  var container = d3.select("body")
    .append("div")
      .classed("planview", true)
      .style("width", "100%")
      .style("height", "100%")
      .style("position", "absolute") 

  var segments = d3.selectAll("#editable-street-section .segment:not([type=separator])"),
      features = [],
      width = 0,
      height;

  segments.each(function () { 
                  features.push({
                    name: this.dataset.name,
                    left: this.offsetLeft,
                    width: this.clientWidth,
                    color: this.dataset.color,
                    texture: this.dataset.texture || null,
                    rulerWidth: this.dataset.width
                  })
                });
  
  var streetLines = [];
  
  var svg = container.append("svg")
        .attr("height", "100%") // firefox svg sizing
        .attr("width", "100%");

  features.map(function (e,i,c) { 
    if (e.texture) {
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

  var lanes = svg.selectAll("rect")
    .data(features)
    .enter()
    .append("rect")
    .attr("x", function (d) { return d.left; })
    .attr("y", height)
    .attr("height", 0)
    .style("top", "35%")
    .attr("width", function (d) { return d.width; })
    .attr("fill", function (d) { return d.texture? "url(#"+d.texture+")": d.color; })
 
  lanes.transition()
    .duration(1000).attr("height", height).attr("y", 0)

  var paintedLines = svg.selectAll("line")
    .data(streetLines)
    .enter()
    .append("line")
      .attr("x1", function (d) { return d; })
      .attr("x2", function (d) { return d; })
      .attr("y1", height)
      .attr("y2", height)
      .attr("stroke-dasharray", "5, 5")
      .attr("stroke", "rgba(200,200,0,.5)")

  paintedLines.transition()
    .duration(1000).attr("height", height).attr("y1", 0)
}

var togglePlanView = 1;

d3.select("#planview-toggle")
  .on("click", function () { 
    planview(++togglePlanView % 2);
    d3.select(this).text(function () {
      return ["Edit", "Plan view"][(togglePlanView % 2)] 
    })
  })
