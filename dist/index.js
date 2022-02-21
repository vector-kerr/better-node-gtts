"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text2Speech = void 0;
const request_1 = __importDefault(require("request"));
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const fs_1 = __importDefault(require("fs"));
const multistream_1 = __importDefault(require("multistream"));
const fake_useragent_1 = __importDefault(require("fake-useragent"));
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const GOOGLE_TTS_URL = 'http://translate.google.com/translate_tts';
const DEFAULT_MAX_CHARS = 200;
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
};
class Text2Speech {
    constructor(_lang, _debug) {
        this.lang = _lang || 'en';
        this.debug = _debug || false;
        this.lang = this.lang.toLowerCase();
        this.maxChars = DEFAULT_MAX_CHARS;
        this.getArgs = this.getArgsFactory(this.lang);
        if (!LANGUAGES[this.lang]) {
            throw new Error('Language not supported: ' + this.lang);
        }
    }
    save(filepath, text) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const textParts = this.tokenize(text);
                const total = textParts.length;
                for (const part of textParts) {
                    const index = textParts.indexOf(part);
                    const headers = this.getHeader();
                    const args = this.getArgs(part, index, total);
                    const fullUrl = GOOGLE_TTS_URL + args;
                    const writeStream = fs_1.default.createWriteStream(filepath, {
                        flags: index > 0 ? 'a' : 'w'
                    });
                    (0, request_1.default)({
                        uri: fullUrl,
                        headers: headers,
                        method: 'GET'
                    })
                        .pipe(writeStream);
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                }
            });
        });
    }
    stream(text) {
        const textParts = this.tokenize(text);
        const total = textParts.length;
        return (0, multistream_1.default)(textParts.map(function (part, index) {
            const headers = this.getHeader();
            const args = this.getArgs(part, index, total);
            const fullUrl = GOOGLE_TTS_URL + args;
            return (0, request_1.default)({
                uri: fullUrl,
                headers: headers,
                method: 'GET'
            });
        }));
    }
    getHeader() {
        const headers = {
            'User-Agent': (0, fake_useragent_1.default)()
        };
        if (this.debug) {
            console.log(headers);
        }
        return headers;
    }
    getArgsFactory(lang) {
        return (text, index, total) => {
            const textlen = text.length;
            const encodedText = encodeURIComponent(text);
            const language = lang || 'en';
            return `?ie=UTF-8&tl=${language}&q=${encodedText}&total=${total}&idx=${index}&client=tw-ob&textlen=${textlen}`;
        };
    }
    tokenize(text) {
        if (!text) {
            throw new Error('No text to speak');
        }
        const punc = '¡!()[]¿?.,;:—«»\n ';
        const puncList = punc.split('').map(function (char) {
            return (0, escape_string_regexp_1.default)(char);
        });
        const pattern = puncList.join('|');
        let parts = text.split(new RegExp(pattern));
        parts = parts.filter(p => p.length > 0);
        const output = [];
        let i = 0;
        for (const p of parts) {
            if (!output[i]) {
                output[i] = '';
            }
            if (output[i].length + p.length < this.maxChars) {
                output[i] += ' ' + p;
            }
            else {
                i++;
                output[i] = p;
            }
        }
        output[0] = output[0].substr(1);
        return output;
    }
    createServer(port) {
        const server = http_1.default.createServer(function (req, res) {
            const queryData = new url_1.default.URL(req.url).searchParams;
            let argsCallback = this.getArgs;
            if (queryData && queryData.get('lang') && LANGUAGES[queryData.get('lang')]) {
                argsCallback = this.getArgsFactory(queryData.get('lang'));
            }
            if (queryData && queryData.get('text')) {
                res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
                this.stream(argsCallback, queryData.get('text')).pipe(res);
            }
            else {
                console.log(req.headers);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    code: -1,
                    message: `Missing text. Please try: ${req.headers.host}?text=your+text`
                }));
            }
        });
        server.listen(port);
        console.log('Text-to-Speech Server running on ' + port);
    }
}
exports.Text2Speech = Text2Speech;
exports.default = new Text2Speech();
//# sourceMappingURL=index.js.map