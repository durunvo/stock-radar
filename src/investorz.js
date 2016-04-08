'use strict'

const fetch = require('node-fetch')
const fs = require('fs')
const symbols = JSON.parse(fs.readFileSync('SET50.json', 'utf-8'))

function mapValue(json) {
  return json.t.map((item, index) => {
    return {
      t: json.t[index],
      o: json.o[index],
      h: json.h[index],
      l: json.l[index],
      c: json.c[index],
      v: json.v[index]
    }
  })
}

function calculateEMA(todaysPrice, numberOfDays, EMAYesterday) {
  const k = 2 / (numberOfDays + 1)
  return todaysPrice * k + EMAYesterday * (1 - k)
}

function calculate(array) {
  let yesterdayEMA = array[0].c
  return array.map(item => {
    yesterdayEMA = calculateEMA(item.c, 25, yesterdayEMA)
    return Object.assign(item, { ema: parseFloat(yesterdayEMA.toFixed(2)) })
  })
}

function indicator(array) {
  let yesterdayEMA = array[0].ema
  let yesterdayAction = 'none'
  return array.map((item, index) => {
    const green = item.c - item.o > 0
    const red = item.c - item.o < 0
    const closeOverEMA = item.c > item.ema
    const closeUnderEMA = item.c < item.ema
    const emaIncrease = item.ema > yesterdayEMA
    const emaDecline = item.ema < yesterdayEMA
    let action
    if (green && closeOverEMA && emaIncrease) {
      action = 'buy'
    } else if (red && closeUnderEMA && emaDecline) {
      action = 'sell'
    } else {
      action = 'none'
    }
    const result = Object.assign(item, { action: yesterdayAction, tomorrowAction: action })
    yesterdayAction = action
    yesterdayEMA = item.ema
    return result
  })
}

function profit(array) {
  let currentHold
  let holdPeriod = false
  const profit = []
  array.forEach(item => {
    if (holdPeriod) {
      if (item.action === 'buy' || item.action === 'none') return
      if (item.action === 'sell') {
        profit.push(item.c - currentHold.c)
        holdPeriod = false
      }
    } else {
      if (item.action === 'sell' || item.action === 'none') return
      if (item.action === 'buy') {
        currentHold = item
        holdPeriod = true
      }
    }
  })
  return profit
}

fetch(`http://chart.investorz.com/achart/history/query.ashx?symbol=${symbols[0]}*BK&resolution=D&from=923875200&to=${new Date().getTime()}`)
  .then(res => res.text())
  .then(body => JSON.parse(body))
  .then(mapValue)
  .then(calculate)
  .then(indicator)
  //.then(profit)
  .then(result => console.log(result))