'use strict'

const talib = require('talib/build/Release/talib');
const mapValue = require('../utils').mapValue
const isCutLoss = require('../utils').isCutLoss
const findProfit = require('../utils').findProfit
const distanceBetweenLine = require('../utils').distanceBetweenLine

function calculateEMA(marketData, length) {
  return new Promise(resolve => {
    talib.execute({
      name: "EMA",
      startIdx: 0,
      inReal: marketData.c,
      endIdx: marketData.c.length - 1,
      high: marketData.h,
      low: marketData.l,
      close: marketData.c,
      optInTimePeriod: length
    }, result => {
      resolve(result.result.outReal)
    });
  })
}

function applyEMA(marketData) {
  return Promise.all([calculateEMA(marketData, 25), calculateEMA(marketData, 50), Promise.resolve(mapValue(marketData))])
}

function ema25CrossEMA50(currentEMA25, prevEMA25, currentEMA50, prevEMA50) {
  return (currentEMA25 > currentEMA50 && prevEMA25 < prevEMA50)
}

function ema25WillCrossEMA50(currentEMA25, prevEMA25, currentEMA50, prevEMA50) {
  return ((distanceBetweenLine(currentEMA25, currentEMA50) < 0.4) && currentEMA25 > prevEMA25 && currentEMA25 < currentEMA50)
}

function isBuyCondition(currentEMA25, prevEMA25, currentEMA50, prevEMA50) {
  return ema25CrossEMA50(currentEMA25, prevEMA25, currentEMA50, prevEMA50) || ema25WillCrossEMA50(currentEMA25, prevEMA25, currentEMA50, prevEMA50)
}

function ema50CrossEMA25(currentEMA25, prevEMA25, currentEMA50, prevEMA50) {
  return (currentEMA25 < currentEMA50 && prevEMA25 > prevEMA50)
}

function ema50WillCrossEMA25(currentEMA25, prevEMA25, currentEMA50, prevEMA50) {
  return ((distanceBetweenLine(currentEMA50, currentEMA25) < 0.4) && currentEMA50 < prevEMA50 && currentEMA50 < currentEMA25)
}

function isSellCondition(currentEMA25, prevEMA25, currentEMA50, prevEMA50) {
  return ema50CrossEMA25(currentEMA25, prevEMA25, currentEMA50, prevEMA50) || ema50WillCrossEMA25(currentEMA25, prevEMA25, currentEMA50, prevEMA50)
}

function findCross(data) {
  const array = []
  const ema50 = data.ema50
  const ema25 = data.ema25.slice(data.ema25.length - ema50.length)
  const marketData = data.marketData.slice(data.marketData.length - ema50.length)
  let prevEMA25 = ema25[0]
  let prevEMA50 = ema50[0]
  let currentHold
  let yesterdayAction = 'none'
  ema25.forEach((item, index) => {
    const currentData = marketData[index]
    const currentEMA25 = ema25[index]
    const currentEMA50 = ema50[index]
    let action = 'none'
    if (isBuyCondition(currentEMA25, prevEMA25, currentEMA50, prevEMA50)) {
      action = 'buy'
      currentHold = currentData
    } else if (isSellCondition(currentEMA25, prevEMA25, currentEMA50, prevEMA50)) {
      action = 'sell'
      currentHold = null
    }
    if (currentHold && isCutLoss(currentHold.c, currentData.c, marketData[index-1].c)) {
      action = 'sell'
      currentHold = null
    }
    array.push(Object.assign({}, currentData, {
      ema25: currentEMA25,
      ema50: currentEMA50,
      action: yesterdayAction,
      tomorrowAction: action
    }))
    prevEMA25 = currentEMA25
    prevEMA50 = currentEMA50
    yesterdayAction = action
  })
  return array
}

module.exports = function (payload, symbol) {
  return applyEMA(payload)
    .then(res => ({ ema25: res[0], ema50: res[1], marketData: res[2] }))
    .then(findCross)
    .then(findProfit)
    //.then(res => console.log('EMA25-50\n', symbol, res))
}
