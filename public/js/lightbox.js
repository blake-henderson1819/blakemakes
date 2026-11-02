(function(){
  var imgs=[].slice.call(document.querySelectorAll('main img, article img')).filter(function(i){return !i.closest('a,button,video,iframe,.lb')});
  if(!imgs.length)return;
  var ov=document.createElement('div');ov.className='lb';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Image viewer');
  ov.innerHTML='<button type="button" class="lb__close" aria-label="Close image">×</button><figure class="lb__fig"><img class="lb__img" alt=""><figcaption class="lb__cap"></figcaption></figure>';
  document.body.appendChild(ov);
  var big=ov.querySelector('.lb__img'),cap=ov.querySelector('.lb__cap'),btn=ov.querySelector('.lb__close'),last=null;
  function open(i){last=i;big.src=i.currentSrc||i.src;big.alt=i.alt||'';var fc=i.closest('figure');fc=fc&&fc.querySelector('figcaption');var t=fc?fc.textContent.trim():(i.alt||'');cap.textContent=t;cap.hidden=!t;ov.hidden=false;document.documentElement.style.overflow='hidden';btn.focus();}
  function close(){if(ov.hidden)return;ov.hidden=true;big.removeAttribute('src');document.documentElement.style.overflow='';if(last)last.focus();}
  imgs.forEach(function(i){i.classList.add('lb-zoom');i.tabIndex=0;i.setAttribute('role','button');i.setAttribute('aria-label','View full size'+(i.alt?': '+i.alt:''));
    i.addEventListener('click',function(){open(i)});
    i.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i)}});});
  ov.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();else if(e.key==='Tab'&&!ov.hidden){e.preventDefault();btn.focus();}});
})();
