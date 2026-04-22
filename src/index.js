const myChart = new BarChartRace("bar-chart-race", {
  width: 600,
  height: 350,
  duration: 2000,
});

function startChart(medalType) {
  myChart.stop();
  myChart.clearDatasets();

  loadData(medalType).then((datasets) => {
    const label = medalType === "total" ? "All Medals" : medalType.charAt(0).toUpperCase() + medalType.slice(1);
    myChart
      .setTitle(`Olympic Medals by Age Group (${label})`)
      .addDatasets(datasets)
      .render();

    d3.select("button").text("Stop");
  });
}

startChart("total");

d3.select("button").on("click", function () {
  if (this.innerHTML === "Stop") {
    this.innerHTML = "Resume";
    myChart.stop();
  } else if (this.innerHTML === "Resume") {
    this.innerHTML = "Stop";
    myChart.start();
  } else {
    this.innerHTML = "Stop";
    myChart.render();
  }
});

d3.select("#medal-filter").on("change", function () {
  startChart(this.value);
});
