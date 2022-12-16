#!/usr/bin/env node

import { Text2Speech } from "./index";
import path from "path";
const args = process.argv.splice(2);

if (args[0] === "serve" || args[0] === "server") {
  const port = parseInt(args[1] ?? "8668");
  const lang = args[2];
  const gtts = new Text2Speech(lang);
  gtts.createServer(port);
} else {
  const lang = args[0];
  const gtts = new Text2Speech(lang);
  const textParts = args.splice(1);
  const text = textParts.join(" ");
  const filename = text.replace(/' '/g, "-") + ".wav";
  const filepath = path.join(__dirname, filename);

  gtts.save(filepath, text)
    .then(() => {
      console.log(`${filepath} was saved!`);
    });
}
