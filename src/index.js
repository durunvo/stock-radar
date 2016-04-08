'use strict'

global.cutLoss = 10
global.suddenDrop = 5
global.startingBalance = 10000
global.startTime = new Date("2016-04-01").getTime()
global.endTime = new Date().getTime()
global.mapAlgorithm = {
  1:'RSI B70 S30',
  2:'RSI B30 S70',
  3:'EMA 25 50',
  4:'EMA 10 25',
  5:'MACD'
}

const mongoose = require('mongoose')
const mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/set-stock'
const express = require('express');
const app = express();
const talib = require('./talib/talibIndex')
const jsdom = require('./jsdom/index')


app.set('views', __dirname + '/talib/views')
app.set('view engine', 'jade')
app.use(express.static(__dirname + '/talib/public'))

app.get('/', (req, res) => {
  const algo = req.query.algo || '1'
  talib.calculate(algo).then(result => {
    res.render('index', { algo: global.mapAlgorithm[algo], result });
  })
});

app.get('/update', (req, res) => {
  talib.update().then(result => {
    res.send(result);
  })
});

mongoose.connect(mongoUri, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + mongoUri + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + mongoUri);
    app.listen(3000, function () {
      console.log('Example app listening on port 3000!');
    });
  }
});