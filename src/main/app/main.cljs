(ns app.main
  (:refer-clojure :exclude [Box])
  (:require
   [clojure.core.async :as async :refer [go <! >!]]
   [clojure.string :as str]
   [goog.format :as gformat]
   [goog.net.XhrIo :as gxhrio]
   [goog.Uri :as guri]
   [helix.core :refer [defnc $ <>]]
   [helix.dom :as d]
   [helix.hooks :as hooks]
   [app.utils :as utils :refer [map-vals] :refer-macros [forv]]
   [app.scale :as scale]

   ["react" :as react]
   ["react-dom" :as react-dom]
   ["react-three-fiber" :as r3]
   ))


(defnc Box
  [{:keys [x y z c] :as props}]
  (let [mesh                 (react/useRef)
        [hovered setHovered] (react/useState false)
        [active setActive]   (react/useState false)]
    (r3/useFrame (fn []
                   (let [r (-> mesh .-current .-rotation)]
                     (set! (.-x r) (+ 0.01 (.-x r)))
                     (set! (.-y r) (+ 0.01 (.-y r))))))
    ($ "mesh" {:ref           mesh
               :position      #js[x y z]
               :scale         (if active #js[0.15 0.15 0.15] #js[0.1 0.1 0.1])
               :onClick       (fn [e] (setActive (not active)))
               :onPointerOver (fn [e] (setHovered true))
               :onPointerOut  (fn [e] (setHovered false))}
       ($ "boxBufferGeometry" {:args #js [1 1 1]})
       ($ "meshStandardMaterial" {:color (if hovered "hotpink" c)}))
    ))

(defnc root
  [{:keys [data] :as props}]
  (d/div {:id "plot-container"}
         ($ r3/Canvas
            ($ "ambientLight" {:intensity 0.5})
            ($ "spotLight" {:position #js[10 10 10]
                            :angle    0.15
                            :penumbra 1})
            ($ "pointLight" {:position #js[-10 -10 -10]})
            (<>
             (let [data (utils/cols-to-rows data)

                   ;; id-getter #(get % "sample")
                   ;; x-getter  #(get % "X1")
                   ;; y-getter  #(get % "X2")
                   ;; z-getter  #(get % "X3")
                   ;; c-getter  #(get % "X1")

                   ;; TODO: get this from the data

                   id-getter #(get % "gene")
                   x-getter  #(get % "tsne1")
                   y-getter  #(get % "tsne2")
                   z-getter  #(get % "tsne3")
                   c-getter  #(get % "avg_log_exp")

                   x-scale-spec (scale/axis-linear (map x-getter data))
                   y-scale-spec (scale/axis-linear (map y-getter data))
                   z-scale-spec (scale/axis-linear (map z-getter data))
                   c-scale-spec (scale/color-continuous (map c-getter data))]

               (forv [datum data]
                     ($ Box {:key (id-getter datum)

                             :x (scale/apply-scale x-scale-spec (x-getter datum))
                             :y (scale/apply-scale y-scale-spec (y-getter datum))
                             :z (scale/apply-scale z-scale-spec (z-getter datum))
                             :c (scale/apply-scale c-scale-spec (c-getter datum))})
                     )))
            )
         (d/div {:id "overlay"}
                (d/div {:id "toolbar"}
                       (d/i {:class "material-icons" :title "previous coord"} "undo")
                       (d/i {:class "material-icons" :title "next coord"} "redo")
                       (d/i {:class "material-icons" :title "previous color"} "arrow_back")
                       (d/i {:class "material-icons" :title "next color"} "arrow_forward")
                       (d/i {:class "material-icons" :title "reset camera angle"} "youtube_searched_for")
                       (d/i {:class "material-icons" :title "toggle aspect ratio between 1:1:1 and original"} "aspect_ratio")
                       (d/i {:class "material-icons" :title "toggle between orthographic and perspective camera"} "call_merge"))
                (d/div {:id "datum-meta"}))
         (d/div {:id "scale-name"})))

(defn fetch-ch
  [^js url]
  (let [ch (async/chan)]
    (gxhrio/send url (fn [e]
                       (async/put! ch ^js (.getResponseJson (.-target e)))
                       (async/close! ch)))
    ch))

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

(defn ^:export refresh!
  []
  (let [root-el (js/document.getElementById "root")]
    (react-dom/render ($ root {:data @data}) root-el)
    ))

(defn ^:export init!
  []
  (go
    (let [json-url    (get-json-url)
          json-input  (<! (fetch-ch json-url))
          root-el     (js/document.getElementById "root")
          old-root-el (js/document.getElementById "old-root")]
      ;; (render-zp old-root-el json-input)
      ;; (reset! data (js->clj json-input))
      (reset! data (js->clj (.-data utils/test-data)))
      (react-dom/render ($ root {:data @data}) root-el)
      )))

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
