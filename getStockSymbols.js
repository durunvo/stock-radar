const jsdom = require('jsdom')
const fs = require('fs')
const jquery = fs.readFileSync('jquery.js', 'utf-8')

jsdom.env({
  url: `http://marketdata.set.or.th/mkt/sectorquotation.do?sector=SET50&langauge=en&country=US`,
  src: [jquery],
  done: (err, window) => {
    if (err) {
      reject(err)
      return
    }
    const $ = window.$
    const items = []
    $('.table-info tbody tr td a').each(function(i) {
      if (i > 3) items.push($(this).text().trim())
    })
    saveToFile(items)
  }
})


function saveToFile(file) {
  fs.writeFile("SET50.json", JSON.stringify(file), function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
}