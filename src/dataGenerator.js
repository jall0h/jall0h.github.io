async function loadData(medalType = "total") {
  const medals = await d3.csv("medals_by_age_group.csv");

  const counts = {};
  for (const row of medals) {
    counts[`${row.year}|${row.age_group}`] = Number(row[medalType]);
  }
  const years = [...new Set(medals.map((row) => row.year))];
  const ageGroups = [...new Set(medals.map((row) => row.age_group))];

  return years.map((year) => ({
    date: year,
    dataSet: ageGroups.map((group) => ({
      name: group,
      value: counts[`${year}|${group}`] || 0,
    })),
  }));
}
