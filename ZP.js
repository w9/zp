// TODO: isolate coordinate changes and color changes, and add key shortcuts for each
// TODO: use svg for the legend of continuous color scale
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


var ZP = ZP || {};


ZP.ASPECT = { EQUAL: 0, ORIGINAL: 1 };
ZP.ASPECT_STATE = { NONE: 0, TRANSITIONING: 1 };

ZP.COLOR_DEFAULT = '#555555';
ZP.COLOR_PALETTE = ['#01a0e4','#db2d20','#01a252','#a16a94'];
ZP.COLOR_LOW = '#56b1f7';
ZP.COLOR_HIGH = '#132b43';
ZP.VIEW_ANGLE = 45;
ZP.ORTHO_SHRINK = 180;
ZP.NEAR = 0.1;
ZP.FAR = 20000;
ZP.ANIMATION_DURATION = 250;
ZP.FLOOR_MARGIN = 2;
ZP.KEY_SCALE_PREV = 'j';
ZP.KEY_SCALE_NEXT = 'k';
ZP.KEY_VIEW_RESET = ' ';
ZP.KEY_TOGGLE_ORTHO_VIEWS = 'Enter';
ZP.NULL_DISPLAY_AS = 'none';
ZP.CROSSHAIR_SIZE_FACTOR = 2;

ZP.normalize = function(xs, low, high) {
  low  = (typeof low  === 'undefined') ? -1 : low;
  high = (typeof high === 'undefined') ? 1 : high;
  let min = Math.min.apply(null, xs);
  let max = Math.max.apply(null, xs);

  return xs.map( x => (x - min)/(max - min) )
           .map( x => low + x * (high - low) );
}

ZP.range0 = function(hi) {
  let a = [];
  for (var i = 0; i < hi; i++) {
    a.push(i);
  }
  return a;
}

/**
 * Unlike htmlwidgets.dataframeToD3, this function does minimal check, but it pads nulls when
 * the arrays are not of the same length.
 *
 * "null" instead of "undefined" is used for representing an NA, because "undefined" cannot be
 * serialized into JSON.
 */
ZP.colsToRows = function(cols_) {
  var _cols = JSON.parse(JSON.stringify(cols_));
  var _rows = [];
  while (true) {
    let flag = true;
    let row = {};
    for (let colName in _cols) {
      let value = _cols[colName].shift();
      if (typeof(value) === 'undefined') {
        value = null;
      } else {
        flag = false;
      }
      row[colName] = value;
    }
    // this loop ends when all cols are depleted
    if (flag) break;
    _rows.push(row);
  }

  return _rows;
};


/**
 * The ultimate purpose of a scale is to map between the data and the aesthetic values in *O(1)* time.
 *
 * The reason we need scales as independent objects is because we need polymorphism, which
 * means that it makes no sense to have them in the first place if they each have different
 * properties (handles).
 *
 * Only the property "values" is guaranteed to be used. Things like "legend" is just something useful provided
 * by the scale (because it conveniently has all the information needed for generating such things).
 * It is completely up to the presenter as to whether, and how to use it. For example, if and where to put the "legend".
 *
 * The way a scale communicates with the presenter is through event firing. This is so that
 * the scale doesn't have to know the existence of a presenter.
 *
 * <ScaleColorDiscrete>
 *                      . values    = [ '#f1f1f1', '#f1a313', ... ]
 *                      . legend    = <div>
 */
