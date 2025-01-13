function calculateCumulativeSums(arr) {
    return arr.reduce((accumulator, currentValue, currentIndex) => {
      // accumulator 应该是一个数组，保存了到当前位置为止的累积和
      // 对于第一个元素，累积和数组只有一个元素，就是它本身
      if (currentIndex === 0) {
        return [currentValue];
      }

      // 对于其他元素，将当前累积和数组的最后一个元素（即前一个位置的累积和）
      // 加上当前元素的值，然后将新数组推入累积和数组
      const newAccumulator = [...accumulator]; // 复制累积和数组，避免直接修改它
      newAccumulator.push(
        newAccumulator[newAccumulator.length - 1] + currentValue
      );
      return newAccumulator;
    }, []); // 初始累积和数组是一个空数组
  }

  
function formatNumber(num) {
    // 定义一个单位映射表
    const units = ["", "k", "M", "G", "T", "P"]; // 你可以根据需要继续添加单位

    // 转换为字符串，便于后续处理
    let numStr = String(num);

    // 去除可能存在的逗号或其他非数字字符
    numStr = numStr.replace(/[^0-9\.]/g, "");

    // 将字符串转换为数字
    num = parseFloat(numStr);

    // 处理小数位
    num = parseFloat(num.toFixed(2)); // 保留两位小数

    // 处理单位
    let unitIndex = 0;
    while (num >= 1000) {
        num /= 1000;
        unitIndex++;
        if (unitIndex >= units.length) {
        // 如果单位列表不足以表示更大的数，则停止处理并返回原始字符串
        return numStr;
        }
    }

    // 格式化字符串并添加单位
    return `${parseFloat(num.toFixed(2))}${units[unitIndex]}`;
}


function getProjectValue(string) {
  const arr = string.split('(')
  const front = arr[0]
  let projectName = front
  let projectId = ''
  let back = arr[1]
  projectName = projectName.split(' - ')[0].toLowerCase()
  if(back) {
      back = back.replaceAll(')', '')
      const startIndex = back.indexOf('PRJ')
      if(startIndex >= 0) {
          projectId = back.slice(startIndex)
      }
  }
  return {
      projectName,
      projectId
  }
}

function getProjects() {
  const obj = {}
  document.querySelector('.Styles__markdown___AoORL').querySelectorAll('.Styles__link___jrhdD').forEach(a => {
    console.log(getProjectValue(a.innerText))
    const {projectName, projectId} = getProjectValue(a.innerText)
    obj[projectName] = projectId
  })

  return obj
}