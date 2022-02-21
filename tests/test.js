const gtts = require('../dist/index').default
const path = require('path')

/*
 * save audio file
 */

const filepath = path.join(__dirname, 'i-love-you.mp3')

gtts.save(filepath, 'I love you')
  .then(() => {
    console.log(`save file: "${filepath}" done`)
  })

gtts.save(path.join(__dirname, 'lorem-ipsum.mp3'), 'I love you so much. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.')
  .then(() => {
    console.log('save file: "./lorem-ipsum.mp3" done')
  })

/*
 * Create server listen port 8668
 * API:
 *  + ?text=your-text //read text in defaut language
 *  + ?text=bonjour&lang=fr //read text in specific language (by each request)
 */
gtts.createServer(8668)
