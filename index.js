const jsdom = require('jsdom')
const fs = require('fs')
const Promise = require('promise')
const jquery = fs.readFileSync('jquery.js', 'utf-8')
const pages = [1, 2, 3]
const symbols = JSON.parse(fs.readFileSync('SET50.json', 'utf-8'))

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

function getFromUrl(symbol, page) {
  return new Promise((resolve, reject) => {
    jsdom.env({
      url: `http://www.set.or.th/set/historicaltrading.do?symbol=${symbol}&page=${page}&ssoPageId=2&language=th&country=TH`,
      src: [jquery],
      done: (err, window) => {
        if (err) {
          reject(err)
          return
        }
        const $ = window.$
        const items = []
        $('.table-info tbody tr').each(function(i) {
          $(this).each(function(j) {
            const children = $(this).children()
            items.push({
              symbol,
              date: new Date(children.eq(0).text().replaceAll('/','-')),
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
    })
  })
}

function getAll(symbol) {
  const array = pages.map(page => getFromUrl(symbol, page))
  return Promise.resolve(array)
}

function fetchSymbol(symbol) {
  return getAll(symbol)
    .then(res => Promise.all(res))
    .then(res => Array.prototype.slice().concat.apply([], res))
    .then(res => {
      saveToFile(symbol, res)
      return Promise.resolve()
    })
}

function loopSymbol() {
  return symbols.map(symbol => fetchSymbol(symbol.toUpperCase()))
}

function start() {
  return Promise.all(loopSymbol())
}

//start()

console.log(formatDate('29/01/2559'))
