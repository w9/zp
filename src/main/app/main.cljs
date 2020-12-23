;; TODO: implement dynamic boundary dimensions
;; TODO: implement selection of mappings
(ns app.main
  (:refer-clojure :exclude [Box])
  (:require
   [clojure.core.async :as async :refer [go go-loop <! >!]]
   [clojure.core.async.interop :refer [<p!]]
   [promesa.core :as p]
   [clojure.string :as str]
   [goog.format :as gformat]
   [goog.net.XhrIo :as gxhrio]
   [goog.Uri :as guri]
   [helix.core :refer [defnc $ <>]]
   [helix.dom :as d]
   [helix.hooks :as hh]
   [app.utils :as utils :refer [map-vals spy forv]]
   [app.scale :as scale]
   [shadow.resource :as rc]
   [applied-science.js-interop :as j]

   ["three/examples/jsm/controls/OrbitControls" :refer [OrbitControls]]

   ["./assets.js" :as assets-js]
   ["./chroma.js" :as chroma-js]

   ["three" :as three]

   ["react" :as react]
   ["react-dom" :as react-dom]
   ;; ["react-spring" :as rspring]
   ["@react-spring/three" :as rsthree]
   ["react-three-fiber" :as r3]))

(r3/extend #js{"OrbitControls" OrbitControls})

(def dot-canvas (atom nil))

(defnc Dot
  [{:keys [x y z c] :as props}]
  (let [mesh                 (react/useRef)
        [hovered setHovered] (react/useState false)
        [active setActive]   (react/useState false)]
    ;; (r3/useFrame (fn []
    ;;                (let [r (-> mesh .-current .-rotation)]
    ;;                  (set! (.-x r) (+ 0.01 (.-x r)))
    ;;                  (set! (.-y r) (+ 0.01 (.-y r))))))
    ;; ($ "sprite" {:position #js[x y z]
    ;;              :scale #js[0.1 0.1 0.1]}
    ;;    ($ "spriteMaterial" {:color 0xffffffff}
    ;;       ($ "canvasTexture" {:args @dot-canvas :attach "map"})))
    ;; ($ "mesh" {:ref           mesh
    ;;            :position      #js[x y z]
    ;;            :scale         (if active #js[0.15 0.15 0.15] #js[0.1 0.1 0.1])
    ;;            :onClick       (fn [e] (setActive (not active)))
    ;;            :onPointerOver (fn [e] (setHovered true))
    ;;            :onPointerOut  (fn [e] (setHovered false))}
    ;;    ($ "boxBufferGeometry" {:args #js [1 1 1]})
    ;;    ($ "meshStandardMaterial" {:color (if hovered "hotpink" c)}))
    ))

(defnc CameraControls
  [{} ccRef]
  {:wrap [(react/forwardRef)]}
  (let [three      (r3/useThree)
        raycaster  (.-raycaster three)
        camera     (.-camera three)
        gl         (.-gl three)
        domElement (.-domElement gl)
        ccRef      (if (nil? ccRef) (react/useRef) ccRef)]
    (set! (.-threshold (.-Points (.-params raycaster))) 0.05)
    (r3/useFrame (fn [state] (-> ccRef .-current .update)))
    (react/useEffect (fn []
                       (let [controls (-> ccRef .-current)]
                         (set! (.-enableDamping controls) true)
                         (set! (.-dampingFactor controls) 0.3))
                       #())
                     #js [])
    ($ "orbitControls" {:ref ccRef :args #js [camera domElement]})))

(defn generate-toy-data
  [n-dots]
  (vec (repeatedly n-dots
                   #(let [r       (rand)
                          g       (rand)
                          b       (rand)
                          [l c h] (chroma-js/rgb2lch #js[r g b])]
                      {:position [l c h]
                       :color    [r g b]}))))


(defnc root
  [{:keys [data mappings options] :as props}]
  (let [ccRef                 (react/useRef)
        geoRef                (react/useRef)
        sprite-position-state (react/useState #js[1 1 1])
        sprite-position       (aget sprite-position-state 0)
        set-sprite-position   (aget sprite-position-state 1)
        v-base                (react/useMemo #(js/Float32Array. #js[1 -1 1
                                                                    -1 -1 1
                                                                    -1 -1 -1
                                                                    1 -1 -1])
                                             #js [])
        n-dots                100
        dots                  (repeatedly n-dots (fn [] [(rand) (rand) (rand)]))
        colors                (assets-js/pointsBufferFromArray (clj->js dots))
        ;; positions (assets-js/pointsBufferFromArray (clj->js (mapv (fn [arr] (mapv #(- (* % 2) 1) arr)) dots)))
        positions             (let [txed-dots   (mapv (fn [dot] (chroma-js/rgb2lch dot)) dots)
                                    dots-ranges (vec (for [i (range 3)]
                                                       (utils/extrema (mapv (fn [dot] (nth dot i)) txed-dots))))]
                                (assets-js/pointsBufferFromArray (clj->js (mapv (fn [dot] (vec (map-indexed (fn [idx x] (utils/linearly-interpolate (nth dots-ranges idx) [-1 1] x))
                                                                                                            dot)))
                                                                                txed-dots))))
        vertex-shader         (rc/inline "./vertex_shader.glsl")
        fragment-shader       (rc/inline "./fragment_shader.glsl")
        material              (react/useMemo #(assets-js/computeDiscMaterial vertex-shader fragment-shader) #js[])
        scrosshair-texture    (r3/useLoader three/TextureLoader "/textures/crosshairs.png")]
    (d/div {:id "plot-container"}
           ($ r3/Canvas
              ($ CameraControls {:ref ccRef})
              ;; ($ "ambientLight" {:intensity 0.5})
              ;; ($ "spotLight" {:position #js[10 10 10]
              ;;                 :angle    0.15
              ;;                 :penumbra 1})
              ;; ($ "pointLight" {:ref      geoRef
              ;;                  :position #js[-10 -10 -10]})
              ;; ($ "line" ($ ""))
              ($ "lineLoop"
                 ($ "bufferGeometry"
                    ($ "bufferAttribute" {:attachObject #js["attributes" "position"]
                                          :itemSize     3
                                          :count        4
                                          :array        v-base}))
                 ($ "lineBasicMaterial" {:color "black" :linewidth 1}))

              ($ "sprite" {:position sprite-position
                           :scale    #js[0.1 0.1 0.1]}
                 ($ "spriteMaterial" {:map   scrosshair-texture
                                      :color 0x000000}))

              ($ "points" {:onDoubleClick (fn [e] (set-sprite-position (.toArray (.-point (aget (.-intersections e) 0)))))
                           :material      material}
                 ;; ($ "shaderMaterial" {:uniforms #js{"color" #js{"value" 0xffffff}
                 ;;                                    "pointTexture" #js{"value" }}}})
                 ($ "bufferGeometry"
                    ($ "bufferAttribute" {:attachObject #js["attributes" "position"]
                                          :itemSize     3
                                          :count        n-dots
                                          :array        positions})
                    ($ "bufferAttribute" {:attachObject #js["attributes" "customColor"]
                                          :itemSize     3
                                          :count        n-dots
                                          :array        colors})))
              ;; (let [data (utils/cols-to-rows data)

              ;;       ;; id-getter #(get % "sample")
              ;;       ;; x-getter  #(get % "X1")
              ;;       ;; y-getter  #(get % "X2")
              ;;       ;; z-getter  #(get % "X3")
              ;;       ;; c-getter  #(get % "X1")

              ;;       ;; TODO: get this from the data

              ;;       id-getter #(get % "gene")
              ;;       x-getter  #(get % (get-in mappings ["coord" 0 0]))
              ;;       y-getter  #(get % (get-in mappings ["coord" 0 1]))
              ;;       z-getter  #(get % (get-in mappings ["coord" 0 2]))
              ;;       c-getter  #(get % (get-in mappings ["color" 0]))

              ;;       x-scale-spec (scale/axis-linear (map x-getter data))
              ;;       y-scale-spec (scale/axis-linear (map y-getter data))
              ;;       z-scale-spec (scale/axis-linear (map z-getter data))
              ;;       c-scale-spec (scale/color-map (map c-getter data))]

              ;;   (forv [datum data]
              ;;         ($ Dot {:key (id-getter datum)

              ;;                 :x (scale/apply-scale x-scale-spec (x-getter datum))
              ;;                 :y (scale/apply-scale y-scale-spec (y-getter datum))
              ;;                 :z (scale/apply-scale z-scale-spec (z-getter datum))
              ;;                 :c (scale/apply-scale c-scale-spec (c-getter datum))})))
              )

           (d/div {:id "overlay"}
                  (d/div {:id "toolbar"}
                         (d/i {:class "material-icons" :title "previous coord"} "undo")
                         (d/i {:class "material-icons" :title "next coord"} "redo")
                         (d/i {:class "material-icons" :title "previous color"} "arrow_back")
                         (d/i {:class "material-icons" :title "next color"} "arrow_forward")
                         (d/i {:class "material-icons" :title "reset camera angle" :onClick #(-> ccRef .-current .reset)} "youtube_searched_for")
                         (d/i {:class "material-icons" :title "toggle aspect ratio between 1:1:1 and original"} "aspect_ratio")
                         (d/i {:class "material-icons" :title "toggle between orthographic and perspective camera"} "call_merge"))
                  (d/div {:id "datum-meta"}))
           (d/div {:id "scale-name"}))))

(defn async-fetch
  [^js url]
  (p/create (fn [resolve reject]
              (gxhrio/send url (fn [e]
                                 (resolve ^js (.getResponseJson (.-target e))))))))

(defn get-json-url
  []
  (let [href js/location.href]
    ^js (.getParameterValue (guri/parse href) "json")))

(defn render-zp
  [old-root-el ^js json-input]
  (let [zp (js/ZP.ZP. old-root-el 1024 768)]
    (js/console.log (.-plot zp))
    (js/console.log (.plot zp (.-data json-input) (.-mappings json-input) (.-options json-input)))))

(defonce data (atom nil))

(defn render!
  []
  (let [root-el (js/document.getElementById "root")]
    (react-dom/render ($ react/Suspense {:fallback nil}
                         ($ root {:data     (get @data "data")
                                  :mappings (get @data "mappings")
                                  :options  (get @data "options")}))
                      root-el)))

(defn ^:export refresh!
  []
  (render!))

(defn ^:export init!
  []
  (p/let [json-url   (get-json-url)
          json-input (async-fetch json-url)]
    ;; (js/console.log json-input)
    ;; (reset! data (js->clj json-input))
    ;; (reset! data (js->clj utils/test-data))
    ;; (reset! dot-canvas (assets-js/drawDotCanvas))
    ;; (js/console.log @dot-canvas)
    (render!)
    )
  )

;; let toolbarDom = document.createElement('div')
;; toolbarDom.id = 'toolbar'
;; overlayDom.appendChild(toolbarDom)

;; let _prev_coord_BUTTON = document.createElement('i')
;; _prev_coord_BUTTON.innerText = 'undo'
;; _prev_coord_BUTTON.title = 'previous coord'
;; _prev_coord_BUTTON.classList.add('material-icons')
;; toolbarDom.appendChild(_prev_coord_BUTTON)

;; let _next_coord_BUTTON = document.createElement('i')
;; _next_coord_BUTTON.innerText = 'redo'
;; _next_coord_BUTTON.title = 'next coord'
;; _next_coord_BUTTON.classList.add('material-icons')
;; toolbarDom.appendChild(_next_coord_BUTTON)

;; let _prev_color_BUTTON = document.createElement('i')
;; _prev_color_BUTTON.innerText = 'arrow_back'
;; _prev_color_BUTTON.title = 'previous color'
;; _prev_color_BUTTON.classList.add('material-icons')
;; toolbarDom.appendChild(_prev_color_BUTTON)

;; let _next_color_BUTTON = document.createElement('i')
;; _next_color_BUTTON.innerText = 'arrow_forward'
;; _next_color_BUTTON.title = 'next color'
;; _next_color_BUTTON.classList.add('material-icons')
;; toolbarDom.appendChild(_next_color_BUTTON)

;; let resetCameraButton = document.createElement('i')
;; resetCameraButton.innerText = 'youtube_searched_for'
;; resetCameraButton.title = 'reset camera angle'
;; resetCameraButton.classList.add('material-icons')
;; toolbarDom.appendChild(resetCameraButton)

;; let toggleAspectButton = document.createElement('i')
;; toggleAspectButton.innerText = 'aspect_ratio'
;; toggleAspectButton.title = 'toggle aspect ratio between 1:1:1 and original'
;; toggleAspectButton.classList.add('material-icons')
;; toolbarDom.appendChild(toggleAspectButton)

;; let toggleOrthoButton = document.createElement('i')
;; toggleOrthoButton.innerText = 'call_merge'
;; toggleOrthoButton.title = 'toggle between orthographic and perspective camera'
;; toggleOrthoButton.classList.add('material-icons')
;; toolbarDom.appendChild(toggleOrthoButton)


;; window.addEventListener('keydown', function(e) {
;;   switch ( e.key ) {
;;     case ZP.KEY_COORD_PREV: _prev_coord_BUTTON.dispatchEvent(new Event('click')); break
;;     case ZP.KEY_COORD_NEXT: _next_coord_BUTTON.dispatchEvent(new Event('click')); break
;;     case ZP.KEY_COLOR_PREV: _prev_color_BUTTON.dispatchEvent(new Event('click')); break
;;     case ZP.KEY_COLOR_NEXT: _next_color_BUTTON.dispatchEvent(new Event('click')); break
;;     case ZP.KEY_VIEW_RESET: resetCameraButton.dispatchEvent(new Event('click')); break
;;     case ZP.KEY_TOGGLE_ORTHO_VIEWS: toggleOrthoButton.dispatchEvent(new Event('click')); break
;;   }
;; })

;; _prev_coord_BUTTON.addEventListener('click', function(e) {
;;   _aes.prev_coord()
;;   _update_coord()
;; })

;; _next_coord_BUTTON.addEventListener('click', function(e) {
;;   _aes.next_coord()
;;   _update_coord()
;; })

;; _prev_color_BUTTON.addEventListener('click', function(e) {
;;   _aes.prev_color()
;;   _aes.reset_color()
;; })

;; _next_color_BUTTON.addEventListener('click', function(e) {
;;   _aes.next_color()
;;   _aes.reset_color()
;; })

;; resetCameraButton.addEventListener('click', function(e) {
;;   _ortho = 'none'
;;   _ortho_orbit.enabled = false
;;   _orbit.enabled = true

;;   _orbit.moveToOriginal()
;; })

;; toggleAspectButton.addEventListener('click', function(e) {
;;   this.toggleAspectButton()
;; })

;; toggleOrthoButton.addEventListener('click', function(e) {
;;   this.toggleOrtho()
;; })

;; _legend_container_DIV.addEventListener('legend_action', function(e) {
;;   let d = e.detail
;;   switch (d.type) {
;;     case 'color':
;;       if (typeof d.indices === 'undefined') d.indices = _data_indices
;;       if (typeof d.color === 'undefined') d.color = ZP.COLOR_DEFAULT
;;       if (typeof d.animation === 'undefined') d.animation = options_.animation
;;       _change_points_color(d.indices, d.color, d.animation)
;;       break
;;     case 'opacity':
;;       if (typeof d.indices === 'undefined') d.indices = _data_indices
;;       if (typeof d.opacity === 'undefined') d.opacity = 1
;;       if (typeof d.animation === 'undefined') d.animation = options_.animation
;;       _change_points_opacity(d.indices, d.opacity, d.animation)
;;       break
;;     case 'selectability':
;;       if (typeof d.indices === 'undefined') d.indices = _data_indices
;;       if (typeof d.selectability === 'undefined') d.selectability = true
;;       _change_points_selectability(d.indices, d.selectability)
;;       break
;;   }
;; })
