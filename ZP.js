// TODO: figure out the appropriate dimmed opacity from the number of points
// TODO: use pretty scales (1, 2, 5, 10 ticks) for the continuous color scale
// TODO: deal with nulls in coords
// TODO: isolate coordinate changes and color changes, and add key shortcuts for each
// TODO: use svg for the legend of continuous color scale
// TODO: double click should add a label following that dot, using the "label" aes
// TODO: add "multiple coordinates" functionality (e.g., for PCA and MDS), and maybe multiple **mappings** as well
// TODO: add **instant type** search functionality, very useful when the dots are overwhelmingly many
// TODO: should be able to specify a label layer
// TODO: change the base to something like http://threejs.org/examples/#webgl_geometry_spline_editor, exept it's infinitely large and there's fog
// TODO: add drop shadow to the base, looks great
// TODO: Temporal Anti-Aliasing (TAA), maybe for lines in the future
// TODO: adopt/modify the offical library for canvas material: http://threejs.org/examples/#canvas_interactive_particles


var ZP = ZP || {}


ZP.ASPECT = { EQUAL: 0, ORIGINAL: 1 }
ZP.ASPECT_STATE = { NONE: 0, TRANSITIONING: 1 }
ZP.COLOR_DEFAULT = '#555555'

ZP.COLOR_PALETTE = [
  '#01a0e4' , '#db2d20' , '#01a252' , '#a16a94' , '#332288' ,
  '#ddcc77' , '#cc6677' , '#882255' , '#aa4499' , '#661100' ,
  '#d7ef75' , '#88ccee' , '#44aa99' , '#117733' , '#999933' ,
  '#6699cc' , '#aa4466' , '#4477aa'
]

ZP.CC_OPACITY_LOW = 0.1
ZP.CC_OPACITY_HIGH = 1
ZP.CC_LOW = '#56b1f7'
ZP.CC_HIGH = '#132b43'

ZP.CC_PATCH_WIDTH = 20
ZP.CC_PATCH_HEIGHT = 130
ZP.CC_PATCH_MARGIN = 10
ZP.CC_PATCH_LABEL_MARGIN = 5

ZP.VIEW_ANGLE = 45
ZP.ORTHO_SHRINK = 180
ZP.NEAR = 0.1
ZP.FAR = 20000
ZP.FLOOR_MARGIN = 2
ZP.KEY_COORD_PREV = 'k'
ZP.KEY_COORD_NEXT = 'j'
ZP.KEY_COLOR_PREV = 'h'
ZP.KEY_COLOR_NEXT = 'l'
ZP.KEY_VIEW_RESET = ' '
ZP.KEY_TOGGLE_ORTHO_VIEWS = 'Enter'
ZP.NULL_DISPLAY_AS = '[none]'
ZP.CROSSHAIR_SIZE_FACTOR = 2

ZP.DEFAULT_OPTIONS = {
  debug: false,
  animation: true,
  dot_size: 'auto',
  dimmed_opacity: 'auto',
  animation_duration: 250
}

ZP.normalize = function(xs, low=-1, high=1) {
  let min = Math.min.apply(null, xs)
  let max = Math.max.apply(null, xs)

  if (min == max) {
    return xs.map( x => 0 )
  } else {
    return xs.map( x => (x - min)/(max - min) )
             .map( x => low + x * (high - low) )
  }
}

ZP.range0 = function(hi) {
  let a = []
  for (let i = 0; i < hi; i++) {
    a.push(i)
  }
  return a
}

ZP.legend_action_event = function(detail_) {
  return (new CustomEvent('legend_action', { bubbles: true, detail: detail_ }))
}

ZP.pretty_breaks = function(vec_) {
  // TODO
}

ZP.hex_to_rgba = function(hex_, alpha_=1) {
  let hex = hex_.match(/[0-9a-fA-F]{6}/)[0]
  let r = parseInt(hex.slice(0,2), 16)
  let g = parseInt(hex.slice(2,4), 16)
  let b = parseInt(hex.slice(4,6), 16)
  return [r, g, b, alpha_]
}

ZP.rgba_to_hex = function(rgba_) {
  let r = Math.round(rgba_[0]).toString(16)
  let g = Math.round(rgba_[1]).toString(16)
  let b = Math.round(rgba_[2]).toString(16)
  return '#' + [r, g, b].map(s => ('00' + s).slice(-2)).join('')
}




/**
 * Unlike htmlwidgets.dataframeToD3, this function does minimal check, but it pads nulls when
 * the arrays are not of the same length.
 *
 * "null" instead of "undefined" is used for representing an NA, because "undefined" cannot be
 * serialized into JSON.
 */
ZP.colsToRows = function(cols_) {
  let _cols = JSON.parse(JSON.stringify(cols_))
  let _rows = []
  while (true) {
    let flag = true
    let row = {}
    for (let colName in _cols) {
      let value = _cols[colName].shift()
      if (typeof(value) === 'undefined') {
        value = null
      } else {
        flag = false
      }
      row[colName] = value
    }
    // this loop ends when all cols are depleted
    if (flag) break
    _rows.push(row)
  }

  return _rows
}



