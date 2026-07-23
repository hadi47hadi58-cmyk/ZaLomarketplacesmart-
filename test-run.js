const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const virtualConsole = new VirtualConsole();
virtualConsole.on("error", (err) => { console.error("JSDOM Error:", err); });
virtualConsole.on("jsdomError", (err) => { console.error("JSDOM jsdomError:", err); });
const html = fs.readFileSync('web/customer-home.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole });
