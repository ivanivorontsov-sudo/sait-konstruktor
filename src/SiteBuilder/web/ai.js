// СайтКонструктор — ИИ: веб-чаты (DeepSeek, GigaChat, Qwen, Claude, Grok через capture.js) и API; строгий JSON-формат правок
const PROV={deepseek:'DeepSeek (веб-чат)',gigachat:'GigaChat (веб-чат)',qwen:'Qwen (веб-чат)',claude:'Claude (веб-чат)',grok:'Grok (веб-чат)',
 'api-gigachat':'GigaChat API','api-deepseek':'DeepSeek API','api-yandex':'YandexGPT API','api-openai':'OpenAI-совместимый API'};
const AIS=Object.assign({prov:'deepseek',check:'',vote:1,retries:2,auto:true,allowExternal:false,facts:'',gigaKey:'',gigaScope:'GIGACHAT_API_PERS',gigaModel:'GigaChat',gigaTrust:false,dsKey:'',dsModel:'deepseek-chat',yaKey:'',yaFolder:'',yaModel:'yandexgpt-lite/latest',oaBase:'https://api.openai.com/v1',oaKey:'',oaModel:'gpt-4o-mini'},JSON.parse(localStorage.sbAI||'{}'));
const saveAIS=()=>localStorage.sbAI=JSON.stringify(AIS);
const HIST=[];const AILOG=[];let aiSeq=0;const aiPend={};
function aiLog(t){AILOG.push(t);if(AILOG.length>300)AILOG.shift();const l=document.getElementById('ailog');if(l){l.textContent=AILOG.slice(-60).join('\n');l.scrollTop=1e9}}
window.onHostMsg=m=>{if(m.type==='aiReply'&&aiPend[m.id]){aiPend[m.id](m.reply);delete aiPend[m.id]}else if(m.type==='aiLog')aiLog(m.t)};
function askRaw(prov,prompt){if(!WV){return Promise.resolve(window.__aiMock?window.__aiMock(prompt,prov):'[ИИ] Работает только в программе для Windows. Здесь можно вставить ответ вручную.')}
 const id='a'+(++aiSeq);document.getElementById('stAI').textContent='⏳ '+PROV[prov];
 return new Promise(r=>{aiPend[id]=x=>{document.getElementById('stAI').textContent='';r(x)};WV.postMessage({cmd:'aiAsk',id,provider:prov,prompt,settings:AIS})})}
// ===== структура страницы для ИИ =====
function walk(c,fn,d){(c.components()||[]).forEach(x=>{fn(x,d);walk(x,fn,d+1)})}
function idx(){const m=new Map();walk(cur().getMainComponent(),x=>m.set(x.getId(),x),0);return m}
function outline(focus){const lines=[];const root=focus||cur().getMainComponent();let n=0;
 const txt=x=>{const t=(x.getEl()&&x.getEl().innerText||'').replace(/\s+/g,' ').trim();return t.slice(0,70)};
 walk(root,(x,d)=>{if(n>220||d>6)return;const tag=x.get('tagName')||'div';const cls=x.getClasses().join('.');const important=d<2||/^(h[1-6]|p|a|button|img|li|summary|b|small|input|textarea)$/.test(tag);
  if(!important)return;n++;const a=x.getAttributes();lines.push('  '.repeat(d)+'#'+x.getId()+' <'+tag+(cls?' .'+cls:'')+'>'+(tag==='img'?' src='+(String(a.src||'').startsWith('data:')?'(картинка)':a.src)+' alt="'+(a.alt||'')+'"':'')+(a.href?' href='+a.href:'')+(x.is('text')||/^(h|p|a|b|s|l|bu)/.test(tag)?' «'+txt(x)+'»':''))},0);
 return lines.join('\n')}
