// СайтКонструктор: строгий формат правок от ИИ — схема, разбор, проверка, очистка, анти-галлюцинации
(function(root){
const OPS={add_block:1,replace_block:1,remove_block:1,move_block:1,set_text:1,set_attr:1,set_style:1,set_theme:1,add_page:1,set_seo:1};
const ATTRS=['href','src','alt','title','placeholder','aria-label','target','data-mailto','name','type'];
const CSS_PROPS=new Set(('color background background-color background-image background-size background-position background-repeat font-family font-size font-weight font-style line-height letter-spacing text-align text-transform text-decoration '+
 'margin margin-top margin-bottom margin-left margin-right padding padding-top padding-bottom padding-left padding-right width max-width min-width height max-height min-height '+
 'display flex-direction justify-content align-items gap grid-template-columns flex-wrap border border-radius border-color border-width box-shadow opacity transform transition object-fit overflow position top left right bottom z-index').split(' '));
const THEME_KEYS=['primary','accent','text','bg','muted','font','head','radius','themeToggle','dark','anim'];
const TAGS=new Set('section header footer nav main article aside div span p h1 h2 h3 h4 h5 h6 a img ul ol li strong b em i small br hr blockquote figure figcaption button form input textarea select option label details summary table thead tbody tr td th iframe video source picture'.split(' '));
const IFRAME_OK=/^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/|yandex\.ru\/map-widget\/|rutube\.ru\/play\/embed\/|vk\.com\/video_ext)/;
const SCHEMA={type:'object',required:['ops'],properties:{summary:{type:'string'},ops:{type:'array',maxItems:60,items:{oneOf:[
 {op:'add_block',required:['op'],props:{block:'id готового блока',html:'HTML секции (если блока нет)',position:'"end"|"start"|{"after":id}|{"before":id}',page:'файл страницы'}},
 {op:'replace_block',required:['op','target','html']},{op:'remove_block',required:['op','target']},{op:'move_block',required:['op','target','position']},
 {op:'set_text',required:['op','target','text']},{op:'set_attr',required:['op','target','name','value']},
 {op:'set_style',required:['op','style'],props:{target:'id',selector:'CSS-класс .sb-…'}},{op:'set_theme',required:['op','theme']},
 {op:'add_page',required:['op','name','file'],props:{blocks:'массив id блоков',html:'HTML',title:'',description:''}},{op:'set_seo',required:['op'],props:{page:'',title:'',description:'',keywords:''}}]}}}};
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
// Терпимый разбор JSON из ответа ИИ (как в ПрокурорПлюс): блоки ```json```, «умные» кавычки, висячие запятые, ключи без кавычек
function parseAIJson(t,want){if(t==null)return null;let s=String(t);
 const fences=[...s.matchAll(/```[a-zA-Z]*\s*\n?([\s\S]*?)```/g)].map(m=>m[1]);const cands=[...fences.reverse(),s];
 const vars=[];for(const c0 of cands){const c1=c0.replace(/^\uFEFF/,'');vars.push(c1);vars.push(c1.replace(/[\u201C\u201D\u201E]/g,'"').replace(/\u00a0/g,' '));vars.push(c1.replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g,'"').replace(/[\u2018\u2019]/g,"'").replace(/\u00a0/g,' '))}
 for(let c of vars){
  const ib=c.indexOf('['),io=c.indexOf('{');const order=ib>=0&&(io<0||ib<io)?['[','{']:['{','['];for(const open of order){const i=c.indexOf(open);if(i<0)continue;
   let dep=0,ins=false,esc=false,j=i;for(;j<c.length;j++){const ch=c[j];if(ins){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')ins=false;continue}if(ch==='"')ins=true;else if(ch==='['||ch==='{')dep++;else if(ch===']'||ch==='}'){dep--;if(dep===0)break}}
   const frag=c.slice(i,j+1);const tries=[frag,frag.replace(/,\s*([\]}])/g,'$1'),frag.replace(/,\s*([\]}])/g,'$1').replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g,'$1"$2":')];
   for(const x of tries){try{return JSON.parse(x)}catch{}}}}
 return null}
