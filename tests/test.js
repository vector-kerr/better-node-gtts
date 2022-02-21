const gtts = require('../dist/index').default
const path = require('path')

/*
 * save audio file
 */

const filepath = path.join(__dirname, 'i-love-you.mp4')

gtts.save(filepath, 'I love you')
  .then(() => {
    console.log(`save file: "${filepath}" done`)
  })

/*
 * Create server listen port 8668
 * API:
 *  + ?text=your-text //read text in defaut language
 *  + ?text=bonjour&lang=fr //read text in specific language (by each request)
 */
gtts.createServer(8668)
