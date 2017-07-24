import { log } from './utils/console-utils'
import Promise from 'bluebird'
import moment from 'moment'
import slack from 'slack'
import { first, orderBy, flow, map, partialRight } from 'lodash'

const token = process.env.SLACK_TOKEN

log.debug(token)

// name to id
const channels = {
  pregnancy: 'C055MHVRJ'
}

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
          partialRight(map, msg => {
            const date = moment.unix(first(msg.ts.split('.')))
            // const relativeTs = last(msg.ts.split('.'))

            return {
              date: date.format('MMMM DD YYYY, MM:HHa'),
              day: date.format('MMMM DD YYYY'),
              ts: msg.ts,
              message: msg.text
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
