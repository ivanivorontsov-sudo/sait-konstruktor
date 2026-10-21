/* СайтКонструктор: скрипт опубликованного сайта (меню, галерея, формы) */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.sb-burger');if(b){var m=b.parentNode.querySelector('.sb-menu');if(m)m.classList.toggle('sb-open');return}
 var img=e.target.closest&&e.target.closest('.sb-gallery img');if(img){var lb=document.createElement('div');lb.className='sb-lightbox';lb.innerHTML='<img alt="">';lb.firstChild.src=img.currentSrc||img.src;lb.onclick=function(){lb.remove()};document.body.appendChild(lb)}});
document.addEventListener('submit',function(e){var f=e.target;if(!f.classList||!f.classList.contains('sb-form'))return;var a=f.getAttribute('action');
 if(a&&a!=='#'&&!/^\s*$/.test(a))return; /* настоящий обработчик (например, Formspree) — отправляем как обычно */
 e.preventDefault();var mail=f.getAttribute('data-mailto');var ok=f.querySelector('.sb-form-ok');
 if(mail){var body=[].map.call(f.querySelectorAll('input,textarea,select'),function(i){return (i.name||i.placeholder||'')+': '+i.value}).join('\n');location.href='mailto:'+mail+'?subject='+encodeURIComponent(document.title)+'&body='+encodeURIComponent(body)}
 if(ok)ok.style.display='block';f.reset()});
(function(){
var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
function init(){
 // слайдеры
 $$('.sb-slider').forEach(function(s){var w=s.querySelector('.sb-slides');if(!w)return;var n=w.children.length,i=0,d=s.querySelector('.sb-dots');
  if(d){d.innerHTML='';for(var k=0;k<n;k++){var e=document.createElement('span');e.dataset.i=k;d.appendChild(e)}}
  function go(j){i=(j+n)%n;w.style.transform='translateX(-'+(i*100)+'%)';if(d)$$('span',d).forEach(function(e,k){e.classList.toggle('on',k===i)})}
  s.addEventListener('click',function(e){if(e.target.closest('.sb-prev'))go(i-1);else if(e.target.closest('.sb-next'))go(i+1);else if(e.target.dataset&&e.target.dataset.i!=null)go(+e.target.dataset.i)});
  go(0);if(s.dataset.autoplay!=='0')setInterval(function(){if(!s.matches(':hover'))go(i+1)},+(s.dataset.interval||5000))});
 // вкладки
 $$('.sb-tabs').forEach(function(t){var tabs=$$('.sb-tab',t),panes=$$('.sb-pane',t);tabs.forEach(function(b,k){b.addEventListener('click',function(){tabs.forEach(function(x,j){x.classList.toggle('on',j===k)});panes.forEach(function(x,j){x.classList.toggle('on',j===k)})})})});
 // счётчики
 var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;io.unobserve(el);
   if(el.classList.contains('sb-reveal')){el.classList.add('sb-in');return}
   var to=parseFloat(el.dataset.to)||0,t0=null,dur=1500;function st(ts){t0=t0||ts;var p=Math.min(1,(ts-t0)/dur);el.textContent=Math.round(to*(1-Math.pow(1-p,3))).toLocaleString('ru-RU')+(el.dataset.suffix||'');if(p<1)requestAnimationFrame(st)}requestAnimationFrame(st)})},{threshold:.2}):null;
 $$('.sb-count').forEach(function(e){if(io)io.observe(e);else e.textContent=e.dataset.to+(e.dataset.suffix||'')});
 $$('.sb-section,.sb-cta,.sb-card').forEach(function(e){if(document.body.dataset.anim==='0')return;e.classList.add('sb-reveal');if(io)io.observe(e);else e.classList.add('sb-in')});
 // тёмная тема
 if(document.body.dataset.themeToggle==='1'){var b=document.createElement('button');b.className='sb-theme-toggle';b.title='Тема';b.textContent='🌓';document.body.appendChild(b);
  try{if(localStorage.sbDark==='1')document.body.classList.add('sb-dark')}catch(e){}
  b.onclick=function(){var on=document.body.classList.toggle('sb-dark');try{localStorage.sbDark=on?'1':'0'}catch(e){}}}
}
// модальные окна: <a href="#id" data-modal> открывает .sb-modal#id
document.addEventListener('click',function(e){var o=e.target.closest&&e.target.closest('[data-modal]');if(o){var m=document.querySelector(o.getAttribute('href'));if(m){e.preventDefault();m.classList.add('on')}return}
 var m2=e.target.classList&&e.target.classList.contains('sb-modal')?e.target:(e.target.closest&&e.target.closest('.sb-close')?e.target.closest('.sb-modal'):null);if(m2)m2.classList.remove('on')});
document.addEventListener('keydown',function(e){if(e.key==='Escape')$$('.sb-modal.on').forEach(function(m){m.classList.remove('on')})});
// валидация форм (до отправки)
document.addEventListener('submit',function(e){var f=e.target;if(!f.classList||!f.classList.contains('sb-form'))return;var bad=false;
 $$('.sb-errmsg',f).forEach(function(x){x.remove()});
 $$('input,textarea,select',f).forEach(function(i){i.classList.remove('sb-err');var v=i.value.trim(),msg='';
  if(i.required&&!v)msg='Заполните поле';else if(v&&i.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))msg='Неверный e-mail';else if(v&&i.type==='tel'&&v.replace(/\D/g,'').length<10)msg='Неверный телефон';
  if(msg){bad=true;i.classList.add('sb-err');var p=document.createElement('div');p.className='sb-errmsg';p.textContent=msg;i.insertAdjacentElement('afterend',p)}});
 if(bad){e.preventDefault();e.stopImmediatePropagation()}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
