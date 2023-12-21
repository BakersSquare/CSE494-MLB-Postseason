import { TEAM_COLORS, TEAM_NAME_MAP } from "./constants.js";
import * as d3 from 'https://cdn.skypack.dev/d3@7';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'https://cdn.skypack.dev/d3-sankey';

// using d3 for convenience, and storing a selected elements
const container = d3.select('#scroll');
const graphic = container.select('.scroll__graphic');
const chart = graphic.select('.chart');
const text = container.select('.scroll__text');
const step = text.selectAll('.step');

const menuItems = d3.selectAll(".dropdown-item")
for (const node of menuItems){
  const temp = d3.select(node)
  temp
  .on('click', (event) => {
    const teamCode = TEAM_NAME_MAP.get(event.target.outerText)
    d3.select(".active-team").text(event.target.outerText ?? "None")

    updateSelectedTeam(teamCode)
  })
}

let prevProg3 = 0
let prevProg4 = 0

let WEIGHT_VALS = false
let TOGGLE_SCALE = false
let SELECTED_TEAM = ""
let VIEW_3_DATA = []
let VIEW_4_DATA = []
let VIEW_5_DATA = []
let STATE = 0;

// initialize the scrollama
const scroller = scrollama();

// resize function to set dimensions on load and on page resize
function handleResize() {
	// 1. update height of step elements for breathing room between steps
	const stepHeight = Math.floor(window.innerHeight * 0.75);
	step.style('height', stepHeight + 'px');

	// 2. update height of graphic element
	const bodyWidth = d3.select('body').node().offsetWidth;

	graphic
		.style('height', window.innerHeight + 'px');

	// 3. update width of chart by subtracting from text width
	const chartMargin = 32;
	const textWidth = text.node().offsetWidth;
	const chartWidth = graphic.node().offsetWidth - textWidth - chartMargin;
	// make the height 1/2 of viewport
	const chartHeight = Math.floor(window.innerHeight / 2);

	chart
		.style('width', chartWidth + 'px')
		.style('height', chartHeight + 'px');

	// 4. tell scrollama to update new element dimensions
	scroller.resize();
}

function handleStepProgress(response) {
  const {element, index, progress, direction} = response
  // Toggle the weights if you're 3/4 way
  if(index === 3 && ((prevProg3 < 0.66 && progress > 0.66) || (prevProg3 > 0.66 && progress < 0.66))) {
    toggleScale()
    prevProg3 = progress
  }
  if(index === 4 && ((prevProg4 < 0.66 && progress > 0.66) || (prevProg4 > 0.66 && progress < 0.66))) {
    toggleWeights()
    prevProg4 = progress
  }

}

// scrollama event handlers
function handleStepEnter(response) {
  const {element, direction, index} = response
	// fade in current step. Formally - it applies the is-active classname to all
  // .step elements (as step is the selectAll method) with the given event's index
	step.classed('is-active', function (d, i) {
		return i === response.index;
	})

  renderSvgFromStep(index)

  // chart.attr('class', 'is-fixed')

	// update graphic based on step here
	const stepData = step.attr('data-step')
  
  // Yup I'm seeing now, so the step events are driven by the text scrolling. Each
  // Event is emitted when the step crosses the threshold at the bottom of the text
}

function handleStepExit(response) {
  const {element, direction, index} = response

	// un-sticky the graphic, and pin to top/bottom of container
	graphic.classed('is-fixed', false);
	graphic.classed('is-bottom', response.direction === 'down');
}

// kick-off code to run once on load -> This is pretty self explanatory.
// Essentially, it sets hooks to what we've defined in the functions above.
function init() {
	// 1. call a resize on load to update width/height/position of elements
	handleResize();

	// 2. setup the scrollama instance
	// 3. bind scrollama event handlers (this can be chained like below)
	scroller
		.setup({
			container: '#scroll', // our outermost scrollytelling element
			graphic: '.scroll__graphic', // the graphic
			text: '.scroll__text', // the step container
			step: '.scroll__text .step', // the step elements
			offset: 0.66, // set the trigger to be 1/2 way down screen
			debug: false, // display the trigger offset for testing,
      progress: true // allows us to capture the progress event
		})
		.onStepEnter(handleStepEnter)
    .onStepProgress(handleStepProgress)
		.onStepExit(handleStepExit);


	// setup resize event
	window.addEventListener('resize', handleResize);
}

