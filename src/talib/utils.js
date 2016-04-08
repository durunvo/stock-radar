'use strict'

function mapValue(json) {
  return json.t.map((item, index) => {
    return formatValue(json, index)
  })
}

function formatValue(data, index, symbol) {
  const result = {
    t: data.t[index],
    o: data.o[index],
    h: data.h[index],
    l: data.l[index],
    c: data.c[index],
    v: data.v[index]
  }
  if (symbol) result.s = symbol
  return result
}

function diffPercent(a, b) {
  return ( a / b ) * 100 - 100
}

function diff(a, b) {
  return a - b
}

function newBalance(balance, percent) {
  return (100 + percent) / 100 * balance
}

function valueLessThanCutLoss(cost, marketValue) {
  return (100 * marketValue / cost) <= (100 - global.cutLoss)
}

function dropSuddenInDay(cost, marketValue, yesterdayValue) {
  return 100 - ( marketValue / yesterdayValue * 100) > global.suddenDrop && yesterdayValue < cost
}

function isCutLoss(cost, marketValue, yesterdayValue) {
  return valueLessThanCutLoss(cost, marketValue) || dropSuddenInDay(cost, marketValue, yesterdayValue)
}

function summary(array, cashBalance, sum, loss) {
  return {
    cashBalance: cashBalance.toFixed(2),
    netProfits: (cashBalance - global.startingBalance).toFixed(2),
    averageProfitsPerShare: (sum / array.length).toFixed(2),
    netProfitsPerShare: sum.toFixed(2),
    trades: array.length,
    'profit/loss': `${array.length - loss}/${loss}`
  }
}

function findProfit(array) {
  let currentHold
  const result = []
  let sum = 0
  let loss = 0
  let win = 0
  let cashBalance = global.startingBalance
  array.forEach(item => {
    if (currentHold) {
      if (item.action === 'buy' || item.action === 'none') return
      if (item.action === 'sell') {
        const changes = diff(item.c, currentHold.c)
        const percent = diffPercent(item.c, currentHold.c)
        cashBalance = newBalance(cashBalance, percent)
        result.push({
          changes: `${changes.toFixed(2)} (${percent.toFixed(2)}%)`,
          cashBalance: cashBalance.toFixed(2)
        })
        if (changes < 0) {
          loss++
        } else {
          win++
        }
        sum += changes
        currentHold = null
      }
    } else {
      if (item.action === 'sell' || item.action === 'none') return
      if (item.action === 'buy') {
        currentHold = item
      }
    }
  })
  return {
    //result,
    summary: summary(result, cashBalance, sum, loss)
  }
}

function distanceBetweenLine(line1, line2) {
  return Math.abs(line1 - line2) / (line1 > line2 ? line1 : line2) * 100
}

module.exports.formatValue = formatValue
module.exports.distanceBetweenLine = distanceBetweenLine
module.exports.findProfit = findProfit
module.exports.isCutLoss = isCutLoss
module.exports.diff = diff
module.exports.diffPercent = diffPercent
module.exports.mapValue = mapValue
