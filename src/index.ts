import request from 'request'
import escapeStringRegexp from 'escape-string-regexp'
import fs from 'fs'
import MultiStream from 'multistream'
import fakeUa from 'fake-useragent'
import http from 'http'
import url from 'url'

const GOOGLE_TTS_URL = 'http://translate.google.com/translate_tts'
const DEFAULT_MAX_CHARS = 200
const LANGUAGES = {
  af: 'Afrikaans',
  sq: 'Albanian',
  ar: 'Arabic',
  hy: 'Armenian',
  ca: 'Catalan',
  zh: 'Chinese',
  'zh-cn': 'Chinese (Mandarin/China)',
  'zh-tw': 'Chinese (Mandarin/Taiwan)',
  'zh-yue': 'Chinese (Cantonese)',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  en: 'English',
  'en-au': 'English (Australia)',
  'en-uk': 'English (United Kingdom)',
  'en-us': 'English (United States)',
  eo: 'Esperanto',
  fi: 'Finnish',
  fr: 'French',
  de: 'German',
  el: 'Greek',
  ht: 'Haitian Creole',
  hi: 'Hindi',
  hu: 'Hungarian',
  is: 'Icelandic',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  la: 'Latin',
  lv: 'Latvian',
  mk: 'Macedonian',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  'pt-br': 'Portuguese (Brazil)',
  ro: 'Romanian',
  ru: 'Russian',
  sr: 'Serbian',
  sk: 'Slovak',
  es: 'Spanish',
  'es-es': 'Spanish (Spain)',
  'es-us': 'Spanish (United States)',
  sw: 'Swahili',
  sv: 'Swedish',
  ta: 'Tamil',
  th: 'Thai',
  tr: 'Turkish',
  vi: 'Vietnamese',
  cy: 'Welsh'
}

export class Text2Speech {
  lang: string
  debug: boolean
  maxChars: number
  getArgs: (text: string, index: any, total: any) => string

  constructor (_lang?: string, _debug?: boolean) {
    this.lang = _lang || 'en'
    this.debug = _debug || false
    this.lang = this.lang.toLowerCase()
    this.maxChars = DEFAULT_MAX_CHARS
    this.getArgs = this.getArgsFactory(this.lang)

    if (!LANGUAGES[this.lang]) { throw new Error('Language not supported: ' + this.lang) }
  }

  async save (filepath, text) {
    return new Promise((resolve, reject) => {
      const textParts = this.tokenize(text)
      const total = textParts.length
      for (const part of textParts) {
        const index = textParts.indexOf(part)
        const headers = this.getHeader()
        const args = this.getArgs(part, index, total)
        const fullUrl = GOOGLE_TTS_URL + args

        const writeStream = fs.createWriteStream(filepath, {
          flags: index > 0 ? 'a' : 'w'
        })
        request({
          uri: fullUrl,
          headers: headers,
          method: 'GET'
        })
          .pipe(writeStream)
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
      }
    })
  }

  stream (text) {
    const textParts = this.tokenize(text)
    const total = textParts.length

    return MultiStream(textParts.map(function (part, index) {
      const headers = this.getHeader()
      const args = this.getArgs(part, index, total)
      const fullUrl = GOOGLE_TTS_URL + args

      return request({
        uri: fullUrl,
        headers: headers,
        method: 'GET'
      })
    }))
  }

  getHeader () {
    const headers = {
      'User-Agent': fakeUa()
    }

    if (this.debug) { console.log(headers) }

    return headers
  }

  getArgsFactory (lang: string) {
    return (text, index, total) => {
      const textlen = text.length
      const encodedText = encodeURIComponent(text)
      const language = lang || 'en'
      return `?ie=UTF-8&tl=${language}&q=${encodedText}&total=${total}&idx=${index}&client=tw-ob&textlen=${textlen}`
    }
  }

  tokenize (text) {
    if (!text) { throw new Error('No text to speak') }

    const punc = '¡!()[]¿?.,;:—«»\n '
    const puncList = punc.split('').map(function (char) {
      return escapeStringRegexp(char)
    })

    const pattern = puncList.join('|')
    let parts = text.split(new RegExp(pattern))
    parts = parts.filter(p => p.length > 0)

    const output = []
    let i = 0
    for (const p of parts) {
      if (!output[i]) {
        output[i] = ''
      }
      if (output[i].length + p.length < this.maxChars) {
        output[i] += ' ' + p
      } else {
        i++
        output[i] = p
      }
    }
    output[0] = output[0].substr(1)
    return output
  }

  createServer (port) {
    const server = http.createServer(function (req, res) {
      const queryData = new url.URL(req.url).searchParams
      let argsCallback = this.getArgs

      if (queryData && queryData.get('lang') && LANGUAGES[queryData.get('lang')]) {
        argsCallback = this.getArgsFactory(queryData.get('lang'))
      }
      if (queryData && queryData.get('text')) {
        res.writeHead(200, { 'Content-Type': 'audio/mpeg' })
        this.stream(argsCallback, queryData.get('text')).pipe(res)
      } else {
        console.log(req.headers)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          code: -1,
          message: `Missing text. Please try: ${req.headers.host}?text=your+text`
        }))
      }
    })

    server.listen(port)
    console.log('Text-to-Speech Server running on ' + port)
  }
}

export default new Text2Speech()
