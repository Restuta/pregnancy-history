import { log } from './utils/console-utils'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import slack from 'slack'
import { first, orderBy, flow, map, partialRight, get, flatMap, cloneDeep, values, } from 'lodash'

const token = process.env.SLACK_TOKEN

// name to id
const channels = {
  pregnancy: 'C055MHVRJ'
}

const translate = phrase => {
  const phraseMap = {
    'кушает п': 'Eat R',
    'кушает л': 'Eat L',
    'кушает п (чек)': 'Eat R (Check)',
    'кушает л (чек)': 'Eat L (Check)',
    'кушает л + п': 'Eat L + R',
    'кушает п + л': 'Eat R + L',
    'сцедила л': 'Pump L',
    'cцедила п': 'Pump R',
    'докормила л': 'More Eat L',
    'докормила п': 'More Eat R',
    'докармливаю л': 'More Eat L',
    'докармливаю п': 'More Eat R',
    'грудь п': 'Eat R',
    проснулась: 'Woke up',
    спит: 'Sleep',
    чек: 'Check',
    купались: 'Bath'
  }

  const translated = phraseMap[phrase.trim().toLowerCase()]

  if (!translated && !values(phraseMap).find(x => x === phrase)) {
    // log.debug(`"${phrase}"`)
  }

  return translated || phrase
}

const splitMessageIntoMultiple = msg => {
  const messageTexts = msg.text.includes('\n')
    ? msg.text.split('\n')
      .map(x => x.trim())
      .filter(x => x)
    : [msg.text]

  // create a copy of the slack message for every new text message afte split
  return messageTexts.map(text => ({
    ...cloneDeep(msg),
    text: text
  }))
}

const fixMispellings = msg => {
  return {
    ...cloneDeep(msg),
    text: msg.text
      .replace('В 5-40', 'Woke up 5-40')
      .replace('Кушаеет', 'Кушает')
      .replace('Поснулась', 'Проснулась')
  }
}

const fixupMessageDateAndTme = msg => {
  let date = moment.unix(first(msg.ts.split('.')))
  date.tz('America/Los_Angeles')

  let msgText = msg.text.trim()
  // extract hours and minuts from messages like Eat L 8-30
  const hoursRegex = /\s(\d\d?)[-:]?(\d\d?)/
  const matches = msgText.match(hoursRegex)

  if (matches && matches.length >= 2) {
    const origDate = date.clone()

    const hour = get(matches, '[1]')

    if (hour && hour <= 12) {
      const minutes = get(matches, '[2]') || 0
      const amPm = origDate.format('a')
      const hoursIn24hFormat = moment(`${hour} ${amPm}`, ['h a']).format('HH')

      date.hours(hoursIn24hFormat).minutes(minutes)
      msgText = msgText.replace(hoursRegex, '')


      if (msg.text.includes('Avocado')) {
        log.debug(hour)
        log.debug(minutes)
        log.debug(hoursIn24hFormat)
        log.json(msg)
        log.json(date.format('MMMM DD YYYY, hh:mma'))
        log.json(matches)
      }
    }
  }

  return {
    date: date.format('MMMM DD YYYY, hh:mma'),
    day: date.format('MMMM DD YYYY'),
    time: date.format('hh:mma'),
    ts: msg.ts,
    text: translate(
      msgText.trim()
        .replace(' с', '')
        .replace(' в', '')
    )
      .replace('Кушает П', 'Eat R')
      .replace('Кушает', 'Eat')
      .replace('Баночка', 'Bottle')
      .replace('Пюре', 'Puree')
      .replace('Водичка', 'Water')
      .replace('Проснулась', 'Wake Up')
      .replace('Спит', 'Sleep')
  }
}

const getPregnancyHistory = ({ count = 100 }) =>
  new Promise((resolve, reject) => {
    slack.channels.history({ token: token, channel: channels['pregnancy'], count: count }, (err, data) => {
      if (err) {
        log.error(err)
        reject(err)
      }

      const results = flow(
        partialRight(map, fixMispellings),
        partialRight(flatMap, splitMessageIntoMultiple),
        partialRight(map, fixupMessageDateAndTme),
        partialRight(orderBy, ['ts'], ['asc'])
      )(data.messages)

      resolve(results)
    })
  })

// getPregnancyHistory({ count: 300 }).then(x => {
//   log.json(x)
//   log.debug(x.length)
//   return x
// })

export default getPregnancyHistory
