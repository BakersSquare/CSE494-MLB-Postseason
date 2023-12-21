import { TEAM_COLORS } from "../constants.js";

/*
Tm,
R/G,
G,
R,
H,
RA/G,
ERA, 
Rank,
Team Code,
Roster,
26-Man Payroll,
Injured Reserve,
Retained,
Buried,
Suspended,
2023 Total Payroll
*/

/*
Teamcodes from playoffs
ARI
ATL
BAL
HOU
LAD
MIA
MIL
MIN
PHI
TB
TEX
TOR
*/

const VIEW_3 = {}
const total_data = await getData();
console.log("Data: ", total_data);



function getColumnn(columnName) {
    let newData = [];
    // Iterate through each row and extract the desired column
    for (let i = 0; i < total_data.length; i++) {
        newData.push(total_data[i][columnName]);
    }
    return newData;
}

// Function to check for overlaps
function checkForOverlaps(circle, existingCircles) {
    let overlaps = false;

    existingCircles.each(function () {
        const thisCircle = d3.select(this);
        const dx = parseFloat(thisCircle.attr("cx")) - parseFloat(circle.attr("cx"));
        const dy = parseFloat(thisCircle.attr("cy")) - parseFloat(circle.attr("cy"));
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Adjust this threshold based on your requirements
        if (distance < parseFloat(thisCircle.attr("r")) + parseFloat(circle.attr("r")) + 2) {
            overlaps = true;
        }
    });

    return overlaps;
}

//make sure the circles stay within bounds
function adjustCirclePosition(cx, cy, radius) {
    // Ensure the circle stays within the bounds of the axes
    const newCx = Math.max(radius, Math.min(innerWidth - radius, cx));
    const newCy = Math.max(radius + margin.top, Math.min(innerHeight + margin.top - radius, cy));

    return { newCx, newCy };
}


const svg = d3.select('#view3');
const width = +svg.style('width').replace('px','');
const height = +svg.style('height').replace('px','');
const margin = { top:40, bottom: 90, right: 20, left: 80 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

//get Runs Scored data
const runsScored = getColumnn('r');
//xScale: Runs Scored
const xScale = d3.scaleLinear()
    .domain([d3.min(runsScored), d3.max(runsScored)])
    .range([0, innerWidth]);

//get ERA data
const era = getColumnn('era');
//invert era
const invert_era = [];
for(let i = 0; i < era.length; i++) {
    invert_era.push(1 / era[i]);
}
//yScale: Inverse ERA
const yScale = d3.scaleLinear()
    .domain([d3.min(invert_era), d3.max(invert_era)])
    .range([innerHeight, 0 ]);

//get Total Payroll data
const totalPayroll = getColumnn('totalPayroll');
//sizeScale: Total Payroll
let size = d3.scaleSqrt().domain([d3.min(totalPayroll), d3.max(totalPayroll)]).range([10, 35]);

//remove old svg
svg.select('g').remove();

const g = svg.append('g');
// .attr('transform', 'translate('+margin.left+', '+margin.top+')');

//Axis creation
const yAxis = d3.axisLeft(yScale);
            g.append('g').call(yAxis).attr('transform', 'translate(80,54)')
const xAxis = d3.axisBottom(xScale);
            g.append('g').call(xAxis)
                                .attr('transform',`translate(80,${height - 75})`)
            g.append('text')
                .attr('x',width/2)
                .attr('y',height - 40)
                .text('Runs Scored');
            g.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 40)  // Adjusted position
                .attr('x', -height / 2)
                .style('text-anchor', 'middle')
                .text('Inverse ERA');
            g.append('text')
                .attr('x',innerWidth/2)
                .attr('y', 20)
                .text('Payroll Effectiveness by Team');

const playoffTeams = ['ARI', 'ATL', 'BAL', 'HOU', 'LAD', 'MIA', 'MIL', 'MIN', 'PHI', 'TB', 'TEX', 'TOR'];

//create the circles
total_data.forEach((element, index) => {
    const radius = Math.abs(size(element['totalPayroll']));
    const cx = xScale(element['r']) + margin.right;
    const cy = yScale(invert_era[index]) + margin.top;

    // Adjust circle position to stay within bounds
    const { newCx, newCy } = adjustCirclePosition(cx, cy, radius);

    const isInPlayoffs = playoffTeams.includes(element['teamCode']);

    const circle = svg.append("circle")
        .attr("class", "circ")
        .attr("stroke", "black")
        .attr("r", radius)
        .attr("cx", newCx + 80)
        .attr("cy", newCy)
        .attr("id", element['teamCode'])
        .style("fill", TEAM_COLORS[element['teamCode']]);
        // .style("fill", isInPlayoffs ? TEAM_COLORS[element['teamCode']] : '#808080');

    // Check for overlaps
    const overlaps = checkForOverlaps(circle, svg.selectAll('.circ'));

    // Adjust opacity based on overlaps
    circle.style("opacity", overlaps ? 0.5 : 1);
});

d3.select(window).on("scroll.scroller", changeColor());



function changeColor() {
    const circle = svg.selectAll('circle');
    circle
        .transition()
        .duration(1000)
        .style('fill', function(d) {
            if(!playoffTeams.includes(d['teamCode'])) { //if team is not in the playoffs
                const scrollPosition = window.scrollY;

                // Define a color scale based on the scroll position
                const colorScale = d3.scaleLinear()
                    .domain([0, innerHeight])
                    .range([TEAM_COLORS[d['teamCode']], "#808080"]);


                // Update the element's color based on the scroll position
                d3.select(this).style('fill', colorScale(scrollPosition));
            }
        });
}  

// function to get the data from payroll-effectiveness.csv
async function getData() {
    return fetch('/data/view3/payroll-effectiveness.csv')
        .then(response => response.text())
        .then(csvData => {
            const noHeader = csvData.split('\n').slice(1); // Skip the header row
            const data = noHeader.slice(2, 32); //get the rows of actual data
            const parsedData = data.map((str) => {
                const [
                  team,
                  rg,
                  g,
                  r,
                  h,
                  rag,
                  era,
                  rank,
                  teamCode,
                  roster,
                  manPayroll,
                  injuredReserve,
                  retained,
                  buried,
                  suspended,
                  totalPayroll,
                ] = str.split(',');

                return {
                    team,
                    rg: parseFloat(rg),
                    g: parseInt(g),
                    r: parseInt(r),
                    h: parseInt(h),
                    rag: parseFloat(rag),
                    era: parseFloat(era),
                    rank: parseInt(rank),
                    teamCode,
                    roster: parseInt(roster),
                    manPayroll: parseInt(manPayroll),
                    injuredReserve: parseInt(injuredReserve),
                    retained: parseInt(retained),
                    buried: parseInt(buried),
                    suspended: parseInt(suspended),
                    totalPayroll: parseFloat(totalPayroll),
                };
            });
            return parsedData;
        });   
}

window.view_3 = VIEW_3

