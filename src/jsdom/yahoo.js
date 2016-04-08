var jsdom = require('jsdom');
var fs = require('fs');
var jquery = fs.readFileSync('jquery.js', 'utf-8')
var symbol = 'KTB.BK'

jsdom.env({
  url: `http://finance.yahoo.com/q/hp?&a=00&b=1&c=2010&d=03&e=4&f=2016&g=d&s=${symbol}&z=50&y=50`,
  src: [jquery],
  done: (err, window) => {
    var $ = window.$;
    var json = []
    $('.yfnc_datamodoutline1 table tbody')
      .children()
      .each(function(index) {
        if (index === 0) return
        if (!$(this).children().eq(1).text()) return
        var data = {
          date: $(this).children().eq(0).text(),
          open: $(this).children().eq(1).text(),
          high: $(this).children().eq(2).text(),
          low: $(this).children().eq(3).text(),
          close: $(this).children().eq(4).text(),
          volume: $(this).children().eq(5).text(),
        }
        json.push(data)
      }
    );
    saveToFile(symbol, json)
  }
})

function saveToFile(name, data) {
  fs.writeFile(`${name}.json`, JSON.stringify(data), function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
}