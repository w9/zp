// TODO: in "orthogonal views", there's a bug where if you pan a lot in the first view, in the next view the plot will fly away if you move just a little bit.
// TODO: implement continuous scale
// TODO: double click should add a label following that dot, using the "label" aes
// TODO: add "multiple coordinates" functionality (e.g., for PCA and MDS), and maybe multiple **mappings** as well
// TODO: add **instant type** search functionality, very useful when the dots are overwhelmingly many
// TODO: use "BufferGeometry" and "PointMaterial" to render points. aspect ratio toggle can be changed accordingly
// TODO: the "color patches" should be threejs canvas themselves
// TODO: use pretty scales (1, 2, 5, 10 ticks) used in ggplot2, drawing gray lines is good enough 
// TODO: should be able to specify a label layer
// TODO: change the base to something like http://threejs.org/examples/#webgl_geometry_spline_editor, exept it's infinitely large and there's fog
// TODO: add drop shadow to the base, looks great
// TODO: Temporal Anti-Aliasing (TAA), maybe for lines in the future
// TODO: adopt/modify the offical library for canvas material: http://threejs.org/examples/#canvas_interactive_particles


ZP = {};


ZP.ASPECT = { EQUAL: 0, ORIGINAL: 1 };
ZP.ASPECT_STATE = { NONE: 0, TRANSITIONING: 1 };

ZP.COLOR_PALETTE = ['#01a0e4','#db2d20','#01a252','#a16a94','#555555','#b5e4f4'];
ZP.VIEW_ANGLE = 45;
ZP.ORTHO_SHRINK = 180;
ZP.NEAR = 0.1;
ZP.FAR = 20000;

ZP.POINT_ICON = document.createElement('img');
ZP.POINT_ICON.src = 'data:image/png;base64,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';

ZP.CROSSHAIRS_ICON = document.createElement('img');
ZP.CROSSHAIRS_ICON.src = 'data:image/png;base64,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';

ZP.normalize11 = function(a, scale, offset) {
  scale = scale || 1;
  offset = offset || 0;
  var i = Math.min.apply(null, a);
  var x = Math.max.apply(null, a);
  var aa = a.map(function(k){return ((k-i)/(x-i)*2-1)*scale + offset});
  aa.lo = -scale + offset;
  aa.hi = scale + offset;
  return aa;
}

ZP.range0 = function(hi) {
  a = [];
  for (var i = 0; i < hi; i++) {
    a.push(i);
  }
  return a;
}