ZP.ScaleColorDiscrete = function(vec_, name_, palette_) {
  var _this = this;

  var _dimmed = {};
  var _color = {};
  var _legendItem = {};
  var _indices = {};
  var _dimmed = {};
  var _legend;

  // this array will later be destroyed so don't use reference directly
  var _palette = (palette_ || ZP.COLOR_PALETTE).slice();

  var _vec = vec_.map(f => f === null ? null : f.toString());

  // sort null last
  var _levels = Array.from(new Set(_vec)).sort((a, b) => ( a === null ? 1 : b === null ? -1 : a > b ));

  var _change_level = function(l, new_dimmed_) {
    _dimmed[l] = new_dimmed_;
    _legendItem[l].classList[new_dimmed_ ? 'add' : 'remove']('dimmed');
    _legend.dispatchEvent(new CustomEvent(new_dimmed_ ? 'dim' : 'light', { bubbles: true, detail: _indices[l] }));
  };
  
  var _toggleLevel = function(l) {
    _change_level(l, !_dimmed[l]);
  };

  var _onlyShowOneLevel = function(l) {
    for (let level of _levels) {
      _change_level(level, !(level == l));
    }
  };

  var _toggleAllLevels = function() {
    let all_dimmed = _levels.every(l => _dimmed[l]);
    _levels.map(l => _change_level(l, !all_dimmed));
  };

  var _format_legend_text = function(t) {
    if (t === null) {
      return ZP.NULL_DISPLAY_AS;
    } else {
      return t;
      //return t.replace('_', ' ');
    }
  }

  _legend = document.createElement('div');
  _legend.innerHTML = '<h2>' + _format_legend_text(name_) + '</h2>';

  let itemContainer = document.createElement('div');
  itemContainer.id = 'item-container';
  _legend.appendChild(itemContainer);
  _legend.addEventListener('dblclick', function(e){_toggleAllLevels()});

  _levels.map(l => _indices[l] = []);
  _levels.map(l => _dimmed[l] = false);
  _vec.map((f, i) => _indices[f].push(i));

  for (let l of _levels) {
    let color = _palette.shift();
    if (!color) color = ZP.COLOR_DEFAULT;

    let item = document.createElement('div');
    item.classList.add('item');
    item.innerHTML = '<span class="color-patch" style="background-color: ' + color + '"></span>' + _format_legend_text(l);
    item.addEventListener('click', function(e){e.ctrlKey ? _onlyShowOneLevel(l) : _toggleLevel(l)});
    item.addEventListener('dblclick', function(e){e.stopPropagation()});
    itemContainer.appendChild(item);

    _color[l] = color;
    _legendItem[l] = item;
    
    if (l === null) { _change_level(l, true) }
  }

  var _values = _vec.map(f => _color[f]);

  _legend.reset = function() { _levels.map(l => _change_level(l, _dimmed[l])) };

  this.legend = _legend;
  this.values = _values;

  /**
   * Chromium console test:
   *
   * var s = new ZP.ScaleColorDiscrete(['v', 'a', 'a', 'b', 'b', 'a'], 'adfaf');
   * document.getElementById('legend').appendChild(s.legend);
   * document.getElementById('legend').addEventListener('dim', e => console.log(e));
   * document.getElementById('legend').addEventListener('light', e => console.log(e));
   *
   */
};



/**
 * <ScaleContinuous>
 *                  . values    = [ 0.12, -0.23, ... ] # -1~1
 *                  . span      = 45.67
 *                  . low       = -23.34 
 *                  . high      = 23.34
 *                  . name      = 'pc1'
 */
ZP.ScaleContinuous = function(vec_, name_) {
  var _values = ZP.normalize(vec_);

  var _low    = Math.min(...vec_);
  var _high   = Math.max(...vec_);
  var _span   = _high - _low;

  this.values = _values;
  this.span   = _span;
  this.low    = _low;
  this.high   = _high;
  this.name   = name_;

  /**
   * Chromium console test:
   *
   * var s = new ZP.ScaleContinuous([0, 1, 10, 1, 2], 'adfaf');
   *
   */
};



/**
 * Dim "false" data by default
 *
 * <ScaleColorBoolean>
 *                       . values    = [ '#f1f1f1', '#f1a313', ... ]
 *                       . legend    = <div>
 */
ZP.ScaleColorBoolean = function(vec_, name_) {
  // TODO
};



/**
 * Dim "NA" data by default.
 *
 * <ScaleColorContinuous>
 *                       . values    = [ '#f1f1f1', '#f1a313', ... ]
 *                       . legend    = <div>
 */
ZP.ScaleColorContinuous = function(vec_, name_) {
  var _norms = ZP.normalize(vec_, 0, 1);
  var _huslLow = HUSL.fromHex(ZP.COLOR_LOW);
  var _huslHigh = HUSL.fromHex(ZP.COLOR_HIGH);

  var _values = [];
  for (let x of _norms) {
    let ys = [];
    for (let i in _huslLow) {
      ys.push(_huslLow[i] + x * (_huslHigh[i] - _huslLow[i]));
    }
    _values.push(HUSL.toHex(...ys));
  }

  var _low    = Math.min(...vec_);
  var _high   = Math.max(...vec_);
  var _span   = _high - _low;

  this.values = _values;
  this.span   = _span;
  this.low    = _low;
  this.high   = _high;
  this.name   = name_;

  // TODO
  var _legend = document.createElement('div');
  _legend.innerHTML = '<h2>' + name_ + '</h2>';
  _legend.innerHTML += '<div style="background: linear-gradient(' + ZP.COLOR_HIGH + ',' + ZP.COLOR_LOW + ')" class="gradient-patch"/>';
  _legend.reset = function() {
    _legend.dispatchEvent(new CustomEvent('light', { bubbles: true, detail: ZP.range0(vec_.length) }));
  };

  this.legend = _legend;
};


