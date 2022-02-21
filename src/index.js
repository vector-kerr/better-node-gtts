const request = require('request');
const escapeStringRegexp = require('escape-string-regexp');
const async = require('async');
const fs = require('fs');
const MultiStream = require('multistream');
const fakeUa = require('fake-useragent');

const GOOGLE_TTS_URL = 'http://translate.google.com/translate_tts';
const DEFAULT_MAX_CHARS = 200;
const LANGUAGES = {
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'ar': 'Arabic',
  'hy': 'Armenian',
  'ca': 'Catalan',
  'zh': 'Chinese',
  'zh-cn': 'Chinese (Mandarin/China)',
  'zh-tw': 'Chinese (Mandarin/Taiwan)',
  'zh-yue': 'Chinese (Cantonese)',
  'hr': 'Croatian',
  'cs': 'Czech',
  'da': 'Danish',
  'nl': 'Dutch',
  'en': 'English',
  'en-au': 'English (Australia)',
  'en-uk': 'English (United Kingdom)',
  'en-us': 'English (United States)',
  'eo': 'Esperanto',
  'fi': 'Finnish',
  'fr': 'French',
  'de': 'German',
  'el': 'Greek',
  'ht': 'Haitian Creole',
  'hi': 'Hindi',
  'hu': 'Hungarian',
  'is': 'Icelandic',
  'id': 'Indonesian',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'la': 'Latin',
  'lv': 'Latvian',
  'mk': 'Macedonian',
  'no': 'Norwegian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'pt-br': 'Portuguese (Brazil)',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sr': 'Serbian',
  'sk': 'Slovak',
  'es': 'Spanish',
  'es-es': 'Spanish (Spain)',
  'es-us': 'Spanish (United States)',
  'sw': 'Swahili',
  'sv': 'Swedish',
  'ta': 'Tamil',
  'th': 'Thai',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'cy': 'Welsh'
}


class Text2Speech {
  constructor(_lang, _debug) {
    this.lang = _lang || 'en'
    this.debug = _debug || false
    this.lang = this.lang.toLowerCase()
    this.max_chars = DEFAULT_MAX_CHARS

    if (!LANGUAGES[this.lang])
      throw new Error('Language not supported: ' + lang)
    
    this.getArgs = this.getArgsFactory(this.lang)
  }

  save(getArgs, filepath, text, callback) {
    var text_parts = tokenize(text);
    var total = text_parts.length;
    async.eachSeries(text_parts, function(part, cb) {
      var index = text_parts.indexOf(part);
      var headers = getHeader();
      var args = getArgs(part, index, total);
      var fullUrl = GOOGLE_TTS_URL + args;
  
      var writeStream = fs.createWriteStream(filepath, {
        flags: index > 0 ? 'a' : 'w'
      });
      request({
          uri: fullUrl,
          headers: headers,
          method: 'GET'
        })
        .pipe(writeStream);
      writeStream.on('finish', cb);
      writeStream.on('error', cb);
    }, callback);
  }
  
  stream(getArgs, text) {
    var text_parts = tokenize(text);
    var total = text_parts.length;
  
    return MultiStream(text_parts.map(function(part, index) {
      var headers = getHeader();
      var args = getArgs(part, index, total);
      var fullUrl = GOOGLE_TTS_URL + args
  
      return request({
        uri: fullUrl,
        headers: headers,
        method: 'GET'
      });
    }));
  }
  
  getHeader() {
    var headers = {
      "User-Agent": fakeUa()
    };

    if(this._debug)
      console.log(headers)

    return headers;
  }
  
  getArgsFactory(lang){
    return function (text, index, total) {
      var textlen = text.length;
      var encodedText = encodeURIComponent(text);
      var language = lang || 'en';
      return `?ie=UTF-8&tl=${language}&q=${encodedText}&total=${total}&idx=${index}&client=tw-ob&textlen=${textlen}`
    }
  }
  
  tokenize(text) {
    var text_parts = [];
    if (!text)
      throw new Error('No text to speak');
  
    var punc = '¡!()[]¿?.,;:—«»\n ';
    var punc_list = punc.split('').map(function(char) {
      return escapeStringRegexp(char);
    });
  
    var pattern = punc_list.join('|');
    var parts = text.split(new RegExp(pattern));
    parts = parts.filter(p => p.length > 0);
  
    var output = [];
    var i = 0;
    for (let p of parts) {
      if (!output[i]) {
        output[i] = '';
      }
      if (output[i].length + p.length < MAX_CHARS) {
        output[i] += ' ' + p;
      } else {
        i++;
        output[i] = p;
      }
    }
    output[0] = output[0].substr(1);
    return output;
  }
  
  createServer(getArgs, port) {
    var http = require("http");
    var url = require('url');
  
    var server = http.createServer(function(req, res) {
      var queryData = url.parse(req.url, true).query;
      var argsCallback = getArgs;
      if (queryData && queryData.lang && LANGUAGES[queryData.lang]) {
        argsCallback = getArgsFactory(queryData.lang);
      }
      if (queryData && queryData.text) {
        res.writeHead(200, {'Content-Type': 'audio/mpeg'});
        stream(argsCallback, queryData.text).pipe(res);
      } else {
        console.log(req.headers);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
          code: -1,
          message: `Missing text. Please try: ${req.headers.host}?text=your+text`
        }))
      }
    });
  
    server.listen(port);
    console.log("Text-to-Speech Server running on " + port);
  }  
}

module.exports = Text2Speech;