ZP.ScaleContinuous = function(vec_, name_) {
  let _values = ZP.normalize(vec_)

  let _low    = Math.min(...vec_)
  let _high   = Math.max(...vec_)
  let _span   = _high - _low

  this.get_value = x => _values[x]
  this.span   = _span
  this.low    = _low
  this.high   = _high
  this.name   = name_
}




/**
 * { type   : 'factor',
 *   data   : [ 1, null, 2, 3, ... ],
 *   levels : [ 'foo', 'bar', 'baz', ... ] }
 */
ZP.ScaleColorFactor = function(vec_, name_, palette_=ZP.COLOR_PALETTE) {
  let _this = this

  let _dimmed = {}
  let _color = {}
  let _legendItem = {}
  let _indices = {}
  let _legend

  let _palette = palette_.slice()

  let _change_level = function(l, new_dimmed_) {
    _dimmed[l] = new_dimmed_
    _legendItem[l].classList[new_dimmed_ ? 'add' : 'remove']('dimmed')
    _legend.dispatchEvent(ZP.legend_action_event({ type: 'opacity', indices: _indices[l], opacity: new_dimmed_ ? 'dim' : 1 }))
    _legend.dispatchEvent(ZP.legend_action_event({ type: 'selectability', indices: _indices[l], selectability: !new_dimmed_ }))
  }
  
  let _toggleLevel = function(l) {
    _change_level(l, !_dimmed[l])
  }

  let _onlyShowOneLevel = function(l) {
    for (let level of vec_.levels) {
      _change_level(level, level != l)
    }
  }

  let _toggleAllLevels = function() {
    let all_dimmed = vec_.levels.every(l => _dimmed[l])
    vec_.levels.map(l => _change_level(l, !all_dimmed))
  }

  let _format_legend_text = function(t) {
    if (t === null) {
      return ZP.NULL_DISPLAY_AS
    } else {
      return t
      //return t.replace('_', ' ')
    }
  }

  _legend = document.createElement('div')
  _legend.innerHTML = `<h2>${_format_legend_text(name_)}</h2>`

  let item_container_DIV = document.createElement('div')
  item_container_DIV.id = 'item-container'
  _legend.appendChild(item_container_DIV)
  _legend.addEventListener('dblclick', function(e){_toggleAllLevels()})

  let _create_legend_item = function(level_, color_) {
    let item_DIV = document.createElement('div')
    item_DIV.classList.add('item')
    item_DIV.innerHTML = `<span class="color-patch" style="background-color: ${color_}"></span>${_format_legend_text(level_)}`
    item_DIV.addEventListener('click', function(e){e.ctrlKey ? _onlyShowOneLevel(level_) : _toggleLevel(level_)})
    item_DIV.addEventListener('dblclick', function(e){e.stopPropagation()})
    item_container_DIV.appendChild(item_DIV)

    return item_DIV
  }

  vec_.levels.map(l => _dimmed[l] = false)
  vec_.levels.map(l => _indices[l] = [])

  for (let l of vec_.levels) {
    let color = _palette.shift()
    if (!color) color = ZP.COLOR_DEFAULT

    _color[l] = color
    _legendItem[l] = _create_legend_item(l, color)
  }

  if (vec_.data.indexOf(null) >= 0) {
    /**
     * If there's null in vec_.data:
     * 
     *   - augment vec.levels with an extra level "<NULL_DISPLAY_AS>"
     *   - change all occurences of null in vec_.data to the index of "<NULL_DISPLAY_AS>"
     *   - dim "<NULL_DISPLAY_AS>"
     */
    let l = ZP.NULL_DISPLAY_AS
    vec_.levels.push(l)
    vec_.data = vec_.data.map(x => x === null ? vec_.levels.length-1 : x)
    _dimmed[l] = true
    _indices[l] = []

    _color[l] = ZP.COLOR_DEFAULT
    _legendItem[l] = _create_legend_item(l, ZP.COLOR_DEFAULT)
  }

  vec_.data.map((f, i) => _indices[vec_.levels[f]].push(i))

  _legend.reset = function() {
    for (l of vec_.levels) {
      _legend.dispatchEvent(ZP.legend_action_event({ type: 'color', indices: _indices[l], color: _color[l] }))
      _change_level(l, _dimmed[l])
    }
  }

  this.dimmed = _dimmed
  this.legend = _legend
  this.name = name_
}



ZP.ScaleColorString = function(vec_, name_) {
  let _levels = Array.from(new Set(vec_))
              . filter(a => a !== null)
              . sort()

  let _level_to_index = {}
  _levels.map((l, i) => _level_to_index[l] = i)

  let _vec = vec_.map(f => f === null ? null : _level_to_index[f])

  return new ZP.ScaleColorFactor({ data: _vec, levels: _levels }, name_)
}



ZP.ScaleColorBoolean = function(vec_, name_) {
  let _levels = ['true', 'false']
  let _vec = vec_.map(b => b ? 0 : 1)

  let _this = new ZP.ScaleColorFactor({ data: _vec, levels: _levels }, name_, ['#ff0000', '#0077ff'])
  _this.dimmed['false'] = true;

  return _this
}

