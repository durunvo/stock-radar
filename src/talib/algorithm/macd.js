'use strict'

const talib = require('talib/build/Release/talib');
const mapValue = require('../utils').mapValue
const isCutLoss = require('../utils').isCutLoss
const findProfit = require('../utils').findProfit

function calculateMACD(marketData) {
  return new Promise(resolve => {
    talib.execute({
      name: "MACD",
      startIdx: 0,
      inReal: marketData.c,
      endIdx: marketData.c.length - 1,
      high: marketData.h,
      low: marketData.l,
      close: marketData.c,
      optInFastPeriod: 12,
      optInSlowPeriod: 26,
      optInSignalPeriod: 9
    }, result => {
      resolve(result.result.outMACD)
    });
  })
}

function applyMACD(marketData) {
  return Promise.all([calculateMACD(marketData), Promise.resolve(mapValue(marketData))])
}

function isBuyCondition(currentMACD, prevMACD) {
  return currentMACD > prevMACD && currentMACD >= 0 && prevMACD <= 0
}

function isSellCondition(currentMACD, prevMACD) {
  return currentMACD < prevMACD && currentMACD <= 0 && prevMACD >= 0
}

function findCross(data) {
  const array = []
  const macd = data.macd
  const marketData = data.marketData.slice(data.marketData.length - macd.length)
  let prevMACD = macd[0]
  let currentHold
  let yesterdayAction = 'none'
  macd.forEach((item, index) => {
    const currentData = marketData[index]
    let action = 'none'
    if (isBuyCondition(item, prevMACD)) {
      action = 'buy'
      currentHold = currentData
    } else if (isSellCondition(item, prevMACD)) {
      action = 'sell'
      currentHold = null
    }
    if (currentHold && isCutLoss(currentHold.c, currentData.c, marketData[index-1].c)) {
      action = 'sell'
      currentHold = null
    }
    array.push(Object.assign({}, currentData, {
      macd: item,
      action: yesterdayAction,
      tomorrowAction: action
    }))
    prevMACD = item
    yesterdayAction = action
  })
  return array
}

module.exports = function (payload, symbol) {
  return applyMACD(payload)
    .then(res => ({ macd: res[0], marketData: res[1] }))
    .then(findCross)
    .then(findProfit)
    //.then(res => console.log('MACD\n', symbol, res))
}

