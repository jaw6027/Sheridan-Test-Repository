const lightbox=document.querySelector('#lightbox');
let opener;
document.querySelectorAll('[data-enlarge]').forEach(button=>button.addEventListener('click',()=>{opener=button;lightbox.querySelector('img').src=button.dataset.enlarge;lightbox.querySelector('img').alt=button.dataset.alt;lightbox.querySelector('p').textContent=button.dataset.alt;lightbox.showModal();}));
lightbox?.querySelector('.close').addEventListener('click',()=>lightbox.close());
lightbox?.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
lightbox?.addEventListener('close',()=>opener?.focus());
document.querySelectorAll('[data-confirm]').forEach(button=>button.addEventListener('click',e=>{if(!confirm(button.dataset.confirm))e.preventDefault();}));
document.querySelector('#share')?.addEventListener('click',async e=>{const status=document.querySelector('#share-status');try{if(navigator.share)await navigator.share({title:document.title,url:e.currentTarget.dataset.url});else{await navigator.clipboard.writeText(e.currentTarget.dataset.url);status.textContent='Page address copied.';}}catch{status.textContent='Copy the page address from your browser to share this design.';}});
