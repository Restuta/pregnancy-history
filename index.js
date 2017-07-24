/* eslint-disable*/
//eslint is disabled to preserve babel config formatting that is easier to copy-paste from .babelrc

const dotenv = require('dotenv')
dotenv.config()

require('babel-register')({
  //see https://babeljs.io/docs/usage/options/#options for more config options
  babelrc: true,
  // presets: [
  //   [
  //     'env',
  //     {
  //       targets: {
  //         node: 'current'
  //       }
  //     }
  //   ],
  //   'stage-2',
  // ]
})
require('./lib/index')
