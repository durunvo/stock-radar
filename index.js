const jsdom = require('jsdom')
const fs = require('fs')
const Promise = require('promise')
const jquery = fs.readFileSync('jquery.js', 'utf-8')

function getFromUrl(url) {
  return new Promise((resolve, reject) => {
    jsdom.env({
      url,
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
              date: children.eq(0).text(),
              open: children.eq(1).text(),
              high: children.eq(2).text(),
              low: children.eq(3).text(),
              close: children.eq(4).text(),
              volume: children.eq(7).text(),
            })
            //$(this).children().each(function(k) {
            //  console.log(`index:${k} ======${$(this).text()}`)
            //})
          })
        })
        resolve(items)
      }
    })
  })
}

const promise1 = getFromUrl('http://www.set.or.th/set/historicaltrading.do?symbol=KTB&page=0&ssoPageId=2&language=th&country=TH')
const promise2 = getFromUrl('http://www.set.or.th/set/historicaltrading.do?symbol=KTB&page=1&ssoPageId=2&language=th&country=TH')
const promise3 = getFromUrl('http://www.set.or.th/set/historicaltrading.do?symbol=KTB&page=2&ssoPageId=2&language=th&country=TH')

Promise.all([promise1, promise2, promise3]).then(res => {
  console.log(JSON.stringify(Array.prototype.slice().concat(res[0], res[1], res[2])))
}, reason => {
  console.log(reason)
})

