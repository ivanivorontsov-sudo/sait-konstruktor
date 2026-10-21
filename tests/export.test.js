const E=require('../src/SiteBuilder/web/export.js');let f=0,n=0;const ok=(m,c)=>{n++;if(!c)f++;console.log(c?'PASS':'FAIL',m)};
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const site={title:'Тест',lang:'ru',description:'Описание сайта',baseUrl:'https://example.ru/',theme:{primary:'#ff0000',themeToggle:true},headCode:'<meta name="yandex-verification" content="abc">'};
const pages=[{id:'a',name:'О нас',file:'about.html',title:'О компании',html:'<a href="index.html">Домой</a>',css:'.x{color:red}'},
 {id:'b',name:'Главная',file:'index.html',title:'Главная & <ко>',description:'Описание "главной"',html:'<body id="bd"><h1>Привет</h1><img src="data:image/png;base64,'+png+'"><a href="about.html">О нас</a></body>',css:'#bd{background:url(data:image/png;base64,'+png+')}'},
 {id:'c',name:'Контакты',file:'',html:'<p>c</p>'},{id:'d',name:'Контакты',file:'',html:'<p>d</p>',noindex:true}];
const r=E.buildSite(site,pages,{themeCss:'body{}',siteJs:'//js'});const F=r.files;
ok('index.html first, others slugified/unique',JSON.stringify(r.pages)==='["index.html","about.html","kontakty.html","kontakty-2.html"]');
ok('all expected files',['index.html','about.html','kontakty.html','css/theme.css','js/site.js','sitemap.xml','robots.txt','404.html','css/index.css','css/about.css'].every(p=>F[p]));
const ix=F['index.html'].text;
ok('doctype, lang, charset, viewport',/^<!DOCTYPE html>\n<html lang="ru">/.test(ix)&&/charset="utf-8"/.test(ix)&&/name="viewport"/.test(ix));
ok('title/description escaped',/<title>Главная &amp; &lt;ко&gt;<\/title>/.test(ix)&&/content="Описание &quot;главной&quot;"/.test(ix));
ok('canonical + og:url',/rel="canonical" href="https:\/\/example.ru\/"/.test(ix)&&/og:url/.test(ix));
ok('body attrs preserved, no nested body',/<body id="bd" data-theme-toggle="1">/.test(ix)&&(ix.match(/<body/g)||[]).length===1);
ok('head code inserted',/yandex-verification/.test(ix));
ok('css/js links',/href="css\/theme.css"/.test(ix)&&/href="css\/index.css"/.test(ix)&&/<script src="js\/site.js"><\/script>/.test(ix));
const asset=Object.keys(F).find(p=>p.startsWith('assets/'));ok('data: image extracted once to assets/',asset&&/\.png$/.test(asset)&&Object.keys(F).filter(p=>p.startsWith('assets/')).length===1&&F[asset].b64===png);
ok('html refers assets/ relative',ix.includes('src="'+asset+'"')&&!ix.includes('data:image'));
ok('css refers ../assets/',F['css/index.css'].text.includes('url(../'+asset+')'));
ok('theme vars + theme css',/--sb-primary:#ff0000/.test(F['css/theme.css'].text)&&/body\{\}/.test(F['css/theme.css'].text));
ok('sitemap lists indexable pages only',/<loc>https:\/\/example.ru\/<\/loc>/.test(F['sitemap.xml'].text)&&/about.html/.test(F['sitemap.xml'].text)&&!/kontakty-2/.test(F['sitemap.xml'].text));
ok('robots with sitemap',/Sitemap: https:\/\/example.ru\/sitemap.xml/.test(F['robots.txt'].text));
ok('noindex meta',/noindex/.test(F['kontakty-2.html'].text)&&!/noindex/.test(ix));
ok('page without css → no css link',!/css\/kontakty.css/.test(F['kontakty.html'].text)&&!F['css/kontakty.css']);
ok('no absolute/backslash paths',Object.keys(F).every(p=>!/^\/|\\|\.\./.test(p)));
const r2=E.buildSite({},[{name:'Одна',file:'my page.html',html:'x'}]);ok('single page → index.html; no sitemap without baseUrl',r2.pages[0]==='index.html'&&!r2.files['sitemap.xml']&&r2.files['robots.txt']);
let thr=false;try{E.buildSite({},[])}catch(e){thr=true}ok('empty project throws',thr);
ok('slugify cyrillic',E.slugify('Наши Услуги и Цены!')==='nashi-uslugi-i-tseny'&&E.slugify('???')==='page');
const r3=E.buildSite({},[{name:'A',file:'index.html',html:'1'},{name:'B',file:'index.html',html:'2'}]);ok('duplicate index renamed',r3.pages[1]!=='index.html');
const r4=E.buildSite({favicon:'data:image/png;base64,'+png},[{name:'A',html:'1'}]);ok('favicon data: → asset file',/<link rel="icon" href="assets\/img-[0-9a-f]+\.png">/.test(r4.files['index.html'].text));
console.log(f?f+' of '+n+' FAILED':'export: all '+n+' PASS');process.exit(f?1:0)
