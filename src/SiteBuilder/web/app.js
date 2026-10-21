// СайтКонструктор — редактор на GrapesJS
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const WV=window.chrome&&window.chrome.webview;
const H=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function toast(t,ms){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),ms||2600);$('#stMsg').textContent=t}
function modal(html,wide){const w=document.createElement('div');w.className='mw';w.innerHTML='<div class="md"'+(wide?' style="width:min(1000px,96vw)"':'')+'>'+html+'</div>';document.body.append(w);
 w.addEventListener('mousedown',e=>{if(e.target===w)w.remove()});w.q=s=>w.querySelector(s);return w}
let THEME_CSS='',SITE_JS='';
const S={site:{title:'Мой сайт',lang:'ru',description:'',keywords:'',baseUrl:'',favicon:'',headCode:'',bodyCode:'',theme:{primary:'#4f46e5',accent:'#f59e0b'}},meta:{},file:null,dirty:false};
const LS='sitebuilder-autosave';
// ===== хост (WebView2) =====
const HOSTP={};let hostSeq=0;
function host(cmd,data){if(!WV)return Promise.resolve(null);const id='h'+(++hostSeq);return new Promise(r=>{HOSTP[id]=r;WV.postMessage(Object.assign({cmd,id},data||{}))})}
if(WV)WV.addEventListener('message',e=>{const m=e.data;if(m&&m.type==='hostReply'&&HOSTP[m.id]){HOSTP[m.id](m);delete HOSTP[m.id]}else if(window.onHostMsg)window.onHostMsg(m)});
// ===== редактор =====
const SMRU={'font-family':'Шрифт','font-size':'Размер шрифта','font-weight':'Насыщенность',color:'Цвет текста','line-height':'Межстрочный','letter-spacing':'Межбуквенный','text-align':'Выравнивание','text-transform':'Регистр','text-decoration':'Оформление','background-color':'Цвет фона',background:'Фон (картинка/градиент)',width:'Ширина','max-width':'Макс. ширина','min-height':'Мин. высота',height:'Высота',margin:'Внешние отступы',padding:'Внутренние отступы','border-radius':'Скругление',border:'Рамка','box-shadow':'Тень',opacity:'Прозрачность',display:'Отображение','flex-direction':'Направление','justify-content':'Выравн. по оси','align-items':'Выравн. поперёк',gap:'Промежуток',position:'Позиция',top:'Сверху',left:'Слева','z-index':'Слой (z-index)',transition:'Плавность',transform:'Трансформация'};
(function(L){L.styleManager=L.styleManager||{};L.styleManager.properties=Object.assign({},L.styleManager.properties,SMRU);L.traitManager=L.traitManager||{};L.traitManager.traits=L.traitManager.traits||{};L.traitManager.traits.labels=Object.assign({},L.traitManager.traits.labels,{title:'Подсказка (title)',href:'Адрес ссылки',target:'Где открывать',alt:'Описание картинки (alt)',id:'Идентификатор (id)',placeholder:'Подсказка в поле',name:'Имя поля',type:'Тип',required:'Обязательное',value:'Значение',method:'Метод',action:'Обработчик формы'})})(window.gjsLocaleRu);
const editor=grapesjs.init({container:'#gjs',height:'100%',fromElement:false,showOffsets:true,noticeOnUnload:false,
 i18n:{locale:'ru',detectLocale:false,messages:{ru:window.gjsLocaleRu}},
 storageManager:false,undoManager:{trackSelection:false},
 panels:{defaults:[]},
 deviceManager:{devices:[{id:'desktop',name:'Компьютер',width:''},{id:'tablet',name:'Планшет',width:'820px',widthMedia:'992px'},{id:'mobile',name:'Телефон',width:'390px',widthMedia:'768px'}]},
 blockManager:{appendTo:'#blocks'},layerManager:{appendTo:'#layers'},traitManager:{appendTo:'#traits'},selectorManager:{componentFirst:true},
 styleManager:{appendTo:'#styles',sectors:[
  {name:'Текст',open:true,properties:['font-family','font-size','font-weight','color','line-height','letter-spacing','text-align','text-transform','text-decoration']},
  {name:'Фон',open:false,properties:['background-color','background']},
  {name:'Размеры',open:false,properties:['width','max-width','min-height','height','margin','padding']},
  {name:'Рамка и тень',open:false,properties:['border-radius','border','box-shadow','opacity']},
  {name:'Раскладка',open:false,properties:['display','flex-direction','justify-content','align-items','gap','position','top','left','z-index']},
  {name:'Эффекты',open:false,properties:['transition','transform']}]},
 assetManager:{embedAsBase64:true,upload:false,uploadText:'Перетащите картинки сюда или нажмите, чтобы выбрать файл',addBtnText:'Добавить по адресу',modalTitle:'Изображения'},
 canvas:{styles:['theme.css']},
 plugins:[window['gjs-blocks-basic'],window['grapesjs-plugin-forms'],window['grapesjs-custom-code'],window['grapesjs-tabs'],window['grapesjs-tooltip']].filter(Boolean).map(p=>p.default||p),
 pluginsOpts:{'gjs-blocks-basic':{flexGrid:true}}});