function ctxNow(){return {ids:[...idx().keys()],blocks:Object.keys(SB_BLOCKS),pages:pages().map(pageFile),allowExternal:AIS.allowExternal,facts:AIS.facts+'\n'+(cur().getMainComponent().getEl()?'':'')}}
function buildPrompt(mode,req,sel){const spec=SBAi.formatSpec(Object.keys(SB_BLOCKS));const facts=AIS.facts.trim()?'ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (только эти факты можно использовать): '+AIS.facts.trim():'Данных о контактах/ценах пользователь не дал — используй заглушки.';
 const blocks='Готовые блоки: '+Object.entries(SB_BLOCKS).map(([k,v])=>k+' ('+v[0]+')').join(', ');
 const site='Сайт «'+S.site.title+'», страницы: '+pages().map(p=>pageFile(p)+' ('+p.getName()+')').join(', ')+'. Текущая: '+pageFile(cur())+'. Тема: '+JSON.stringify(S.site.theme)+'.';
 const css='Доступные классы темы: sb-section, sb-muted, sb-container, sb-title, sb-sub, sb-btn, sb-ghost, sb-grid, sb-card, sb-icon, sb-split, sb-hero, sb-hero-dark, sb-badge, sb-cta, sb-footer, sb-copy, sb-gallery, sb-price, sb-amount, sb-featured, sb-faq, sb-form, sb-form-ok, sb-stat, sb-count (data-to), sb-timeline, sb-step, sb-tabs/sb-tab/sb-pane, sb-slider/sb-slides/sb-slide, sb-modal/sb-modal-box/sb-close.';
 const head='Ты — веб-дизайнер и редактор статического сайта в конструкторе. '+site+'\n'+css+'\n'+blocks+'\n'+facts+'\n\n';
 if(mode==='site')return head+'ЗАДАЧА: собрать содержимое текущей страницы с нуля (страница будет очищена). Используй операции add_block с готовыми блоками или своим html на классах sb-*, затем set_theme и set_seo; для других страниц — add_page. Тексты пиши под бизнес пользователя.\nОписание от пользователя: '+req+'\n\n'+spec;
 return head+'СТРУКТУРА '+(sel?'ВЫДЕЛЕННОГО ЭЛЕМЕНТА':'ТЕКУЩЕЙ СТРАНИЦЫ')+' (id — после #):\n'+outline(sel)+'\n\nЗАДАЧА: '+req+'\n\n'+spec}