/**
 *
 * TODO: scales_cache = { pc1: { x: <scale> }, group: { y: <scale> }, .. }
 *
 * mappings_ . coord . pca = { x: 'pc1'  , y: 'pc2'  , z: 'pc3'  }
 *                   . mds = { x: 'mds1' , y: 'mds2' , z: 'mds3' }
 *           . color . group = 'group' 
 *                   . expr  = 'expr' 
 *
 * <Aes> . coord . pca = { x: <scale>, y: <scale>, z: <scale>}
 *               . mds = { x: <scale>, y: <scale>, z: <scale>}
 *       . coord_i = 0
 *       . color . group = <scale>
 *               . expr  = <scale>
 *       . color_i = 0
 *
 *
 */


ZP.Aes = function(mappings_) {
  let coord = {};
  for (let coord_scale_name in mappings_.coord) {
    let coord_colnames = mappings_.coord[coord_scale_name];
    _coord[c].x = new ZP.ScaleContinuous(data_[coord_colnames.x]);
    _coord[c].y = new ZP.ScaleContinuous(data_[coord_colnames.y]);
    _coord[c].z = new ZP.ScaleContinuous(data_[coord_colnames.z]);
  }

  for (let color_scale_name in mappings_.color) {
    let color_colnames = mappings_.color[color_scale_name];
    _color[c] = new ZP.ScaleContinuous(data_[color_colnames]);
  }


  let _coords = Object.keys(mappings_.coord);
  let _coord_i = 0;
  let _coord_name = _coords[_coord_i];

  let _change_coord = function(delta) {
    _coord_i += delta;
    _coord_name = _coords[_coord_i];
  }

  let _get_coord_scale = function() {
    return 
  }

  let _colors = Object.keys(mappings_.color);
  let _color_i = 0;
  let _color_name = _colors[_color_i];

  let _change_color = function(delta) {
    _color_i += delta;
    _color_name = _colors[_color_i];
  }

  let _get_color_scale = function(delta) {
  }


  this.coord_i      = _coord_i      ;
  this.coord_name       = _coord_name   ;
  this.get_coord_scale  = _coord_name   ;
  this.change_coord = _change_coord ;
  this.color_i      = _color_i      ;
  this.color_name   = _color_name   ;
  this.change_color = _change_color ;
};


/**
 * What's in an Aes (a "presentation" if you will) is very specific to the
 * application. In ZP, for example, an Aes should have the following slots for
 * scales: x, y, z, and optionally color, alpha, size, etc. For each slot, only
 * certain types of scales are allowed.
 *
 * Aes is like the specification of what the presenter needs. It should be
 * a direct translation of the mapping_ input. Different Aes's can share scales
 * (via reference) to improve performance.
 *
 * Note that data rows and indices are not part of any aes, instead they are
 * global variables in ZP.ZP. This is because all columns are shown in the
 * data info panel, always. That means the data rows are independent of
 * current aes.
 *
 * <Aes>
 *       . x
 *       . y
 *       . z
 *       . color [optional]
 */
ZP.OldAes = function(attrs_) {
  if (!attrs_.x || !attrs_.y || !attrs_.z) {
    throw new Error("x, y and z are required in the mapping!");
  }
  this.x = attrs_.x;
  this.y = attrs_.y;
  this.z = attrs_.z;
  this.color = attrs_.color;
};




