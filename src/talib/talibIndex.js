'use strict'

const fs = require('fs')
const fetch = require('node-fetch')
const symbols = JSON.parse(fs.readFileSync(__dirname + '/SET100.json', 'utf-8'))
const macd = require('./algorithm/macd')
const ema1025 = require('./algorithm/ema10-25')
const rsi7030 = require('./algorithm/rsi70-30')
const rsi3070 = require('./algorithm/rsi30-70')
const ema2550 = require('./algorithm/ema25-50')
const formatValue = require('./utils').formatValue
const stockModel = require('./database/Stocks.model')

function getUrl(symbol) {
  return `http://chart.investorz.com/achart/history/query.ashx?symbol=${symbol}*BK&resolution=D&from=${global.startTime}&to=${global.endTime}`
}

function applyAlgorithm(payload, symbol, algo) {
  if (global.mapAlgorithm[algo].match(/B70/)) {
    return rsi7030(payload, symbol)
  } else if (global.mapAlgorithm[algo].match(/B30/)) {
    return rsi3070(payload, symbol)
  } else if (global.mapAlgorithm[algo].match(/50/)) {
    return ema2550(payload, symbol)
  } else if (global.mapAlgorithm[algo].match(/10/)) {
    return ema1025(payload, symbol)
  } else if (global.mapAlgorithm[algo].match(/MACD/)) {
    return macd(payload, symbol)
  }
  return rsi7030(payload, symbol)
}

function formatStockDataAndSave(symbol, data) {
  data.t.forEach((item, index) => {
    stockModel.findOneAndUpdate(formatValue(data, index, symbol))
  })
}

function formatSymbolFromMongo(data) {
  const result = {
    c: [],
    h: [],
    l: [],
    v: [],
    o: [],
    t: [],
  }
  data.forEach(item => {
    result.c.push(item.c)
    result.h.push(item.h)
    result.l.push(item.l)
    result.v.push(item.v)
    result.o.push(item.o)
    result.t.push(item.t)
  })
  return Promise.resolve(result)
}

function saveFetchToMongo(symbol) {
  stockModel.dropFetchIfExist(symbol)
    .then(() => fetch(getUrl(symbol)))
    .then(res => res.text())
    .then(body => JSON.parse(body))
    .then(res => formatStockDataAndSave(symbol, res))
}

let i = 0

function fetchAndUpdateStockData(symbol, i) {
  return fetch(getUrl(symbol))
    .then(res => res.text())
    .then(body => JSON.parse(body))
    .then(res => {
      const length = res.t.length
      const dayBack = 5
      const result = {}
      result.t = res.t.slice(length - dayBack)
      result.o = res.o.slice(length - dayBack)
      result.c = res.c.slice(length - dayBack)
      result.h = res.h.slice(length - dayBack)
      result.l = res.l.slice(length - dayBack)
      result.v = res.v.slice(length - dayBack)
      return result
    })
    .then(res => {
      res.t.forEach((time, index) => {
        stockModel.findOneAndUpdate(formatValue(res, index, symbol))
      })
      console.log(i, symbol, 'done')
      return symbol
    })
}

function loadFromMongo(symbol, algo) {
  return stockModel.getSymbolFromMongo(symbol)
    .then(formatSymbolFromMongo)
    .then(res => applyAlgorithm(res, symbol, algo))
    .then(res => ({ symbol, summary: res.summary }))
}

function update() {
  return Promise.all(symbols.map(fetchAndUpdateStockData))
}

function calculate(algo) {
  return Promise.all(symbols.map(res => loadFromMongo(res, algo)))
}
module.exports.calculate = calculate
module.exports.update = update