// ===== конвейер: запрос → разбор → проверка → повтор с ошибками → перекрёстная проверка/голосование =====
async function askOps(mode,req,sel,ui){const ctx=ctxNow();if(mode==='site')ctx.ids=[];let prompt=buildPrompt(mode,req,sel);const cands=[];
 for(let v=0;v<Math.max(1,AIS.vote);v++){let res=null,reply='';
  for(let a=0;a<=AIS.retries;a++){ui('⏳ '+PROV[AIS.prov]+(AIS.vote>1?' · вариант '+(v+1)+'/'+AIS.vote:'')+(a?' · исправление '+a:'')+'…');
   reply=await askRaw(AIS.prov,prompt);aiLog('Ответ ('+reply.length+' симв.)');
   if(/^\[(ИИ|Ошибка)/.test(reply.trim()))return {fail:reply};
   res=SBAi.validate(reply,ctx);if(res.ok)break;aiLog('Проверка не пройдена: '+res.errors.join('; '));
   prompt='Твой предыдущий ответ не прошёл автоматическую проверку. Ошибки:\n- '+res.errors.slice(0,15).join('\n- ')+'\nПришли ИСПРАВЛЕННЫЙ ответ целиком — только JSON по той же схеме, только существующие id.\n\n'+buildPrompt(mode,req,sel)}
  res.raw=reply;cands.push(res)}
 let best=AIS.vote>1?SBAi.pickMajority(cands):cands[0];if(!best||!best.ok)return {fail:'ИИ не дал корректный ответ после '+(AIS.retries+1)+' попыток.',res:cands[cands.length-1]};
 if(AIS.vote>1)best.warnings.push('Голосование: выбран вариант, совпавший у '+cands.filter(c=>c.ok&&c.ops.map(o=>o.op).join()===best.ops.map(o=>o.op).join()).length+' из '+AIS.vote);
 if(AIS.check){ui('🔍 Проверка второй моделью: '+PROV[AIS.check]+'…');const cr=await askRaw(AIS.check,'Проверь правки сайта, предложенные другим ИИ, на соответствие запросу и на выдуманные факты (телефоны, цены, адреса, имена, отзывы, цифры, которых нет в данных пользователя).\nЗапрос: '+req+'\nДанные пользователя: '+(AIS.facts||'(нет)')+'\nПравки:\n'+best.ops.map(SBAi.describe).join('\n')+'\nОтветь ТОЛЬКО JSON: {"approve":true|false,"issues":["…"]}');
  const j=SBAi.parseAIJson(cr);if(j&&typeof j.approve==='boolean'){best.review=j;if(!j.approve)best.warnings.push('⚠ Вторая модель против: '+(j.issues||[]).join('; '))}else best.warnings.push('Вторая модель ответила не по формату — проверка пропущена')}
 return {res:best}}
// ===== применение правок =====
function applyOps(ops,mode){const before=editor.getProjectData(),beforeMeta=JSON.parse(JSON.stringify({meta:S.meta,site:S.site}));const done=[];const um=editor.UndoManager;
 if(mode==='site')cur().getMainComponent().components('');
 for(const o of ops){try{const m=idx();const T=o.target&&m.get(o.target);const wrapper=()=>{if(o.page){const p=pages().find(x=>pageFile(x)===o.page);if(p&&p!==cur())editor.Pages.select(p)}return cur().getMainComponent()};
  const at=pos=>{if(pos&&typeof pos==='object'){const ref=m.get(String(pos.after||pos.before));return {parent:ref.parent(),at:ref.index()+(pos.after?1:0)}}const w=wrapper();return {parent:w,at:pos==='start'?0:w.components().length}};
  switch(o.op){case 'add_block':{const p=at(o.position);p.parent.components().add(o.block?SB_BLOCKS[o.block][3]:o.html,{at:p.at});break}
   case 'replace_block':T.replaceWith(o.html);break;case 'remove_block':T.remove();break;
   case 'move_block':{T.remove({temporary:true});const p=at(o.position);p.parent.components().add(T,{at:p.at});break}
   case 'set_text':done.push({d:'«'+(T.getEl()&&T.getEl().innerText||'').slice(0,50)+'» → «'+o.text.slice(0,50)+'»'});T.components(H(o.text));break;
   case 'set_attr':if(o.name==='src'&&T.is('image'))T.set('src',o.value);else T.addAttributes({[o.name]:o.value});break;
   case 'set_style':if(T)T.addStyle(o.style);else editor.Css.setRule(o.selector,o.style);break;
   case 'set_theme':Object.assign(S.site.theme,o.theme);frameStyle();break;
   case 'add_page':{const html=o.blocks?o.blocks.map(b=>SB_BLOCKS[b][3]).join(''):o.html;const keep=cur();const p=addPage(o.name,html,o.file);const mm=meta(p);if(o.title)mm.title=o.title;if(o.description)mm.description=o.description;editor.Pages.select(keep);break}
   case 'set_seo':{const p=o.page?pages().find(x=>pageFile(x)===o.page):cur();const mm=meta(p);['title','description','keywords'].forEach(k=>{if(o[k]!=null)mm[k]=o[k]});break}}
  }catch(e){done.push({err:SBAi.describe(o)+': '+e.message})}}
 refreshPages();dirty();return {before,beforeMeta,done}}
function rollback(h){editor.loadProjectData(h.before);S.meta=h.beforeMeta.meta;S.site=h.beforeMeta.site;refreshPages();setTimeout(frameStyle,200);h.rolled=true;renderHist();toast('Откат выполнен: «'+h.req.slice(0,40)+'»')}
function renderHist(){const el=document.getElementById('histP');if(!HIST.length){el.innerHTML='<div class="hint">Здесь появятся правки ИИ. Любую можно откатить в один клик; обычные правки отменяются ↶ (Ctrl+Z).</div>';return}
 el.innerHTML=HIST.slice().reverse().map((h,ri)=>{const i=HIST.length-1-ri;return '<div class="hitem"><small>'+h.time+' · '+H(PROV[h.prov]||h.prov)+(h.rolled?' · <span class="warn">откачено</span>':'')+'</small><div><b>'+H(h.req.slice(0,90))+'</b></div>'+(h.summary?'<div class="hint">'+H(h.summary)+'</div>':'')+
  '<ul class="ops">'+h.ops.map(o=>'<li>'+H(SBAi.describe(o))+'</li>').join('')+(h.done||[]).map(d=>'<li class="'+(d.err?'err':'')+'">'+H(d.err||d.d)+'</li>').join('')+'</ul>'+(h.warnings.length?'<div class="warn">'+h.warnings.slice(0,8).map(H).join('<br>')+'</div>':'')+
  (h.rolled?'':'<button data-rb="'+i+'">⟲ Откатить к состоянию до этой правки</button>')+'</div>'}).join('');
 el.querySelectorAll('[data-rb]').forEach(b=>b.onclick=()=>rollback(HIST[+b.dataset.rb]))}
// ===== панель ИИ =====
function renderAI(){const el=document.getElementById('aiP');
 el.innerHTML='<div class="aibox"><label class="hint">ИИ-модель</label><select id="aiProv">'+Object.entries(PROV).map(([k,v])=>'<option value="'+k+'"'+(k===AIS.prov?' selected':'')+'>'+v+'</option>').join('')+'</select>'+
 '<div class="aibtns"><button id="aiChat" title="Показать/скрыть окно веб-чата (войдите в аккаунт один раз)">💬 Окно чата</button><button id="aiSet">⚙ Настройки</button><button id="aiLogB">📜 Журнал</button></div>'+
 '<textarea id="aiReq" placeholder="Например: «Сайт для барбершопа во Владивостоке: услуги, цены, запись, отзывы, тёмная тема» или «сделай первый экран ярче и короче»"></textarea>'+
 '<div class="aibtns"><button class="accent" id="aiSite">✨ Сделать страницу</button><button class="primary" id="aiEdit">✏️ Изменить</button></div>'+
 '<div class="hint">Быстро для выделенного элемента:</div><div class="aibtns"><button data-q="Перепиши тексты выделенного блока: короче, понятнее, продающе. Без выдуманных фактов.">📝 Переписать текст</button><button data-q="Исправь орфографию и пунктуацию в выделенном блоке, смысл не меняй.">🔤 Орфография</button><button data-q="Улучши дизайн выделенного блока через set_style: отступы, размеры шрифтов, контраст, тени. Только CSS.">🎨 CSS-стиль</button><button data-q="Добавь после выделенного блока подходящую по смыслу новую секцию из готовых блоков.">➕ Секцию</button><button data-q="Заполни SEO (title до 60 символов, description 140–160) для всех страниц по их содержимому.">🔎 SEO</button></div>'+
 '<label class="hint"><input type="checkbox" id="aiAuto" '+(AIS.auto?'checked':'')+'> Применять сразу (иначе — предпросмотр)</label><div id="aiOut"></div><div class="ailog" id="ailog"></div></div>';
 const $q=s=>el.querySelector(s);$q('#aiProv').onchange=e=>{AIS.prov=e.target.value;saveAIS()};$q('#aiAuto').onchange=e=>{AIS.auto=e.target.checked;saveAIS()};
 $q('#aiChat').onclick=()=>{if(!AIS.prov.startsWith('api-')&&WV)WV.postMessage({cmd:'aiToggle',provider:AIS.prov});else toast(WV?'У API-моделей нет окна чата':'Только в программе для Windows')};
 $q('#aiSet').onclick=settingsDialog;$q('#aiLogB').onclick=()=>{const w=modal('<h2>Журнал ИИ</h2><pre class="code" style="max-height:60vh">'+H(AILOG.join('\n'))+'</pre><div class="row"><button>Закрыть</button></div>');w.q('button').onclick=()=>w.remove()};
 $q('#aiSite').onclick=()=>run('site',$q('#aiReq').value.trim());$q('#aiEdit').onclick=()=>run('edit',$q('#aiReq').value.trim(),editor.getSelected());
 el.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const s=editor.getSelected();if(!s&&!/SEO/.test(b.textContent)){toast('Сначала выделите элемент на странице');return}run('edit',b.dataset.q+($q('#aiReq').value.trim()?' Пожелание: '+$q('#aiReq').value.trim():''),/SEO/.test(b.textContent)?null:(/Секцию/.test(b.textContent)?null:topSection(s)))});aiLog('')}