window.editor=editor;
// русские категории для блоков плагинов
editor.on('load',()=>{const bm=editor.BlockManager;const RU={column1:'1 колонка',column2:'2 колонки',column3:'3 колонки','column3-7':'Колонки 3/7',text:'Текст',link:'Ссылка',image:'Картинка',video:'Видео',map:'Карта (Google)',form:'Форма',input:'Поле ввода',textarea:'Многострочное поле',select:'Список',button:'Кнопка',label:'Подпись',checkbox:'Флажок',radio:'Переключатель','custom-code':'Свой код (HTML)',tabs:'Вкладки (плагин)',tooltip:'Подсказка'};
 bm.getAll().forEach(b=>{if(b.id.startsWith('sb-'))return;const c=b.get('category');const cn=c&&(c.id||c.get&&c.get('id')||c);b.set('category',/form/i.test(String(cn))?'Элементы форм':'Простые элементы');if(RU[b.id])b.set('label',RU[b.id])});
 const all=bm.getAll().models.slice();const order=['Первый экран','Навигация','Контент','Продажи','Медиа','Интерактив','Формы','Магазин','Блог','Простые элементы','Элементы форм'];const cat=b=>{const c=b.get('category');return typeof c==='string'?c:(c&&(c.get?c.get('label')||c.get('id'):c.label||c.id))||''};
 all.sort((a,b)=>order.indexOf(cat(a))-order.indexOf(cat(b)));bm.getAll().reset(all);bm.render();
 editor.BlockManager.getCategories().each(c=>c.set('open',['Первый экран','Навигация','Контент'].includes(c.get('id'))));});
sbAddBlocks(editor);
// стили только для холста (модальные окна и вкладки видны при редактировании)
function frameStyle(){const d=editor.Canvas.getDocument();if(!d)return;let st=d.getElementById('sb-vars');if(!st){st=d.createElement('style');st.id='sb-vars';d.head.appendChild(st)}
 st.textContent=SBExport.themeCss(S.site.theme)+(window.SB_BLOCKS_CANVAS_CSS||'')+(S.site.theme.dark?'body{--sb-bg:#0f172a;--sb-text:#e5e7eb;--sb-muted:#1e293b}':'')+'.sb-reveal{opacity:1!important;transform:none!important}'}
