


// get请求
async function fetchData(url) {
    const response = await fetch(url); // 替换为你的 API URL
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = await response.json(); // 假设你的 API 返回的是 JSON 格式的数据
    return data;
  }

  // 获取表盘所需数据
  function getUmberllaData(url) {
    return new Promise((resolve) => {
      fetchData(url).then((res) => {
        resolve(formatDataUmbrella(res));
      });
    })
  }

  // 将数据格式化成 echarts 需要的格式
  function formatDataUmbrella(data) {
    const arr = data.report.report.arc;
    const colors = ["#440154", "#404387", "#2a788e", "#22a884", "#7ad151", "#fde725"];
    let index = 0
    return arr.map((item) => {
      return {
              name: item.rank,
              description: `${formatNumber(item.x)}/${formatNumber(item.y)}`,
              type: 'bar',
              data: [Math.floor(item.arc * 1000 + 0.5) / 10],
              coordinateSystem: 'polar',
              showBackground: true,
              backgroundStyle: {
                  color: 'rgba(180, 180, 180, 0.4)'
              },
              itemStyle: {
                  color: colors[index++],
              },
              label: {
                  show: true,
                  position: 'end',
                  formatter: '{c}%',
                  textStyle: {
                      color: '#000'
                  }
              }
          }
    }).reverse();
  }

  // 获取柱状图所需数据
  function getStackedBarData(url) {
      return new Promise(resolve => {
          fetchData(url).then((res) => {
              resolve({
                formatData: formatStackedBarData(res), 
                defaultData: getDefaultStackedBarData(res),
                percentData: getPercentStackedBarData(res)
              })
          });
      })
    
  }

  // 将数据格式化成 echarts 需要的格式
  function formatStackedBarData(data) {
    const histograms = data.report.report.histogram.histograms;
    const tableName = data.report.report.yLabel+ ' ' + 'format'
    const category = histograms.buckets.map((item) =>
      new Date(item).getFullYear()
    );
    category.pop()
    const colors = ["#404387", "#2a788e", "#22a884", "#7ad151"];
    const series = [];
    let index = 0
    for (let name in histograms.byCat) {
      const obj = {
        name,
        type: "bar",
        stack: "total",
        label: {
          show: false,
        },
        itemStyle: {
            color: colors[index++],
          },
          barGap: '1px', // 同一类目下系列之间的间隔
          barCategoryGap: '1px',
      };
      obj.data = calculateCumulativeSums(histograms.byCat[name]);
      const total = obj.data.pop()
      obj.description = formatNumber(total)
      series.push(obj);
    }

    return {
      category,
      series,
      tableName
    }
  }

  function getDefaultStackedBarData(data) {
    const histograms = data.report.report.histogram.histograms;
    const tableName = data.report.report.yLabel + ' ' + 'default'
    const category = histograms.buckets.map((item) =>
      new Date(item).getFullYear()
    );
    category.pop()
    const colors = ["#404387", "#2a788e", "#22a884", "#7ad151"];
    const series = [];
    let index = 0
    for (let name in histograms.byCat) {
      const obj = {
        name,
        type: "bar",
        stack: "total",
        label: {
          show: false,
        },
        itemStyle: {
            color: colors[index++],
          },
          barGap: '1px', // 同一类目下系列之间的间隔
          barCategoryGap: '1px',
      };
      obj.data = histograms.byCat[name];
      const total = calculateCumulativeSums(histograms.byCat[name]).pop()
      obj.description = formatNumber(total)
      series.push(obj);
    }

    return {
      category,
      series,
      tableName
    }
  }

  function getPercentStackedBarData(data) {
    const histograms = data.report.report.histogram.histograms;
    const tableName = data.report.report.yLabel + ' ' + 'percent'
    const category = histograms.buckets.map((item) =>
      new Date(item).getFullYear()
    );
    category.pop()
    const colors = ["#404387", "#2a788e", "#22a884", "#7ad151"];
    const series = [];
    let index = 0
    for (let name in histograms.byCat) {
      const obj = {
        name,
        type: "bar",
        stack: "total",
        label: {
          show: false,
        },
        itemStyle: {
            color: colors[index++],
          },
          barGap: '1px', // 同一类目下系列之间的间隔
          barCategoryGap: '1px',
      };
      const sums = calculateCumulativeSums(histograms.byCat[name])
      obj.data = histograms.byCat[name].map((item, index) => {
        if(index === 0) return 0
        const lastSum = sums[index - 1]
        if(lastSum === 0) return 0

        return (item / lastSum * 100).toFixed(2)
      });
      const total = sums.pop()
      obj.description = formatNumber(total)
      series.push(obj);
    }

    return {
      category,
      series,
      tableName
    }
  }