let busy=false;
async function run(mode,req,sel){if(!req){toast('Опишите задачу для ИИ');return}if(busy)return;busy=true;const out=document.getElementById('aiOut');const ui=t=>out.innerHTML='<div class="hint">'+H(t)+'</div>';
 try{const r=await askOps(mode,req,sel,ui);
  if(r.fail){out.innerHTML='<div class="err">'+H(r.fail)+'</div>'+(r.res?'<div class="err">'+r.res.errors.slice(0,6).map(H).join('<br>')+'</div>':'')+'<div class="aibtns"><button id="aiPaste">📋 Вставить ответ вручную</button>'+(WV?'<button id="aiGrab">⤵ Забрать ответ из чата</button>':'')+'</div>';
   out.querySelector('#aiPaste').onclick=()=>pasteBox(t=>finish(mode,req,SBAi.validate(t,mode==='site'?Object.assign(ctxNow(),{ids:[]}):ctxNow()),out));
   if(WV)out.querySelector('#aiGrab').onclick=async()=>{const id='g'+(++aiSeq);const t=await new Promise(rr=>{aiPend[id]=rr;WV.postMessage({cmd:'aiGrab',id})});finish(mode,req,SBAi.validate(t,ctxNow()),out)};return}
  finish(mode,req,r.res,out)}finally{busy=false}}
