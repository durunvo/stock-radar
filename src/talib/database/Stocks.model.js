'use strict'

const mongoose = require('mongoose')

const Schema = mongoose.Schema
const Stock = mongoose.model('Stock', new Schema({
  s: String,
  t: Number,
  o: Number,
  h: Number,
  l: Number,
  c: Number,
  v: Number
}));

function saveToMongo(data) {
  return new Promise((resolve, reject) => {
    const stock = new Stock(data)
    stock.save(err => {
      if (err) return reject()
      resolve()
    })
  })
}

function findOneAndUpdate(data) {
  const query = {
    s: data.s,
    t: data.t
  }
  return new Promise((resolve, reject) => {
    Stock.findOneAndUpdate(query, data, { upsert: true }, (err, doc) => {
      if (err) return console.log(err)
      return resolve()
    });
  })
}

function dropFetchIfExist(symbol) {
  return new Promise(resolve => {
    Stock.findOne({ s: symbol }).exec((err, stock) => {
      if (err) return console.log(symbol, 'error')
      if (!stock) {
        resolve()
      }
    })
  })
}

function getSymbolFromMongo(symbol, time) {
  return new Promise(resolve => {
    const query = {
      s: symbol
    }
    if (time) query.t = time

    Stock.
      find(query).
      sort('-t').
      exec((err, stock) => {
        if (err) return console.log(symbol, 'error')
        resolve(stock)
      })
  })
}

module.exports.saveToMongo = saveToMongo
module.exports.getSymbolFromMongo = getSymbolFromMongo
module.exports.dropFetchIfExist = dropFetchIfExist
module.exports.findOneAndUpdate = findOneAndUpdate