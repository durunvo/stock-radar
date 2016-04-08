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
  return Promise.all([calculateEMA(marketData, 10), calculateEMA(marketData, 25), Promise.resolve(mapValue(marketData))])
}

function ema10CrossEMA25(currentEMA10, prevEMA10, currentEMA25, prevEMA25) {
  return (currentEMA10 > currentEMA25 && prevEMA10 < prevEMA25)
}

function ema10WillCrossEMA25(currentEMA10, prevEMA10, currentEMA25, prevEMA25) {
  return ((distanceBetweenLine(currentEMA10, currentEMA25) < 0.4) && currentEMA10 > prevEMA10 && currentEMA10 < currentEMA25)
}

function isBuyCondition(currentEMA10, prevEMA10, currentEMA25, prevEMA25) {
  return ema10CrossEMA25(currentEMA10, prevEMA10, currentEMA25, prevEMA25)
    || ema10WillCrossEMA25(currentEMA10, prevEMA10, currentEMA25, prevEMA25)
}

function ema25CrossEMA10(currentEMA10, prevEMA10, currentEMA25, prevEMA25) {
  return (currentEMA10 < currentEMA25 && prevEMA10 > prevEMA25)
}

function ema25WillCrossEMA10(currentEMA10, prevEMA10, currentEMA25, prevEMA25) {
  return ((distanceBetweenLine(currentEMA10, currentEMA25) < 0.4) && currentEMA25 < prevEMA25 && currentEMA25 < currentEMA10)
}

function isSellCondition(currentEMA10, prevEMA10, currentEMA25, prevEMA25) {
  return ema25CrossEMA10(currentEMA10, prevEMA10, currentEMA25, prevEMA25)
    || ema25WillCrossEMA10(currentEMA10, prevEMA10, currentEMA25, prevEMA25)
}

function findCross(data) {
  const array = []
  const ema25 = data.ema25
  const ema10 = data.ema10.slice(data.ema10.length - ema25.length)
  const marketData = data.marketData.slice(data.marketData.length - ema25.length)
  let prevEMA10 = ema10[0]
  let prevEMA25 = ema25[0]
  let currentHold
  let yesterdayAction = 'none'
  ema10.forEach((item, index) => {
    const currentData = marketData[index]
    const currentEMA10 = ema10[index]
    const currentEMA25 = ema25[index]
    let action = 'none'
    if (isBuyCondition(currentEMA10, prevEMA10, currentEMA25, prevEMA25)) {
      action = 'buy'
      currentHold = currentData
    } else if (isSellCondition(currentEMA10, prevEMA10, currentEMA25, prevEMA25)) {
      action = 'sell'
      currentHold = null
    }
    if (currentHold && isCutLoss(currentHold.c, currentData.c, marketData[index-1].c)) {
      action = 'sell'
      currentHold = null
    }
    array.push(Object.assign({}, currentData, {
      ema10: currentEMA10,
      ema25: currentEMA25,
      action: yesterdayAction,
      tomorrowAction: action
    }))
    prevEMA10 = currentEMA10
    prevEMA25 = currentEMA25
    yesterdayAction = action
  })
  return array
}

module.exports = function (payload, symbol) {
  return applyEMA(payload)
    .then(res => ({ ema10: res[0], ema25: res[1], marketData: res[2] }))
    .then(findCross)
    .then(findProfit)
    //.then(res => console.log('EMA10-25\n', symbol, res))
}
