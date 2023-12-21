// Alexander Burton, Sourish Murthy, John Baker, Yonatan Rosenbloom
// CSE 478: Data Visualization - Team Project
// View 2 - Pie Chart

import { TEAM_COLORS } from "../constants.js";

// Major League Baseball (MLB) is the highest level of professional baseball
// in North America (29 teams in the US, 1 in Canada).
// There are two leagues within Major League Baseball, the American League (AL) and the National League.
// Each league has 15 teams, broken in to 3 divisions of 5 teams (West, Central, and East).

// View 2 is a Pie Chart consisting of the teams with the 12 best records during the 2023 MLB season.
// However, there are 13 teams included in this pie chart, as there was a tie for 12th place
// between the Arizona Diamondbacks and the Miami Marlins.

document.addEventListener("DOMContentLoaded", function () {
  // Set up dimensions and margins
  const width = 800;
  const height = 600;
  const radius = Math.min(width, height) / 2 - 10;
  
  // Create the SVG container
  const svg = d3.select("#view2")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${radius + 20},${height / 2})`);

  // Define the pie data
  const pieData = [6/13, 6/13, 1/13]; // Proportions for your pie segments

  // Define the pie layout
  const pie = d3.pie();

  // Define the arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // Define the color scale
  const colorScale = d3.scaleOrdinal(["blue", "red", "red"]); // Adjusted colors for distinction
  const legendLabels = ['National League', 'American League']; // Added Seattle Mariners

  // Append the tooltip div to the body
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Draw pie slices with tooltips
  const paths = svg.selectAll("path")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d, i) => colorScale(legendLabels[i]))
    .attr("stroke", (d, i) => i === 2 ? "black" : "white") // Highlight the Mariners' segment
    .style("stroke-width", (d, i) => i === 2 ? "2px" : "0px") // Thicker stroke for the Mariners' segment
    .on('mouseover', function(event, d) {
      tooltip.html(tooltipText(d.index))
        .style('opacity', 1)
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
    });

  // Function to determine text for tooltips
  function tooltipText(index) {
    const tooltips = [
      "ATL, LAD, MIL, PHI, MIA, ARI", // National League
      "BAL, HOU, MIN, TB, TEX, TOR", // American League
      "Despite having 88 wins in the regular season,\nand ranking 10th in MLB in wins,\nthe Mariners were 4th in the American League Wild Card Standings,\nresulting in the Mariners missing the playoffs" // Seattle Mariners
    ];
    return tooltips[index];
  }

  // Add a title to the chart
  svg.append("text")
    .attr("x", 0)
    .attr("y", -height / 2 + 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Top 12 Regular Season Teams by Wins");

  // Add the legend to the chart
  const legend = svg.selectAll(".legend")
    .data(legendLabels)
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${radius + 30},${-radius + 100 + i * 20})`);

  legend.append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => colorScale(d));

  legend.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text(d => d);
});


export default {};