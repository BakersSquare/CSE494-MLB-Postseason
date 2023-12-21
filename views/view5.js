import { TEAM_COLORS } from "../constants.js";


let GLOBAL_DATA = []
document.addEventListener('DOMContentLoaded', function () {
  // Drawing the original chart once the csv is loaded
    d3.csv('data/view5/post_season_ops.csv').then(async data => {
      data = data.filter(row => isHitter(row))
      GLOBAL_DATA = data

      const teamRuns = await d3.csv('data/view5/post_season_runs_wide.csv')

      const svg = d3.select('#view5');
      const width = +svg.style('width').replace('px','');
      const height = +svg.style('height').replace('px','');
      const margin = { top:40, bottom: 30, right: 30, left: 30 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;


      // We want the dimensions to be the different tiers of the playoffs.
      // WildCard -> Divison Series -> Division Champs -> World Series
      // (a|n)lwc -> (a|n)lds -> (a|n)lcs -> wc

      const dimensions = ["Regular Season", "Wild Card", 'Division Series', 'Division Championship', 'World Series']

      // For each dimension, Build the functions linear that map the value to the vertical point.
      const heightFunctions = {}
      for (const dataSet of dimensions) {
        const columnValue = getColumnValue(dataSet)
        heightFunctions[dataSet] = d3.scaleLinear()
          .domain( d3.extent(data, function(d) { return +d[columnValue]; }) )
          .range([innerHeight + margin.top, margin.bottom])
      }

      // Build the X scale -> it find the best position for each Y axis
      const x = d3.scalePoint()
        .range([margin.left, innerWidth])
        .padding(1)
        .domain(dimensions.map(bar => getColumnValue(bar)));

      // The path function take a row of the csv as input, and return all the points for that row x and y coordinates of the line to draw for this raw. We only want a path if the 
      function getLineCoords(d) {
        const lineCoords = []
        let skippedWildCard = true      // More teams skipped the wildCard fs
        for( let i = 0; i < dimensions.length; i++) {
          if(i == 0){
                // Here we're getting the OPS for the regular season
              lineCoords.push([x('RegOPS'), heightFunctions["Regular Season"](d['RegOPS'])])
          }
          if(i == 1){
              // Here we're checking the OPS for the wild card, which teams likely skipped
              if(Number(d['wcOPS'])){
                lineCoords.push([x('wcOPS'), heightFunctions["Wild Card"](d['wcOPS'])])
                skippedWildCard = false;
              } else{
                lineCoords.push([x('RegOPS'), heightFunctions["Regular Season"](0)])
                lineCoords.push([x('wcOPS'), heightFunctions["Wild Card"](0)])
                lineCoords.push([x('wcOPS'), heightFunctions["Wild Card"](d['RegOPS'])])

              }
          }
          if(i == 2){
              // Here we're checking the OPS for division series. Anyone who has a 0 here either played, or is now out.
              if(Number(d['dsOPS'])){
                lineCoords.push([x('dsOPS'), heightFunctions["Division Series"](d['dsOPS'])])
              } else {
                lineCoords.push(lineCoords[i - 1])
              }
          }
          if(i == 3) {
              // Here we're checking the OPS for division Champs. Anyone who has a 0 here either played, or is now out.
              if(Number(d['dcOPS'])){
                lineCoords.push([x('dcOPS'), heightFunctions["Division Championship"](d['dcOPS'])])
              } else {
                lineCoords.push(lineCoords[i - 1])
              }
          }
          if(i == 4) {
              // Here we're checking the OPS for division Champs. Anyone who has a 0 here either played, or is now out.
              if(Number(d['wsOPS'])){
                lineCoords.push([x('wsOPS'), heightFunctions["World Series"](d['wsOPS'])])
              } else {
                lineCoords.push(lineCoords[i - 1])
              }
          }
        }
        return d3.line()(lineCoords)
      }

      // Determine the series that need to be stacked.
      const subGroups = teamRuns.columns.slice(1)
      const groups = d3.map(teamRuns, d => d['Series'])//.keys()?

      // Add Y axis
      const barY = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight + margin.top, margin.bottom]);

    teamRuns.forEach( d => {
      // Compute the total
      let tot = 0
      for (let i in subGroups){ name=subGroups[i] ; tot += +d[name] }
      // Now normalize
      for (let i in subGroups){ name=subGroups[i] ; d[name] = d[name] / tot * 100}
    }
    )
  
    //stack the data? --> stack per subgroup
    const stackedData = d3.stack()
      .keys(subGroups)
      (teamRuns)
      
          // Show the bars
        svg.append("g")
        .selectAll("g")
        // Enter in the stack data = loop key per key = group per group
        .data(stackedData)
        .join("g")
          .attr("fill", d => {return TEAM_COLORS[d.key]})
          // Replace the 0 with the translation recieved from the x(getColumnValue(D)) function by passing in the series.
          .selectAll("rect")
          // enter a second time = loop subgroup per subgroup to add all rectangles
          .data(d => {return d})
          .join("rect")
          .attr("x", d => {return x(getColumnValue(d.data['Series']))-(x.step()/10)})
          .attr("y", d => barY(d[1]))
          .attr("height", d => barY(d[0]) - barY(d[1]))
          .attr("transform", function(d) {return "translate(" + 0 + "," + margin.top/2 +  ")"; })
            .attr("width",x.step()/10)
            .style("opacity", 0.3)
      
            

      // Prepare the scales for positional and color encodings.
      // Draw the lines
      svg
        .selectAll("myPath")
        .data(data)
        .enter().append("path")
        .attr("d",  getLineCoords)
        .attr("transform", function(d) { return "translate(" + 0 + "," + margin.top/2 +  ")"; })
        .attr("id",  d => d['Name'])
        .style("fill", "none")
        .style("stroke", d => TEAM_COLORS[d['Team Code']])
        .style("opacity", 0.5)
        

      // Draw the axis:
      svg.selectAll("myAxis")
        // For each dimension of the dataset I add a 'g' element:
        .data(dimensions).enter()
        .append("g")
        // I translate this element to its right position on the x axis
        .attr("transform", function(d) { return "translate(" + x(getColumnValue(d)) + "," + margin.top/2 +  ")"; })
        // And I build the axis with the call function
        .each(function(d) { d3.select(this).call(d3.axisLeft().scale(heightFunctions[d])); })
        // Add axis title
        .append("text")
          .style("text-anchor", "middle")
          .attr("y", -9)
          .text(function(d) { return d; })
          .style("fill", "black")
    });
})

function getColumnValue(string) {
  switch(string){
    case "rs": case "Regular Season": return "RegOPS"
    case "wc": case "Wild Card": return "wcOPS"
    case "ds": case 'Division Series': return "dsOPS"
    case "cs": case 'Division Championship': return "dcOPS"
    case "ws": case 'World Series': return "wsOPS"
    default:
      return "NOT_FOUND"
  }
}

function isHitter(row) {
  return Number(row['AB.1']) > 0
}