ZP.Aes = function(data_, mapping_, aspect_) {
  var _this = this;

  var discTxtr = new THREE.Texture(ZP.POINT_ICON);
  discTxtr.needsUpdate = true;

  this.index = ZP.range0(data_[mapping_.x].length);

  // note the axes are rotated for the gl space
  this.z = data_[mapping_.x];
  this.x = data_[mapping_.y];
  this.y = data_[mapping_.z];

  this.xMax = Math.max.apply(null, this.x);
  this.xMin = Math.min.apply(null, this.x);
  this.xRange = this.xMax - this.xMin;
  this.yMax = Math.max.apply(null, this.y);
  this.yMin = Math.min.apply(null, this.y);
  this.yRange = this.yMax - this.yMin;
  this.zMax = Math.max.apply(null, this.z);
  this.zMin = Math.min.apply(null, this.z);
  this.zRange = this.zMax - this.zMin;

  this.data = data_;
  this.mapping = mapping_;
  // TODO: try combining the next two lines
  var aspect = aspect_ || ZP.ASPECT.ORIGINAL;
  this.changeAspectTo(aspect);
  this.legendDom = null;

  function dimGroup(m) {
      m.dimmed = true;
      m.material.opacity = 0.1;
      m.legendItem.classList.add('dimmed');
  }

  function lightGroup(m) {
      m.dimmed = false;
      m.material.opacity = 1;
      m.legendItem.classList.remove('dimmed');
  }

  function toggleAllGroups() {
    var m = _this.scale.mapping;

    var allDimmed = true;

    for (var i in m) {
      if (!m[i].dimmed) {
        allDimmed = false;
        break;
      }
    }

    if (allDimmed) {
      for (var i in m) {
        lightGroup(m[i]);
      }
    } else {
      for (var i in m) {
        dimGroup(m[i]);
      }
    }
  }

  function toggleGroup(f) {
    var m = _this.scale.mapping[f];
    m.dimmed ? lightGroup(m) : dimGroup(m);
  }

  function onlyShowOneGroup(f) {
    var m = _this.scale.mapping;

    for (var i in m) {
      i == f ? lightGroup(m[i]) : dimGroup(m[i]);
    }
  }

  function drawLegendDiscrete(aes) {
    var scale = aes.scale;
    var legendTitle = aes.mapping.color;
    var colorLegend = document.createElement('div');
    var mapping = scale.mapping;
    var levels = scale.levels;

    colorLegend.innerHTML = '<h2>' + legendTitle + '</h2>';
    for (let i in levels) {
      let level = levels[i];
      colorLegend.appendChild(mapping[level].legendItem);
    }
    colorLegend.addEventListener('dblclick', function(e){toggleAllGroups()});
    return colorLegend;
  }

  function convertFactorsToColors(fs) {
    // scale . levels = ['a', 'b']
    //
    //       . mapping = { 'a': { color: "red",  material: red,  indices: [0,1,4,...], legend: <red_leg>,  dimmed: false },
    //                     'b': { color: "blue", material: blue, indices: [2,3,5,...], legend: <blue_leg>, dimmed: false }}
    //
    //       . materials = [ red, blue, blue, red, ... ]

    let levels = [];
    for (let i=0; i<fs.length; i++) {
      let f = fs[i].toString();
      if (levels.indexOf(f) < 0) {
        levels.push(f);
      }
    }
    levels = levels.sort();
    
    let mapping = {};
    for (let i=0; i<levels.length; i++) {
      let f = levels[i];

      var color = ZP.COLOR_PALETTE[i];
      var material = new THREE.SpriteMaterial( { map: discTxtr, color: new THREE.Color(color), fog: true } );

      var item = document.createElement('div');
      item.classList.add('item');
      item.innerHTML = '<span class="color-patch" style="background-color: ' + color + '"></span>' + f;
      let ff = f;
      item.addEventListener('click', function(e){e.ctrlKey ? onlyShowOneGroup(ff) : toggleGroup(ff)});
      item.addEventListener('dblclick', function(e){e.stopPropagation()});

      mapping[f] = { color: color, material: material, legendItem: item, indices: [], dimmed: false};
    }

    let materials = [];
    for (let i=0; i<fs.length; i++) {
      let f = fs[i].toString();
      materials.push(mapping[f].material);
      mapping[f].indices.push(i);
    }

    return { materials: materials, mapping: mapping, levels: levels };
  }


  if ('color' in mapping_) {
    this.scale = convertFactorsToColors(data_[mapping_.color]);
    this.material = this.scale.materials;
    this.legendDom = drawLegendDiscrete(this);
  } else {
    let material = new THREE.SpriteMaterial( { map: discTxtr, color: new THREE.Color(ZP.COLOR_PALETTE[0]), fog: true } );
    this.material = this.index.map(function(){return material});
  }
}

ZP.Aes.prototype.changeAspectTo = function(aspect) {
  if (!aspect || aspect == ZP.ASPECT.EQUAL) {
    this.changeAspectToXYZ(100, 100, 100);
  } else if (aspect == ZP.ASPECT.ORIGINAL) {
    let rx = this.xRange;
    let ry = this.yRange;
    let rz = this.zRange;
    let coef = 100 / Math.cbrt(rx * ry * rz);
    this.changeAspectToXYZ(coef * rx, coef * ry, coef * rz);
  }
}

ZP.Aes.prototype.changeAspectToXYZ = function(xx, yy, zz) {
  this.x = ZP.normalize11(this.x, xx);
  this.y = ZP.normalize11(this.y, yy);
  this.z = ZP.normalize11(this.z, zz);
}







