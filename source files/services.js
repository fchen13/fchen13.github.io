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
    function getTreeData(url) {
      return new Promise((resolve) => {
        fetchData(url).then((res) => {
          resolve(res);
        });
      })
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
    const colors = ["#440154", "#404387", "#2a788e", "#22a884", "#7ad151", "#ff4500"];
    let index = 0
    return arr.map((item) => {
      return {
              name: item.rank,
              type: 'bar',
              data: [{
                value: Math.floor(item.arc * 1000 + 0.5) / 10,
                description: `${Number(item.x).toLocaleString('en-US')}/${Number(item.y).toLocaleString('en-US')}`
              }],
              total: item.y,
              num: item.x,
              coordinateSystem: 'polar',
              showBackground: true,
              backgroundStyle: {
                  color: '#cccccc'
              },
              itemStyle: {
                  color: colors[index++],
              },
              label: {
                  show: true,
                  position: 'middle',
                  formatter: `${Math.floor(item.arc * 1000 + 0.5) / 10}%`,
                  textStyle: {
                      color: '#fff',
                      fontSize: 10
                  }
              }
          }
    }).reverse();
  }

  function handleStackedFormat(data, colors, sourceName) {
    return data.map((d, index) => {
      if(colors) {
        d.itemStyle = {
          color: colors[index]
        }
      }
      const arr = [{
        value: 0,
        label: {
          show: false
        }
      },{
        value: 0,
        label: {
          show: false
        }
      },{
        value: 0,
        label: {
          show: false
        }
      },{
        value: 0,
        label: {
          show: false
        }
      },{
        value: 0,
        label: {
          show: false
        }
      },{
        value: 0,
        label: {
          show: false
        }
      }]
      arr[index].value = d.data[0].value
      arr[index].description = `${sourceName}-${d.name}: ${d.data[0].description}`
      arr[index].label.show = true
      arr[index].label.rotate = 0
      d.data = arr
      // d.stack = index
      d.stack  = 'a'

      return d
    })
  }
  
  function formatStackedUmbrellaData(url1, url2, delay = 1000) {
    return new Promise(resolve => {
      Promise.all([fetchData(url1), fetchData(url2)]).then((res) => {
        const EBPColors = ["#440154", "#404387", "#2a788e", "#22a884", "#7ad151", "#ff4500"];
        const INSDCColors = ["#6d3f9b", "#6e6d9b", "#55b4c6", "#4ad6a4", "#b3e093", "#ff8c42"]
        const EBPUmbrellaData = formatDataUmbrella(res[0])
        const INSDCUmbrellaData = formatDataUmbrella(res[1])
        const EBP = handleStackedFormat(EBPUmbrellaData, EBPColors.reverse(), 'EBP')
        const INSDC = handleStackedFormat(INSDCUmbrellaData, INSDCColors.reverse(), 'INSDC')
        // EBP.forEach(item => {
        //   item.animationDelay = function() {
        //     return 2 * delay
        //   }
        // })
        INSDC.forEach((item, index) => {
          let ratio = item.data[index].value / EBP[index].data[index].value
          if(EBP[index].data[index].value < 5) {
            EBP[index].data[index].value = EBP[index].data[index].value + 1
            ratio = Math.min(ratio, 3)
            item.data[index].value = EBP[index].data[index].value * ratio
          }
          // item.data[index].value = item.data[index].value - EBP[index].data[index].value
          // item.animationDelay = function() {
          //   return 1 * delay
          // }
        })
        const legends = []
        const len = EBPUmbrellaData.length
        for(let i = 0; i < len; i++) {
          legends.push({
            name: EBPUmbrellaData[i].name,
            color: EBPColors[i],
            data: [
              {name: 'EBP', num: EBPUmbrellaData[i].num, color: EBPColors[i]},
              {name: 'INSDC', num: INSDCUmbrellaData[i].num, color: INSDCColors[i]},
            ],
            contrast: EBPUmbrellaData[i].num / INSDCUmbrellaData[i].num,
            total: formatNumber(EBPUmbrellaData[i].total)
          })
        }

        const stackedData = EBP.map((_, index) => {
          return [
            EBP[index],
            INSDC[index]
          ]
        })
        resolve({
          stackedData: stackedData.flat(Infinity), legends
        })
      })
    })
    
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
    console.log('Raw data buckets:', histograms.buckets);
    console.log('Raw data byCat:', histograms.byCat);
    
    const tableName = data.report.report.yLabel+ ' ' + '(cumulative)'
    const category = histograms.buckets.map((item) =>
      new Date(item).getFullYear()
    );
    console.log('Processed categories:', category);
    
    const colors = ["#404387", "#22a884", "#ffff33", "#7ad151"];
    const series = [];
    let index = 0
    for (let name in histograms.byCat) {
      const rawData = histograms.byCat[name];
      console.log(`Raw data for ${name}:`, rawData);
      
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
          barGap: '1px',
          barCategoryGap: '1px',
      };
      
      // Calculate cumulative sums properly
      obj.data = rawData.reduce((acc, curr, idx) => {
        if (idx === 0) return [curr];
        return [...acc, acc[idx - 1] + curr];
      }, []);
      
      console.log(`Cumulative data for ${name}:`, obj.data);
      
      const total = obj.data[obj.data.length - 1]
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
    const tableName = data.report.report.yLabel + ' ' + '(actual)'
    const category = histograms.buckets.map((item) =>
      new Date(item).getFullYear()
    );
    const colors = ["#404387", "#22a884", "#ffff33", "#7ad151"];
    const series = [];
    let index = 0
    for (let name in histograms.byCat) {
      const rawData = histograms.byCat[name];
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
      const total = calculateCumulativeSums(histograms.byCat[name])[obj.data.length - 1]
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
    const tableName = data.report.report.yLabel + ' ' + '(YoY growth)'
    const category = histograms.buckets.map((item) =>
      new Date(item).getFullYear()
    );
    const colors = ["#404387", "#22a884", "#ffff33", "#7ad151"];
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
      obj.data = histograms.byCat[name].map((item, index) => {
        if(index === 0) return item > 0 ? 100 : 0
        const lastVal = histograms.byCat[name][index - 1]
        if(lastVal === 0) return item > 0 ? 100 : 0

        return ((item - lastVal) / lastVal * 100).toFixed(2)
      });
      const total = 0
      obj.description = formatNumber(total)
      series.push(obj);
    }

    return {
      category,
      series,
      tableName
    }
  }