function renderSvgFromStep(index){
  // Set the state immediately so we can redraw if the selected team changes.
  const DIR = STATE - index > 0 ? "UP" : (STATE - index == 0 ? "" : "DOWN")
  STATE = index;
  d3.select("#view1").selectAll("*").remove ();
  d3.selectAll(".tooltip").remove()

  const svg = d3.select('#view1');
  const width = + d3.select('#chart').style('width').replace('px','');
  const height = + d3.select('#chart').style('height').replace('px','');
  const margin = { top:90, bottom: 90, right: 80, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  
  if (index == 1 || index == 0){
    drawView1();
  }
  if (index == 2){
    drawView2();
  }
  if (index == 3){
    if(DIR == "DOWN"){
      prevProg3 = 0
      TOGGLE_SCALE = false
    } else if (DIR == "UP"){
      TOGGLE_SCALE = true;
      prevProg3 = 1
    }
    drawView3();
  }
  if (index == 4){
    if(DIR == "DOWN"){
      prevProg4 = 0
      WEIGHT_VALS = false
    } else if (DIR == "UP"){
      prevProg4 = 1
      WEIGHT_VALS = true;
    }
    drawView4();
  }
  if (index == 5){
    drawView5();
  }
  if (index == 6){
    drawView6();
  }


  // FUNCTION DEFS
  async function drawView1(){
    const data = [
        { TeamCode: "ATL", League: "N", Division: "NLE", W: "104" },
        { TeamCode: "PHI", League: "N", Division: "NLE", W: "90" },
        { TeamCode: "MIA", League: "N", Division: "NLE", W: "84" },
        { TeamCode: "NYM", League: "N", Division: "NLE", W: "75" },
        { TeamCode: "WSH", League: "N", Division: "NLE", W: "71" },
        { TeamCode: "MIL", League: "N", Division: "NLC", W: "92" },
        { TeamCode: "CHC", League: "N", Division: "NLC", W: "83" },
        { TeamCode: "CIN", League: "N", Division: "NLC", W: "82" },
        { TeamCode: "PIT", League: "N", Division: "NLC", W: "76" },
        { TeamCode: "STL", League: "N", Division: "NLC", W: "71" },
        { TeamCode: "LAD", League: "N", Division: "NLW", W: "100" },
        { TeamCode: "ARI", League: "N", Division: "NLW", W: "84" },
        { TeamCode: "SD", League: "N", Division: "NLW", W: "82" },
        { TeamCode: "SF", League: "N", Division: "NLW", W: "79" },
        { TeamCode: "COL", League: "N", Division: "NLW", W: "59" },
        { TeamCode: "BAL", League: "A", Division: "ALE", W: "101" },
        { TeamCode: "TB", League: "A", Division: "ALE", W: "99" },
        { TeamCode: "TOR", League: "A", Division: "ALE", W: "89" },
        { TeamCode: "NYY", League: "A", Division: "ALE", W: "82" },
        { TeamCode: "BOS", League: "A", Division: "ALE", W: "78" },
        { TeamCode: "MIN", League: "A", Division: "ALC", W: "87" },
        { TeamCode: "DET", League: "A", Division: "ALC", W: "78" },
        { TeamCode: "CLE", League: "A", Division: "ALC", W: "76" },
        { TeamCode: "CHW", League: "A", Division: "ALC", W: "61" },
        { TeamCode: "KC", League: "A", Division: "ALC", W: "56" },
        { TeamCode: "HOU", League: "A", Division: "ALW", W: "90" },
        { TeamCode: "TEX", League: "A", Division: "ALW", W: "90" },
        { TeamCode: "SEA", League: "A", Division: "ALW", W: "88" },
        { TeamCode: "LAA", League: "A", Division: "ALW", W: "73" },
        { TeamCode: "OAK", League: "A", Division: "ALW", W: "50" },
      ];

      let groups = [
        { 
        name: 'NLE', 
        values: [104, 90, 84, 75, 71], 
        color: ['#ce1141', '#e81828', '#00a3e0', '#ff5910', '#aa1e22'], 
        team: ["Atlanta Braves", "Philadelphia Phillies", "Miami Marlins", "New York Mets", "Washington Nationals"],
        teamCode: ["ATL", "PHI", "MIA", "NYM", "WSH"]
      },
        { 
          name: 'NLC', 
        values: [92, 83, 82, 76, 71], 
        color: ['#0a2351', '#0e3386', '#c62127', '#fdb724', '#b72126'], 
        team: ["Milwaukee Brewers", "Chicago Cubs", "Cincinnati Reds", "Pittsburgh Pirates", "St. Louis Cardinals"],
        teamCode: ["MIL", "CHC", "CIN", "PIT", "STL"]
      },
        {
           name: 'NLW', 
           values: [100, 84, 82, 79, 59],
            color: ['#005a9c', '#a71930', '#473729', '#f4793e', '#c4ced4'], 
            team: ["LA Dodgers", "Arizona Diamondbacks", "San Diego Padres", "San Francisco Giants", "Colorado Rockies"],
            teamCode: ["LAD", "ARI", "SD", "SF", "COL"]
          },
        { 
          name: 'ALE',
           values: [101, 99, 89, 82, 78], 
           color: ['#df4601', '#092c5c', '#134a8e', '#142448', '#c62033'], 
           team: ["Baltimore Orioles", "Tampa Bay Rays", "Toronto Blue Jays", "New York Yankees", "Boston Red Sox"],
           teamCode: ["BAL", "TB", "TOR", "NYY", "BOS"]
          },
        { 
          name: 'ALC', 
          values: [87, 78, 76, 61, 56], 
          color: ['#d31145', '#0c2c56', '#1a2e5a', '#231f20', '#004687'], 
          team: ["Minnesota Twins", "Detroit Tigers", "Cleveland Guardians", "Chicago White Sox", "Kansas City Royals"],
          teamCode: ["MIN", "DET", "CLE", "CHW", "KS"]
        },
        { 
          name: 'ALW', 
          values: [90, 90, 88, 73, 50], 
          color: ['#eb6e1f', '#003278', '#005c5c', '#cd1141', '#003831'], 
          team: ["Houston Astros", "Texas Rangers", "Seattle Mariners", "LA Angels", "Oakland Athletics"],
          teamCode: ["HOU", "TEX", "SEA", "LAA", "OAK"]
         },
      ];
        const divisionWins = d3.rollup(
          data,
          v => d3.sum(v, d => +d.W),
          d => d.Division,
          d => d.TeamCode
      );
      
      const divisions = Array.from(divisionWins.keys());
      const teams = Array.from(divisionWins.values()).flatMap(d => Array.from(d.keys()));
      const wins = Array.from(divisionWins.values()).flatMap(d => Array.from(d.values()));
      
    
    // Scales
    const x = d3.scaleBand()
      .domain(divisions)
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(wins)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .style("font-size", "1.25vh")
      .call(d3.axisBottom(x));

      
    svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .style("font-size", "1.25vh")
    .call(d3.axisLeft(y));

    
    // Bars
    svg.append("g")
      .selectAll("g")
      .data(groups)
      .join("g")
      .attr("transform", d => `translate(${x(d.name)},0)`)
      .selectAll("rect")
      .data(d => d.values.map((value, i) => ({ value, color: d.color[i], team: d.team[i], teamCode: d.teamCode[i] })))
      .join("rect")
      .attr("x", (d, i) => x.bandwidth() / 5 * i)
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth() / 5)
      .attr("height", d => y(0) - y(+d.value))
      .attr("fill",  d => `${d.color}`)
      .attr('opacity', d => getOpacity(d.teamCode) ?? 1)
      .style('stroke','black')
      .on('mouseover', function(event, d) {
        tooltip.html(()=> `${d.team}\nWins: ${d.value}`)
          .style('opacity', 1)
          .style('width', "10vw")
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY - 28) + 'px')
          .style('font-size', "18px");
      }).on('mousemove', (d, i ) => {
        tooltip
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });
    
    
    svg.append("text")
        .attr('x',width/2)
        .attr('y',height - 40)
        .attr("text-anchor", "middle")
        .style("font-size", "2vh")
        .text("Division");
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 40)  // Adjusted position
      .attr('x', -height / 2)
      .style("font-size", "2vh")
      .style('text-anchor', 'middle')
      .text('Wins');

    svg.append('text')
      .attr('x',width/2)
      .attr('y', margin.top)
      .style('text-anchor', 'middle')
      .style("font-size", "4vh")
      .text("Team Wins 2023");
  }

  async function drawView2(){
    const data = [
      { Team: "ATL", League: "N", W: "104" },
      { Team: "BAL", League: "A", W: "101" },
      { Team: "LAD", League: "N", W: "100" },
      { Team: "TB", League: "A", W: "99" },
      { Team: "MIL", League: "N", W: "92" },
      { Team: "PHI", League: "N", W: "90" },
      { Team: "HOU", League: "A", W: "90" },
      { Team: "TEX", League: "A", W: "90" },
      { Team: "TOR", League: "A", W: "89" },
      { Team: "SEA", League: "A", W: "88" },
      { Team: "MIN", League: "A", W: "87" },
      { Team: "MIA", League: "N", W: "84" },
      { Team: "ARI", League: "N", W: "84" },
    ];
  

    const winsThreshold = 84;
  
    const filteredData = data.filter((d) => +d.W >= winsThreshold);

    const radius = Math.min(width, height) / 2 - margin.top/2;

    // Use wins as input values for the pie function
    const pieData = [6/13, 6/13, 1/13]; // Fractions of the pie

    const pie = d3.pie().startAngle(0).endAngle((Math.PI * 2));
    const colors = ["blue", "red"];

    const arc = d3.arc().innerRadius(0).outerRadius(radius);
  
    const colorScale = d3.scaleOrdinal(["blue", "red", "red"]); // Adjusted colors for distinction
    const legendLabels = ['National League', 'American League']; // Added Seattle Mariners

  // Draw pie slices with tooltips
  svg.selectAll("path")
    .data(pie(pieData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("transform", `translate(${margin.left + innerWidth/2},${margin.top + innerHeight/2})`)
    .attr("fill", (d, i) => colorScale(legendLabels[i]))
    .style('stroke','black')
    .on('mouseover', function(event, d) {
      tooltip.html(tooltipText(d.index))
        .style('opacity', 1)
        .style('width', "20vw")
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px')
        .style('font-size', "18px");
    }).on('mousemove', (d, i ) => {
      tooltip
      .style('left', (event.pageX) + 'px')
      .style('top', (event.pageY - 28) + 'px')
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
    });
  
    function tooltipText(index) {
      const tooltips = [
        "Atlanta Braves, LA Dodgers, Milwaukee Brewers, Philadelphia Phillies, Miami Marlins, Arizona Diamondbacks", // National League
        "Baltimore Orioles, Houston Astros, Minnesota Twins, Tampa Bay Rays, Texas Rangers, Toronto Blue Jays", // American League
        "Despite having 88 wins in the regular season and ranking 10th in MLB in wins, the Mariners were 4th in the American League Wild Card Standings, resulting in the Mariners missing the playoffs" // Seattle Mariners
      ];
      return tooltips[index];
    }
  
    // Add legend
    const legend = svg
      .selectAll(".legend")
      .data(colors)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${innerWidth /2},${innerHeight  - 150 + i * 25})`);
  
    legend
      .append("rect")
      .attr("x", width / 2 + 30)
      .attr("width", 18)
      .attr("height", 18)
      .style('stroke','black')
      .style("fill", (d) => d);
  
      const legendText = ["National League", "American League"];

    legend
      .append("text")
      .attr("x", width / 2 + 20)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text((d, i) => legendText[i]);
      
  
    svg.append("text")
      .attr("x", width/2)
      .attr("y", "28px")
      .attr("text-anchor", "middle")
      .style("font-size", "4vh")
      .text("Top 13 Regular Season Teams by Wins");
  }

  async function drawView3() {
    const total_data = await getData();
    VIEW_3_DATA = total_data
    //get Runs Scored data
    const runsScored = getColumnnView3('r', VIEW_3_DATA);
    const invert_era = getColumnnView3('era', VIEW_3_DATA).map(item => 1 / item)
    const totalPayroll = getColumnnView3('totalPayroll', VIEW_3_DATA);
    
    //xScale: Runs Scored
    const size = d3.scaleSqrt().domain([d3.min(totalPayroll), d3.max(totalPayroll)]).range([10, 35]);
    const xScale = d3.scaleLinear()
        .domain([TOGGLE_SCALE ? d3.min(runsScored) : 0, d3.max(runsScored)])
        .range([0, innerWidth]);

    //yScale: Inverse ERA - Consider setting min val to just 0 becase that's how scatter plots should be
    const yScale = d3.scaleLinear()
        .domain([TOGGLE_SCALE ? d3.min(invert_era) : 0, d3.max(invert_era)])
        .range([innerHeight, 0 ]);
    //sizeScale: Total Payroll
        
    //remove old svg
    svg.select('g').remove();
    
    const g = svg.append('g');
    // .attr('transform', 'translate('+margin.left+', '+margin.top+')');
    
    //Axis creation
    const yAxis = d3.axisLeft(yScale);
                g.append('g').call(yAxis)
                .attr('transform', `translate(${margin.left},${margin.top})`)
                .attr('id', 'view3-y-axis');

    const xAxis = d3.axisBottom(xScale);
                g.append('g').call(xAxis)
                  .attr('transform',`translate(${margin.left},${innerHeight + margin.top})`)
                  .attr('id', 'view3-x-axis');
                g.append('text')
                  .attr('x',width/2)
                  .attr('y',height-40)
                  .style('text-anchor','middle')
                  .attr('id', 'view3-x-axis-text')
                  .text('Runs Scored');
                g.append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('y', 40)  // Adjusted position
                    .attr('x', -height / 2)
                    .style('text-anchor', 'middle')
                    .attr('id', 'view3-y-axis-text')
                    .text('Inverse ERA');
                g.append('text')
                    .attr('x',innerWidth/2+margin.left)
                    .attr('y', 40)
                    .style("font-size", "4vh")
                    .attr('id', 'view3-title')
                    .text('Payroll Effectiveness by Team')
                    .style('text-anchor', 'middle')
                    
    g.selectAll('circle')
      .data(total_data)
      .enter()
      .append("circle")
      .attr("class", "circ")
      .attr("stroke", "black")
      .attr("r", d => Math.abs(size(d['totalPayroll'])))
      .attr("cx", d => xScale(d['r']))
      .attr("cy", (d, i) => yScale(invert_era[i]))
      .attr("id", d => d['teamCode'])
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('opacity', d => getOpacity(d['teamCode']) ?? 0.7)
      .style("fill", d => TEAM_COLORS[d['teamCode']])        
      .on('mouseover', function(event, d) {
        tooltip.html(() => {return `${d['team']}\n$${d['totalPayroll'].toLocaleString('en-US')}`})
        // tooltip.html(d => `${d['team']}\n$${d['totalPayroll'].toLocaleString('en-US')}`)
          .style('opacity', 1)
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY - 28) + 'px')
          .style('font-size', "20px");
        }).on('mousemove', (d, i ) => {
          tooltip
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY - 28) + 'px')
        })
        .on('mouseout', function() {
          tooltip.style('opacity', 0);
        });

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
  }

  async function drawView4() {
    function getWeightedValue(d, feat) {
      const weight = d['G'] / 162
      return weight * d[feat]
    }
            
      // Drawing the original chart once the csv is loaded
      let data = await d3.csv('./data/view4/playoff_teams.xls.csv')
      VIEW_4_DATA = data

          const chartDim = svg.node().getBoundingClientRect()

          // Defined function that grabs a datapoint's 'Games Played' value, and used it to scale the metric
    
          const title = `Offensive Output of Playoff Teams${WEIGHT_VALS ? " (Weighted)" : "" }`

          const xScale = d3.scaleLinear()
                          .domain([0, d3.max(data, d => WEIGHT_VALS ? getWeightedValue(d, 'OBP') : d['OBP'])]) // data space
                          .range([0, innerWidth]); // pixel space
          const yScale = d3.scaleLinear()
                          .domain([0, d3.max(data, d => WEIGHT_VALS ? getWeightedValue(d,'SLG') : d['SLG'])]) // data space
                          .range([innerHeight, 0 ]); // pixel space
    
          svg.select('g').remove();
    
          const g = svg.append('g').attr('transform', 'translate('+margin.left+', '+margin.top+')');;
                    
          g.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('id', d => d.Name.replaceAll(' ','_'))
            .attr('cx', d => xScale(WEIGHT_VALS ? getWeightedValue(d, 'OBP') : d['OBP']))
            .attr('cy', d => yScale(WEIGHT_VALS ? getWeightedValue(d, 'SLG') : d['SLG']))
            .attr('r',4)
            .style('opacity', d => getOpacity(d['Team Code']) ?? 0.8)
            .style('fill', d => TEAM_COLORS[d['Team Code']])
            .style('stroke','black')
            .on('mouseover', function(event, d) {
              tooltip.html(() => {return `${d.Name} (${d['Team Code']})\nOBP: ${d.OBP}\nSLG: ${d.SLG}\nGames: ${d.G}`})
                .style('opacity', 1)
                .style('left', (event.pageX) + 'px')
                .style('top', (event.pageY - 28) + 'px')
                .style('font-size', "20px");
            }).on('mousemove', (d, i ) => {
              tooltip
              .style('left', (event.pageX) + 'px')
              .style('top', (event.pageY - 28) + 'px')
            })
            .on('mouseout', function() {
              tooltip.style('opacity', 0);
            });
            
            const yAxis = d3.axisLeft(yScale);
            g.append('g').call(yAxis)
            .attr('id', 'view4-y-axis');

            const xAxis = d3.axisBottom(xScale);
            
            g.append('g').call(xAxis)
              .attr('transform',`translate(0,${innerHeight})`)
              .attr('id', 'view4-x-axis')
            g.append('text')
                .attr('x',innerWidth/2)
                .attr('y',innerHeight+40)
                .style('text-anchor','middle')
                .attr('id', 'view4-x-axis-text')
                .text('OBP');
            g.append('text')
                .attr('transform','rotate(-90)')
                .attr('y','-40px')
                .attr('x',-innerHeight/2)
                .style('text-anchor','middle')
                .text('Slugging')
                .attr('id', 'view4-y-axis-text')
            g.append('text')
              .attr('x',innerWidth/2)
              .attr('y', -40)
              .style("font-size", "4vh")
              .style('text-anchor','middle')
              .attr('id', 'view4-title')
              .text(title);
  }

  async function drawView5() {
  let data = await d3.csv('./data/view5/post_season_ops.csv')
  // remove the pitchers then clean the names
  data = data.filter(row => isHitter(row))
  for (const row of data) {
    row['Name'] = row['Name'].replace(/[^a-zA-Z0-9]/g,'-')
  }
  VIEW_5_DATA = data
  
  const teamRuns = await d3.csv('./data/view5/post_season_runs_wide.csv')
    
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
    .range([0, width])
    .padding(1)
    .domain(dimensions.map(bar => getColumnValue(bar)));
  

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
    .style("opacity", d => getOpacity(d.key) ?? 0.3)
      // Replace the 0 with the translation recieved from the x(getColumnValue(D)) function by passing in the series.
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(d => {return d})
      .join("rect")
      .on('mouseover', function(event, d) {
        tooltip.html(() => `${Math.round(d[1] - d[0])}% of series runs`)
          .style('opacity', 1)
          .style('left', (event.pageX) + 'px')
          .style('top', (event.pageY - 28) + 'px')
          .style('font-size', "18px");
        highlight(event, d)
      }).on('mousemove', (d, i ) => {
        tooltip
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function(d, i) {
        tooltip.style('opacity', 0);
        unHighlight(d, i)
      })
      .attr("x", d => {return x(getColumnValue(d.data['Series']))-(x.step()/10)})
      .attr("y", d => barY(d[1]))
      .attr("height", d => barY(d[0]) - barY(d[1]))
      .attr("transform", function(d) {return "translate(" + 0 + "," + margin.top/2 +  ")"; })
      .attr("width",x.step()/10)

        
  
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
    .style("opacity", d => getOpacity(d['Team Code']) ?? 0.3)
    .on('mouseover', function(event, d) {
      tooltip.html(() => `${d.Name} (${d['Team Code']})`)
        .style('opacity', 1)
        .style('left', (event.pageX) + 'px')
        .style('top', (event.pageY - 28) + 'px')
        .style('font-size', "18px");
      highlight(event, d)
    }).on('mousemove', (d, i ) => {
      tooltip
      .style('left', (event.pageX) + 'px')
      .style('top', (event.pageY - 28) + 'px')
    })
    .on('mouseout', function(d, i) {
      tooltip.style('opacity', 0);
      unHighlight(d, i)
    });
    
  
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
      .attr("y", margin.top - 10)
      .text(function(d) { return d; })
      .style("font-size", "1.5vh")
      .style("fill", "black")

  svg.append('text')
    .attr('transform','rotate(-90)')
    .attr('y',margin.left + 30)
    .attr('x',-height/2 - 40)
    .style('text-anchor','middle')
    .style("font-size", "1.5vh")
    .text('OPS / Proportional Runs (by team)')
  
    svg.append('text')
      .attr('x',innerWidth/2 + margin.left)
      .attr('y', margin.top - 10)
      .style("font-size", "32px")
      .style('text-anchor','middle')
      .text("Individual Performance");

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

  function getLineCoords(d) {
    const lineCoords = []
    let skippedWildCard = true      // More teams skipped the wildCard fs
    for( let i = 0; i < dimensions.length; i++) {
      if(i == 0){
            // Here we're getting the OPS for the regular season
          lineCoords.push([x('RegOPS'), heightFunctions["Regular Season"](d['RegOPS'])])
      }
      else if(i == 1){
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
      else if(i == 2){
          // Here we're checking the OPS for division series. Anyone who has a 0 here either played, or is now out.
          if(Number(d['dsOPS'])){
            lineCoords.push([x('dsOPS'), heightFunctions["Division Series"](d['dsOPS'])])
          } else {
            lineCoords.push(lineCoords.pop())
          }
      }
      else if(i == 3) {
          // Here we're checking the OPS for division Champs. Anyone who has a 0 here either played, or is now out.
          if(Number(d['dcOPS'])){
            lineCoords.push([x('dcOPS'), heightFunctions["Division Championship"](d['dcOPS'])])
          } else {
            lineCoords.push(lineCoords.pop())
          }
      }
      else if(i == 4) {
          // Here we're checking the OPS for division Champs. Anyone who has a 0 here either played, or is now out.
          if(Number(d['wsOPS'])){
            lineCoords.push([x('wsOPS'), heightFunctions["World Series"](d['wsOPS'])])
          } else {
            lineCoords.push(lineCoords.pop())
          }
      }
    }
    return d3.line()(lineCoords)
  }

  const highlight = function(event, d){
    const player = d3.select(`path#${d.Name}`)
    if(SELECTED_TEAM){
      if(player.data()[0]['Team Code'] === SELECTED_TEAM){
        player
          .transition().duration(10)
          .style('stroke', 'black')
          .style("opacity", "1")
      }
    } else {
      player
      .transition().duration(10)
      .style('stroke', 'black')
      .style("opacity", "1")
    }
    // Second the hovered specie takes its color
  }

  // Unhighlight
  const unHighlight = function(event, d){
    const player = d3.select(`path#${d.Name}`)
    player
      .transition().duration(10)
      .style("stroke", d => TEAM_COLORS[d['Team Code']] )
      .style("opacity", getOpacity(d['Team Code']) ?? 0.3)
  }
  
  }

  async function drawView6() {

    // Set up the Sankey generator with increased node padding
    const sankey = d3Sankey()
      .nodeWidth(15)
      .nodePadding(50) // Increased padding for more space between nodes
      .extent([[margin.left, margin.top], [width-margin.right, height - margin.bottom]]);

    // Define the data structure for the Sankey diagram
    const data = {
      nodes: [
        { name: "Regular Season" }, // Source 0
        { name: "Playoffs" }, // Source 1
        { name: "Wild Card" }, // Source 2
        // Split Divisional Series into two nodes to differentiate bypassing teams
        { name: "Divisional Series" }, // Source 3
        { name: "League Championship Series" }, // Source 4
        { name: "World Series" }, // Source 5
        { name: "CHAMPION" }, // Source 6
        { name: "ELIMINATED" } // Source 7
      ],
      links: [
        { source: 0, target: 1, value: 12 }, // Regular Season to Playoffs
        { source: 1, target: 2, value: 8 }, // Playoffs to Wild Card
        { source: 1, target: 3, value: 4 }, // Playoffs to Wild Card
        { source: 2, target: 3, value: 4 }, // Wild Card to Divisional Series
        
        // Combine Divisional Series nodes to League Championship Series
        { source: 3, target: 4, value: 4 }, // Divisional Series to LCS
        { source: 3, target: 7, value: 4 }, // Divisional Series to LCS
        { source: 4, target: 5, value: 2 }, // LCS to World Series
        { source: 5, target: 6, value: 1 }, // World Series to CHAMPION
        // ELIMINATED links
        { source: 0, target: 7, value: 18 }, // Regular Season to ELIMINATED
        { source: 2, target: 7, value: 4 }, // Wild Card to ELIMINATED
        //{ source: 4, target: 8, value: 0 }, // Divisional Series to ELIMINATED    
        { source: 4, target: 7, value: 2 }, // LCS to ELIMINATED
        { source: 5, target: 7, value: 1 }  // World Series to ELIMINATED
      ]
    };


    // Assign colors to rounds and 'ELIMINATED' as grey
    const nodeColors = {
      "Regular Season": "#1f77b4",
      "Playoffs": "#ff7f0e",
      "Wild Card": "#2ca02c",
      "Divisional Series (via Bye)": "#d62728",
      "Divisional Series": "#d62728",
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

    // Add rectangles for the nodes
    node.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", sankey.nodeWidth())
      .style("fill", d => d.color)
      .style("stroke", d => d3.rgb(d.color).darker(2));

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

    // Ensure the colors are set for nodes based on some logic or preset values
    data.nodes.forEach(function(d, i) {
      d.color = nodeColors[d.name] || "#7f7f7f"; // Apply the color based on node name
    });

    svg.append('text')
      .attr('x',innerWidth/2 + margin.left)
      .attr('y', margin.top - 10)
      .style("font-size", "32px")
      .style('text-anchor','middle')
      .text("MLB 2023 Season Flow");

    // Add the nodes and links to the Sankey diagram
    sankey(data);

  }
}

