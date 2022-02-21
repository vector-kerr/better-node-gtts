# better-node-gtts
This is a better version of node-gtts (Unofficial API)

## How to install
```bash
npm install better-node-gtts
```

## How to use

### 1. Save audio file
```javascript
var gtts = new (require('node-gtts'))();
var filepath = './i-love-you.wav';

gtts.save(filepath, 'I love you', function() {
  console.log('save done');
})
```

### 2. Pipe directly to router response
Example with ExpressJS Router

```javascript
var express = require('express');
var router = express.Router();
var gtts = new (require('node-gtts'))();

router.get('/speech', function(req, res) {
  res.set({'Content-Type': 'audio/mpeg'});
  gtts.stream(req.query.text).pipe(res);
})
```

### 3. Create a standalone server
```javascript
var gtts = new (require('node-gtts'))();
gtts.createServer(8668);
```

### 4. Command line usage
```bash
# create file: helllo-world.wav
better-node-gtts en Hello World

# create server listen port 8668
# (in English by default)
better-node-gtts serve 8668 en
```


## API for standalone server
`GET /?text={your-text}`
+ stream audio of speech with default language

`GET /?text={your-text}?lang={lang}`
+ stream audio of speech with specific language