ZP.ScaleColorDensity = function() {
  let _legend = document.createElement('div')
  _legend.innerHTML = ``
  _legend.innerHTML += `<div style="text-align: center">opacity</div>`
  _legend.innerHTML +=
    `<div>` +
    `<input id="scn-opacity-slider" type="range" min="0" max="1" step="0.01" value="1"/>` +
    `</div>`

  let _change_opacity_to = function(opacity_) {
    _legend.dispatchEvent(ZP.legend_action_event({ type: 'opacity', opacity: opacity_ }))
  }

  let _opacity_slider = _legend.querySelector('#scn-opacity-slider')
  _opacity_slider.addEventListener('input', e => _change_opacity_to(_opacity_slider.value, false))

  _legend.reset = function () {
    _legend.dispatchEvent(ZP.legend_action_event({ type: 'color' }))
    _legend.dispatchEvent(ZP.legend_action_event({ type: 'selectability' }))
    _change_opacity_to(_opacity_slider.value)
  }

  this.legend = _legend
}


ZP.ScaleColorNumeric = function(vec_, name_) {
  let _use_transparency = false

  let _norms = ZP.normalize(vec_, 0, 1)
  let _huslLow = ZP.hex_to_rgba(ZP.CC_LOW)
  let _huslHigh = ZP.hex_to_rgba(ZP.CC_HIGH)

  let _colors = []
  for (let x of _norms) {
    let ys = []
    for (let i of [0,1,2]) {
      ys.push(_huslLow[i] + x * (_huslHigh[i] - _huslLow[i]))
    }
    _colors.push(ZP.rgba_to_hex(ys))
  }

  let _opacities = ZP.normalize(vec_, ZP.CC_OPACITY_LOW, ZP.CC_OPACITY_HIGH)

  let _low    = Math.min(...vec_)
  let _high   = Math.max(...vec_)
  let _span   = _high - _low

  // TODO
  let _legend = document.createElement('div')
  _legend.innerHTML =
    `<h2>${name_}</h2>` +
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="cc-svg">` +
			`<defs>` +
				`<linearGradient id="cc-gradient" x1="0" y1="1" x2="0" y2="0">` +
					`<stop stop-color="rgba(${ZP.hex_to_rgba(ZP.CC_LOW, _use_transparency ? ZP.CC_OPACITY_LOW : 1).join(',')})" offset="0%"/>` +
					`<stop stop-color="rgba(${ZP.hex_to_rgba(ZP.CC_HIGH, ZP.CC_OPACITY_HIGH).join(',')})" offset="100%"/>` +
				`</linearGradient>` +
			`</defs>` +
      `<rect id="cc-gradient-strip" x="0" y="0" width="${ZP.CC_PATCH_WIDTH}" height="${ZP.CC_PATCH_HEIGHT}" fill="url(#cc-gradient)"/>` +
      `<line x1="0" y1="0.5" x2="30" y2="0.5" stroke="black"/>` +
      `<line x1="0" y1="${ZP.CC_PATCH_HEIGHT-0.5}" x2="${ZP.CC_PATCH_WIDTH+10}" y2="${ZP.CC_PATCH_HEIGHT-0.5}" stroke="black"/>` +
      `<text x="${30+ZP.CC_PATCH_LABEL_MARGIN}" y="0.5" alignment-baseline="middle" text-anchor="start" font-size="0.8em">${_high}</text>` +
      `<text x="${30+ZP.CC_PATCH_LABEL_MARGIN}" y="${ZP.CC_PATCH_HEIGHT-0.5}" alignment-baseline="middle" text-anchor="start" font-size="0.8em">${_low}</text>` +
    `</svg>`

  let _svg = _legend.querySelector('#cc-svg')
  let _gradient = _legend.querySelector('#cc-gradient')
  let _gradient_strip_RECT = _legend.querySelector('#cc-gradient-strip')
  _gradient_strip_RECT.addEventListener('click', function(e) {
    _use_transparency = !_use_transparency
    _gradient.children[0].setAttribute('stop-color', `rgba(${ZP.hex_to_rgba(ZP.CC_LOW, _use_transparency ? ZP.CC_OPACITY_LOW : 1).join(',')})`)
    _legend.reset()
  })

  _legend.reset = function() {
    _legend.dispatchEvent(ZP.legend_action_event({ type: 'selectability' }))
    _legend.dispatchEvent(ZP.legend_action_event({ type: 'color', color: _colors }))
    if (_use_transparency) {
      _legend.dispatchEvent(ZP.legend_action_event({ type: 'opacity', opacity: _opacities }))
    } else {
      _legend.dispatchEvent(ZP.legend_action_event({ type: 'opacity' }))
    }

    let bbox = _svg.getBBox();
    let mbox = {
      x: bbox.x - ZP.CC_PATCH_MARGIN,
      y: bbox.y - ZP.CC_PATCH_MARGIN,
      width: bbox.width + 2 * ZP.CC_PATCH_MARGIN,
      height: bbox.height + 2 * ZP.CC_PATCH_MARGIN,
    }
    let viewBox = [mbox.x, mbox.y, mbox.width, mbox.height]
    _svg.setAttribute('viewBox', viewBox.join(' '))
    _svg.setAttribute('width', mbox.width)
    _svg.setAttribute('height', mbox.height)
  }

  this.span   = _span
  this.low    = _low
  this.high   = _high
  this.legend = _legend
  this.name   = name_
}


/**
 *
 * TODO: scales_cache = { pc1: { x: <scale> }, group: { y: <scale> }, .. }
 *
 * mappings_ . coord = [ { x: 'pc1'  , y: 'pc2'  , z: 'pc3'  },
 *                       { x: 'mds1' , y: 'mds2' , z: 'mds3' } ]
 *           . color = [ 'group', 'expr' ]
 *
 * 
 * <Scales> . coord . [ { x: <scale>, y: <scale>, z: <scale>},
 *                      { x: <scale>, y: <scale>, z: <scale>} ]
 *          . color . [ <scale>, <scale> ]
 */
ZP.Scales = function(data_, mappings_) {
  let _coord = []
  for (let m of mappings_.coord) {
    /**
     * m = ["col1", "col2", "col3"]
     */
    let ms = {}
    ms.x = new ZP.ScaleContinuous(data_[m[0]], m[0])
    ms.y = new ZP.ScaleContinuous(data_[m[1]], m[1])
    ms.z = new ZP.ScaleContinuous(data_[m[2]], m[2])
    
    _coord.push(ms)
  }
  
  let _color = []
  if (mappings_.color.length == 0) {
    _color = [new ZP.ScaleColorDensity()]
  } else {
    for (let m of mappings_.color) {
      /**
       * m  = 'group'
       */
      let ms
      if (m === null) {
        ms = new ZP.ScaleColorDensity()
      } else {
        if (typeof data_[m][0] == 'number') {
          ms = new ZP.ScaleColorNumeric(data_[m], m)
        } else if (typeof data_[m][0] == 'boolean') {
          ms = new ZP.ScaleColorBoolean(data_[m], m)
        } else {
          ms = new ZP.ScaleColorString(data_[m], m)
        }
      }
      
      _color.push(ms)
    }
  }
  
  this.coord = _coord
  this.color = _color
}

/**
 * <Aes>
 *       . current . coord = { x: <scale>, y: <scale>, z: <scale> }
 *                 . color = <scale>
 * 
 *       . next_coord()
 *       . prev_coord()
 *
 *       . next_color()
 *       . prev_color()
 *
 */

ZP.Aes = function(data_, mappings_) {
  let _scales = new ZP.Scales(data_, mappings_)
  
  let _current = { coord: _scales.coord[0], color: _scales.color[0] }

  let _coord_i = 0
  let _num_coords = _scales.coord.length

  let _title_DIV = document.createElement('div')
  _title_DIV.innerText = Object.keys(_current.coord).map(x => _current.coord[x].name).join(', ')

  let _prev_coord = function() {
    _coord_i += _num_coords - 1
    _coord_i %= _num_coords
    _current.coord = _scales.coord[_coord_i]

    _title_DIV.innerText = Object.keys(_current.coord).map(x => _current.coord[x].name).join(', ')
  }

  let _next_coord = function() {
    _coord_i += _num_coords + 1
    _coord_i %= _num_coords
    _current.coord = _scales.coord[_coord_i]

    _title_DIV.innerText = Object.keys(_current.coord).map(x => _current.coord[x].name).join(', ')
  }

  let _legend_DIV = document.createElement('div')
  _legend_DIV.appendChild(_current.color.legend)

  let _color_i = 0
  let _num_colors = _scales.color.length

  let _prev_color = function() {
    _color_i += _num_colors - 1
    _color_i %= _num_colors
    _current.color = _scales.color[_color_i]

    _legend_DIV.innerHTML = ''
    _legend_DIV.appendChild(_current.color.legend)
  }

  let _next_color = function() {
    _color_i += _num_colors + 1
    _color_i %= _num_colors
    _current.color = _scales.color[_color_i]

    _legend_DIV.innerHTML = ''
    _legend_DIV.appendChild(_current.color.legend)
  }

  let _reset_color = function() {
    _current.color.legend.reset()
  }

  this.current = _current
  this.prev_coord = _prev_coord
  this.next_coord = _next_coord
  this.prev_color = _prev_color
  this.next_color = _next_color
  this.legend_DIV = _legend_DIV
  this.title_DIV = _title_DIV
  this.reset_color = _reset_color
}


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
    throw new Error("x, y and z are required in the mapping!")
  }
  this.x = attrs_.x
  this.y = attrs_.y
  this.z = attrs_.z
  this.color = attrs_.color
}




ZP.ZP = function(el_, width_, height_) {
  let _aes

  let _data_rows
  let _data_indices

  let _aspect_state = ZP.ASPECT_STATE.NONE
  let _current_aspect = ZP.ASPECT.ORIGINAL


  let _points = []
  let _selected_obj = null
  let _floor
  let _crosshairs
  let _ortho = 'none'

  let _arena_dims

  let _disc_txtr = new THREE.Texture(ZP.POINT_ICON)
  _disc_txtr.needsUpdate = true

  let ar = width_ / height_
  let _camera = new THREE.PerspectiveCamera( ZP.VIEW_ANGLE, ar, ZP.NEAR, ZP.FAR )
  _camera.position.set( -400, 0, -130 )

  let s = ZP.ORTHO_SHRINK
  let _ortho_camera = new THREE.OrthographicCamera( ar * -s, ar * s, s, -s, ZP.NEAR, ZP.FAR )

  let _scene = new THREE.Scene()
  //_scene.fog = new THREE.Fog(0xffffff, 400, 1000)
  _scene.add( _camera )

  let _scene_overlay = new THREE.Scene()

  let _renderer = new THREE.WebGLRenderer( { antialias:true } )
  _renderer.setSize(width_, height_)
  _renderer.setClearColor(0xffffff, 1)
  _renderer.autoClear = false

  let _orbit = new THREE.OrbitControls( _camera, _renderer.domElement, new THREE.Vector3(0,0,0))
  _orbit.addEventListener('userRotate', function(e){_ortho = 'none'})
  _orbit.enableDamping = true
  _orbit.dampingFactor = 0.4
  _orbit.update()

  let _ortho_orbit = new THREE.OrbitControls( _ortho_camera, _renderer.domElement, new THREE.Vector3(0,0,0))
  _ortho_orbit.addEventListener('userRotate', function(e){_ortho = 'none'})
  _ortho_orbit.mouseButtons = { ORBIT: null, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.LEFT }
  _ortho_orbit.enabled = false
  _ortho_orbit.enableRotate = false
  _ortho_orbit.enableDamping = true
  _ortho_orbit.dampingFactor = 0.4
  _ortho_orbit.update()

  let _container_DIV = document.createElement('div')
  _container_DIV.id = 'plot-container'
  _container_DIV.appendChild( _renderer.domElement )
  el_.appendChild(_container_DIV)

  let _scale_name_DIV = document.createElement('div')
  _scale_name_DIV.id = 'scale-name'
  el_.appendChild(_scale_name_DIV)

  let _legend_DIV = document.createElement('div')
  _legend_DIV.id = 'legend'
  el_.appendChild(_legend_DIV)

  let overlayDom = document.createElement('div')
  overlayDom.id = 'overlay'
  el_.appendChild(overlayDom)

  let toolbarDom = document.createElement('div')
  toolbarDom.id = 'toolbar'
  overlayDom.appendChild(toolbarDom)

  let _prev_coord_BUTTON = document.createElement('i')
  _prev_coord_BUTTON.innerText = 'undo'
  _prev_coord_BUTTON.title = 'previous coord'
  _prev_coord_BUTTON.classList.add('material-icons')
  toolbarDom.appendChild(_prev_coord_BUTTON)

  let _next_coord_BUTTON = document.createElement('i')
  _next_coord_BUTTON.innerText = 'redo'
  _next_coord_BUTTON.title = 'next coord'
  _next_coord_BUTTON.classList.add('material-icons')
  toolbarDom.appendChild(_next_coord_BUTTON)

  let _prev_color_BUTTON = document.createElement('i')
  _prev_color_BUTTON.innerText = 'arrow_back'
  _prev_color_BUTTON.title = 'previous color'
  _prev_color_BUTTON.classList.add('material-icons')
  toolbarDom.appendChild(_prev_color_BUTTON)

  let _next_color_BUTTON = document.createElement('i')
  _next_color_BUTTON.innerText = 'arrow_forward'
  _next_color_BUTTON.title = 'next color'
  _next_color_BUTTON.classList.add('material-icons')
  toolbarDom.appendChild(_next_color_BUTTON)

  let resetCameraButton = document.createElement('i')
  resetCameraButton.innerText = 'youtube_searched_for'
  resetCameraButton.title = 'reset camera angle'
  resetCameraButton.classList.add('material-icons')
  toolbarDom.appendChild(resetCameraButton)

  let toggleAspectButton = document.createElement('i')
  toggleAspectButton.innerText = 'aspect_ratio'
  toggleAspectButton.title = 'toggle aspect ratio between 1:1:1 and original'
  toggleAspectButton.classList.add('material-icons')
  toolbarDom.appendChild(toggleAspectButton)

  let toggleOrthoButton = document.createElement('i')
  toggleOrthoButton.innerText = 'call_merge'
  toggleOrthoButton.title = 'toggle between orthographic and perspective camera'
  toggleOrthoButton.classList.add('material-icons')
  toolbarDom.appendChild(toggleOrthoButton)

  let datumDisplay = document.createElement('div')
  overlayDom.appendChild(datumDisplay)

  let _raycaster = new THREE.Raycaster()


  //--------------------- Helper Functions ----------------------//

  this.plot = function(data_, mappings_, options_) {
    if (typeof options_ === 'undefined') { 
      options_=ZP.DEFAULT_OPTIONS
    } else {
      for (o in ZP.DEFAULT_OPTIONS) {
        if (typeof options_[o] === 'undefined') {
          options_[o] = ZP.DEFAULT_OPTIONS[o]
        }
      }
    }

    let _change_aspect_to = function(aspect) {
      if (!aspect || aspect == ZP.ASPECT.EQUAL) {
        _arena_dims = { x: 100, y: 100, z: 100 }
      } else if (aspect == ZP.ASPECT.ORIGINAL) {
        let rx = _aes.current.coord.x.span
        let ry = _aes.current.coord.y.span
        let rz = _aes.current.coord.z.span
        let coef = 300 / (rx + ry + rz)
        _arena_dims = { x: coef * rx, y: coef * ry, z: coef * rz }
      }
    }

    let _update_coord = function() {
      _change_aspect_to(_current_aspect)
      _update_arena()
    }

    let _update_arena = function() {
      // animate the points
      for (let i in _points) {
        let a = {
          y: _points[i].position.x,
          z: _points[i].position.y,
          x: _points[i].position.z
        }
        let b = {
          x: _aes.current.coord.x.get_value(i) * _arena_dims.x,
          y: _aes.current.coord.y.get_value(i) * _arena_dims.y,
          z: _aes.current.coord.z.get_value(i) * _arena_dims.z
        }

        ;(new TWEEN.Tween(a)).to(b, options_.animation_duration).easing(TWEEN.Easing.Exponential.Out)
          .onUpdate(function(){ _points[i].position.set(this.y, this.z, this.x) })
          .start()

        // animate the crosshairs
        if (_points[i] === _selected_obj) {
          ;(new TWEEN.Tween(a)).to(b, options_.animation_duration).easing(TWEEN.Easing.Exponential.Out)
            .onUpdate(function(){
              _crosshairs.position.set(this.y, this.z, this.x)
            })
            .start()
        }
      }


      // animate the floor
      let m = options_.dot_size/2 + ZP.FLOOR_MARGIN
      let dims = {
        x: _arena_dims.x + m,
        y: _arena_dims.y + m,
        z: _arena_dims.z + m
      }
      let vs = [
        { x: - dims.x, y: - dims.y, z: - dims.z },
        { x: + dims.x, y: - dims.y, z: - dims.z },
        { x: + dims.x, y: + dims.y, z: - dims.z },
        { x: - dims.x, y: + dims.y, z: - dims.z },
        { x: - dims.x, y: - dims.y, z: - dims.z }
      ]

      for (let i in _floor.geometry.vertices) {
        let a = {
          y: _floor.geometry.vertices[i].x,
          z: _floor.geometry.vertices[i].y,
          x: _floor.geometry.vertices[i].z
        }
        let b = vs[i]

        ;(new TWEEN.Tween(a)).to(b, options_.animation_duration).easing(TWEEN.Easing.Exponential.Out)
          .onUpdate(function(){
            _floor.geometry.vertices[i].set(this.y, this.z, this.x)
            _floor.geometry.verticesNeedUpdate = true
          })
          .start()
      }
    }


    let _change_points_selectability = function(inds_, values_) {
      let is_array = Array.isArray(values_)
      for (let i of inds_) {
        _points[i]._selectable = is_array ? values_[i] : values_
      }
    }

    let _change_points_color = function(inds_, values_, animation_) {
      let is_array = Array.isArray(values_)
      for (let i of inds_) {
        let value = is_array ? values_[i] : values_
        if (animation_) {
          let a = ZP.hex_to_rgba(_points[i].material.color.getHexString())
          let b = ZP.hex_to_rgba(value)

          ;(new TWEEN.Tween(a)).to(b, options_.animation_duration).easing(TWEEN.Easing.Exponential.Out)
            .onUpdate(function(){ _points[i].material.color = new THREE.Color(ZP.rgba_to_hex(this)) })
            .start()
        } else {
          _points[i].material.color = new THREE.Color(value)
        }
      }
    }

    let _change_points_opacity = function(inds_, values_, animation_) {
      let is_array = Array.isArray(values_)
      for (let i of inds_) {
        let value = is_array ? values_[i] : values_
        if (value === 'dim') value = options_.dimmed_opacity
        if (animation_) {
          let a = { opacity: _points[i].material.opacity }
          let b = { opacity: value }
          
          ;(new TWEEN.Tween(a)).to(b, options_.animation_duration).easing(TWEEN.Easing.Exponential.Out)
            .onUpdate(function(){ _points[i].material.opacity = this.opacity })
            .start()
        } else {
          _points[i].material.opacity = value
        }
      }
    }
    if (options_.title) { document.title = 'ZP - ' + options_.title }
    if (options_.debug) { console.log('data_ = ', data_) }
    if (options_.debug) { console.log('mappings_ = ', mappings_) }

    _aes = new ZP.Aes(data_, mappings_)
    if (options_.debug) { console.log('_aes = ', _aes) }

    _data_rows = ZP.colsToRows(data_)
    if (options_.debug) { console.log('_data_rows = ', _data_rows) }

    _data_indices = ZP.range0(_data_rows.length)
    let l = _data_indices.length
    if (options_.dot_size == 'auto') options_.dot_size = Math.cbrt(Math.pow(2,3) + Math.pow(10,3) / (l/20 + 1))
    if (options_.dimmed_opacity == 'auto') options_.dimmed_opacity = Math.cbrt(Math.pow(0.01,3) + Math.pow(0.1,3) / (l/5000 + 1))

    _change_aspect_to(ZP.ASPECT.ORIGINAL)

    let m = options_.dot_size/2 + ZP.FLOOR_MARGIN
    let dims = {
      x: _arena_dims.x + m,
      y: _arena_dims.y + m,
      z: _arena_dims.z + m
    }
    let vs = [
      { x: -dims.x, y: -dims.y, z: -dims.z },
      { x: +dims.x, y: -dims.y, z: -dims.z },
      { x: +dims.x, y: +dims.y, z: -dims.z },
      { x: -dims.x, y: +dims.y, z: -dims.z },
      { x: -dims.x, y: -dims.y, z: -dims.z }
    ]

    let floorMtrl = new THREE.LineBasicMaterial( { color: 0x777777 })
    let floorGtry = new THREE.Geometry()
    vs.map(v => floorGtry.vertices.push(new THREE.Vector3(v.y, v.z, v.x)))
    _floor = new THREE.Line(floorGtry, floorMtrl)
    _scene.add(_floor)

    for (let i of _data_indices) {
      let x = _aes.current.coord.x.get_value(i) * _arena_dims.x
      let y = _aes.current.coord.y.get_value(i) * _arena_dims.y
      let z = _aes.current.coord.z.get_value(i) * _arena_dims.z

      let datum = _data_rows[i]
      datum['(0-based index)'] = i

      let color = ZP.COLOR_DEFAULT
      let discMtrl = new THREE.SpriteMaterial({ map: _disc_txtr, color: new THREE.Color(color) })
      let discSprt = new THREE.Sprite(discMtrl)
      discSprt.position.set( y , z , x )
      discSprt.scale.set( options_.dot_size, options_.dot_size, 1 )
      discSprt.datum = datum
      discSprt.dimmed = false
      _scene.add( discSprt )

      discSprt._selectable = true;

      _points.push(discSprt)
    }

    if (options_.debug) { console.log('_points = ', _points) }

    let crosshairsTxtr = new THREE.Texture(ZP.CROSSHAIRS_ICON)
    crosshairsTxtr.needsUpdate = true
    let crosshairsMtrl = new THREE.SpriteMaterial({
      map: crosshairsTxtr,
      color: new THREE.Color('#000000')
    })
    _crosshairs = new THREE.Sprite( crosshairsMtrl )
    _crosshairs.position.set( Infinity, Infinity, Infinity )
    _crosshairs.visible = false
    _crosshairs.tweenObj = { size: options_.dot_size * ZP.CROSSHAIR_SIZE_FACTOR }
    _crosshairs.tween = new TWEEN.Tween(_crosshairs.tweenObj)
    _crosshairs.tween.to({ size: options_.dot_size * ZP.CROSSHAIR_SIZE_FACTOR * 1.4 }, 800).easing(TWEEN.Easing.Sinusoidal.InOut).repeat(Infinity).yoyo(true)
      .onUpdate(function(){ _crosshairs.scale.set(this.size, this.size, 1) })
      .start()
    _scene_overlay.add( _crosshairs )



    //---------------------- configure UI ---------------------//

    _scale_name_DIV.appendChild(_aes.title_DIV)
    _legend_DIV.appendChild(_aes.legend_DIV)
    _legend_DIV.addEventListener('legend_action', function(e) {
      let d = e.detail
      switch (d.type) {
        case 'color':
          if (typeof d.indices === 'undefined') d.indices = _data_indices
          if (typeof d.color === 'undefined') d.color = ZP.COLOR_DEFAULT
          if (typeof d.animation === 'undefined') d.animation = options_.animation
          _change_points_color(d.indices, d.color, d.animation)
          break
        case 'opacity':
          if (typeof d.indices === 'undefined') d.indices = _data_indices
          if (typeof d.opacity === 'undefined') d.opacity = 1
          if (typeof d.animation === 'undefined') d.animation = options_.animation
          _change_points_opacity(d.indices, d.opacity, d.animation)
          break
        case 'selectability':
          if (typeof d.indices === 'undefined') d.indices = _data_indices
          if (typeof d.selectability === 'undefined') d.selectability = true
          _change_points_selectability(d.indices, d.selectability)
          break
      }
    })

    window.addEventListener('keydown', function(e) {
      switch ( e.key ) {
        case ZP.KEY_COORD_PREV: _prev_coord_BUTTON.dispatchEvent(new Event('click')); break
        case ZP.KEY_COORD_NEXT: _next_coord_BUTTON.dispatchEvent(new Event('click')); break
        case ZP.KEY_COLOR_PREV: _prev_color_BUTTON.dispatchEvent(new Event('click')); break
        case ZP.KEY_COLOR_NEXT: _next_color_BUTTON.dispatchEvent(new Event('click')); break
        case ZP.KEY_VIEW_RESET: resetCameraButton.dispatchEvent(new Event('click')); break
        case ZP.KEY_TOGGLE_ORTHO_VIEWS: toggleOrthoButton.dispatchEvent(new Event('click')); break
      }
    })
    
    _prev_coord_BUTTON.addEventListener('click', function(e) {
      _aes.prev_coord()
      _update_coord()
    })

    _next_coord_BUTTON.addEventListener('click', function(e) {
      _aes.next_coord()
      _update_coord()
    })

    _prev_color_BUTTON.addEventListener('click', function(e) {
      _aes.prev_color()
      _aes.reset_color()
    })

    _next_color_BUTTON.addEventListener('click', function(e) {
      _aes.next_color()
      _aes.reset_color()
    })

    resetCameraButton.addEventListener('click', function(e) {
      _ortho = 'none'
      _ortho_orbit.enabled = false
      _orbit.enabled = true

      _orbit.moveToOriginal()
    })

    toggleAspectButton.addEventListener('click', function(e) {
      if (_current_aspect == ZP.ASPECT.EQUAL) {
        _change_aspect_to(ZP.ASPECT.ORIGINAL)
        toggleAspectButton.classList.remove('activated')
        _current_aspect = ZP.ASPECT.ORIGINAL
      } else {
        _change_aspect_to(ZP.ASPECT.EQUAL)
        toggleAspectButton.classList.add('activated')
        _current_aspect = ZP.ASPECT.EQUAL
      }
      _update_arena()
    })

    toggleOrthoButton.addEventListener('click', function(e) {
      if (_ortho == 'none') {
        _ortho_camera.position.set( 0, 1000, 0 )
        _ortho_camera.up.set( 1, 0, 0 )
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0))
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix()

        _ortho_orbit.target = new THREE.Vector3(0, 0, 0)
        _ortho_orbit.enabled = true
        _orbit.enabled = false

        _ortho = 'z'
      } else if (_ortho == 'z') {
        _ortho_camera.position.set( -1000, 0, 0 )
        _ortho_camera.up.set( 0, 1, 0 )
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0))
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix()

        _ortho_orbit.target = new THREE.Vector3(0, 0, 0)
        _ortho_orbit.enabled = true
        _orbit.enabled = false

        _ortho = 'y'
      } else if (_ortho == 'y') {
        _ortho_camera.position.set( 0, 0, -1000 )
        _ortho_camera.up.set( 0, 1, 0 )
        _ortho_camera.lookAt(new THREE.Vector3(0, 0, 0))
        _ortho_camera.zoom = 1
        _ortho_camera.updateProjectionMatrix()

        _ortho_orbit.target = new THREE.Vector3(0, 0, 0)
        _ortho_orbit.enabled = true
        _orbit.enabled = false

        _ortho = 'x'
      } else if (_ortho == 'x') {
        _ortho = 'none'

        _ortho_orbit.enabled = false
        _orbit.enabled = true
      }
    })

    _renderer.domElement.addEventListener('dblclick', function(e) {
      let selectable_points = _points.filter(p => p._selectable)

      let mouse = new THREE.Vector2(Infinity, Infinity)
      mouse.x = ( e.offsetX / _renderer.domElement.clientWidth ) * 2 - 1
      mouse.y = - ( e.offsetY / _renderer.domElement.clientHeight ) * 2 + 1

      if (_ortho == 'none') {
        _raycaster.setFromCamera( mouse, _camera )
      } else {
        _raycaster.setFromCamera( mouse, _ortho_camera )
      }
      let intersects = _raycaster.intersectObjects( selectable_points )
      if (intersects.length > 0) {
        if (intersects[0].object != _selected_obj) {
          _selected_obj = intersects[0].object
          let outputs = []
          for (let prop in _selected_obj.datum) {
            outputs.push(prop + ' = ' + _selected_obj.datum[prop])
          }
          datumDisplay.innerText = outputs.join('\n')
          _crosshairs.position.copy(_selected_obj.position)
          _crosshairs.visible = true
        }
      } else {
        _selected_obj = null
        datumDisplay.innerText = ''
        _crosshairs.visible = false
      }
    })

    _aes.reset_color()

    //-------------------- start the engine -------------------//

    animate()

    function animate() {
      requestAnimationFrame( animate )
      render()
      update()
    }

    function update() {
      TWEEN.update()
      _orbit.update()
    }

    function render() {
      let render_camera = _ortho == 'none' ? _camera : _ortho_camera
      _renderer.clear()
      _renderer.render( _scene, render_camera )
      _renderer.clearDepth()
      _renderer.render( _scene_overlay, render_camera )
    }
  }

  this.resize = function(width, height) {
    _renderer.setSize( width, height )

    _camera.aspect = width / height
    _camera.updateProjectionMatrix()

    _ortho_camera.left = width / height * -ZP.ORTHO_SHRINK
    _ortho_camera.right = width / height * ZP.ORTHO_SHRINK
    _ortho_camera.top = ZP.ORTHO_SHRINK
    _ortho_camera.bottom = -ZP.ORTHO_SHRINK
    _ortho_camera.updateProjectionMatrix()
  }
}