function getOpacity(teamCode){
  if(SELECTED_TEAM){
    if(teamCode === SELECTED_TEAM) {
      return 0.7
    } else {
      return 0.1
    }
  }
  // Leaving this so each function can nullish coallesce to a default
  return undefined;
}

function updateSelectedTeam(teamCode){
  SELECTED_TEAM = teamCode

  renderSvgFromStep(STATE)
}

function toggleWeights(){
  WEIGHT_VALS = !WEIGHT_VALS
  const svg = d3.select('#view1');
  const width = + d3.select('#chart').style('width').replace('px','');
  const height = + d3.select('#chart').style('height').replace('px','');
  const margin = { top:90, bottom: 90, right: 80, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

    function getWeightedValue(d, feat) {
    const weight = d['G'] / 162
    return weight * d[feat]
  }

  const chart = svg.select('g')
  const xScale = d3.scaleLinear()
                  .domain([0, d3.max(VIEW_4_DATA, d => WEIGHT_VALS ? getWeightedValue(d, 'OBP') : d['OBP'])]) // data space
                  .range([0, innerWidth]); // pixel space
  const yScale = d3.scaleLinear()
                  .domain([0, d3.max(VIEW_4_DATA, d => WEIGHT_VALS ? getWeightedValue(d,'SLG') : d['SLG'])]) // data space
                  .range([innerHeight, 0 ]); // pixel space

  chart.selectAll("circle")
      .data(VIEW_4_DATA)
      .join('circle')
      .attr('r',4)
      .style('opacity', d => getOpacity(d['Team Code']) ?? 0.8)
      .style('fill', d => TEAM_COLORS[d['Team Code']])
      .style('stroke','black')
      .transition()
      .attr("cx", d => xScale(WEIGHT_VALS ? getWeightedValue(d, 'OBP') : d['OBP']))
      .attr("cy", d => yScale(WEIGHT_VALS ? getWeightedValue(d, 'SLG') : d['SLG']))

      const title = `Offensive Output of Playoff Teams${WEIGHT_VALS ? " (Weighted)" : "" }`

      d3.select("#view4-x-axis").remove()
      d3.select("#view4-x-axis-text").remove()
      d3.select("#view4-y-axis").remove()
      d3.select("#view4-y-axis-text").remove()
      d3.select("#view4-title").remove()

      const yAxis = d3.axisLeft(yScale);
      chart.append('g').call(yAxis)
        .attr('id', 'view4-y-axis');

      const xAxis = d3.axisBottom(xScale);
      
      chart.append('g').call(xAxis)
      .attr('transform',`translate(0,${innerHeight})`)
      .attr('id', 'view4-x-axis')
    chart.append('text')
        .attr('x',innerWidth/2)
        .attr('y',innerHeight+40)
        .style('text-anchor','middle')
        .attr('id', 'view4-x-axis-text')
        .text('OBP');
    chart.append('text')
        .attr('transform','rotate(-90)')
        .attr('y','-40px')
        .attr('x',-innerHeight/2)
        .attr('id', 'view4-y-axis-text')
        .style('text-anchor','middle')
        .text('Slugging')
    chart.append('text')
      .attr('x',innerWidth/2)
      .attr('y', -40)
      .style("font-size", "4vh")
      .style('text-anchor','middle')
      .attr('id', 'view4-title')
      .text(title);
}

function toggleScale(){
  TOGGLE_SCALE = !TOGGLE_SCALE
  const svg = d3.select('#view1');
  const width = + d3.select('#chart').style('width').replace('px','');
  const height = + d3.select('#chart').style('height').replace('px','');
  const margin = { top:90, bottom: 90, right: 80, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const runsScored = getColumnnView3('r', VIEW_3_DATA);
  const invert_era = getColumnnView3('era', VIEW_3_DATA).map(item => 1 / item)
  const totalPayroll = getColumnnView3('totalPayroll', VIEW_3_DATA);
    
  d3.select("#view3-x-axis").remove()
  d3.select("#view3-x-axis-text").remove()
  d3.select("#view3-y-axis").remove()
  d3.select("#view3-y-axis-text").remove()
  d3.select("#view3-title").remove()

    //xScale: Runs Scored
    const size = d3.scaleSqrt().domain([d3.min(totalPayroll), d3.max(totalPayroll)]).range([10, 35]);
    const xScale = d3.scaleLinear()
        .domain([TOGGLE_SCALE ? d3.min(runsScored) : 0, d3.max(runsScored)])
        .range([0, innerWidth]);

    //yScale: Inverse ERA - Consider setting min val to just 0 becase that's how scatter plots should be
    const yScale = d3.scaleLinear()
        .domain([TOGGLE_SCALE ? d3.min(invert_era) : 0, d3.max(invert_era)])
        .range([innerHeight, 0 ]);
    //sizeScale: Total Payroll
        
    //remove old svg
    const chart = svg.select('g')
    // .attr('transform', 'translate('+margin.left+', '+margin.top+')');
    
    //Axis creation
    const yAxis = d3.axisLeft(yScale);
                chart.append('g').call(yAxis)
                .attr('transform', `translate(${margin.left},${margin.top})`)
                .attr('id', 'view3-y-axis');

    const xAxis = d3.axisBottom(xScale);
                chart.append('g').call(xAxis)
                    .attr('transform',`translate(${margin.left},${innerHeight + margin.top})`)
                  .attr('id', 'view3-x-axis');
                chart.append('text')
                  .attr('x',width/2)
                  .attr('y',height-40)
                  .style('text-anchor','middle')
                  .attr('id', 'view3-x-axis-text')
                  .text('Runs Scored');
                chart.append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('y', 40)  // Adjusted position
                    .attr('x', -height / 2)
                    .style('text-anchor', 'middle')
                    .attr('id', 'view3-y-axis-text')
                    .text('Inverse ERA');
                chart.append('text')
                    .attr('x',innerWidth/2+margin.left)
                    .attr('y', 40)
                    .style("font-size", "4vh")
                    .attr('id', 'view3-title')
                    .text(`Payroll Effectiveness by Team${TOGGLE_SCALE ? ' (Non-Zero Origin)' : ""}`)
                    .style('text-anchor', 'middle')

    chart.selectAll('circle')
      .data(VIEW_3_DATA)
      .join('circle')
      .attr("class", "circ")
      .attr("stroke", "black")
      .attr("r", d => Math.abs(size(d['totalPayroll'])))
      .attr("id", d => d['teamCode'])
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('opacity', d => getOpacity(d['teamCode']) ?? 0.7)
      .style("fill", d => TEAM_COLORS[d['teamCode']])        
      .transition()
        .attr("cx", d => xScale(d['r']))
        .attr("cy", (d, i) => yScale(invert_era[i]))
}

function getColumnnView3(columnName, data) {
  let newData = [];
  // Iterate through each row and extract the desired column
  for (let i = 0; i < data.length; i++) {
      newData.push(data[i][columnName]);
  }
  return newData;
}

// start
init();







