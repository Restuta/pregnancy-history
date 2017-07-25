import { log } from './utils/console-utils'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import slack from 'slack'
import {
  first,
  orderBy,
  flow,
  map,
  partialRight,
  get,
  flatMap,
  cloneDeep,
} from 'lodash'

const token = process.env.SLACK_TOKEN

log.debug(token)

// name to id
const channels = {
  pregnancy: 'C055MHVRJ'
}

const translate = phrase => {
  const phraseMap = {
    'кушает п': 'Eat R',
    'кушает л': 'Eat L',
    'проснулась': 'Woke up',
    'спит': 'Sleeps',
    'чек': 'Check',
  }

  return phraseMap[phrase.toLowerCase()] || phrase
}

// const replace = (phrase, map) => {
//
// }

const getPregnancyHistory = ({ count = 200 }) =>
  new Promise((resolve, reject) => {
    slack.channels.history(
      { token: token, channel: channels['pregnancy'], count: count },
      (err, data) => {
        if (err) {
          log.error(err)
          reject(err)
        }

        const results = flow(
          // split messages witn \n into multiple messages
          // partialRight(flatMap, msg => {
          //
          // }),
          partialRight(map, msg => {
            let date = moment.unix(first(msg.ts.split('.')))
            date.tz('America/Los_Angeles')
            
            let msgText = msg.text.trim()
            // extract hours and minuts from messages like Eat L 8-30
            const hoursRegex = /(\d+)[-:](\d+)/
            const matches = msgText.match(hoursRegex)

            if (matches && matches.length === 3) {
              const origDate = date.clone()

              const hour = get(matches, '[1]')
              const minutes = get(matches, '[2]')
              const amPm = origDate.format('a')
              const hoursIn24hFormat = moment(`${hour} ${amPm}`, [
                'h a'
              ]).format('HH')

              date.hours(hoursIn24hFormat).minutes(minutes)
              msgText = msgText.replace(hoursRegex, '')
              // msgText += ' (corrected from ' + origDate.format('hh:mma') + ')'
            }

            return {
              date: date.format('MMMM DD YYYY, hh:mma'),
              day: date.format('MMMM DD YYYY'),
              time: date.format('hh:mma'),
              ts: msg.ts,
              text: translate(msgText)
            }
          }),
          partialRight(orderBy, ['ts'], ['asc'])
        )(data.messages)

        resolve(results)
      }
    )
  })

// getPregnancyHistory({ count: 300 }).then(x => {
//   log.json(x)
//   log.debug(x.length)
//   return x
// })

export default getPregnancyHistory
