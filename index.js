const jsdom = require('jsdom')
const fs = require('fs')
const Promise = require('promise')
const jquery = fs.readFileSync('jquery.js', 'utf-8')
const pages = [0,1,2]
const symbols = JSON.parse(fs.readFileSync('SET50.json', 'utf-8'))
//const symbols = JSON.parse(fs.readFileSync('SET100.json', 'utf-8'))
//const mongoUri = 'mongodb://localhost:27017/stock-radar-2'
const mongoUri = 'mongodb://localhost:27017/stock-radar'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Stock = mongoose.model('Stock', new Schema({
  symbol: String,
  date: Date,
  open: String,
  high: String,
  low: String,
  close: String,
  volume: String
}));

function formatDate(input) {
  // 29/01/2559
  const array = input.split('/').reverse()
  const thaiYear = parseInt(array[0]) - 543
  return new Date(`${thaiYear}-${array[1]}-${array[2]}`)
}

function saveToFile(name, data) {
  fs.writeFile(`${name}.json`, JSON.stringify(data), function(err) {
    if(err) {
      return console.log(err);
    }
    console.log(`save ${name}.json!`)
  })
}

function getFromUrl(symbol, page, first) {
  return new Promise((resolve, reject) => {
    const url = `http://www.set.or.th/set/historicaltrading.do?symbol=${symbol}&page=${page}&ssoPageId=2&language=th&country=TH`
    jsdom.env({
      url,
      src: [jquery],
      done: (err, window) => {
        if (err) {
          reject(err)
          return
        }
        console.log(`${url} => done`)
        const $ = window.$
        if (first) {
          const children = $('.table-info tbody tr').eq(0).children()
          const data = {
            symbol,
            date: formatDate(children.eq(0).text()),
            open: children.eq(1).text(),
            high: children.eq(2).text(),
            low: children.eq(3).text(),
            close: children.eq(4).text(),
            volume: children.eq(7).text(),
          }
          resolve(data)
        } else {
          const items = []
          $('.table-info tbody tr').each(function(i) {
            $(this).each(function(j) {
              const children = $(this).children()
              items.push({
                symbol,
                date: formatDate(children.eq(0).text()),
                open: children.eq(1).text(),
                high: children.eq(2).text(),
                low: children.eq(3).text(),
                close: children.eq(4).text(),
                volume: children.eq(7).text(),
              })
            })
          })
          resolve(items)
        }
      }
    })
  })
}

function getAll(symbol) {
  const array = pages.map(page => getFromUrl(symbol, page))
  return Promise.resolve(array)
}

function saveAll(items) {
  const array = items.map(item => saveToMongo(item))
  return Promise.resolve(array)
}

function fetchSymbolAll(symbol) {
  return getAll(symbol)
    .then(res => Promise.all(res))
    .then(res => Array.prototype.slice().concat.apply([], res))
    .then(res => saveAll(res))
    .then(res => Promise.all(res))

}

function saveToMongo(data) {
  return new Promise((resolve, reject) => {
    const stock = new Stock(data)
    stock.save(err => {
      if (err) return reject()
      console.log(`${data.symbol} save!!`)
      resolve()
    })
  })
}

function fetchSymbolFirst(symbol) {
  return getFromUrl(symbol, 0, true)
    .then(res => Promise.all(res))
    .then(res => saveToMongo(res))
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

mongoose.connect(mongoUri, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + mongoUri + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + mongoUri);
    startFirst().then(() => process.exit())
    //startAll().then(() => process.exit())
  }
});