function urlOk(u,ctx,kind){u=String(u||'').trim();if(!u||u[0]==='#'||/^(mailto:|tel:)/i.test(u))return true;if(/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(u))return true;
 if(/^(javascript|vbscript|data|file):/i.test(u))return false;if(!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(u))return !/\.\./.test(u)||kind==='href';
 if(kind==='iframe')return IFRAME_OK.test(u);return !!ctx.allowExternal&&/^https:\/\//i.test(u)}
// Очистка HTML без DOM (работает и в node): белый список тегов, без on*-атрибутов, скриптов и внешних адресов
function sanitizeHtml(html,ctx,warn){ctx=ctx||{};warn=warn||[];let s=String(html||'');
 s=s.replace(/<!--[\s\S]*?-->/g,'');
 s=s.replace(/<(script|style|object|embed|base|link|meta|svg|math|template|noscript)\b[\s\S]*?(<\/\1\s*>|$)/gi,m=>{warn.push('Удалён тег '+m.slice(1,m.indexOf(' ')>0&&m.indexOf(' ')<12?m.indexOf(' '):8).replace(/[^a-z]/gi,''));return ''});
 s=s.replace(/<(script|object|embed|base|link|meta)\b[^>]*\/?>/gi,()=>{warn.push('Удалён опасный тег');return ''});
 s=s.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g,(m,tag,attrs)=>{const t=tag.toLowerCase();if(!TAGS.has(t)){warn.push('Удалён тег <'+t+'>');return ''}
  if(m[1]==='/')return '</'+t+'>';const out=[];const re=/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;let a;
  while((a=re.exec(attrs))){const n=a[1].toLowerCase();let v=a[3]!=null?a[3]:a[4]!=null?a[4]:a[5]!=null?a[5]:'';
   if(/^on/.test(n)||n==='srcdoc'||n==='formaction'){warn.push('Удалён атрибут '+n);continue}
   if(n==='href'||n==='src'||n==='action'||n==='poster'){const kind=t==='iframe'?'iframe':n;if(!urlOk(v,ctx,kind)){warn.push('Убран внешний/опасный адрес: '+v.slice(0,60));v=n==='src'?(t==='iframe'?'about:blank':''):'#'}}
   if(n==='style'){v=sanitizeStyleStr(v,ctx,warn)}
   out.push(n+(a[2]!=null?'="'+v.replace(/"/g,'&quot;')+'"':''))}
  const self=/\/\s*$/.test(attrs);return '<'+t+(out.length?' '+out.join(' '):'')+(self?' /':'')+'>'});
 return s}
function cssValOk(v,ctx){v=String(v);if(/expression\s*\(|javascript:|@import|behavior\s*:|<\/?/i.test(v))return false;
 const urls=[...v.matchAll(/url\(\s*['"]?([^'")]+)/gi)].map(m=>m[1]);return urls.every(u=>urlOk(u,ctx,'src'))}
function sanitizeStyleObj(st,ctx,warn){const o={};for(const [k0,v] of Object.entries(st||{})){const k=String(k0).trim().replace(/[A-Z]/g,c=>'-'+c.toLowerCase()).toLowerCase();
  if(!CSS_PROPS.has(k)&&!/^--sb-/.test(k)){warn.push('Неизвестное CSS-свойство пропущено: '+k0);continue}
  if(!cssValOk(v,ctx)){warn.push('Опасное/внешнее значение CSS пропущено: '+k);continue}o[k]=String(v)}return o}
function sanitizeStyleStr(s,ctx,warn){const o={};String(s).split(';').forEach(p=>{const i=p.indexOf(':');if(i>0)o[p.slice(0,i).trim()]=p.slice(i+1).trim()});
 return Object.entries(sanitizeStyleObj(o,ctx,warn)).map(([k,v])=>k+':'+v).join(';')}
// Анти-галлюцинации: телефоны, e-mail, цены, адреса сайтов, которых нет в данных пользователя → метки-заглушки
const digits=s=>String(s).replace(/\D/g,'');
function factGuard(text,ctx,warn){const facts=String(ctx.facts||'').toLowerCase();const fd=digits(facts);let s=String(text);
 s=s.replace(/(?:\+7|8)[\s\-(]*\d{3}[\s\-)]*\d{3}[\s-]*\d{2}[\s-]*\d{2}|\+\d[\d\s\-()]{8,16}\d/g,m=>fd.includes(digits(m))?m:(warn.push('Выдуманный телефон заменён: '+m),'[телефон]'));
 s=s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,m=>facts.includes(m.toLowerCase())?m:(warn.push('Выдуманный e-mail заменён: '+m),'[e-mail]'));
 s=s.replace(/(?:от\s+)?\d[\d\s.,]*\s?(?:₽|руб\.?|рублей|р\.|\$|€|usd|eur)/gi,m=>{const d=digits(m);return d&&fd.includes(d)?m:(warn.push('Выдуманная цена заменена: '+m.trim()),'[цена] ₽')});
 s=s.replace(/(?:г\.|город)\s*[А-ЯЁ][а-яё-]+,?\s*(?:ул\.|улица|пр\.|проспект)\s*[^<,\n]{2,40}?,?\s*(?:д\.|дом)\s*\d+[а-яА-Я]?/g,m=>facts.includes(m.toLowerCase().slice(0,20))?m:(warn.push('Выдуманный адрес заменён'),'[адрес]'));
 return s}
function guardHtml(html,ctx,warn){return String(html).replace(/>([^<]+)</g,(m,t)=>'>'+factGuard(t,ctx,warn)+'<')}
function posOk(p,ids){if(p==null||p==='end'||p==='start')return null;if(typeof p==='object'){const k=p.after!=null?'after':p.before!=null?'before':null;if(!k)return 'position: нужен "end", "start", {"after":id} или {"before":id}';if(!ids.has(String(p[k])))return 'position: нет элемента с id "'+p[k]+'"';return null}return 'position: неверное значение'}
/** ctx: {ids:Set|Array, blocks:Set|Array, pages:Set|Array, allowExternal, facts, maxOps} → {ok, errors, warnings, ops, summary} */
function validate(obj,ctx){ctx=Object.assign({},ctx);const ids=new Set(ctx.ids||[]),blocks=new Set(ctx.blocks||[]),pages=new Set(ctx.pages||[]);const E=[],W=[],out=[];
 if(typeof obj==='string')obj=parseAIJson(obj);
 if(Array.isArray(obj))obj={ops:obj};
 if(!obj||typeof obj!=='object')return {ok:false,errors:['Ответ не содержит JSON-объекта {"ops":[…]}'],warnings:W,ops:[]};
 if(!Array.isArray(obj.ops))return {ok:false,errors:['Нет массива "ops"'],warnings:W,ops:[]};
 if(!obj.ops.length)E.push('Массив "ops" пуст');if(obj.ops.length>(ctx.maxOps||60))E.push('Слишком много операций ('+obj.ops.length+'), максимум '+(ctx.maxOps||60));
 const removed=new Set();const newPages=new Set();
 obj.ops.forEach((o,i)=>{const P='ops['+i+']';if(!o||typeof o!=='object'){E.push(P+': не объект');return}
  const op=o.op||o.type||o.action;if(!OPS[op]){E.push(P+': неизвестная операция "'+op+'". Разрешены: '+Object.keys(OPS).join(', '));return}
  const need=k=>{if(o[k]==null||o[k]===''){E.push(P+' ('+op+'): нет поля "'+k+'"');return false}return true};
  const tgt=()=>{if(!need('target'))return false;const t=String(o.target).replace(/^#/,'');if(!ids.has(t)){E.push(P+' ('+op+'): элемента с id "'+t+'" нет на странице — используйте только id из структуры');return false}if(removed.has(t)){E.push(P+': элемент "'+t+'" уже удалён раньше');return false}return t};
  const pg=k=>{if(o[k]!=null&&o[k]!==''&&!pages.has(o[k])&&!newPages.has(o[k])){E.push(P+': страницы "'+o[k]+'" нет. Есть: '+[...pages].join(', '));return false}return true};
  const html=h=>guardHtml(sanitizeHtml(h,ctx,W),ctx,W);const r={op};
  switch(op){
   case 'add_block':if(o.block!=null&&!blocks.has(o.block)){if(o.html)W.push(P+': блока "'+o.block+'" нет, использую html');else{E.push(P+': неизвестный блок "'+o.block+'". Доступные: '+[...blocks].join(', '));return}}
    if(o.block==null&&!o.html){E.push(P+': нужен "block" или "html"');return}{const pe=posOk(o.position,ids);if(pe){E.push(P+': '+pe);return}}if(!pg('page'))return;
    if(o.block&&blocks.has(o.block))r.block=o.block;else r.html=html(o.html);if(r.html!=null&&!r.html.trim()){E.push(P+': после очистки html пуст');return}r.position=o.position||'end';if(o.page)r.page=o.page;break;
   case 'replace_block':{const t=tgt();if(!t||!need('html'))return;r.target=t;r.html=html(o.html);if(!r.html.trim()){E.push(P+': после очистки html пуст');return}break}
   case 'remove_block':{const t=tgt();if(!t)return;r.target=t;removed.add(t);break}
   case 'move_block':{const t=tgt();if(!t)return;const pe=posOk(o.position,ids);if(pe||o.position==null){E.push(P+': '+(pe||'нет position'));return}r.target=t;r.position=o.position;break}
   case 'set_text':{const t=tgt();if(!t||!need('text'))return;if(typeof o.text!=='string'){E.push(P+': "text" должен быть строкой');return}r.target=t;r.text=factGuard(o.text.replace(/<[^>]*>/g,''),ctx,W);break}
   case 'set_attr':{const t=tgt();if(!t||!need('name'))return;const n=String(o.name).toLowerCase();if(!ATTRS.includes(n)){E.push(P+': атрибут "'+n+'" запрещён. Разрешены: '+ATTRS.join(', '));return}
    let v=String(o.value==null?'':o.value);if((n==='href'||n==='src')&&!urlOk(v,ctx,n)){W.push(P+': внешний/опасный адрес заменён: '+v.slice(0,60));v=n==='href'?'#':''}
    if(n==='data-mailto')v=factGuard(v,ctx,W).replace(/^\[e-mail\]$/,'');r.target=t;r.name=n;r.value=v;break}
   case 'set_style':{if(o.target==null&&!o.selector){E.push(P+': нужен "target" или "selector"');return}if(o.target!=null){const t=tgt();if(!t)return;r.target=t}
    else{if(!/^[.#]?[a-zA-Z][\w-]*([ .:>#-][\w-:.#> ]*)?$/.test(o.selector)||/[{};]/.test(o.selector)){E.push(P+': недопустимый селектор');return}r.selector=o.selector}
    if(!o.style||typeof o.style!=='object'){E.push(P+': "style" должен быть объектом {"свойство":"значение"}');return}r.style=sanitizeStyleObj(o.style,ctx,W);if(!Object.keys(r.style).length){E.push(P+': нет допустимых CSS-свойств');return}break}
   case 'set_theme':{if(!o.theme||typeof o.theme!=='object'){E.push(P+': "theme" должен быть объектом');return}const th={};for(const [k,v] of Object.entries(o.theme)){if(!THEME_KEYS.includes(k)){W.push(P+': ключ темы "'+k+'" пропущен');continue}
     if(['primary','accent','text','bg','muted'].includes(k)&&!/^#[0-9a-f]{3,8}$|^rgba?\([\d\s.,%]+\)$/i.test(v)){E.push(P+': цвет "'+k+'" должен быть #RRGGBB');continue}if(!cssValOk(v,ctx))continue;th[k]=v}r.theme=th;break}
   case 'add_page':{if(!need('name')||!need('file'))return;const f=String(o.file).trim();if(!/^[a-z0-9][a-z0-9_-]*\.html$/.test(f)){E.push(P+': имя файла "'+f+'" — только латиница, цифры, - и .html');return}
    if(pages.has(f)||newPages.has(f)){E.push(P+': страница "'+f+'" уже есть');return}newPages.add(f);r.name=String(o.name);r.file=f;
    if(Array.isArray(o.blocks)){const bad=o.blocks.filter(b=>!blocks.has(b));if(bad.length){E.push(P+': неизвестные блоки '+bad.join(', '));return}r.blocks=o.blocks}if(o.html)r.html=html(o.html);
    if(!r.blocks&&!r.html){E.push(P+': нужен "blocks" или "html"');return}['title','description'].forEach(k=>{if(o[k])r[k]=factGuard(String(o[k]),ctx,W)});break}
   case 'set_seo':{if(!pg('page'))return;['title','description','keywords'].forEach(k=>{if(o[k]!=null)r[k]=factGuard(String(o[k]).replace(/<[^>]*>/g,''),ctx,W).slice(0,k==='title'?120:400)});if(o.page)r.page=o.page;
    if(r.title==null&&r.description==null&&r.keywords==null){E.push(P+': нет title/description/keywords');return}break}}
  out.push(r)});
 return {ok:!E.length,errors:E,warnings:W,ops:out,summary:typeof obj.summary==='string'?obj.summary.slice(0,300):''}}
// Голосование: из нескольких валидных ответов выбрать тот, чья «подпись» операций встречается чаще (при равенстве — меньше предупреждений)
function sig(r){return r.ops.map(o=>o.op+':'+(o.target||o.block||o.file||o.selector||'')).sort().join('|')}
function pickMajority(results){const ok=results.filter(r=>r&&r.ok);if(!ok.length)return null;const cnt={};ok.forEach(r=>{const s=sig(r);cnt[s]=(cnt[s]||0)+1});
 return ok.slice().sort((a,b)=>cnt[sig(b)]-cnt[sig(a)]||a.warnings.length-b.warnings.length)[0]}
function describe(o){const p=o.position&&typeof o.position==='object'?(o.position.after?' после #'+o.position.after:' перед #'+o.position.before):o.position==='start'?' в начало':'';
 return {add_block:'➕ Добавить '+(o.block?'блок «'+o.block+'»':'секцию')+p+(o.page?' на '+o.page:''),replace_block:'♻️ Заменить #'+o.target,remove_block:'🗑 Удалить #'+o.target,move_block:'↕️ Переместить #'+o.target+p,
  set_text:'✏️ Текст #'+o.target+': «'+String(o.text).slice(0,80)+'»',set_attr:'🔗 #'+o.target+' '+o.name+' = '+String(o.value).slice(0,60),set_style:'🎨 Стиль '+(o.target?'#'+o.target:o.selector)+': '+Object.entries(o.style||{}).map(([k,v])=>k+':'+v).join('; '),
  set_theme:'🌈 Тема: '+Object.entries(o.theme||{}).map(([k,v])=>k+'='+v).join(', '),add_page:'📄 Новая страница «'+o.name+'» ('+o.file+')',set_seo:'🔎 SEO'+(o.page?' '+o.page:'')+(o.title?': '+o.title:'')}[o.op]||o.op}
function formatSpec(blocks){return 'Отвечай ТОЛЬКО одним JSON-объектом в блоке ```json без пояснений, строго по схеме:\n{"summary":"что сделано, 1 фраза","ops":[ ...операции... ]}\nОперации:\n'+
 '{"op":"add_block","block":"<id блока>","position":"end"|"start"|{"after":"<id>"}|{"before":"<id>"},"page":"<файл, необязательно>"}\n{"op":"add_block","html":"<section class=\\"sb-section\\">…</section>","position":"end"}\n'+
 '{"op":"replace_block","target":"<id>","html":"<section>…</section>"}\n{"op":"remove_block","target":"<id>"}\n{"op":"move_block","target":"<id>","position":{"after":"<id>"}}\n'+
 '{"op":"set_text","target":"<id>","text":"новый текст без HTML"}\n{"op":"set_attr","target":"<id>","name":"href|src|alt|title|placeholder|data-mailto","value":"…"}\n'+
 '{"op":"set_style","target":"<id>"|"selector":".sb-hero","style":{"background-color":"#123456","padding":"40px"}}\n{"op":"set_theme","theme":{"primary":"#4f46e5","accent":"#f59e0b","font":"Georgia, serif"}}\n'+
 '{"op":"add_page","name":"О нас","file":"about.html","blocks":["sb-nav","sb-about","sb-footer"]}\n{"op":"set_seo","page":"index.html","title":"…","description":"…"}\n'+
 'Правила: используй только id из структуры страницы и только эти блоки: '+blocks.join(', ')+'. Только классы sb-* из темы. Без <script>, без обработчиков on*, без внешних ссылок и картинок. '+
 'НЕ выдумывай телефоны, e-mail, адреса, цены, имена, отзывы и цифры — если их нет в данных пользователя, ставь заглушки [телефон], [e-mail], [адрес], [цена], [имя]. Пиши по-русски.'}
const api={OPS,ATTRS,SCHEMA,CSS_PROPS,parseAIJson,sanitizeHtml,sanitizeStyleObj,factGuard,validate,pickMajority,describe,formatSpec,urlOk};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SBAi=api;
})(typeof window!=='undefined'?window:globalThis);