function finish(mode,req,res,out){if(!res.ok){out.innerHTML='<div class="err">Ответ не прошёл проверку:<br>'+res.errors.slice(0,8).map(H).join('<br>')+'</div>';return}
 const h={time:new Date().toLocaleTimeString('ru-RU'),prov:AIS.prov,req,summary:res.summary,ops:res.ops,warnings:res.warnings};
 const show=applied=>{out.innerHTML='<div class="'+(applied?'ok':'hint')+'">'+(applied?'✅ Применено правок: ':'Предлагается правок: ')+res.ops.length+'</div>'+(res.summary?'<div class="hint">'+H(res.summary)+'</div>':'')+'<ul class="ops">'+res.ops.map(o=>'<li>'+H(SBAi.describe(o))+'</li>').join('')+'</ul>'+(res.warnings.length?'<div class="warn">🛡 '+res.warnings.slice(0,6).map(H).join('<br>🛡 ')+'</div>':'')+
  '<div class="aibtns">'+(applied?'<button id="aiRb">⟲ Откатить</button><button id="aiHi">🕘 История</button>':'<button class="primary" id="aiAp">✔ Применить</button><button id="aiNo">✖ Отклонить</button>')+'</div>'};
 const apply=()=>{const a=applyOps(res.ops,mode);Object.assign(h,a);HIST.push(h);renderHist();show(true);out.querySelector('#aiRb').onclick=()=>{rollback(h);out.innerHTML='<div class="hint">Откачено.</div>'};out.querySelector('#aiHi').onclick=()=>tab('right','hist');
  const errs=a.done.filter(d=>d.err);if(errs.length)out.insertAdjacentHTML('beforeend','<div class="err">'+errs.map(e=>H(e.err)).join('<br>')+'</div>');toast('ИИ: применено правок '+res.ops.length+' — можно откатить')};
 if(AIS.auto&&!(res.review&&res.review.approve===false))apply();else{show(false);out.querySelector('#aiAp').onclick=apply;out.querySelector('#aiNo').onclick=()=>out.innerHTML='<div class="hint">Отклонено.</div>'}}
function pasteBox(cb){const w=modal('<h2>Вставьте ответ ИИ</h2><p class="hint">Скопируйте ответ из окна чата (кнопка «Копировать» у блока кода) и вставьте сюда — он пройдёт ту же проверку.</p><textarea id="pb" class="code"></textarea><div class="row"><button id="pc">Отмена</button><button class="primary" id="po">Проверить и применить</button></div>');
 w.q('#pc').onclick=()=>w.remove();w.q('#po').onclick=()=>{const t=w.q('#pb').value;w.remove();if(t.trim())cb(t)}}
