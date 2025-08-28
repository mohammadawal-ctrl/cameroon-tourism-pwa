
// Simple client-side "framework" for header/footer/nav + utils
export const CM = {
  fmtXAF(n) {
    try {
      return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);
    } catch(e) {
      return n.toLocaleString() + " XAF";
    }
  },
  qs(sel, root=document){ return root.querySelector(sel); },
  qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); },
  state: {
    cart: JSON.parse(localStorage.getItem('cart')||'[]'),
    bookings: JSON.parse(localStorage.getItem('bookings')||'[]'),
    packages: [],
    destinations: [],
    culture: []
  },
  save() {
    localStorage.setItem('cart', JSON.stringify(CM.state.cart));
    localStorage.setItem('bookings', JSON.stringify(CM.state.bookings));
    localStorage.setItem('packages', JSON.stringify(CM.state.packages));
    localStorage.setItem('destinations', JSON.stringify(CM.state.destinations));
    localStorage.setItem('culture', JSON.stringify(CM.state.culture));
  },
  header(active){
    return `
    <div class="header">
      <div class="brand">
        <span>🌍</span>
        <span>Cameroon Explore</span>
        <span class="badge">PWA</span>
      </div>
      <nav class="nav">
        <a href="index.html" ${active==='home'?'class="active"':''}>Home</a>
        <a href="explore.html" ${active==='explore'?'class="active"':''}>Explore</a>
        <a href="packages.html" ${active==='packages'?'class="active"':''}>Packages</a>
        <a href="mytrips.html" ${active==='trips'?'class="active"':''}>My Trips</a>
        <a href="culture.html" ${active==='culture'?'class="active"':''}>Culture</a>
        <a href="offline-map.html" ${active==='map'?'class="active"':''}>Map</a>
        <a href="admin.html" ${active==='admin'?'class="active"':''}>Admin</a>
      </nav>
      <div class="flex">
        <a class="btn secondary" href="cart.html">Cart (<span id="cartCount">0</span>)</a>
        <a class="btn secondary" href="auth.html">Login</a>
      </div>
    </div>`;
  },
  footer(){
    return `<footer class="container">
      <div class="grid cols-3">
        <div>
          <div class="brand">🌍 Cameroon Explore</div>
          <p class="small">A demo touristic booking system for Cameroon. Works offline as a PWA.</p>
          <ul class="inline small">
            <li><a href="terms.html">Terms</a></li>
            <li><a href="privacy.html">Privacy</a></li>
            <li><a href="offline.html">Offline</a></li>
          </ul>
        </div>
        <div>
          <div class="kicker">Quick links</div>
          <ul class="inline">
            <li><a href="explore.html">Explore</a></li>
            <li><a href="packages.html">Packages</a></li>
            <li><a href="mytrips.html">My Trips</a></li>
            <li><a href="culture.html">Culture</a></li>
          </ul>
        </div>
        <div>
          <div class="kicker">Install App</div>
          <p class="small">On mobile, tap the browser menu and choose “Add to Home Screen”.</p>
          <a class="btn" id="installBtn">Install PWA</a>
        </div>
      </div>
      <div class="small" style="margin-top:12px;">&copy; <span id="year"></span> Cameroon Explore</div>
    </footer>`;
  },
  renderShell(active=''){
    const header = document.createElement('div');
    header.innerHTML = CM.header(active);
    document.body.prepend(header);
    const footer = document.createElement('div');
    footer.innerHTML = CM.footer();
    document.body.append(footer);
    document.getElementById('year').textContent = new Date().getFullYear();
    CM.updateCartCount();
    // PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e)=>{
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById('installBtn');
      if(btn){
        btn.addEventListener('click', async ()=>{
          if(deferredPrompt){ deferredPrompt.prompt(); }
        });
      }
    });
  },
  updateCartCount(){
    const c = CM.state.cart.reduce((a,x)=>a + (x.qty||1), 0);
    const el = document.getElementById('cartCount');
    if(el) el.textContent = c;
  },
  addToCart(pkg, qty=1, date=null, guests=1, addons=[]){
    const existing = CM.state.cart.find(x=>x.id===pkg.id);
    if(existing){
      existing.qty += qty;
    } else {
      CM.state.cart.push({id: pkg.id, title: pkg.title, price: pkg.price, qty, date, guests, addons, img: pkg.image});
    }
    CM.save(); CM.updateCartCount();
    alert('Added to cart');
  },
  param(name){
    const url = new URL(location.href);
    return url.searchParams.get(name);
  },
  // QR generation (lightweight) - based on a minimal algorithm (tiny implementation)
  // For demo: we will not implement full QR; instead draw a placeholder box with data text
  // to keep things dependency-free and offline-safe.
  drawFakeQR(canvas, text){
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,size,size);
    ctx.fillStyle = "#000000";
    const cells = 21; // 21x21 matrix placeholder
    let i=0;
    for(let y=0;y<cells;y++){
      for(let x=0;x<cells;x++){
        const v = (text.charCodeAt((i++)%text.length) + x*y) % 2;
        if(v===0){
          ctx.fillRect(x*size/cells, y*size/cells, size/cells, size/cells);
        }
      }
    }
  }
};

// Data bootstrap (loads from localStorage or /data/*.json on first run)
export async function loadData(){
  const cachedDest = CM.state.destinations?.length;
  const cachedPack = CM.state.packages?.length;
  const cachedCulture = CM.state.culture?.length;
  async function fetchJson(path){
    const r = await fetch(path);
    return r.json();
  }
  if(!cachedDest){
    try { CM.state.destinations = await fetchJson('data/destinations.json'); } catch(e){ CM.state.destinations = []; }
  }
  if(!cachedPack){
    try { CM.state.packages = await fetchJson('data/packages.json'); } catch(e){ CM.state.packages = []; }
  }
  if(!cachedCulture){
    try { CM.state.culture = await fetchJson('data/culture.json'); } catch(e){ CM.state.culture = []; }
  }
  CM.save();
  return CM.state;
}

// Register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js');
  });
}
