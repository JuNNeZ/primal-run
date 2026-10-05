const fs = require('fs');
const { chromium } = require('playwright');
function browserOptions() {
  const options = {headless: true};
  if (process.env.PRIMAL_CHROME_ARGS) options.args = JSON.parse(process.env.PRIMAL_CHROME_ARGS);
  if (process.env.PRIMAL_CHROME_PATH) options.executablePath = process.env.PRIMAL_CHROME_PATH;
  else if (process.platform === 'win32' && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) {
    options.executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  }
  return options;
}
module.exports = {chromium, browserOptions};
