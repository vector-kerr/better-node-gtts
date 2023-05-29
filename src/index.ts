import axios from "axios";
import fs from "fs";
import MultiStream, { LazyStream } from "multistream";
import http from "http";

import { escapeStringRegexp } from "./vendored/escapeStringRegexp";
import { LANGUAGES } from "./languages";

const GOOGLE_TTS_URL = "http://translate.google.com/translate_tts";
const DEFAULT_MAX_CHARS = 100;
const DEFAULT_LANG = "en";

interface Options {
  lang?: string;
  debug?: boolean;
  maxChars?: number;
  throwOnUnsupportedLanguage?: boolean;
}

export class Text2Speech {
  lang: string;
  debug: boolean;
  maxChars: number;
  throwOnUnsupportedLanguage: boolean;
  getArgs: (text: string, index: number, total: number) => string;

  /**
   * Create a new Text2Speech instance.
   * This constructor offers two signatures - one for compatibility and one modern.
   * @param {Options} opts Text2Speech options
   * @param {string} opts.lang The two-letter code for the language to use (default=en)
   * @param {boolean} opts.debug Enable debugging (default=false)
   * @param {number} opts.maxChars The maximum number of characters supported in a single message (default=100)
   * @param {boolean} opts.throwOnUnsupportedLanguage Throw an exception if the supplied language is unsupported (default=true)
   * @param {string} lang The two-letter code for the language to use (default=en)
   * @param {boolean} debug Enable debugging (default=false)
   *
   * @example
   * const tts = new Text2Speech({lang: 'en', debug: false, maxChars: 50})
   * 
   * @example
   * const tts = new Text2Speech("en", false)
   */
  constructor() {
    if (typeof arguments[0] === "object") {
      const opts: Options = arguments[0] as Options;
      this.lang = opts.lang ?? DEFAULT_LANG;
      this.debug = opts.debug ?? false;
      this.maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;
      this.throwOnUnsupportedLanguage = opts.throwOnUnsupportedLanguage ?? true;
    } else {
      this.lang = arguments[0] ?? DEFAULT_LANG;
      this.debug = arguments[1] ?? false;
      this.maxChars = DEFAULT_MAX_CHARS;
    }

    this.lang = this.lang.toLowerCase();
    this.getArgs = this.getArgsFactory(this.lang);

    if (LANGUAGES[this.lang] === undefined) {
      if (this.throwOnUnsupportedLanguage) {
        throw new Error("Language not supported: " + this.lang);
      } else {
        console.warn("Language not supported: " + this.lang);
      }
    }
  }

  async save(filepath: string, text: string) {
    const textParts = this.tokenize(text);
    const total = textParts.length;
    for (const part of textParts) {
      const index = textParts.indexOf(part);
      const headers = this.getHeader();
      const args = this.getArgs(part, index, total);
      const fullUrl = GOOGLE_TTS_URL + args;

      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(filepath, {
          flags: index > 0 ? "a" : "w",
        });
        axios({
          url: fullUrl,
          headers,
          method: "GET",
          responseType: "stream",
        }).then((response) => {
          response.data.pipe(writeStream);
        });
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
    }
  }

  async stream(text: string) {
    const textParts = this.tokenize(text);
    const total = textParts.length;

    const streams = (await Promise.all(
      textParts.map((part, index) => {
        return new Promise((resolve) => {
          const headers = this.getHeader();
          const args = this.getArgs(part, index, total);
          const fullUrl = GOOGLE_TTS_URL + args;

          axios({
            url: fullUrl,
            headers,
            method: "GET",
            responseType: "stream",
          }).then((response) => {
            resolve(response.data);
          });
        });
      })
    )) as LazyStream[];

    return new MultiStream(streams);
  }

  getHeader() {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/536.26.17 (KHTML like Gecko) Version/6.0.2 Safari/536.26.17",
    };

    if (this.debug) console.log(headers);
    return headers;
  }

  getArgsFactory(lang: string) {
    return (text: string, index: number, total: number) => {
      const textlen = text.length;
      const encodedText = encodeURIComponent(text);
      const language = lang ?? "en";
      return `?ie=UTF-8&tl=${language}&q=${encodedText}&total=${total}&idx=${index}&client=tw-ob&textlen=${textlen}`;
    };
  }

  tokenize(text: string) {
    if (text === "") throw new Error("No text to speak");

    const punc = "¡!()[]¿?.,;:—«»\n";
    const puncList = punc.split("").map(function (char) {
      return escapeStringRegexp(char);
    });

    const pattern = puncList.join("|");
    let parts = text.split(new RegExp(pattern));
    parts = parts.filter((p) => p.length > 0);

    let output = [];

    output = parts;
    // TODO: Split parts if they are longer than maxChars
    // let i = 0
    // for (const p of parts) {
    //   if (!output[i]) {
    //     output[i] = ''
    //   }
    //   if (output[i].length + p.length < this.maxChars) {
    //     output[i] += ' ' + p
    //   } else {
    //     i++
    //     output[i] = p
    //   }
    // }
    // output[0] = output[0].substr(1)

    return output;
  }

  createServer(port: number) {
    const server = http.createServer(async (req, res) => {
      if (req.url === undefined) throw new Error("???"); // TODO: Investigate
      const queryData = new URL(req.url).searchParams;
      // const lang = queryData.get('lang')
      const text = queryData.get("text");

      if (typeof text === "string") {
        res.writeHead(200, { "Content-Type": "audio/mpeg" });
        (await this.stream(text)).pipe(res);
      } else {
        console.log(req.headers);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: -1,
            message: `Missing text. Please try: ${req.headers.host}?text=your+text`,
          })
        );
      }
    });

    server.listen(port);
    console.log("Text-to-Speech Server running on " + port);
  }
}

export default new Text2Speech();
