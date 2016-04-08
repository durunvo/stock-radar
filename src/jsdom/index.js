'use strict'

const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')
const pages = [0,1,2]
const symbols = JSON.parse(fs.readFileSync(__dirname + '/SET100.json', 'utf-8'))
const stockModel = require('../talib/database/Stocks.model')

var i = 0

function formatDate(input) {
  // 29/01/2559
  const array = input.split('/').reverse()
  const year = parseInt(array[0]) - 543
  const d = new Date(`${year}-${array[1]}-${array[2]}`)
  return parseInt(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)/1000)
}

function saveToFile(name, data) {
  fs.writeFile(`${name}.json`, JSON.stringify(data), function(err) {
    if(err) {
      return console.log(err);
    }
    console.log(`save ${name}.json!`)
  })
}

function formatData(children, symbol) {
  return {
    s: symbol,
    t: formatDate(children.eq(0).text()),
    o: parseFloat(children.eq(1).text()),
    h: parseFloat(children.eq(2).text()),
    l: parseFloat(children.eq(3).text()),
    c: parseFloat(children.eq(4).text()),
    v: parseInt(children.eq(7).text().replace(/,/g, '')),
  }
}

function getFromUrl(symbol, page, first) {
  const url = `http://www.set.or.th/set/historicaltrading.do?symbol=${symbol}&page=${page}&ssoPageId=2&language=th&country=TH`
  return fetch(url)
    .then(res => res.text())
    .then(body => {
      console.log(i++, `${symbol} => done`)
      const $ = cheerio.load(body)
      if (first) {
        const children = $('.table-info tbody tr').eq(0).children()
        return formatData(children, symbol)
      } else {
        const items = []
        $('.table-info tbody tr').each(function(i) {
          $(this).each(function(j) {
            const children = $(this).children()
            items.push(formatData(children, symbol))
          })
        })
        return items
      }
    })
}

function getAll(symbol) {
  const array = pages.map(page => getFromUrl(symbol, page))
  return Promise.resolve(array)
}

function saveAll(items) {
  const array = items.map(item => stockModel.findOneAndUpdate(item))
  return Promise.resolve(array)
}

function fetchSymbolAll(symbol) {
  return getAll(symbol)
    .then(res => Promise.all(res))
    .then(res => Array.prototype.slice().concat.apply([], res))
    .then(res => saveAll(res))
    .then(res => Promise.all(res))

}

function fetchSymbolFirst(symbol) {
  return getFromUrl(symbol, 0, true)
    .then(res => stockModel.findOneAndUpdate(res))
    .then(res => Promise.all(res))
    .catch(err => {

    })
}

function loopSymbolAll() {
  return symbols.map(symbol => fetchSymbolAll(symbol.toUpperCase()))
}

function loopSymbolFirst() {
  return symbols.map(symbol => fetchSymbolFirst(symbol.toUpperCase()))
}

function startAll() {
  return Promise.all(loopSymbolAll())
}

function startFirst() {
  return Promise.all(loopSymbolFirst())
}

module.exports.startFirst = startFirst
module.exports.startAll = startAll