editor.on('canvas:frame:load',()=>setTimeout(frameStyle,50));editor.on('load',()=>setTimeout(frameStyle,200));
// ===== состояние/страницы =====
const pages=()=>editor.Pages.getAll();
const cur=()=>editor.Pages.getSelected();
function meta(p){p=p||cur();const id=p.getId();if(!S.meta[id])S.meta[id]={file:'',title:p.getName()||'',description:'',keywords:'',noindex:false};return S.meta[id]}
function pageFile(p){const m=meta(p);return m.file||(p===pages()[0]?'index.html':SBExport.slugify(p.getName())+'.html')}
function refreshPages(){const sel=$('#pageSel');sel.innerHTML=pages().map(p=>'<option value="'+H(p.getId())+'">'+H(p.getName()||'Страница')+' — '+H(pageFile(p))+'</option>').join('');sel.value=cur().getId();
 $('#pagesList').innerHTML=pages().map(p=>'<div class="hitem"><b>'+H(p.getName())+'</b> <small>'+H(pageFile(p))+'</small><div class="aibtns"><button data-go="'+H(p.getId())+'">Открыть</button><button data-dup="'+H(p.getId())+'">Копия</button></div></div>').join('')+'<button id="pgAdd2">➕ Добавить страницу</button>';
 $$('#pagesList [data-go]').forEach(b=>b.onclick=()=>{editor.Pages.select(b.dataset.go);refreshPages()});
 $$('#pagesList [data-dup]').forEach(b=>b.onclick=()=>{const p=editor.Pages.get(b.dataset.dup);addPage(p.getName()+' (копия)',p.getMainComponent().toHTML())});$('#pgAdd2').onclick=()=>pageDialog(null)}
function addPage(name,html,file){const used=new Set(pages().map(pageFile));let f=file||SBExport.slugify(name)+'.html';let i=2;while(used.has(f))f=f.replace(/(-\d+)?\.html$/,'-'+(i++)+'.html');
 const p=editor.Pages.add({name,component:html||''});S.meta[p.getId()]={file:f,title:name,description:'',keywords:'',noindex:false};editor.Pages.select(p);refreshPages();dirty();return p}
function dirty(){S.dirty=true;clearTimeout(dirty.t);dirty.t=setTimeout(autosave,1500)}
function projectJson(){return {format:'sitebuilder-1',app:'СайтКонструктор',saved:new Date().toISOString(),site:S.site,meta:S.meta,gjs:editor.getProjectData()}}
function autosave(){try{localStorage.setItem(LS,JSON.stringify(projectJson()));$('#stMsg').textContent='Автосохранено '+new Date().toLocaleTimeString('ru-RU')}catch(e){}}
function loadProject(j){if(!j||!j.gjs)throw new Error('Это не файл проекта СайтКонструктора');S.site=Object.assign({},S.site,j.site||{});S.site.theme=Object.assign({},(j.site||{}).theme||{});S.meta=j.meta||{};
 editor.loadProjectData(j.gjs);editor.UndoManager.clear();refreshPages();setTimeout(frameStyle,300);S.dirty=false}
function newFromTemplate(key){const t=SB_TEMPLATES[key];S.meta={};S.site=Object.assign({},S.site,{title:t.name==='Пустой сайт'?'Мой сайт':t.name,theme:Object.assign({primary:'#4f46e5',accent:'#f59e0b'},t.theme)});
 editor.loadProjectData({pages:t.pages.map((p,i)=>({id:'p'+i+'-'+Date.now().toString(36),name:p.name,component:p.html}))});
 pages().forEach((p,i)=>S.meta[p.getId()]={file:t.pages[i].file,title:t.pages[i].title||t.pages[i].name,description:'',keywords:'',noindex:false});
 editor.UndoManager.clear();S.file=null;refreshPages();setTimeout(frameStyle,300);dirty();toast('Создан сайт «'+t.name+'». Перетаскивайте блоки слева, двойной щелчок — правка текста.')}
// ===== сборка сайта =====
function collect(){const list=pages().map(p=>{const m=meta(p);const main=p.getMainComponent();return {id:p.getId(),name:p.getName(),file:pageFile(p),title:m.title||p.getName(),description:m.description,keywords:m.keywords,noindex:m.noindex,ogImage:m.ogImage,
  html:editor.getHtml({component:main}).replace(/^<body[^>]*>|<\/body>$/g,''),css:editor.getCss({component:main,avoidProtected:true})}});
 return SBExport.buildSite(S.site,list,{themeCss:THEME_CSS,siteJs:SITE_JS})}
