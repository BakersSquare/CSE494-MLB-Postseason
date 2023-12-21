import { TEAM_COLORS } from "../constants.js";


let WEIGHT_VALS = true
let GLOBAL_DATA = []
const VIEW_4 = {}

function getWeightedValue(d, feat) {
  const weight = d['G'] / 162
  return weight * d[feat]
}
        
  // Drawing the original chart once the csv is loaded
    d3.csv('../data/view4/playoff_teams.xls.csv').then(data => {
      GLOBAL_DATA = data

      
      const svg = d3.select('#view4');
      const width = +svg.style('width').replace('px','');
      const height = +svg.style('height').replace('px','');
      const margin = { top:40, bottom: 90, right: 20, left: 80 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const chartDim = svg.node().getBoundingClientRect()
      console.log(chartDim)

      const toolTip = d3.select("body")
      .append("div")
        .attr("id", "tooltip")
        .attr('style', 'position: absolute; opacity: 0;')
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")


      // Defined function that grabs a datapoint's 'Games Played' value, and used it to scale the metric

      const title = `Offensive Ouput of Playoff Teams${WEIGHT_VALS ? " (Game Weighted)" : "" }`

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
                .style('opacity',.8)
                .style('fill', d => TEAM_COLORS[d['Team Code']])
                .style('stroke','black')
                .on('mouseover', function(i, d) {
                  console.log(i, d)
                  d3.select('#tooltip').style('opacity', 1).text(`${d.Name}\n ${d.OBP}:${d.SLG}`)
                })
                .on('mouseout', function(i, d) {
                  console.log(i, d)
                  d3.select('#tooltip').style('opacity', 0)
                })
                .on('mousemove', function(i, d) {
                  console.log(i, d)

                  d3.select('#tooltip')
                  .style('left', i.clientX + 'px')
                  .style('top', i.clientY + 30 + 'px')
                  })
                
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
                    .attr('id', 'view4-x-axis-text')
                    .text('OBP');
                g.append('text')
                    .attr('transform','rotate(-90)')
                    .attr('y','-40px')
                    .attr('x',-innerHeight/2)
                    .style('text-anchor','middle')
                    .text('Slugging')
                g.append('text')
                  .attr('x',innerWidth/2 - 80)
                  .attr('y', -10)
                  .attr('id', 'view4-title')
                  .text(title);
    });

        // Adding animation if the weights are toggled off
  function toggleWeights(){
    WEIGHT_VALS = !WEIGHT_VALS
    const svg = d3.select('#view4');
    const width = +svg.style('width').replace('px','');
    const height = +svg.style('height').replace('px','');
    const margin = { top:40, bottom: 90, right: 20, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg.select('g')
    const xScale = d3.scaleLinear()
                    .domain([0, d3.max(GLOBAL_DATA, d => WEIGHT_VALS ? getWeightedValue(d, 'OBP') : d['OBP'])]) // data space
                    .range([0, innerWidth]); // pixel space
    const yScale = d3.scaleLinear()
                    .domain([0, d3.max(GLOBAL_DATA, d => WEIGHT_VALS ? getWeightedValue(d,'SLG') : d['SLG'])]) // data space
                    .range([innerHeight, 0 ]); // pixel space

    chart.selectAll("circle")
        .data(GLOBAL_DATA)
        .join('circle')
        .attr('r',4)
        .style('opacity',.8)
        .style('fill', d => TEAM_COLORS[d['Team Code']])
        .style('stroke','black')
        .transition()
        .attr("cx", d => xScale(WEIGHT_VALS ? getWeightedValue(d, 'OBP') : d['OBP']))
        .attr("cy", d => yScale(WEIGHT_VALS ? getWeightedValue(d, 'SLG') : d['SLG']))

        const title = `Offensive Ouput of Playoff Teams${WEIGHT_VALS ? " (Game Weighted)" : "" }`

        d3.select("#view4-x-axis").remove()
        d3.select("#view4-x-axis-text").remove()
        d3.select("#view4-y-axis").remove()
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
            .attr('id', 'view4-x-axis-text')
            .text('OBP');

        chart.append('text')
            .attr('x',innerWidth/2 - 80)
            .attr('y', -10)
            .attr('id', 'view4-title')
            .text(title);
  }

VIEW_4.toggleWeights = toggleWeights
window.view_4 = VIEW_4
