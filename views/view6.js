// Import the necessary D3 modules
import * as d3 from 'https://cdn.skypack.dev/d3@7';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'https://cdn.skypack.dev/d3-sankey';

// Set the dimensions and margins of the diagram
const margin = { top: 10, right: 10, bottom: 10, left: 10 },
      width = 1200 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3.select("#view6")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Set up the Sankey generator with increased node padding
const sankey = d3Sankey()
  .nodeWidth(15)
  .nodePadding(100) // Increased padding for more space between nodes
  .extent([[1, 1], [width - 1, height - 5]]);

// Define the data structure for the Sankey diagram
const data = {
  nodes: [
    { name: "Regular Season" }, // Source 0
    { name: "Playoffs" }, // Source 1
    { name: "Wild Card" }, // Source 2
    // Split Divisional Series into two nodes to differentiate bypassing teams
    { name: "Divisional Series (via Bye)" }, // Source 3
    { name: "Divisional Series (via Wild Card)" }, // Source 4
    { name: "League Championship Series" }, // Source 5
    { name: "World Series" }, // Source 6
    { name: "CHAMPION" }, // Source 7
    { name: "ELIMINATED" } // Source 8
  ],
  links: [
    { source: 0, target: 1, value: 12 }, // Regular Season to Playoffs
    { source: 1, target: 2, value: 8 }, // Playoffs to Wild Card
    { source: 1, target: 3, value: 4 }, // Playoffs directly to Divisional Series (bypassing Wild Card)
    { source: 2, target: 4, value: 4 }, // Wild Card to Divisional Series
    
    // Combine Divisional Series nodes to League Championship Series
    { source: 4, target: 5, value: 4 }, // Divisional Series (via Wild Card) to LCS
    { source: 5, target: 6, value: 2 }, // LCS to World Series
    { source: 6, target: 7, value: 1 }, // World Series to CHAMPION
    // ELIMINATED links
    { source: 0, target: 8, value: 18 }, // Regular Season to ELIMINATED
    { source: 2, target: 8, value: 4 }, // Wild Card to ELIMINATED
    { source: 3, target: 8, value: 4 }, // Divisional Series (via Bye) to ELIMINATED
    //{ source: 4, target: 8, value: 0 }, // Divisional Series (via Wild Card) to ELIMINATED    
    { source: 5, target: 8, value: 2 }, // LCS to ELIMINATED
    { source: 6, target: 8, value: 1 }  // World Series to ELIMINATED
  ]
};


// Assign colors to rounds and 'ELIMINATED' as grey
const nodeColors = {
  "Regular Season": "#1f77b4",
  "Playoffs": "#ff7f0e",
  "Wild Card": "#2ca02c",
  "Divisional Series (via Bye)": "#d62728",
  "Divisional Series (via Wild Card)": "#d62728",
  "League Championship Series": "#9467bd",
  "World Series": "#8c564b",
  "CHAMPION": "#e377c2",
  "ELIMINATED": "#7f7f7f"  // Grey color for ELIMINATED
};

data.nodes.forEach(node => {
  node.color = nodeColors[node.name];
});

data.links.forEach(link => {
  const sourceNode = data.nodes[link.source];
  const targetNode = data.nodes[link.target];

  if (targetNode.name === "ELIMINATED") {
    link.color = nodeColors["ELIMINATED"]; // Set color to gray for ELIMINATED
  } else {
    link.color = sourceNode.color; // Set color to the source node's color
  }
});

// Compute the Sankey diagram
sankey(data);

// Manually adjust the nodes to ensure they don't overlap by setting their y0 and y1
data.nodes.forEach(node => {
  if (node.name === "League Championship Series") {
    // Push down slightly
    node.y0 += 20;
    node.y1 += 20;
  }
});

// Recalculate the layout to apply the manual adjustments
sankey.update(data);

// Add links
const link = svg.append("g")
  .selectAll("path")
  .data(data.links)
  .enter()
  .append("path")
  .attr("class", "link")
  .attr("d", sankeyLinkHorizontal())
  .style("fill", "none")
  .style("stroke-opacity", 0.5)
  .style("stroke-width", d => Math.max(1, d.width))
  .style("stroke", d => d.color);

// Add node groups
const node = svg.append("g")
  .selectAll("g")
  .data(data.nodes)
  .enter()
  .append("g");


// Append the tooltip div to the body
const tooltip = d3.select('body').append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

// Add rectangles for the nodes
node.append("rect")
  .attr("x", d => d.x0)
  .attr("y", d => d.y0)
  .attr("height", d => d.y1 - d.y0)
  .attr("width", sankey.nodeWidth())
  .style("fill", d => d.color)
  .style("stroke", d => d3.rgb(d.color).darker(2))
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
        "NL East: ATL, PHI, MIA, NYM, WSH\nNL Central: MIL, STL, PIT, CIN, CHC\nNL West: LAD, ARI, SD, SF, COL\nAL East: BAL, TB, TOR, NYY, BOS\nAL Central: MIN, CLE, CHW, DET, KC\nAL West: HOU, TEX, SEA, LAA, OAK", 
        "NL: ATL, LAD, MIL, PHI, MIA, ARI\nAL: BAL, HOU, MIN, TB, TEX, TOR", 
        "NL WC: MIL, PHI, MIA, ARI\n AL WC: MIN, TB, TEX, TOR",
        "NL DS (via Bye): ATL & LAD\nAL DS (via Bye): BAL & HOU",
        "NL DS (via WC): PHI & ARI\nAL DS (via WC): MIN & TEX",
        "NL CS: PHI & ARI\nAL CS: HOU & TEX",
        "WS: TEX & ARI",
        "Champ: TEX",
        "Regular Season: NYM, WSH, STL, PIT, CIN, CHC, SD, SF, COL, NYY, BOS, MIN, CLE, CHW, DET, KC, SEA, LAA, OAK\nWild Card: TOR, TB, MIA, MIL\nDivisional Series: ATL, LAD, BAL, MIN\nLeague Championship Series: PHI & HOU\nWorld Series: ARI"
      ];
      return tooltips[index];
    }



// Add titles for the nodes
node.append("text")
  .attr("x", d => d.x0 - 6)
  .attr("y", d => (d.y1 + d.y0) / 2)
  .attr("dy", "0.35em")
  .attr("text-anchor", "end")
  .text(d => d.name)
  .filter(d => d.x0 < width / 2)
  .attr("x", d => d.x1 + 6)
  .attr("text-anchor", "start");

// Add drag functionality to nodes
// node.call(d3.drag()
//   .subject(d => d)
//   .on("start", function() { this.parentNode.appendChild(this); })
//   .on("drag", dragmove));

// // Function to handle drag events
// function dragmove(event, d) {
//   const rectY = event.y - (d.y1 - d.y0) / 2;
//   d.y0 = rectY;
//   d.y1 = rectY + (d.y1 - d.y0);
//   d3.select(this).attr("transform", `translate(0,${rectY})`);
//   sankey.update(data);
//   svg.selectAll("path").data(data.links).attr("d", sankeyLinkHorizontal());
// }

// Ensure the colors are set for nodes based on some logic or preset values
data.nodes.forEach(function(d, i) {
  d.color = nodeColors[d.name] || "#7f7f7f"; // Apply the color based on node name
});

// Add the nodes and links to the Sankey diagram
sankey(data);