async function loadStatic(){THEME_CSS=await (await fetch('theme.css')).text();SITE_JS=await (await fetch('site.js')).text()}
function b64ToBytes(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
async function zipBlob(files){const z=new JSZip();for(const [p,f] of Object.entries(files))z.file(p,f.b64!=null?b64ToBytes(f.b64):f.text);return z.generateAsync({type:'blob'})}
function download(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
async function doExport(kind){let r;try{r=collect()}catch(e){toast('Ошибка сборки: '+e.message);return}
 const name=SBExport.slugify(S.site.title||'site');
 if(kind==='zip'){if(WV){const x=await host('exportZip',{files:r.files,name:name+'.zip'});toast(x&&x.ok?'ZIP сохранён: '+x.path:(x&&x.error)||'Отменено')}else download(name+'.zip',await zipBlob(r.files));return}
 if(kind==='folder'){if(WV){const x=await host('exportFolder',{files:r.files,name});toast(x&&x.ok?'Сайт сохранён в папку: '+x.path+' ('+Object.keys(r.files).length+' файлов)':(x&&x.error)||'Отменено',5000)}else{download(name+'.zip',await zipBlob(r.files));toast('В браузере папку сохранить нельзя — скачан ZIP')}return}
 if(kind==='preview'){if(WV){const x=await host('preview',{files:r.files});if(x&&!x.ok)toast(x.error)}else{const w=window.open('','_blank');w.document.write(r.files['index.html'].text)}return}
 if(kind==='ftp')ftpDialog(r)}
function ftpDialog(r){const f=JSON.parse(localStorage.sbFtp||'{}');const w=modal('<h2>Загрузка на хостинг по FTP</h2><p class="hint">Данные берутся в панели вашего хостинга (раздел FTP). Пароль не сохраняется.</p><div class="cols"><div><label>Сервер</label><input id="fh" placeholder="ftp.example.ru" value="'+H(f.h||'')+'"></div><div><label>Порт</label><input id="fp" value="'+H(f.p||21)+'"></div><div><label>Логин</label><input id="fu" value="'+H(f.u||'')+'"></div><div><label>Пароль</label><input id="fw" type="password"></div></div><label>Папка на сервере</label><input id="fd" value="'+H(f.d||'/public_html')+'"><label><input type="checkbox" id="fs" '+(f.s?'checked':'')+'> FTPS (защищённое соединение)</label><div id="fo" class="hint"></div><div class="row"><button id="fx">Отмена</button><button class="primary" id="fg">Загрузить '+Object.keys(r.files).length+' файлов</button></div>');
 w.q('#fx').onclick=()=>w.remove();w.q('#fg').onclick=async()=>{const d={h:w.q('#fh').value.trim(),p:+w.q('#fp').value||21,u:w.q('#fu').value.trim(),d:w.q('#fd').value.trim(),s:w.q('#fs').checked};localStorage.sbFtp=JSON.stringify(d);
  if(!WV){w.q('#fo').textContent='FTP работает только в программе для Windows.';return}w.q('#fo').textContent='⏳ Загружаю…';const x=await host('ftp',Object.assign({files:r.files,pass:w.q('#fw').value},d));
  w.q('#fo').innerHTML=x&&x.ok?'<span class="ok">✅ Загружено файлов: '+x.count+'</span>':'<span class="err">'+H(x&&x.error||'Ошибка')+'</span>'}}
// ===== диалоги =====
function templatesDialog(){const w=modal('<h2>Новый сайт — выберите шаблон</h2><div class="tpls">'+Object.entries(SB_TEMPLATES).map(([k,t])=>'<div class="tpl" data-k="'+k+'"><div class="pv"><iframe loading="lazy" data-k="'+k+'"></iframe></div><b>'+H(t.name)+'</b><small>'+H(t.desc)+(t.pages.length>1?' · '+t.pages.length+' стр.':'')+'</small></div>').join('')+'</div><div class="row"><button id="tx">Закрыть</button></div>',true);
 w.querySelectorAll('iframe').forEach(f=>{const t=SB_TEMPLATES[f.dataset.k];f.srcdoc='<style>'+SBExport.themeCss(Object.assign({primary:'#4f46e5',accent:'#f59e0b'},t.theme))+THEME_CSS+'</style>'+(t.pages[0].html||'<p style="padding:40px;font:40px Arial;color:#94a3b8">Пустая страница</p>')});
 w.querySelectorAll('.tpl').forEach(d=>d.onclick=()=>{if(S.dirty&&pages().some(p=>p.getMainComponent().components().length)&&!confirm('Текущий проект будет закрыт. Несохранённые изменения пропадут (есть автосохранение). Продолжить?'))return;newFromTemplate(d.dataset.k);w.remove()});w.q('#tx').onclick=()=>w.remove()}
function pageDialog(p){const isNew=!p;const m=p?meta(p):{file:'',title:'',description:'',keywords:'',noindex:false};
 const w=modal('<h2>'+(isNew?'Новая страница':'Страница и SEO')+'</h2><div class="cols"><div><label>Название в меню</label><input id="pn" value="'+H(p?p.getName():'Новая страница')+'"></div><div><label>Имя файла</label><input id="pf" value="'+H(p?pageFile(p):'')+'" placeholder="about.html"></div></div>'+
  '<label>Заголовок (title) — видно во вкладке браузера и в поиске</label><input id="pt" value="'+H(m.title)+'"><label>Описание (meta description) — 120–160 символов</label><textarea id="pd" rows="3">'+H(m.description)+'</textarea><div class="hint" id="pdc"></div>'+
  '<label>Ключевые слова</label><input id="pk" value="'+H(m.keywords)+'"><label>Картинка для соцсетей (og:image, адрес)</label><input id="po" value="'+H(m.ogImage||'')+'"><label><input type="checkbox" id="pi" '+(m.noindex?'checked':'')+'> Скрыть от поисковиков (noindex)</label>'+
  (isNew?'':'<hr style="border-color:#334155"><h2>Сайт целиком</h2><div class="cols"><div><label>Название сайта</label><input id="st" value="'+H(S.site.title)+'"></div><div><label>Адрес сайта (для sitemap.xml и canonical)</label><input id="su" value="'+H(S.site.baseUrl)+'" placeholder="https://example.ru"></div></div><label>Иконка сайта (favicon, адрес или файл)</label><div style="display:flex;gap:6px"><input id="sf" value="'+H(S.site.favicon&&S.site.favicon.length>200?'(загружена картинка)':S.site.favicon)+'"><button id="sfb">Файл…</button></div><label>Код в &lt;head&gt; (счётчики Метрики, верификация)</label><textarea class="code" style="height:70px" id="sh">'+H(S.site.headCode)+'</textarea><label>Код перед &lt;/body&gt;</label><textarea class="code" style="height:60px" id="sb">'+H(S.site.bodyCode)+'</textarea>')+
  '<div class="row"><button id="px">Отмена</button><button class="primary" id="pok">'+(isNew?'Создать':'Сохранить')+'</button></div>');
 const cnt=()=>{const l=w.q('#pd').value.length;w.q('#pdc').textContent='Символов: '+l+(l>160?' — длинновато':l&&l<70?' — коротковато':'')};w.q('#pd').oninput=cnt;cnt();let fav=null;
 if(w.q('#sfb'))w.q('#sfb').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=()=>{const r=new FileReader();r.onload=()=>{fav=r.result;w.q('#sf').value='(загружена картинка)'};r.readAsDataURL(i.files[0])};i.click()};
 w.q('#px').onclick=()=>w.remove();w.q('#pok').onclick=()=>{const name=w.q('#pn').value.trim()||'Страница';let f=w.q('#pf').value.trim();if(f&&!/\.html$/.test(f))f+='.html';if(f)f=SBExport.slugify(f.replace(/\.html$/,''))+'.html';
  const dup=pages().find(x=>x!==p&&pageFile(x)===f);if(dup){alert('Файл '+f+' уже занят страницей «'+dup.getName()+'»');return}
  const target=isNew?addPage(name,'<section class="sb-section"><div class="sb-container"><h1>'+H(name)+'</h1><p>Перетащите сюда блоки слева.</p></div></section>',f||undefined):p;
  if(!isNew)target.setName(name);const mm=meta(target);if(f)mm.file=f;mm.title=w.q('#pt').value||name;mm.description=w.q('#pd').value;mm.keywords=w.q('#pk').value;mm.ogImage=w.q('#po').value;mm.noindex=w.q('#pi').checked;
  if(!isNew){S.site.title=w.q('#st').value;S.site.baseUrl=w.q('#su').value.trim();const sf=w.q('#sf').value;S.site.favicon=fav||(sf==='(загружена картинка)'?S.site.favicon:sf);S.site.headCode=w.q('#sh').value;S.site.bodyCode=w.q('#sb').value}
  refreshPages();dirty();w.remove();toast('Сохранено')}}
function themeDialog(){const t=S.site.theme;const w=modal('<h2>Тема сайта</h2><label>Палитра в один клик</label><div class="pal">'+SB_PALETTES.map((p,i)=>'<button data-p="'+i+'"><span class="sw" style="background:'+p[1]+'"></span><span class="sw" style="background:'+p[2]+'"></span>'+p[0]+'</button>').join('')+'</div>'+
 '<label>Шрифтовая пара</label><div class="pal">'+SB_FONTS.map((f,i)=>'<button data-f="'+i+'" style="font-family:'+H(f[2])+'">'+f[0]+'</button>').join('')+'</div>'+
 '<div class="cols"><div><label>Основной цвет</label><input type="color" id="c1" value="'+(t.primary||'#4f46e5')+'"></div><div><label>Акцент</label><input type="color" id="c2" value="'+(t.accent||'#f59e0b')+'"></div><div><label>Текст</label><input type="color" id="c3" value="'+(t.text||'#1f2937')+'"></div><div><label>Фон</label><input type="color" id="c4" value="'+(t.bg||'#ffffff')+'"></div></div>'+
 '<label>Скругление углов: <span id="rv">'+(t.radius!=null?t.radius:12)+'</span> px</label><input type="range" id="rr" min="0" max="32" value="'+(t.radius!=null?t.radius:12)+'" style="width:100%">'+
 '<label><input type="checkbox" id="tt" '+(t.themeToggle?'checked':'')+'> Кнопка «светлая/тёмная тема» на сайте</label><label><input type="checkbox" id="td" '+(t.dark?'checked':'')+'> Тёмная тема по умолчанию</label><label><input type="checkbox" id="ta" '+(t.anim!==false?'checked':'')+'> Плавное появление блоков при прокрутке</label>'+
 '<div class="row"><button class="primary" id="tok">Готово</button></div>');
 const upd=()=>{Object.assign(t,{primary:w.q('#c1').value,accent:w.q('#c2').value,text:w.q('#c3').value,bg:w.q('#c4').value,radius:+w.q('#rr').value,themeToggle:w.q('#tt').checked,dark:w.q('#td').checked,anim:w.q('#ta').checked});w.q('#rv').textContent=t.radius;frameStyle();dirty()};
 w.querySelectorAll('input').forEach(i=>i.oninput=upd);
 w.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const p=SB_PALETTES[b.dataset.p];w.q('#c1').value=p[1];w.q('#c2').value=p[2];upd()});
 w.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const f=SB_FONTS[b.dataset.f];t.font=f[1];t.head=f[2];upd()});w.q('#tok').onclick=()=>w.remove()}
