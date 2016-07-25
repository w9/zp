var zp = new ZP.ZP(document.body);

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

getJSON('example_query.json', function(err, p) {
  if (err != null) {
  } else {
    zp.plot(p.data, p.mapping);
    window.addEventListener('resize', zp.resize(window.innerWidth, window.innerHeight));
  }
});
