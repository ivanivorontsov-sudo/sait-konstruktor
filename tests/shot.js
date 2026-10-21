// node --experimental-websocket shot.js <out.png> <url> <actions ;; separated> [waitMs] [w] [h]
const {spawn}=require('child_process');const [out,url,act,wait,W,Hh]=process.argv.slice(2);const port=9600+Math.floor(Math.random()*300);
const ch=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--window-size='+(W||1366)+','+(Hh||820),'--remote-debugging-port='+port,'--user-data-dir=/tmp/sbshot'+port,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let tabs;for(let i=0;i<60;i++){try{tabs=await (await fetch(`http://127.0.0.1:${port}/json`)).json();break}catch{await sleep(200)}}
 const t=tabs.find(x=>x.type==='page');const ws=new WebSocket(t.webSocketDebuggerUrl);let id=0;const P={};const errs=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errs.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errs.push('console: '+m.params.args.map(a=>a.value||a.description).join(' '));if(P[m.id]){P[m.id](m.result);delete P[m.id]}};
 await new Promise(r=>ws.onopen=r);const send=(method,params={})=>new Promise(r=>{P[++id]=r;ws.send(JSON.stringify({id,method,params}))});
 await send('Runtime.enable');await send('Page.enable');if(process.env.PRE)await send('Page.addScriptToEvaluateOnNewDocument',{source:require('fs').readFileSync(process.env.PRE,'utf8')});
 await send('Page.navigate',{url});await sleep(3000);
 for(const a of (act||'').split(';;').filter(Boolean)){if(/^wait\d+$/.test(a)){await sleep(+a.slice(4));continue}const r=await send('Runtime.evaluate',{expression:a,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)errs.push('action: '+a.slice(0,80)+' → '+(r.exceptionDetails.exception?.description||'').slice(0,300));else if(r.result&&r.result.value!==undefined&&process.env.DUMP)require('fs').writeFileSync(process.env.DUMP,JSON.stringify(r.result.value));if(r.result&&r.result.value!==undefined)console.log('=>',JSON.stringify(r.result.value).slice(0,1500))}
 await sleep(+(wait||1200));const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:!!process.env.FULL});require('fs').writeFileSync(out,Buffer.from(s.data,'base64'));
 console.log(out,errs.length?'ERRORS: '+errs.join(' | '):'no errors');ws.close();ch.kill();process.exit(0)})();