function codeDialog(){const main=cur().getMainComponent();const w=modal('<h2>Код страницы «'+H(cur().getName())+'»</h2><label>HTML</label><textarea class="code" id="ch">'+H(editor.getHtml({component:main}).replace(/^<body[^>]*>|<\/body>$/g,''))+'</textarea><label>CSS</label><textarea class="code" id="cc" style="height:150px">'+H(editor.getCss({component:main,avoidProtected:true}))+'</textarea><div class="hint">Можно править код напрямую и нажать «Применить». Скрипты лучше добавлять блоком «Свой код».</div><div class="row"><button id="cx">Закрыть</button><button class="primary" id="ca">Применить</button></div>',true);
 w.q('#cx').onclick=()=>w.remove();w.q('#ca').onclick=()=>{main.components(w.q('#ch').value);editor.Css.addRules(w.q('#cc').value);dirty();w.remove();toast('Код применён')}}
function exportMenu(btn){const r=btn.getBoundingClientRect();const m=document.createElement('div');m.className='menu';m.style.cssText='top:'+(r.bottom+4)+'px;right:10px';
 m.innerHTML='<button data-k="folder">📁 В папку (готово к загрузке на хостинг)</button><button data-k="zip">🗜 В ZIP-архив</button><button data-k="ftp">🌐 Загрузить по FTP…</button><button data-k="preview">👁 Открыть в браузере</button>';document.body.append(m);
 const close=e=>{if(!m.contains(e.target)){m.remove();document.removeEventListener('mousedown',close)}};setTimeout(()=>document.addEventListener('mousedown',close));m.querySelectorAll('button').forEach(b=>b.onclick=()=>{m.remove();doExport(b.dataset.k)})}
