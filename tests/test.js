const gtts = require('../dist/index').default
const path = require('path')

/*
 * save audio file
 */

const filepath = path.join(__dirname, 'i-love-you.mp3')

gtts.maxChars = 200

gtts.save(filepath, 'I love you')
  .then(() => {
    console.log(`save file: "${filepath}" done`)
  })

gtts.save(path.join(__dirname, 'reddit-test.mp3'), 'That camper is actually the single best photo the author could have used. It is a perfect depiction of the crazy alt-right. They are some of the lowest educated, and poorest. Yet, they’re the first ones to cry about government handouts, despite being some of the best candidates for it. Also, even though they think they don’t get “handouts,” I’d be willing to bet they get some sort of government benefit. It is actually sad to see people be so brainwashed, that they think taking some money from the government is bad, if they need it. If the government wants to give me free money, let em! I’ll be happy to take anything weighing their pockets down.')
  .then(() => {
    console.log('save file: "./reddit-test.mp3" done')
  })

/*
 * Create server listen port 8668
 * API:
 *  + ?text=your-text //read text in defaut language
 *  + ?text=bonjour&lang=fr //read text in specific language (by each request)
 */
// gtts.createServer(8668)
