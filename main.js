var zp = new ZP.ZP(document.body, window.innerWidth, window.innerHeight);

var _help_panel = document.getElementById('help-panel');

window.addEventListener('keydown', () => _help_panel.hidden = true);
window.addEventListener('mousedown', () => _help_panel.hidden = true);

function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("get", url, true);
  xhr.responseType = "json";
  xhr.onload = function() {
    var status = xhr.status;
    if (status == 200) {
      callback(null, xhr.response);
    } else {
      callback(status);
    }
  };
  xhr.send();
}

getJSON('MGH30_genes.json', function(err, p) {
  if (err != null) {
  } else {
    zp.plot(p.data, p.mappings, p.options);
    window.addEventListener('resize', e => zp.resize(window.innerWidth, window.innerHeight));
  }
});