// ===== сохранение/открытие =====
async function saveProject(as){const json=JSON.stringify(projectJson());const name=SBExport.slugify(S.site.title)+'.sitebuilder.json';
 if(WV){const x=await host('saveProject',{json,name,path:as?null:S.file});if(x&&x.ok){S.file=x.path;S.dirty=false;toast('Проект сохранён: '+x.path)}}else{download(name,new Blob([json],{type:'application/json'}));S.dirty=false;toast('Проект скачан')}}
async function openProject(){if(WV){const x=await host('openProject');if(x&&x.ok){try{loadProject(JSON.parse(x.json));S.file=x.path;toast('Открыт: '+x.path)}catch(e){alert(e.message)}}return}
 const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{try{loadProject(JSON.parse(await i.files[0].text()));toast('Проект открыт')}catch(e){alert(e.message)}};i.click()}
// ===== быстрые действия для выделенного =====
function quickPanel(c){const q=$('#quick');if(!c){q.innerHTML='';return}const root=topSection(c);
 q.innerHTML='<div class="hint">Выделено: <b>'+H(c.getName())+'</b></div><button id="qUp">⬆ Блок выше</button><button id="qDn">⬇ Блок ниже</button><button id="qDup">⧉ Дублировать</button><button id="qDel">🗑 Удалить</button><button id="qSel">⤴ Выделить секцию</button>'+(c.is('image')?'<button id="qImg">🖼 Заменить картинку</button>':'')+(c.is('link')||c.getAttributes().href!=null?'<button id="qLnk">🔗 Ссылка</button>':'');
 const mv=d=>{const p=root.parent(),i=root.index();if(!p)return;const j=i+d;if(j<0||j>=p.components().length)return;root.remove({temporary:true});p.components().add(root,{at:j});editor.select(root);dirty()};
 $('#qUp').onclick=()=>mv(-1);$('#qDn').onclick=()=>mv(1);$('#qDup').onclick=()=>{const p=root.parent();p.components().add(root.clone(),{at:root.index()+1});dirty()};$('#qDel').onclick=()=>{c.remove();quickPanel(null);dirty()};$('#qSel').onclick=()=>editor.select(root);
 if($('#qImg'))$('#qImg').onclick=()=>editor.runCommand('core:open-assets',{target:c,types:['image'],accept:'image/*',select(a,complete){c.set('src',a.getSrc());if(complete)editor.Modal.close()}});
 if($('#qLnk'))$('#qLnk').onclick=()=>{const all=pages().map(pageFile);const v=prompt('Адрес ссылки (страница: '+all.join(', ')+', якорь #id, https://… , tel:, mailto:)',c.getAttributes().href||'');if(v!=null){c.addAttributes({href:v});dirty()}}}
