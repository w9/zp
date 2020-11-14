(ns app.color
  "The hsluv functions are adapted from hsluv/hsluv-emacs [1].

  [1] https://github.com/hsluv/hsluv-emacs"
  (:require
   [goog.string :as gs]
   [cljs.test :refer [deftest is run-tests]]
   [app.utils :as utils])
  )

(defn check-rgb
  [rgb]
  ;; check if all components are within range
  (doseq [[n x] (zipmap ["r" "g" "b"] rgb)]
    (when (not (and (<= 0 x 255)))
      (throw (ex-info (str n " value out of range")
                      {:rgb rgb}))))
  )

(defn rgb-to-css-rgb
  [rgb]
  (check-rgb rgb)
  (apply str (concat ["rgb("] (interpose "," rgb) [")"])))

(defn rgb-to-hex
  [rgb]
  (check-rgb rgb)
  (let [num-to-hex #(-> %
                        (.toString 16)
                        (.padStart 2 "0"))]
    (apply str "#" (map num-to-hex rgb))))

(deftest test-rgb-to-hex
  (is (=
       "#0100ff"
       (rgb-to-hex [1 0 255])))
  (is (=
       "#15f104"
       (rgb-to-hex [21 241 4])))
  (is (thrown?
       js/Error
       (rgb-to-hex [256 241 4])))
  (is (thrown?
       js/Error
       (rgb-to-hex [255 -1 4]))))

(deftest test-rgb-to-css-rgb
  (is (=
       "rgb(1,0,255)"
       (rgb-to-css-rgb [1 0 255])))
  (is (=
       "rgb(21,241,4)"
       (rgb-to-css-rgb [21 241 4])))
  (is (thrown?
       js/Error
       (rgb-to-css-rgb [256 241 4])))
  (is (thrown?
       js/Error
       (rgb-to-css-rgb [255 -1 4]))))


(defn hex-to-rgb
  [hex]
  (let [hex-to-num #(js/parseInt % 16)
        r          (hex-to-num (subs hex 1 3))
        g          (hex-to-num (subs hex 3 5))
        b          (hex-to-num (subs hex 5 7))]
    [r g b])
  )

(deftest test-hex-to-rgb
  (let [colors ["#1f77b4" "#ff7f0e" "#2ca02c" "#d62728" "#9467bd"
                "#8c564b" "#e377c2" "#7f7f7f" "#bcbd22" "#17becf"]]
    (is (= (map rgb-to-hex (map hex-to-rgb colors)))))
  )

(def categorical-10
  ["#1f77b4" "#ff7f0e" "#2ca02c" "#d62728" "#9467bd"
   "#8c564b" "#e377c2" "#7f7f7f" "#bcbd22" "#17becf"])

(defn blues
  [pct]
  (let [[r0 g0 b0] (hex-to-rgb "#56b1f7")
        [r1 g1 b1] (hex-to-rgb "#132b43")]
    (let [itpl  #(js/Math.round (utils/linearly-interpolate [0 1] % pct))
          color (mapv itpl [[r0 r1] [g0 g1] [b0 b1]])]
      (rgb-to-hex color))))

(deftest test-blues
  (is (=
       "#56b1f7"
       (blues 0)
       ))
  (is (=
       "#132b43"
       (blues 1)
       ))
  (is (=
       ("#56b1f7" "#4fa4e5" "#4996d3" "#4289c1" "#3b7baf"
        "#356e9d" "#2e618b" "#275379" "#204667" "#1a3855"
        "#132b43")
       (map blues (map #(/ % 10) (range 11)))
       ))
  )

