;; TODO: NEXT: load a json and show it verbatim on the screen

(ns app.main
  (:require
   ["react" :as react]
   ["react-dom" :as react-dom]
   [com.fulcrologic.fulcro.dom :as dom :refer [div i]]
   [goog.Uri :as uri]
   [goog.format :as format]
   [clojure.string :as str]))


(def ^js test-data
  (clj->js {"data"     {"avg_log_exp" [0.9639 1.0483 0.7468 0.6396 0.4754 1.5452 1.6167 0.5952 1.0576 1.0403]
                        "gene"        ["CCNL2" "MRPL20" "GNB1" "RPL22" "CAMTA1" "PARK7" "ENO1" "UBE4B" "KIF1B" "PGD"]
                        "pathway"     [nil "ribosome" nil nil nil nil nil nil nil nil]
                        "tsne1"       [-1.5605 -2.4195 6.8363 -31.2578 -17.7063 -17.9218 -14.1088 16.0979 8.8398 10.4589]
                        "tsne2"       [-3.3797 -1.9856 -9.6096 8.3487 12.2769 10.0354 7.8908 -10.6043 -11.3531 5.2662]
                        "tsne3"       [10.8744 -4.6542 -15.8324 0.951 3.4605 -2.2884 -3.8157 8.0973 6.4229 3.7634]}
            "mappings" {"color" ["pathway" "avg_log_exp"]
                        "coord" [["tsne1" "tsne2" "tsne3"]]}
            "options"  {"title" "MGH30 Genes"}})
  )

(defn root
  []
  (div :#plot-container
       (div :#renderer-dom-element)
       (div :#overlay
            (div :#toolbar
                 (i :.material-icons {:title "previous coord"} "undo")
                 (i :.material-icons {:title "next coord"} "redo")
                 (i :.material-icons {:title "previous color"} "arrow_back")
                 (i :.material-icons {:title "next color"} "arrow_forward")
                 (i :.material-icons {:title "reset camera angle"} "youtube_searched_for")
                 (i :.material-icons {:title "toggle aspect ratio between 1:1:1 and original"} "aspect_ratio")
                 (i :.material-icons {:title "toggle between orthographic and perspective camera"} "call_merge")
                 )
            (div :#datum-meta))
       (div :#scale-name))
  ;; (react/createElement "div" nil "hello world")
  )

(defn init!
  []
  (let [href js/location.href
        x    ^js (uri/parse href)]
    (js/console.log (.getParameterValue x "json"))
    (js/console.log (.getParameterValue x "jsonn")))

  (let [
        root-el     (js/document.getElementById "root")
        old-root-el (js/document.getElementById "old-root")]
    (let [zp (js/ZP.ZP. old-root-el 640 480)]
      (js/console.log (.-plot zp))
      (js/console.log (.plot zp (.-data test-data) (.-mappings test-data) (.-options test-data))))
    (react-dom/render (root) root-el)
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
