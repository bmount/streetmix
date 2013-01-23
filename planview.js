
function planview () {
  var segments = d3.selectAll("#editable-street-section .segment:not([type=separator])")

  var features = [],
      height = 500;

  segments.each(function (t) { dbg=this; features.push({
                      name: this.innerText,
                      left: this.offsetLeft,
                      width: this.clientWidth
                  })
                })

  var cont = d3.select("body").append("div").attr("id", "planview");

  

  var svg = cont.append("svg");

  function r8 () {
    return Math.floor(Math.random()*255.99).toString() +',';
  }

  d3.selectAll("section").remove()

  svg.selectAll("rect")
    .data(features)
    .enter()
    .append("rect")
    .attr("x", function (d) { return d.left; })
    .attr("y", 0)
    .attr("height", height)
    .attr("width", function (d) { return d.width; })
    .attr("fill", function (d) { return 'rgba(' + r8() + r8() + r8() + '.6)'; })
}

d3.select("#planview-render").on("click", planview)
