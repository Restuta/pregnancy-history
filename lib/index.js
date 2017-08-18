import 'babel-polyfill'
const dotenv = require('dotenv')
dotenv.config()

import { log } from './utils/console-utils'
import getPregnancyHistory from './get-pregnancy-history'
// import Promise from 'bluebird'
// import moment from 'moment'

import { groupBy } from 'lodash'

import express from 'express'
import pkg from '../package.json'


const app = express()

app.set('view engine', 'pug')

app.get('/', function(req, res) {
  getPregnancyHistory({count: 900})
    .then(messages => {

      const groupedMessages = groupBy(messages, 'day')
      // log.json(groupedMessages)

      res.render('index', {
        title: 'Mo\'s history',
        header: 'Mo\'s history',
        subHeader: 'v' + pkg.version,
        messages: messages,
        groupedMessages: groupedMessages
      })
    })

})

const port = process.env.PORT || 3000

app.listen(port, function() {
  log.info(`Example app listening on port ${port}!`)
})
