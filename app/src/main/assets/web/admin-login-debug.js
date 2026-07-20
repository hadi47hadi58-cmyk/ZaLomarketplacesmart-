window.logToUI = function(msg) {
  const div = document.getElementById('debug-log') || (function() {
    const d = document.createElement('div');
    d.id = 'debug-log';
    d.style = 'position:fixed; bottom:0; left:0; width:100%; height:150px; overflow-y:auto; background:rgba(0,0,0,0.8); color:#0f0; font-family:monospace; font-size:12px; z-index:9999; padding:10px; text-align:left; direction:ltr;';
    document.body.appendChild(d);
    return d;
  })();
  div.innerHTML += `<div>${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}</div>`;
  div.scrollTop = div.scrollHeight;
  console.log(msg);
}
