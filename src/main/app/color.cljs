(ns app.color
  "The hsluv functions are adapted from hsluv/hsluv-emacs [1].

  [1] https://github.com/hsluv/hsluv-emacs"
  (:require
   [goog.string :as gs]
   [cljs.test :refer [deftest is]])
  )

(defn rgb-to-string
  "Option `format` is either `:hex` or `:css-rgb`"
  ([rgb] (rgb-to-string rgb {}))
  ([rgb
    {:keys [format]
     :or   {format :hex}
     :as   opts}]
   (let [[r g b]    rgb
         num-to-hex (fn [x]
                      (if (and (<= 0 x 255))
                        (-> x
                            (.toString 16)
                            (.padStart 2 "0"))
                        (throw (ex-info "rgb value out of range" {:rgb             rgb
                                                                  :opts            opts
                                                                  :offending-value x}))))]
     (case format
       :hex (apply str "#" (map num-to-hex rgb))
       (throw (ex-info "unrecognized format" {:format format}))))
   ))

(deftest test-rgb-to-string
  (is (=
       "#0100ff"
       (rgb-to-string [1 0 255])))
  (is (=
       "#15f104"
       (rgb-to-string [21 241 4]))))

(def categorical-10
  ["#1f77b4" "#ff7f0e" "#2ca02c" "#d62728" "#9467bd"
   "#8c564b" "#e377c2" "#7f7f7f" "#bcbd22" "#17becf"])

(defn blues
  [pct]
  ;; (let [c0 [#56b1f7]
  ;;       c1 [#132b43]])

  (gs/format "asdfasf")
  )