ZP.ZP = function(el_, width_, height_) {
  var _aes;

  var _aspect_state = ZP.ASPECT_STATE.NONE;
  var _aspect_original = false;

  var _scene;
  var _scene_overlay;
  var _orbit;
  var _stats;
  var _points;
  var _selectedObj;
  var floor;
  var _crosshairs;
  var _ortho = 'none';

  let ar = width_ / height_;
  var _camera = new THREE.PerspectiveCamera( ZP.VIEW_ANGLE, ar, ZP.NEAR, ZP.FAR );
  _camera.position.set( -400, 0, -130 );

  let s = ZP.ORTHO_SHRINK;
  var _ortho_camera = new THREE.OrthographicCamera( ar * -s, ar * s, s, -s, ZP.NEAR, ZP.FAR );


  var _renderer = new THREE.WebGLRenderer( { antialias:true } );
  _renderer.setSize(width_, height_);
  _renderer.setClearColor(0xffffff, 1);
  _renderer.autoClear = false;

  var container = document.createElement('div');
  container.id = 'plot-container';
  el_.appendChild(container);

  var legendDiv = document.createElement('div');
  legendDiv.id = 'legend';
  el_.appendChild(legendDiv);

  var overlayDom = document.createElement('div');
  overlayDom.id = 'overlay';
  el_.appendChild(overlayDom);

  var toolbarDom = document.createElement('div');
  toolbarDom.id = 'toolbar';
  overlayDom.appendChild(toolbarDom);

  var resetCameraButton = document.createElement('i');
  resetCameraButton.innerText = 'youtube_searched_for';
  resetCameraButton.id = 'reset-camera-button';
  resetCameraButton.title = 'reset camera angle';
  resetCameraButton.classList.add('material-icons');
  toolbarDom.appendChild(resetCameraButton);

  var toggleAspectButton = document.createElement('i');
  toggleAspectButton.innerText = 'aspect_ratio';
  toggleAspectButton.id = 'toggle-aspect-buttom';
  toggleAspectButton.title = 'toggle aspect ratio between 1:1:1 and original';
  toggleAspectButton.classList.add('material-icons');
  toolbarDom.appendChild(toggleAspectButton);

  var toggleOrthoButton = document.createElement('i');
  toggleOrthoButton.innerText = 'call_merge';
  toggleOrthoButton.id = 'toggle-ortho-buttom';
  toggleOrthoButton.title = 'toggle between orthographic and perspective camera';
  toggleOrthoButton.classList.add('material-icons');
  toolbarDom.appendChild(toggleOrthoButton);

  var datumDisplay = document.createElement('div');
  datumDisplay.id = 'datum-display';
  overlayDom.appendChild(datumDisplay);

  var _mouse;
  var _raycaster;

  function syncGeometryWithAes() {
    // animate the _points
    for (var i in _points) {
      let ii = i;
      let a = {
        x: _points[ii].position.x,
        y: _points[ii].position.y,
        z: _points[ii].position.z
      };
      let b = {
        x: _aes.x[ii],
        y: _aes.y[ii],
        z: _aes.z[ii]
      };

      (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function(){ _points[ii].position.set(this.x, this.y, this.z); })
        .start();

      // animate the crosshairs
      if (_points[ii] === _selectedObj) {
        (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
          .onUpdate(function(){
            _crosshairs.position.set(this.x, this.y, this.z);
          })
          .start();
      }
    }


    // animate the floor
    var newFloorVertices = [
      { x: _aes.x.lo, y: _aes.y.lo, z: _aes.z.lo },
      { x: _aes.x.hi, y: _aes.y.lo, z: _aes.z.lo },
      { x: _aes.x.hi, y: _aes.y.lo, z: _aes.z.hi },
      { x: _aes.x.lo, y: _aes.y.lo, z: _aes.z.hi },
      { x: _aes.x.lo, y: _aes.y.lo, z: _aes.z.lo }
    ];

    for (var i in floor.geometry.vertices) {
      let ii = i;
      let a = {
        x: floor.geometry.vertices[ii].x,
        y: floor.geometry.vertices[ii].y,
        z: floor.geometry.vertices[ii].z
      };
      let b = newFloorVertices[ii];

      (new TWEEN.Tween(a)).to(b, 250).easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function(){
          floor.geometry.vertices[ii].set(this.x, this.y, this.z);
          floor.geometry.verticesNeedUpdate = true;
        })
        .start();
    }

  }

  this.plot = function(data_, mapping_) {
    _points = [];
    _mouse = new THREE.Vector2(Infinity, Infinity);
    _raycaster = new THREE.Raycaster();
    _selectedObj = null;


    var keyboard = new THREEx.KeyboardState();


    //------------------------- Remap AES -------------------------//

    _aes = new ZP.Aes(data_, mapping_);
    if (_aes.legendDom) legendDiv.appendChild(_aes.legendDom);

    //------------------------ Handle events ----------------------//

    
    resetCameraButton.addEventListener('click', function(e) {
      _orbit.moveToOriginal();
    });

    toggleAspectButton.addEventListener('click', function(e) {
      if (_aspect_original) {
        _aes.changeAspectTo(ZP.ASPECT.ORIGINAL);
        toggleAspectButton.classList.remove('activated');
        _aspect_original = false;
      } else {
        _aes.changeAspectTo(ZP.ASPECT.EQUAL);
        toggleAspectButton.classList.add('activated');
        _aspect_original = true;
      }
      syncGeometryWithAes();
    });

    toggleOrthoButton.addEventListener('click', function(e) {
      if (_ortho == 'none') {
        _ortho_camera.position.set( 0, 1000, 0 );
        _ortho_camera.up.set( 1, 0, 0 );
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0));
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix();

        _ortho_orbit.enabled = true;
        _orbit.enabled = false;

        _ortho = 'z';
      } else if (_ortho == 'z') {
        _ortho_camera.position.set( -1000, 0, 0 );
        _ortho_camera.up.set( 0, 1, 0 );
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0));
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix();

        _ortho_orbit.enabled = true;
        _orbit.enabled = false;

        _ortho = 'y';
      } else if (_ortho == 'y') {
        _ortho_camera.position.set( 0, 0, -1000 );
        _ortho_camera.up.set( 0, 1, 0 );
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0));
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix();

        _ortho_orbit.enabled = true;
        _orbit.enabled = false;

        _ortho = 'x';
      } else if (_ortho == 'x') {
        _ortho = 'none';

        _ortho_orbit.enabled = false;
        _orbit.enabled = true;
      }
    });

    el_.addEventListener('keypress', function(e) {
      switch (e.key) {
        case 'p':
          _stats.domElement.hidden = !_stats.domElement.hidden;
          break;
        default:
          break;
      }
    });

    //-------------------------------------------------------------//

    _scene = new THREE.Scene();

    //_scene.fog = new THREE.Fog(0xffffff, 400, 1000);

    _scene.add( _camera );

    _renderer.domElement.addEventListener('mousemove', function(e) {
      _mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
      _mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
    });

    _renderer.domElement.addEventListener('dblclick', function(e) {
      let undimmed_points = [];
      let levels = _aes.scale.levels;
      let mapping = _aes.scale.mapping;

      for (let i in levels) {
        let l = levels[i];
        let ids = mapping[l].indices;
        if (!mapping[l].dimmed) {
          for (let j=0; j<ids.length; j++) {
            undimmed_points.push(_points[ids[j]]);
          }
        }
      }
      let undimmed_points_flatten = [].concat.apply([], undimmed_points);

      _raycaster.setFromCamera( _mouse, _camera );
      var intersects = _raycaster.intersectObjects( undimmed_points );
      if (intersects.length > 0) {
        if (intersects[0].object != _selectedObj) {
          _selectedObj = intersects[0].object;
          var outputs = [];
          for (var prop in _selectedObj.datum) {
            outputs.push(prop + ' = ' + _selectedObj.datum[prop]);
          }
          datumDisplay.innerText = outputs.join('\n');
          _crosshairs.position.copy(_selectedObj.position);
          _crosshairs.visible = true;
        }
      } else {
        _selectedObj = null;
        datumDisplay.innerText = '';
        _crosshairs.visible = false;
      }
    });

    container.appendChild( _renderer.domElement );

    _orbit = new THREE.OrbitControls( _camera, _renderer.domElement, new THREE.Vector3(0,0,0));
    _orbit.addEventListener('userRotate', function(e){_ortho = 'none'}); 
    _orbit.enableDamping = true;
    _orbit.dampingFactor = 0.4;
    _orbit.update();

    _ortho_orbit = new THREE.OrbitControls( _ortho_camera, _renderer.domElement, new THREE.Vector3(0,0,0));
    _ortho_orbit.addEventListener('userRotate', function(e){_ortho = 'none'}); 
    _ortho_orbit.mouseButtons = { ORBIT: null, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.LEFT };
    _ortho_orbit.enabled = false;
    _ortho_orbit.enableRotate = false;
    _ortho_orbit.enableDamping = true;
    _ortho_orbit.dampingFactor = 0.4;
    _ortho_orbit.update();

    _stats = new Stats();
    _stats.domElement.style.position = 'absolute';
    _stats.domElement.style.bottom = '0px';
    _stats.domElement.style.zIndex = 100;
    _stats.domElement.hidden = true;
    container.appendChild( _stats.domElement );

    var floorMtrl = new THREE.LineBasicMaterial( { color: 0x777777 });
    var floorGtry = new THREE.Geometry();
        floorGtry.vertices.push(new THREE.Vector3( _aes.x.lo, _aes.y.lo, _aes.z.lo));
        floorGtry.vertices.push(new THREE.Vector3( _aes.x.hi, _aes.y.lo, _aes.z.lo));
        floorGtry.vertices.push(new THREE.Vector3( _aes.x.hi, _aes.y.lo, _aes.z.hi));
        floorGtry.vertices.push(new THREE.Vector3( _aes.x.lo, _aes.y.lo, _aes.z.hi));
        floorGtry.vertices.push(new THREE.Vector3( _aes.x.lo, _aes.y.lo, _aes.z.lo));
    floor = new THREE.Line(floorGtry, floorMtrl);
    _scene.add(floor);

    // Sprites

    let dotSize = Math.cbrt(7.5 + 60000 / _aes.index.length);
    
    for (var i in _aes.index) {
      var x = _aes.x[i];
      var y = _aes.y[i];
      var z = _aes.z[i];
      var material = _aes.material[i];

      var datum = {};
      // note that _index is 1-based
      datum._index = parseInt(i)+1;
      for (var prop in data_) {
        datum[prop] = data_[prop][i];
      }

      var discSprt = new THREE.Sprite( material );
      discSprt.position.set( x, y, z );
      discSprt.scale.set( dotSize, dotSize, 1 );
      discSprt.datum = datum;
      _scene.add( discSprt );

      _points.push(discSprt);
    }

    // overlay scene

    _scene_overlay = new THREE.Scene();

    var crosshairsTxtr = new THREE.Texture(ZP.CROSSHAIRS_ICON);
    crosshairsTxtr.needsUpdate = true;
    var crosshairsMtrl = new THREE.SpriteMaterial({
      map: crosshairsTxtr,
      color: new THREE.Color('#000000')
    });
    _crosshairs = new THREE.Sprite( crosshairsMtrl );
    _crosshairs.position.set( Infinity, Infinity, Infinity );
    _crosshairs.visible = false;
    _crosshairs.tweenObj = { size: 10 };
    _crosshairs.tween = new TWEEN.Tween(_crosshairs.tweenObj)
    _crosshairs.tween.to({ size: 14 }, 800).easing(TWEEN.Easing.Sinusoidal.InOut).repeat(Infinity).yoyo(true)
      .onUpdate(function(){ _crosshairs.scale.set(this.size, this.size, 1) })
      .start()
    _scene_overlay.add( _crosshairs );

    animate();

    function animate() {
      requestAnimationFrame( animate );
      render();   
      update();
    }

    function update() {
      TWEEN.update();
      _orbit.update();
      _stats.update();
    }

    function render() {
      let render_camera = _ortho == 'none' ? _camera : _ortho_camera;
      _renderer.clear();
      _renderer.render( _scene, render_camera );
      _renderer.clearDepth();
      _renderer.render( _scene_overlay, render_camera );
    }
  };

  this.resize = function(width, height) {
    _renderer.setSize( width, height );

    _camera.aspect = width / height;
    _camera.updateProjectionMatrix();

    _ortho_camera.left = width / height * -ZP.ORTHO_SHRINK;
    _ortho_camera.right = width / height * ZP.ORTHO_SHRINK;
    _ortho_camera.top = ZP.ORTHO_SHRINK;
    _ortho_camera.bottom = -ZP.ORTHO_SHRINK;
    _ortho_camera.updateProjectionMatrix();
  };
}

