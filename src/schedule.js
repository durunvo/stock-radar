'use strict'

const schedule = require('./jsdom/index')
const mongoose = require('mongoose')
const mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/test'

mongoose.connect(mongoUri, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + mongoUri + '. ' + err);
    mongoose.disconnect()
    process.exit()
  } else {
    console.log ('Succeeded connected to: ' + mongoUri);
    schedule.startFirst().then(() => {
      mongoose.disconnect()
      process.exit()
    })
  }
});
