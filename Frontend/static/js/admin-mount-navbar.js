(function(){
  function execScripts(host){
    const scripts = host.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function mount(){
    const host = document.getElementById('admin-navbar-container');
    if (!host) return;

    fetch('admin-navbar.html?v=' + Date.now())
      .then(r => r.text())
      .then(html => {
        host.innerHTML = html;
        execScripts(host);
      })
      .catch(err => console.error('Failed to load admin navbar:', err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
