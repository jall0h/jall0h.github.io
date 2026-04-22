function BarChartRace(chartId, extendedSettings) {
  const chartSettings = {
    width: 500,
    height: 400,
    padding: 40,
    titlePadding: 5,
    columnPadding: 0.4,
    ticksInXAxis: 5,
    duration: 3500,
    ...extendedSettings,
  };

  chartSettings.innerWidth = chartSettings.width - chartSettings.padding * 2;
  chartSettings.innerHeight = chartSettings.height - chartSettings.padding * 2;

  chartSettings.pauseAt = chartSettings.pauseAt ?? 600;

  const chartDataSets = [];
  let chartTransition;
  let timerStart, timerEnd;
  let pauseTimer = null;
  let currentDataSetIndex = 0;
  let displayedIndex = 0;
  let elapsedTime = chartSettings.duration;

  const chartContainer = d3.select(`#${chartId} .chart-container`);
  const xAxisContainer = d3.select(`#${chartId} .x-axis`);
  const yAxisContainer = d3.select(`#${chartId} .y-axis`);

  const xAxisScale = d3.scaleLinear().range([0, chartSettings.innerWidth]);

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const yAxisScale = d3
    .scaleBand()
    .range([0, chartSettings.innerHeight])
    .padding(chartSettings.columnPadding);

  d3.select(`#${chartId}`)
    .attr("width", chartSettings.width)
    .attr("height", chartSettings.height);

  chartContainer.attr(
    "transform",
    `translate(${chartSettings.padding} ${chartSettings.padding})`,
  );

  chartContainer
    .select(".current-date")
    .attr(
      "transform",
      `translate(${chartSettings.innerWidth} ${chartSettings.innerHeight})`,
    );

  function draw({ dataSet, date: currentDate }, transition) {
    const { innerHeight, ticksInXAxis, titlePadding } = chartSettings;

    chartContainer.select(".current-date").text(currentDate);

    xAxisScale.domain([0, d3.max(dataSet, ({ value }) => value)]);
    yAxisScale.domain(dataSet.map(({ name }) => name));

    xAxisContainer
      .transition(transition)
      .call(d3.axisTop(xAxisScale).ticks(ticksInXAxis).tickSize(-innerHeight));

    yAxisContainer
      .transition(transition)
      .call(d3.axisLeft(yAxisScale).tickSize(0));

    // The general update Pattern in d3.js

    // Data Binding
    const barGroups = chartContainer
      .select(".columns")
      .selectAll("g.column-container")
      .data(dataSet, ({ name }) => name);

    // Enter selection
    const barGroupsEnter = barGroups
      .enter()
      .append("g")
      .attr("class", "column-container")
      .attr("transform", `translate(0,${innerHeight})`);

    barGroupsEnter
      .append("rect")
      .attr("class", "column-rect")
      .attr("width", 0)
      .attr("height", yAxisScale.step() * (1 - chartSettings.columnPadding))
      .attr("fill", ({ name }) => colorScale(name));

    barGroupsEnter
      .append("text")
      .attr("class", "column-title")
      .attr("y", (yAxisScale.step() * (1 - chartSettings.columnPadding)) / 2)
      .attr("x", -titlePadding)
      .text(({ name }) => name);

    barGroupsEnter
      .append("text")
      .attr("class", "column-value")
      .attr("y", (yAxisScale.step() * (1 - chartSettings.columnPadding)) / 2)
      .attr("x", titlePadding)
      .text(0);

    // Update selection
    const barUpdate = barGroupsEnter.merge(barGroups);

    barUpdate
      .transition(transition)
      .attr("transform", ({ name }) => `translate(0,${yAxisScale(name)})`);

    barUpdate
      .select(".column-rect")
      .transition(transition)
      .attr("width", ({ value }) => xAxisScale(value));

    barUpdate
      .select(".column-title")
      .transition(transition)
      .attr("x", ({ value }) => xAxisScale(value) - titlePadding);

    barUpdate
      .select(".column-value")
      .transition(transition)
      .attr("x", ({ value }) => xAxisScale(value) + titlePadding)
      .tween("text", function ({ value }) {
        const interpolateStartValue =
          elapsedTime === chartSettings.duration
            ? this.currentValue || 0
            : +this.innerHTML;

        const interpolate = d3.interpolate(interpolateStartValue, value);
        this.currentValue = value;

        return function (t) {
          d3.select(this).text(Math.ceil(interpolate(t)));
        };
      });

    // Exit selection
    const bodyExit = barGroups.exit();

    bodyExit
      .transition(transition)
      .attr("transform", `translate(0,${innerHeight})`)
      .on("end", function () {
        d3.select(this).attr("fill", "none");
      });

    bodyExit.select(".column-title").transition(transition).attr("x", 0);

    bodyExit.select(".column-rect").transition(transition).attr("width", 0);

    bodyExit
      .select(".column-value")
      .transition(transition)
      .attr("x", titlePadding)
      .tween("text", function () {
        const interpolate = d3.interpolate(this.currentValue, 0);
        this.currentValue = 0;

        return function (t) {
          d3.select(this).text(Math.ceil(interpolate(t)));
        };
      });

    return this;
  }

  function clearDatasets() {
    chartDataSets.length = 0;
    currentDataSetIndex = 0;
    elapsedTime = chartSettings.duration;

    return this;
  }

  function addDataset(dataSet) {
    chartDataSets.push(dataSet);

    return this;
  }

  function addDatasets(dataSets) {
    chartDataSets.push.apply(chartDataSets, dataSets);

    return this;
  }

  function setTitle(title) {
    d3.select(".chart-title")
      .attr("x", chartSettings.width / 2)
      .attr("y", -chartSettings.padding / 2)
      .text(title);

    return this;
  }

  function drawInstant(index) {
    if (index < 0 || index >= chartDataSets.length) return;
    stop();
    displayedIndex = index;
    currentDataSetIndex = index;
    elapsedTime = chartSettings.duration;
    timerStart = null;
    timerEnd = null;

    const instantTransition = chartContainer.transition().duration(0);

    draw(chartDataSets[index], instantTransition);
  }

  function stepForward() {
    const next = displayedIndex + 1;
    if (next < chartDataSets.length) drawInstant(next);
    return this;
  }

  function stepBack() {
    const prev = displayedIndex - 1;
    if (prev >= 0) drawInstant(prev);
    return this;
  }

  async function render(index = 0) {
    currentDataSetIndex = index;
    displayedIndex = index;
    timerStart = d3.now();

    chartTransition = chartContainer
      .transition()
      .duration(elapsedTime)
      .ease(d3.easeLinear)
      .on("end", () => {
        if (index < chartDataSets.length) {
          elapsedTime = chartSettings.duration;
          pauseTimer = setTimeout(() => render(index + 1), chartSettings.pauseAt);
        } else {
          d3.select("#play-stop").text("Play");
        }
      })
      .on("interrupt", () => {
        timerEnd = d3.now();
      });

    if (index < chartDataSets.length) {
      draw(chartDataSets[index], chartTransition);
    }

    return this;
  }

  function stop() {
    clearTimeout(pauseTimer);
    d3.select(`#${chartId}`).selectAll("*").interrupt();

    return this;
  }

  function start() {
    elapsedTime -= timerEnd - timerStart;

    render(currentDataSetIndex);

    return this;
  }

  return {
    addDataset,
    addDatasets,
    clearDatasets,
    render,
    setTitle,
    start,
    stepBack,
    stepForward,
    stop,
  };
}
