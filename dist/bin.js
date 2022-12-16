#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const path_1 = __importDefault(require("path"));
const args = process.argv.splice(2);
if (args[0] === "serve" || args[0] === "server") {
    const port = parseInt((_a = args[1]) !== null && _a !== void 0 ? _a : "8668");
    const lang = args[2];
    const gtts = new index_1.Text2Speech(lang);
    gtts.createServer(port);
}
else {
    const lang = args[0];
    const gtts = new index_1.Text2Speech(lang);
    const textParts = args.splice(1);
    const text = textParts.join(" ");
    const filename = text.replace(/' '/g, "-") + ".wav";
    const filepath = path_1.default.join(__dirname, filename);
    gtts.save(filepath, text)
        .then(() => {
        console.log(`${filepath} was saved!`);
    });
}
//# sourceMappingURL=bin.js.map