function settingsDialog(){const f=(id,l,v,t)=>'<div><label>'+l+'</label><input id="'+id+'" type="'+(t||'text')+'" value="'+H(v)+'"></div>';
 const w=modal('<h2>Настройки ИИ</h2><label>Данные о вас для сайта (ИИ использует ТОЛЬКО их; всё остальное — заглушки [телефон], [цена]…)</label><textarea id="sF" rows="4" placeholder="Название, город, телефон, e-mail, адрес, услуги и цены, часы работы…">'+H(AIS.facts)+'</textarea>'+
 '<div class="cols"><div><label>Проверка второй моделью</label><select id="sC"><option value="">не проверять</option>'+Object.entries(PROV).map(([k,v])=>'<option value="'+k+'"'+(k===AIS.check?' selected':'')+'>'+v+'</option>').join('')+'</select></div><div><label>Голосование (вариантов ответа)</label><select id="sV">'+[1,3,5].map(n=>'<option'+(n==AIS.vote?' selected':'')+'>'+n+'</option>').join('')+'</select></div>'+
 '<div><label>Повторов при ошибке формата</label><select id="sR">'+[0,1,2,3].map(n=>'<option'+(n==AIS.retries?' selected':'')+'>'+n+'</option>').join('')+'</select></div><div><label>&nbsp;</label><label><input type="checkbox" id="sE" '+(AIS.allowExternal?'checked':'')+'> Разрешить внешние https-ссылки и картинки</label></div></div>'+
 '<h3>GigaChat API</h3><div class="cols">'+f('sGk','Authorization key (developers.sber.ru)',AIS.gigaKey,'password')+f('sGs','Scope',AIS.gigaScope)+f('sGm','Модель',AIS.gigaModel)+'<div><label>&nbsp;</label><label><input type="checkbox" id="sGt" '+(AIS.gigaTrust?'checked':'')+'> Не проверять сертификат (нет сертификата НУЦ Минцифры)</label></div></div>'+
 '<h3>DeepSeek API</h3><div class="cols">'+f('sDk','API-ключ (platform.deepseek.com)',AIS.dsKey,'password')+f('sDm','Модель',AIS.dsModel)+'</div>'+
 '<h3>YandexGPT API</h3><div class="cols">'+f('sYk','API-ключ сервисного аккаунта',AIS.yaKey,'password')+f('sYf','ID каталога',AIS.yaFolder)+f('sYm','Модель',AIS.yaModel)+'</div>'+
 '<h3>OpenAI-совместимый (OpenAI, OpenRouter, Ollama, LM Studio…)</h3><div class="cols">'+f('sOb','Адрес API',AIS.oaBase)+f('sOk','Ключ',AIS.oaKey,'password')+f('sOm','Модель',AIS.oaModel)+'</div>'+
 '<p class="hint">Веб-чаты (DeepSeek, GigaChat, Qwen, Claude, Grok) ключей не требуют: откройте «Окно чата» и один раз войдите в аккаунт. Ключи хранятся только на этом компьютере.</p><div class="row"><button id="sx">Отмена</button><button class="primary" id="so">Сохранить</button></div>');
 w.q('#sx').onclick=()=>w.remove();w.q('#so').onclick=()=>{const g=id=>w.q('#'+id).value;Object.assign(AIS,{facts:g('sF'),check:g('sC'),vote:+g('sV'),retries:+g('sR'),allowExternal:w.q('#sE').checked,gigaKey:g('sGk'),gigaScope:g('sGs'),gigaModel:g('sGm'),gigaTrust:w.q('#sGt').checked,dsKey:g('sDk'),dsModel:g('sDm'),yaKey:g('sYk'),yaFolder:g('sYf'),yaModel:g('sYm'),oaBase:g('sOb'),oaKey:g('sOk'),oaModel:g('sOm')});saveAIS();w.remove();toast('Настройки ИИ сохранены')}}
renderAI();renderHist();
