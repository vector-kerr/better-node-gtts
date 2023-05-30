const path = require('path')
const fs = require('fs')
require('jest')
const axios = require('axios')
const { Text2Speech } = require('../src/index')
const {Server} = require('http')

describe('Text2Speech', () => {
  describe('save operations', () => {
    const testFilePath = path.join(__dirname, 'test-output.mp3')
    beforeEach(() => {
      try {
        fs.unlinkSync(testFilePath)
      } catch (e) {
        // ignore
      }
    })
    afterEach(() => {
      try {
        fs.unlinkSync(testFilePath)
      } catch (e) {
        // ignore
      }
    })
    it('can save a file', async () => {
      const tts = new Text2Speech({ lang: 'en', debug: false, maxChars: 200 })
      const message = 'I love you'
      await tts.save(testFilePath, message)
      expect(fs.existsSync(testFilePath))
    })
    it('can handle long messages', async () => {
      const tts = new Text2Speech({ lang: 'en', debug: false, maxChars: 200 })
      const message = 'That camper is actually the single best photo the author could have used. It is a perfect depiction of the crazy alt-right. They are some of the lowest educated, and poorest. Yet, they’re the first ones to cry about government handouts, despite being some of the best candidates for it. Also, even though they think they don’t get “handouts,” I’d be willing to bet they get some sort of government benefit. It is actually sad to see people be so brainwashed, that they think taking some money from the government is bad, if they need it. If the government wants to give me free money, let em! I’ll be happy to take anything weighing their pockets down.'
      await tts.save(testFilePath, message)
      expect(fs.existsSync(testFilePath))
    }, 10000) /* 10 second timeout as synthesizing long message can take some time */
  })
  describe('web server operations', () => {
    let tts: typeof Text2Speech | null = null
    beforeAll(async () => {
      tts = new Text2Speech({ lang: 'en' })
      await tts.createServer(8000)
    })
    afterAll(async () => {
      await tts.closeServer(true)
    })
    it('can service a web request', async () => {
      const response = await axios.get('http://localhost:8000/?text=hello+world')
      expect(response.status).toEqual(200)
    })
    it('can service a web request using a different language', async () => {
      const response = await axios.get('http://localhost:8000/?text=bonjour+pour+la+monde')
      expect(response.status).toEqual(200)
    })
  })
})
