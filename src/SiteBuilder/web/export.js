// СайтКонструктор: сборка статического сайта (чистые функции, тестируются в node)
(function(root){
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const TR={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
function slugify(s){const r=String(s||'').toLowerCase().split('').map(c=>TR[c]!=null?TR[c]:c).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return r||'page'}
function fileName(f,name,used){let b=String(f||'').trim().replace(/\\/g,'/').split('/').pop().replace(/\.html?$/i,'');b=b?slugify(b):slugify(name);if(b==='index'&&used.has('index.html'))b='page';
 let n=b+'.html',i=2;while(used.has(n))n=b+'-'+(i++)+'.html';used.add(n);return n}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
const EXT={'image/png':'png','image/jpeg':'jpg','image/jpg':'jpg','image/gif':'gif','image/webp':'webp','image/svg+xml':'svg','image/x-icon':'ico','image/vnd.microsoft.icon':'ico','image/avif':'avif'};
// data:-картинки → assets/img-<hash>.<ext>
function extractAssets(text,files){return String(text||'').replace(/data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)/gi,(m,mime,b64)=>{
 b64=b64.replace(/\s+/g,'');const p='assets/img-'+hash(b64)+'.'+(EXT[mime.toLowerCase()]||'bin');if(!files[p])files[p]={b64};return '{{ROOT}}'+p})}
function themeCss(t){t=t||{};const v={primary:t.primary||'#4f46e5',accent:t.accent||'#f59e0b',text:t.text||'#1f2937',bg:t.bg||'#ffffff',muted:t.muted||'#f3f4f6',font:t.font||"'Inter','Segoe UI',Arial,sans-serif",radius:(t.radius!=null?t.radius:12)+'px',head:t.head||t.font||"'Inter','Segoe UI',Arial,sans-serif"};
 return ':root{--sb-primary:'+v.primary+';--sb-accent:'+v.accent+';--sb-text:'+v.text+';--sb-bg:'+v.bg+';--sb-muted:'+v.muted+';--sb-font:'+v.font+';--sb-radius:'+v.radius+';--sb-head:'+v.head+'}\n'}
function pageHtml(site,pg,css,file){const lang=esc(site.lang||'ru');const title=esc(pg.title||pg.name||site.title||'');const d=pg.description||site.description||'';const k=pg.keywords||site.keywords||'';
 const url=site.baseUrl?String(site.baseUrl).replace(/\/+$/,'')+'/'+(file==='index.html'?'':file):'';const og=pg.ogImage||site.ogImage||'';
 const h=['<!DOCTYPE html>','<html lang="'+lang+'">','<head>','<meta charset="utf-8">','<meta name="viewport" content="width=device-width, initial-scale=1">','<title>'+title+'</title>'];
 if(d)h.push('<meta name="description" content="'+esc(d)+'">');if(k)h.push('<meta name="keywords" content="'+esc(k)+'">');if(pg.noindex)h.push('<meta name="robots" content="noindex, nofollow">');
 h.push('<meta property="og:type" content="website">','<meta property="og:title" content="'+title+'">');if(d)h.push('<meta property="og:description" content="'+esc(d)+'">');
 if(og)h.push('<meta property="og:image" content="'+esc(og)+'">');if(url)h.push('<link rel="canonical" href="'+esc(url)+'">','<meta property="og:url" content="'+esc(url)+'">');
 if(site.favicon)h.push('<link rel="icon" href="'+esc(site.favicon)+'">');
 h.push('<link rel="stylesheet" href="css/theme.css">');if(css)h.push('<link rel="stylesheet" href="css/'+file.replace(/\.html$/,'')+'.css">');
 if(site.headCode)h.push(site.headCode);if(pg.headCode)h.push(pg.headCode);h.push('</head>');
 let body=String(pg.html||'').trim();const m=body.match(/^<body([^>]*)>([\s\S]*)<\/body>$/i);let battr='';if(m){battr=m[1];body=m[2]}
 const th=site.theme||{};if(th.themeToggle&&!/data-theme-toggle/.test(battr))battr+=' data-theme-toggle="1"';if(th.dark&&!/class=/.test(battr))battr+=' class="sb-dark"';if(th.anim===false)battr+=' data-anim="0"';
 h.push('<body'+battr+'>',body,'<script src="js/site.js"></script>');if(site.bodyCode)h.push(site.bodyCode);h.push('</body>','</html>','');return h.join('\n')}
/** site: {title,lang,description,keywords,favicon,baseUrl,headCode,bodyCode,theme}; pages: [{name,file,title,description,keywords,ogImage,noindex,html,css}]
 *  opts: {themeCss, siteJs} → {files:{path:{text}|{b64}}, pages:[file]} */
function buildSite(site,pages,opts){site=site||{};opts=opts||{};const files={};const used=new Set();const list=[];
 if(!pages||!pages.length)throw new Error('В проекте нет страниц');
 const ordered=pages.slice();const iHome=ordered.findIndex(p=>/^index(\.html?)?$/i.test(String(p.file||'').trim()));if(iHome>0)ordered.unshift(ordered.splice(iHome,1)[0]);
 ordered.forEach((p,i)=>{const f=i===0?(used.add('index.html'),'index.html'):fileName(p.file,p.name,used);list.push(f)});
 // ссылки на страницы по старому имени файла → новое
 const map={};ordered.forEach((p,i)=>{if(p.file)map[String(p.file).trim()]=list[i];if(p.id)map['#page:'+p.id]=list[i]});
 const fixLinks=t=>t.replace(/href="([^"]*)"/g,(m,u)=>map[u]?'href="'+map[u]+'"':m);
 ordered.forEach((p,i)=>{const file=list[i];let css=extractAssets(p.css||'',files).split('{{ROOT}}').join('../');
  const html=fixLinks(extractAssets(p.html||'',files).split('{{ROOT}}').join(''));
  let s2=Object.assign({},site);if(s2.favicon&&/^data:/.test(s2.favicon))s2.favicon=extractAssets(s2.favicon,files).split('{{ROOT}}').join('');
  files[file]={text:pageHtml(s2,Object.assign({},p,{html}),css.trim(),file)};if(css.trim())files['css/'+file.replace(/\.html$/,'')+'.css']={text:css.trim()+'\n'}});
 files['css/theme.css']={text:themeCss(site.theme)+(opts.themeCss||'')};files['js/site.js']={text:opts.siteJs||''};
 if(site.baseUrl){const b=String(site.baseUrl).replace(/\/+$/,'');const d=new Date().toISOString().slice(0,10);
  files['sitemap.xml']={text:'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+ordered.map((p,i)=>p.noindex?'':'  <url><loc>'+esc(b+'/'+(list[i]==='index.html'?'':list[i]))+'</loc><lastmod>'+d+'</lastmod></url>\n').join('')+'</urlset>\n'};
  files['robots.txt']={text:'User-agent: *\nAllow: /\nSitemap: '+b+'/sitemap.xml\n'}}
 else files['robots.txt']={text:'User-agent: *\nAllow: /\n'};
 if(opts.notFound!==false&&!files['404.html'])files['404.html']={text:pageHtml(site,{title:'Страница не найдена',noindex:true,html:'<section class="sb-section" style="text-align:center;padding:120px 20px"><h1>404</h1><p>Такой страницы нет.</p><p><a class="sb-btn" href="index.html">На главную</a></p></section>'},'','404.html')};
 return {files,pages:list}}
const api={slugify,buildSite,extractAssets,themeCss,pageHtml,hash,esc};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SBExport=api;
})(typeof window!=='undefined'?window:globalThis);