ZP.ZP = function(el_, width_, height_) {
  var _aes;

  var _data_rows;
  var _data_indices;

  var _aspect_state = ZP.ASPECT_STATE.NONE;
  var _current_aspect = ZP.ASPECT.ORIGINAL;

  var _scene = new THREE.Scene();
  var _scene_overlay = new THREE.Scene();

  var _orbit;
  var _points;
  var _selected_obj;
  var _floor;
  var _crosshairs;
  var _ortho = 'none';

  var _arena_dims;

  var _disc_txtr;

  var _aeses;
  var _aeses_names;
  var _num_aeses;
  var _current_aes_index;
  var _current_aes_name;
  var _current_aes;
  var _cached_aes;

  var _dot_size;

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

  var _scale_name_div = document.createElement('div');
  _scale_name_div.id = 'scale-name';
  el_.appendChild(_scale_name_div);

  var _legend_div = document.createElement('div');
  _legend_div.id = 'legend';
  el_.appendChild(_legend_div);

  var overlayDom = document.createElement('div');
  overlayDom.id = 'overlay';
  el_.appendChild(overlayDom);

  var toolbarDom = document.createElement('div');
  toolbarDom.id = 'toolbar';
  overlayDom.appendChild(toolbarDom);

  var prevScaleButton = document.createElement('i');
  prevScaleButton.innerText = 'undo';
  prevScaleButton.title = 'previous scale';
  prevScaleButton.classList.add('material-icons');
  toolbarDom.appendChild(prevScaleButton);

  var nextScaleButton = document.createElement('i');
  nextScaleButton.innerText = 'redo';
  nextScaleButton.title = 'next scale';
  nextScaleButton.classList.add('material-icons');
  toolbarDom.appendChild(nextScaleButton);

  var resetCameraButton = document.createElement('i');
  resetCameraButton.innerText = 'youtube_searched_for';
  resetCameraButton.title = 'reset camera angle';
  resetCameraButton.classList.add('material-icons');
  toolbarDom.appendChild(resetCameraButton);

  var toggleAspectButton = document.createElement('i');
  toggleAspectButton.innerText = 'aspect_ratio';
  toggleAspectButton.title = 'toggle aspect ratio between 1:1:1 and original';
  toggleAspectButton.classList.add('material-icons');
  toolbarDom.appendChild(toggleAspectButton);

  var toggleOrthoButton = document.createElement('i');
  toggleOrthoButton.innerText = 'call_merge';
  toggleOrthoButton.title = 'toggle between orthographic and perspective camera';
  toggleOrthoButton.classList.add('material-icons');
  toolbarDom.appendChild(toggleOrthoButton);

  var datumDisplay = document.createElement('div');
  overlayDom.appendChild(datumDisplay);

  //var _mouse;
  var _raycaster;

  //--------------------- Helper Functions ----------------------//

  var _change_aspect_to = function(aspect) {
    if (!aspect || aspect == ZP.ASPECT.EQUAL) {
      _arena_dims = { x: 100, y: 100, z: 100 };
    } else if (aspect == ZP.ASPECT.ORIGINAL) {
      let rx = _current_aes.x.span;
      let ry = _current_aes.y.span;
      let rz = _current_aes.z.span;
      let coef = 300 / (rx + ry + rz);
      _arena_dims = { x: coef * rx, y: coef * ry, z: coef * rz };
    }
  };

  var _update_aes = function() {
    // animated colors if updated
    if (_current_aes.color !== _cached_aes.color) {
      for (let i in _points) {
        let a = HUSL.fromHex(_cached_aes.color.values[i]);
        let b = HUSL.fromHex(_current_aes.color.values[i]);
        (new TWEEN.Tween(a)).to(b, ZP.ANIMATION_DURATION).easing(TWEEN.Easing.Exponential.Out)
          .onUpdate(function(){
            _points[i].material.color = new THREE.Color(HUSL.toHex(this[0], this[1], this[2]));
          })
          .start();
      }

      if (_cached_aes) {
        _cached_aes.color.legend.removeEventListener('dim', _on_dim);
        _cached_aes.color.legend.removeEventListener('light', _on_light);
      }

      _current_aes.color.legend.addEventListener('dim', _on_dim);
      _current_aes.color.legend.addEventListener('light', _on_light);
      _current_aes.color.legend.reset();

      _legend_div.innerHTML = '';
      _legend_div.appendChild(_current_aes.color.legend);
    }

    // animated points if updated
    if ( _current_aes.x != _cached_aes.x ||
         _current_aes.y != _cached_aes.y ||
         _current_aes.z != _cached_aes.z ) {
      _change_aspect_to(_current_aspect);
      _update_arena();
    }

    _cached_aes = _current_aes;
  };

  var _update_arena = function() {
    // animate the points
    for (let i in _points) {
      let a = {
        y: _points[i].position.x,
        z: _points[i].position.y,
        x: _points[i].position.z
      };
      let b = {
        x: _current_aes.x.values[i] * _arena_dims.x,
        y: _current_aes.y.values[i] * _arena_dims.y,
        z: _current_aes.z.values[i] * _arena_dims.z
      };

      (new TWEEN.Tween(a)).to(b, ZP.ANIMATION_DURATION).easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function(){ _points[i].position.set(this.y, this.z, this.x); })
        .start();

      // animate the crosshairs
      if (_points[i] === _selected_obj) {
        (new TWEEN.Tween(a)).to(b, ZP.ANIMATION_DURATION).easing(TWEEN.Easing.Exponential.Out)
          .onUpdate(function(){
            _crosshairs.position.set(this.y, this.z, this.x);
          })
          .start();
      }
    }

    // animate the floor

    let m = _dot_size/2 + ZP.FLOOR_MARGIN;
    let dims = {
      x: _arena_dims.x + m,
      y: _arena_dims.y + m,
      z: _arena_dims.z + m
    };
    let vs = [
      { x: - dims.x, y: - dims.y, z: - dims.z },
      { x: + dims.x, y: - dims.y, z: - dims.z },
      { x: + dims.x, y: + dims.y, z: - dims.z },
      { x: - dims.x, y: + dims.y, z: - dims.z },
      { x: - dims.x, y: - dims.y, z: - dims.z }
    ];

    for (let i in _floor.geometry.vertices) {
      let a = {
        y: _floor.geometry.vertices[i].x,
        z: _floor.geometry.vertices[i].y,
        x: _floor.geometry.vertices[i].z
      };
      let b = vs[i];

      (new TWEEN.Tween(a)).to(b, ZP.ANIMATION_DURATION).easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function(){
          _floor.geometry.vertices[i].set(this.y, this.z, this.x);
          _floor.geometry.verticesNeedUpdate = true;
        })
        .start();
    }
  };

  var _dim_points = function(inds, dim) {
    for (let i of inds) {
      var a = { opacity: _points[i].material.opacity };
      var b = { opacity: dim ? 0.1 : 1 };
      (new TWEEN.Tween(a)).to(b, ZP.ANIMATION_DURATION).easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function(){ _points[i].material.opacity = this.opacity })
        .start();
    }
  };

  var _on_dim = function(e) { _dim_points(e.detail, true) };
  var _on_light = function(e) { _dim_points(e.detail, false) };

  this.plot = function(data_, mappings_) {
    _points = [];
    //_mouse = new THREE.Vector2(Infinity, Infinity);
    _raycaster = new THREE.Raycaster();
    _selected_obj = null;

    _disc_txtr = new THREE.Texture(ZP.POINT_ICON);
    _disc_txtr.needsUpdate = true;

    _data_rows = ZP.colsToRows(data_);
    _data_indices = ZP.range0(_data_rows.length);

    //------------------------- Remap AES -------------------------//

    /**
     *
     * scales = { pc1: { x: <scale> }, group: { y: <scale> }, .. }
     *
     * mappings_ = { pca: { x: 'pc1'  , y: 'pc2'  , z: 'pc3'  , color: 'group' } ,
     *               mds: { x: 'mds1' , y: 'mds2' , z: 'mds3' , color: 'group' } }
     *
     * TODO: should be based on types instead of aes slots:
     *       scales = { pc1: { continuous: <scale> }, group: { color_discrete: <scale> }, .. }
     *
     *
     */
    let scales = {};
    for (let col in data_) {
      scales[col] = {};
    }

    _aeses = {};
    for (let m in mappings_) {
      let mapping = mappings_[m];
      let attrs = {};
      for (let a in mapping) {
        let col = mapping[a];
        if (scales[col][a]) {
          attrs[a] = scales[col][a];
        } else {
          if (a == 'x' || a == 'y' || a == 'z') {
            attrs[a] = scales[col][a] = new ZP.ScaleContinuous(data_[col], col);
          } else if (a == 'color') {
            if (typeof data_[col][0] == 'number') {
              attrs[a] = scales[col][a] = new ZP.ScaleColorContinuous(data_[col], col);
            } else {
              attrs[a] = scales[col][a] = new ZP.ScaleColorDiscrete(data_[col], col);
            }
          } else {
            throw new Error(a + " in mappings is not supported!");
          }
        }
      }
      _aeses[m] = new ZP.OldAes(attrs);
    }

    /**
     * _aeses
     *
     *   . pca
     *       . x     = <scale>
     *       . y     = <scale>
     *       . z     = <scale>
     *       . color = <scale>
     *
     *   . mds
     *       . x     = <scale>
     *       . y     = <scale>
     *       . z     = <scale>
     *       . color = <scale>
     *
     */

    _aeses_names = Object.keys(_aeses);
    _num_aeses = _aeses_names.length;

    // TODO: draw legends for switching between aeses

    var _change_aes = function(by_) {
      _cached_aes = _current_aes;

      _current_aes_index = (_current_aes_index + _num_aeses + by_) % _num_aeses;
      _current_aes_name = _aeses_names[_current_aes_index];
      _scale_name_div.innerText = _current_aes_name;

      _current_aes = _aeses[_current_aes_name];
    };

    _current_aes_index = 0;
    _change_aes(0);

    _change_aspect_to(ZP.ASPECT.ORIGINAL);


    //------------------------ Handle events ----------------------//

    window.addEventListener('keydown', function(e) {
      switch ( e.key ) {
        case ZP.KEY_SCALE_PREV: prevScaleButton.dispatchEvent(new Event('click')); break;
        case ZP.KEY_SCALE_NEXT: nextScaleButton.dispatchEvent(new Event('click')); break;
        case ZP.KEY_VIEW_RESET: resetCameraButton.dispatchEvent(new Event('click')); break;
        case ZP.KEY_TOGGLE_ORTHO_VIEWS: toggleOrthoButton.dispatchEvent(new Event('click')); break;
      }
    });
    
    prevScaleButton.addEventListener('click', function(e) {
      _change_aes(-1);
      _update_aes();
    });

    nextScaleButton.addEventListener('click', function(e) {
      _change_aes(1);
      _update_aes();
    });

    resetCameraButton.addEventListener('click', function(e) {
      _ortho = 'none';
      _ortho_orbit.enabled = false;
      _orbit.enabled = true;

      _orbit.moveToOriginal();
    });

    toggleAspectButton.addEventListener('click', function(e) {
      if (_current_aspect == ZP.ASPECT.EQUAL) {
        _change_aspect_to(ZP.ASPECT.ORIGINAL);
        toggleAspectButton.classList.remove('activated');
        _current_aspect = ZP.ASPECT.ORIGINAL;
      } else {
        _change_aspect_to(ZP.ASPECT.EQUAL);
        toggleAspectButton.classList.add('activated');
        _current_aspect = ZP.ASPECT.EQUAL;
      }
      _update_arena();
    });

    toggleOrthoButton.addEventListener('click', function(e) {
      if (_ortho == 'none') {
        _ortho_camera.position.set( 0, 1000, 0 );
        _ortho_camera.up.set( 1, 0, 0 );
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0));
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix();

        _ortho_orbit.target = new THREE.Vector3(0, 0, 0);
        _ortho_orbit.enabled = true;
        _orbit.enabled = false;

        _ortho = 'z';
      } else if (_ortho == 'z') {
        _ortho_camera.position.set( -1000, 0, 0 );
        _ortho_camera.up.set( 0, 1, 0 );
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0));
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix();

        _ortho_orbit.target = new THREE.Vector3(0, 0, 0);
        _ortho_orbit.enabled = true;
        _orbit.enabled = false;

        _ortho = 'y';
      } else if (_ortho == 'y') {
        _ortho_camera.position.set( 0, 0, -1000 );
        _ortho_camera.up.set( 0, 1, 0 );
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0));
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix();

        _ortho_orbit.target = new THREE.Vector3(0, 0, 0);
        _ortho_orbit.enabled = true;
        _orbit.enabled = false;

        _ortho = 'x';
      } else if (_ortho == 'x') {
        _ortho = 'none';

        _ortho_orbit.enabled = false;
        _orbit.enabled = true;
      }
    });

    //-------------------------------------------------------------//


    //_scene.fog = new THREE.Fog(0xffffff, 400, 1000);

    _scene.add( _camera );

    //_renderer.domElement.addEventListener('mousemove', function(e) {
    //  _mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
    //  _mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
    //});

    _renderer.domElement.addEventListener('dblclick', function(e) {
      let undimmed_points = _points.filter(p => p.material.opacity == 1);

      let mouse = new THREE.Vector2(Infinity, Infinity);
      mouse.x = ( e.offsetX / _renderer.domElement.clientWidth ) * 2 - 1;
      mouse.y = - ( e.offsetY / _renderer.domElement.clientHeight ) * 2 + 1;

      if (_ortho == 'none') {
        _raycaster.setFromCamera( mouse, _camera );
      } else {
        _raycaster.setFromCamera( mouse, _ortho_camera );
      }
      var intersects = _raycaster.intersectObjects( undimmed_points );
      if (intersects.length > 0) {
        if (intersects[0].object != _selected_obj) {
          _selected_obj = intersects[0].object;
          var outputs = [];
          for (var prop in _selected_obj.datum) {
            outputs.push(prop + ' = ' + _selected_obj.datum[prop]);
          }
          datumDisplay.innerText = outputs.join('\n');
          _crosshairs.position.copy(_selected_obj.position);
          _crosshairs.visible = true;
        }
      } else {
        _selected_obj = null;
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

    _dot_size = Math.cbrt(7.5 + 20000 / (_data_indices.length + 20));

    let m = _dot_size/2 + ZP.FLOOR_MARGIN;
    let dims = {
      x: _arena_dims.x + m,
      y: _arena_dims.y + m,
      z: _arena_dims.z + m
    };
    let vs = [
      { x: - dims.x, y: - dims.y, z: - dims.z },
      { x: + dims.x, y: - dims.y, z: - dims.z },
      { x: + dims.x, y: + dims.y, z: - dims.z },
      { x: - dims.x, y: + dims.y, z: - dims.z },
      { x: - dims.x, y: - dims.y, z: - dims.z }
    ];

    let floorMtrl = new THREE.LineBasicMaterial( { color: 0x777777 });
    let floorGtry = new THREE.Geometry();
    vs.map(v => floorGtry.vertices.push(new THREE.Vector3(v.y, v.z, v.x)));
    _floor = new THREE.Line(floorGtry, floorMtrl);
    _scene.add(_floor);

    // Sprites
    
    for (let i of _data_indices) {
      // TODO: deal with nulls in these columns
      let x     = _current_aes.x.values[i] * _arena_dims.x;
      let y     = _current_aes.y.values[i] * _arena_dims.y;
      let z     = _current_aes.z.values[i] * _arena_dims.z;

      let datum = _data_rows[i];
      datum['(0-based index)'] = i;

      let color = _current_aes.color ? _current_aes.color.values[i] : ZP.COLOR_DEFAULT;
      let discMtrl = new THREE.SpriteMaterial({ map: _disc_txtr, color: new THREE.Color(color) });
      let discSprt = new THREE.Sprite(discMtrl);
      discSprt.position.set( y , z , x );
      discSprt.scale.set( _dot_size, _dot_size, 1 );
      discSprt.datum = datum;
      discSprt.dimmed = false;
      _scene.add( discSprt );

      _points.push(discSprt);
    }

    if (_current_aes.color) {
      _current_aes.color.legend.addEventListener('dim', _on_dim);
      _current_aes.color.legend.addEventListener('light', _on_light);

      _legend_div.innerHTML = '';
      _legend_div.appendChild(_current_aes.color.legend);

      _current_aes.color.legend.reset();
    }

    // overlay scene

    var crosshairsTxtr = new THREE.Texture(ZP.CROSSHAIRS_ICON);
    crosshairsTxtr.needsUpdate = true;
    var crosshairsMtrl = new THREE.SpriteMaterial({
      map: crosshairsTxtr,
      color: new THREE.Color('#000000')
    });
    _crosshairs = new THREE.Sprite( crosshairsMtrl );
    _crosshairs.position.set( Infinity, Infinity, Infinity );
    _crosshairs.visible = false;
    _crosshairs.tweenObj = { size: _dot_size * ZP.CROSSHAIR_SIZE_FACTOR };
    _crosshairs.tween = new TWEEN.Tween(_crosshairs.tweenObj)
    _crosshairs.tween.to({ size: _dot_size * ZP.CROSSHAIR_SIZE_FACTOR * 1.4 }, 800).easing(TWEEN.Easing.Sinusoidal.InOut).repeat(Infinity).yoyo(true)
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
