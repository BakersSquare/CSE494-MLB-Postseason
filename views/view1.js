import { TEAM_COLORS } from "../constants.js";

// There are 30 teams in Major League Baseball (MLB). These 30 teams are split into two leagues: the American League (AL) and the National League (NL), each containing three divisions: East, Central and West.
document.addEventListener("DOMContentLoaded", function () {
  const data = [
    { TeamCode: "ATL", League: "N", Division: "E", W: "104" },
    { TeamCode: "PHI", League: "N", Division: "E", W: "90" },
    { TeamCode: "MIA", League: "N", Division: "E", W: "84" },
    { TeamCode: "NYM", League: "N", Division: "E", W: "75" },
    { TeamCode: "WSH", League: "N", Division: "E", W: "71" },
    { TeamCode: "MIL", League: "N", Division: "C", W: "92" },
    { TeamCode: "CHC", League: "N", Division: "C", W: "83" },
    { TeamCode: "CIN", League: "N", Division: "C", W: "82" },
    { TeamCode: "PIT", League: "N", Division: "C", W: "76" },
    { TeamCode: "STL", League: "N", Division: "C", W: "71" },
    { TeamCode: "LAD", League: "N", Division: "W", W: "100" },
    { TeamCode: "ARI", League: "N", Division: "W", W: "84" },
    { TeamCode: "SD", League: "N", Division: "W", W: "82" },
    { TeamCode: "SF", League: "N", Division: "W", W: "79" },
    { TeamCode: "COL", League: "N", Division: "W", W: "59" },
    { TeamCode: "BAL", League: "A", Division: "E", W: "101" },
    { TeamCode: "TB", League: "A", Division: "E", W: "99" },
    { TeamCode: "TOR", League: "A", Division: "E", W: "89" },
    { TeamCode: "NYY", League: "A", Division: "E", W: "82" },
    { TeamCode: "BOS", League: "A", Division: "E", W: "78" },
    { TeamCode: "MIN", League: "A", Division: "C", W: "87" },
    { TeamCode: "DET", League: "A", Division: "C", W: "78" },
    { TeamCode: "CLE", League: "A", Division: "C", W: "76" },
    { TeamCode: "CHW", League: "A", Division: "C", W: "61" },
    { TeamCode: "KC", League: "A", Division: "C", W: "56" },
    { TeamCode: "HOU", League: "A", Division: "W", W: "90" },
    { TeamCode: "TEX", League: "A", Division: "W", W: "90" },
    { TeamCode: "SEA", League: "A", Division: "W", W: "88" },
    { TeamCode: "LAA", League: "A", Division: "W", W: "73" },
    { TeamCode: "OAK", League: "A", Division: "W", W: "50" },
  ];
  
const margin = { top: 30, right: 30, bottom: 30, left: 40 };
const width = 1000 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#view11")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const divisionWins = d3.rollup(
      data,
      v => d3.sum(v, d => +d.W),
      d => d.Division,
      d => d.TeamCode
    );
  
  const divisions = Array.from(divisionWins.keys());
  const teams = Array.from(divisionWins.values()).flatMap(d => Array.from(d.keys()));
  const wins = Array.from(divisionWins.values()).flatMap(d => Array.from(d.values()));
  

const x = d3.scaleBand()
    .domain(teams)
    .range([margin.left, width - margin.right])
    .padding(0.6);

const y = d3.scaleLinear()
    .domain([0, d3.max(wins)])
    .nice()
    .range([height - margin.bottom, margin.top]);

svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.TeamCode))
    .attr("width", x.bandwidth())
    .attr("y", d => y(+d.W))
    .attr("height", d => y(0) - y(+d.W))
    .attr("fill", d => `${TEAM_COLORS[d.TeamCode]}0`)

svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Season Results");

svg.append('text')
    .attr('x',width/2)
    .attr('y',height + 10)
    .text('Teams');

svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0)
    .attr('x', -height / 2)
    .style('text-anchor', 'middle')
    .text('Wins');
});

export default {};