function topSection(c){let x=c;while(x.parent()&&x.parent().get('type')!=='wrapper')x=x.parent();return x}
editor.on('component:selected',c=>{$('#selHint').style.display='none';quickPanel(c)});editor.on('component:deselected',()=>{if(!editor.getSelected()){$('#selHint').style.display='';quickPanel(null)}});
editor.on('update',dirty);editor.on('page:select',()=>{refreshPages();setTimeout(frameStyle,200)});
// ===== кнопки =====
$('#bNew').onclick=templatesDialog;$('#bOpen').onclick=openProject;$('#bSave').onclick=()=>saveProject(false);
$('#pageSel').onchange=e=>editor.Pages.select(e.target.value);$('#bPageAdd').onclick=()=>pageDialog(null);$('#bPageEdit').onclick=()=>pageDialog(cur());
$('#bPageDel').onclick=()=>{if(pages().length<2){toast('Нельзя удалить единственную страницу');return}if(confirm('Удалить страницу «'+cur().getName()+'»?')){const p=cur();delete S.meta[p.getId()];editor.Pages.remove(p);editor.Pages.select(pages()[0]);refreshPages();dirty()}};
$$('#devs button').forEach(b=>b.onclick=()=>{editor.setDevice({desktop:'Компьютер',tablet:'Планшет',mobile:'Телефон'}[b.dataset.dev]||b.dataset.dev);editor.setDevice(b.dataset.dev);$$('#devs button').forEach(x=>x.classList.toggle('on',x===b))});
$('#bUndo').onclick=()=>editor.UndoManager.undo();$('#bRedo').onclick=()=>editor.UndoManager.redo();
$('#bOutline').onclick=e=>{const on=!editor.Commands.isActive('core:component-outline');on?editor.runCommand('core:component-outline'):editor.stopCommand('core:component-outline');e.target.classList.toggle('on',on)};
$('#bCode').onclick=codeDialog;$('#bTheme').onclick=themeDialog;$('#bPreview').onclick=()=>doExport('preview');$('#bExport').onclick=e=>exportMenu(e.currentTarget);
$('#bAI').onclick=()=>tab('right','ai');
function tab(side,t){$$('#'+side+' .tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('#'+side+' .pane').forEach(p=>p.classList.toggle('on',p.id===t+'P'))}
$$('#left .tabs button').forEach(b=>b.onclick=()=>tab('left',b.dataset.t));$$('#right .tabs button').forEach(b=>b.onclick=()=>tab('right',b.dataset.t));
$('#blockSearch').oninput=e=>{const q=e.target.value.toLowerCase();const bm=editor.BlockManager;const all=bm.getAll();bm.render(q?all.filter(b=>String(b.get('label')).toLowerCase().includes(q)):all.models)};
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject(e.shiftKey)}if(e.ctrlKey&&e.key.toLowerCase()==='o'){e.preventDefault();openProject()}});
window.addEventListener('beforeunload',autosave);
// ===== старт =====
(async()=>{await loadStatic();let restored=false;
 try{const a=localStorage.getItem(LS);if(a&&!/#(fresh|tpl=)/.test(location.hash)){loadProject(JSON.parse(a));restored=true;toast('Восстановлен последний проект (автосохранение)')}}catch(e){}
 if(!restored){newFromTemplate(/#tpl=(\w+)/.test(location.hash)?RegExp.$1:'landing');if(!/#tpl=/.test(location.hash))setTimeout(templatesDialog,400)}
 if(WV)host('ready')})();
