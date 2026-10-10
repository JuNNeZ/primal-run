const fs = require('fs');
const { chromium } = require('playwright');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let serverReady;
// HTTP also works with managed Chromium, whose policy blocks file:// pages.
function localURL(file) {
  const relative = path.relative(root, path.resolve(file));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('File outside repository');
  if (!serverReady) serverReady = new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let requested;
      try { requested = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
      catch (_) { res.writeHead(400).end(); return; }
      if (requested !== root && !requested.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav' };
      fs.readFile(requested, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', types[path.extname(requested)] || 'application/octet-stream'); res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => { server.unref(); resolve('http://127.0.0.1:' + server.address().port + '/'); });
  });
  return serverReady.then(base => base + relative.split(path.sep).map(encodeURIComponent).join('/'));
}
function browserOptions() {
  const options = {headless: true};
  if (process.env.PRIMAL_CHROME_PATH) options.executablePath = process.env.PRIMAL_CHROME_PATH;
  else if (process.platform === 'win32' && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) {
    options.executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  }
  return options;
}
module.exports = {chromium, browserOptions, localURL};
