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

(s/def ::hex-pair (s/and integer? #(<= 0 % 255)))
(s/def ::color-hex (s/with-gen
                     (s/and string? #(str/starts-with? % "#") #(= 7 (count %)))
                     #(gen/fmap (fn [x] (str "#" (str/join x))) (gen/vector gen-hex 6))))
(s/def ::rgb (s/coll-of ::hex-pair :count 3))
(s/def ::percentage (s/and number? #(<= 0 % 1)))


(defn rgb-to-css-rgb
  [rgb]
  (apply str (concat ["rgb("] (interpose "," rgb) [")"])))

(s/fdef rgb-to-hex :args (s/cat :rgb ::rgb) :ret ::color-hex)
(defn rgb-to-hex
  [rgb]
  {:pre [(s/valid? ::rgb rgb)]}
  (let [num-to-hex #(-> %
                        (.toString 16)
                        (.padStart 2 "0"))]
    (apply str "#" (map num-to-hex rgb))))

(comment
  (s/exercise-fn rgb-to-hex)
  (rgb-to-hex [256 2 3])
  )

(s/fdef hex-to-rgb
  :args (s/cat :hex ::color-hex)
  :ret ::rgb
  :fn #(= (-> % :args :hex) (-> % :ret rgb-to-hex)))
(defn hex-to-rgb
  [hex]
  (let [hex-to-num #(js/parseInt % 16)
        r          (hex-to-num (subs hex 1 3))
        g          (hex-to-num (subs hex 3 5))
        b          (hex-to-num (subs hex 5 7))]
    [r g b])
  )

(def categorical-10
  ["#1f77b4" "#ff7f0e" "#2ca02c" "#d62728" "#9467bd"
   "#8c564b" "#e377c2" "#7f7f7f" "#bcbd22" "#17becf"])

(s/fdef blues
  :args (s/cat :pct ::percentage)
  :ret ::color-hex)
(defn blues
  [pct]
  (let [low (-> "#56b1f7"
                cm/hex2rgb
                cm/rgb2lch)
        high (-> "#132b43"
                 cm/hex2rgb
                 cm/rgb2lch)]
    (let [itpl  #(utils/linearly-interpolate [0 1] % pct)
          color (mapv itpl (utils/zipvec low high))]
      (-> color
          cm/lch2rgb
          cm/rgb2hex)))
)
