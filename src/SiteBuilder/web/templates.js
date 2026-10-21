// Шаблоны сайтов: набор страниц из блоков + тема
(function(){
const b=id=>window.SB_BLOCKS[id][3];
const nav=(logo,items)=>`<header class="sb-nav"><a class="sb-logo" href="index.html">${logo}</a><button class="sb-burger" aria-label="Меню">☰</button><nav class="sb-menu">${items.map(([t,h])=>`<a href="${h}">${t}</a>`).join('')}</nav></header>`;
const T={
 empty:{name:'Пустой сайт',desc:'Одна чистая страница',theme:{},pages:[{name:'Главная',file:'index.html',html:''}]},
 landing:{name:'Лендинг услуги',desc:'Первый экран, преимущества, цены, отзывы, заявка',theme:{primary:'#4f46e5'},pages:[{name:'Главная',file:'index.html',title:'Услуга — главная',
  html:nav('Компания',[['Услуги','#uslugi'],['Цены','#ceny'],['Контакты','#kontakty']])+b('sb-hero')+b('sb-features')+b('sb-stats')+b('sb-pricing')+b('sb-testimonials')+b('sb-faq')+b('sb-contact')+b('sb-footer')}]},
 business:{name:'Сайт компании',desc:'3 страницы: главная, о компании, контакты',theme:{primary:'#0f766e',accent:'#fbbf24'},pages:[
  {name:'Главная',file:'index.html',title:'Компания',html:nav('Компания',[['Главная','index.html'],['О компании','about.html'],['Контакты','contacts.html']])+b('sb-hero-split')+b('sb-features')+b('sb-cta')+b('sb-footer')},
  {name:'О компании',file:'about.html',title:'О компании',html:nav('Компания',[['Главная','index.html'],['О компании','about.html'],['Контакты','contacts.html']])+b('sb-about')+b('sb-stats')+b('sb-team')+b('sb-footer')},
  {name:'Контакты',file:'contacts.html',title:'Контакты',html:nav('Компания',[['Главная','index.html'],['О компании','about.html'],['Контакты','contacts.html']])+b('sb-contact')+b('sb-map')+b('sb-footer')}]},
 portfolio:{name:'Портфолио',desc:'Фотограф, дизайнер: галерея и обо мне',theme:{primary:'#111827',accent:'#e11d48',font:"Georgia,'Times New Roman',serif"},pages:[
  {name:'Работы',file:'index.html',title:'Портфолио',html:nav('Имя Фамилия',[['Работы','index.html'],['Обо мне','about.html']])+b('sb-hero')+b('sb-gallery')+b('sb-cta')+b('sb-footer')},
  {name:'Обо мне',file:'about.html',title:'Обо мне',html:nav('Имя Фамилия',[['Работы','index.html'],['Обо мне','about.html']])+b('sb-about')+b('sb-testimonials')+b('sb-contact')+b('sb-footer')}]},
 cafe:{name:'Кафе / ресторан',desc:'Меню-цены, галерея, карта',theme:{primary:'#b45309',accent:'#fde68a'},pages:[{name:'Главная',file:'index.html',title:'Кафе',
  html:nav('Кафе',[['Меню','#ceny'],['Галерея','#gal'],['Контакты','#kontakty']])+b('sb-hero')+b('sb-about')+b('sb-pricing').replace('Тарифы','Меню')+b('sb-gallery').replace('<section class="sb-section">','<section class="sb-section" id="gal">')+b('sb-map')+b('sb-contact')+b('sb-footer')}]}};
window.SB_TEMPLATES=T;
})();
(function(){const T=window.SB_TEMPLATES,b=id=>window.SB_BLOCKS[id][3];
const nav=(l,it)=>`<header class="sb-nav"><a class="sb-logo" href="index.html">${l}</a><button class="sb-burger" aria-label="Меню">☰</button><nav class="sb-menu">${it.map(([t,h])=>`<a href="${h}">${t}</a>`).join('')}</nav></header>`;
T.startup={name:'Стартап / IT',desc:'Тёмный экран, логотипы, счётчики, вкладки, цены',theme:{primary:'#7c3aed',accent:'#22d3ee',themeToggle:true},pages:[{name:'Главная',file:'index.html',title:'Продукт',html:nav('Продукт',[['Возможности','#uslugi'],['Цены','#ceny'],['Контакты','#kontakty']])+b('sb-hero-dark')+b('sb-logos')+b('sb-features')+b('sb-counters')+b('sb-tabs')+b('sb-pricing')+b('sb-faq')+b('sb-cta')+b('sb-contact')+b('sb-footer')}]};
T.shop={name:'Витрина магазина',desc:'Каталог с заказом во всплывающем окне',theme:{primary:'#e11d48',accent:'#fb923c'},pages:[{name:'Главная',file:'index.html',title:'Магазин',html:nav('Магазин',[['Каталог','#katalog'],['Доставка','#dostavka'],['Контакты','#kontakty']])+b('sb-slider')+b('sb-products').replace('<section class="sb-section">','<section class="sb-section" id="katalog">')+b('sb-timeline').replace('Как мы работаем','Доставка').replace('<section class="sb-section">','<section class="sb-section" id="dostavka">')+b('sb-testimonials')+b('sb-contact')+b('sb-footer')}]};
T.blog={name:'Блог',desc:'Лента статей и страница статьи',theme:{primary:'#0f172a',accent:'#f59e0b',font:'Georgia,"Times New Roman",serif'},pages:[
 {name:'Блог',file:'index.html',title:'Блог',html:nav('Мой блог',[['Статьи','index.html'],['Обо мне','about.html']])+b('sb-hero-center')+b('sb-blog')+b('sb-footer-min')},
 {name:'Статья',file:'post.html',title:'Статья',html:nav('Мой блог',[['Статьи','index.html'],['Обо мне','about.html']])+b('sb-article')+b('sb-blog').replace('Блог','Ещё статьи')+b('sb-footer-min')},
 {name:'Обо мне',file:'about.html',title:'Обо мне',html:nav('Мой блог',[['Статьи','index.html'],['Обо мне','about.html']])+b('sb-about')+b('sb-contact')+b('sb-footer-min')}]};
T.landing.pages[0].html=T.landing.pages[0].html.replace(b('sb-hero'),b('sb-hero-dark')).replace(b('sb-stats'),b('sb-counters')+b('sb-timeline'));
T.portfolio.pages[0].html=T.portfolio.pages[0].html.replace(b('sb-hero'),b('sb-hero-glass'));
})();
