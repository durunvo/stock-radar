'use strict'

const cheerio = require('cheerio')
const fetch = require('node-fetch')
const symbol = 'KTB'

fetch(`http://finance.yahoo.com/q/hp?s=${symbol.toUpperCase()}.BK`)
  .then(res => res.text())
  .then(body => {
    const $ = cheerio.load(body)
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
        console.log(data)
        json.push(data)
      });
  })