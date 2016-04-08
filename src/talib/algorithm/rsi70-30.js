'use strict'

const talib = require('talib/build/Release/talib');
const mapValue = require('../utils').mapValue
const isCutLoss = require('../utils').isCutLoss
const findProfit = require('../utils').findProfit

//var function_desc = talib.explain("RSI");
//console.dir(function_desc);

function calculateRSI(marketData) {
  return new Promise(resolve => {
    talib.execute({
      name: "RSI",
      startIdx: 0,
      inReal: marketData.c,
      endIdx: marketData.c.length - 1,
      high: marketData.h,
      low: marketData.l,
      close: marketData.c,
      optInTimePeriod: 14,
    }, result => {
      resolve(result.result.outReal)
    });
  })
}

function applyRSI(marketData) {
  return Promise.all([calculateRSI(marketData), Promise.resolve(mapValue(marketData))])
}

function rsiCross70(currentRSI, prevRSI) {
  return currentRSI >= 70 && prevRSI < 70
}

function rsiWillCross70(currentRSI, prevRSI) {
  return currentRSI >= 65 && prevRSI < currentRSI
}

function rsiCross30(currentRSI, prevRSI) {
  return currentRSI <= 30 && prevRSI > 30
}

function rsiWillCross30(currentRSI, prevRSI) {
  return currentRSI <= 35 && prevRSI > currentRSI
}

function isBuyCondition(currentRSI, prevRSI) {
  return rsiCross70(currentRSI, prevRSI)
  || rsiWillCross70(currentRSI, prevRSI)
}

function isSellCondition(currentRSI, prevRSI) {
  return rsiCross30(currentRSI, prevRSI)
  || rsiWillCross30(currentRSI, prevRSI)
}


function findCross(data) {
  const array = []
  const rsi = data.rsi
  const marketData = data.marketData.slice(data.marketData.length - rsi.length)
  let prevRSI = rsi[0]
  let currentHold
  let yesterdayAction = 'none'
  rsi.forEach((item, index) => {
    const currentData = marketData[index]
    let action = 'none'
    if (isBuyCondition(item, prevRSI)) {
      action = 'buy'
      currentHold = currentData
    } else if (isSellCondition(item, prevRSI)) {
      action = 'sell'
      currentHold = null
    }
    if (currentHold && isCutLoss(currentHold.c, currentData.c, marketData[index-1].c)) {
      action = 'sell'
      currentHold = null
    }
    array.push(Object.assign({}, currentData, {
      rsi: item,
      action: yesterdayAction,
      tomorrowAction: action
    }))
    prevRSI = item
    yesterdayAction = action
  })
  return array
}

module.exports = function (payload, symbol) {
  return applyRSI(payload)
    .then(res => ({ rsi: res[0], marketData: res[1] }))
    .then(findCross)
    .then(findProfit)
    //.then(res => console.log('RSI B70 S30\n', symbol, res))
}
