(ns app.color
  "The hsluv functions are adapted from hsluv/hsluv-emacs [1].

  [1] https://github.com/hsluv/hsluv-emacs"
  (:require
   [goog.string :as gs]
   [cljs.test :refer [deftest is run-tests]]
   [app.utils :as utils]
   [clojure.string :as str]
   [clojure.spec.alpha :as s]
   [clojure.test.check.generators :as gen]

   ;; [clojure.spec.test.alpha :as stest]
   ;; [clojure.test.check]
   ;; [clojure.test.check.properties]

   ["./chroma" :as cm]
   )
  )

(def gen-hex
  "Generates alphanumeric characters."
  (gen/fmap char
            (gen/one-of [(gen/choose 48 57)
                         (gen/choose 97 102)])))

(def categorical-10
  ["#1f77b4" "#ff7f0e" "#2ca02c" "#d62728" "#9467bd"
   "#8c564b" "#e377c2" "#7f7f7f" "#bcbd22" "#17becf"])

(defn gradient
  [pct low high]
  (let [low-val  (-> low
                     cm/hex2rgb
                     cm/rgb2lch)
        high-val (-> high
                     cm/hex2rgb
                     cm/rgb2lch)]
    (let [itpl  #(utils/linearly-interpolate [0 1] % pct)
          color (mapv itpl (utils/zipvec low-val high-val))]
      (-> color
          cm/lch2rgb
          cm/rgb2hex)))
  )

(defn blues
  [pct]
  (gradient pct "#56b1f7" "#132b43"))
