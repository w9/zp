(ns app.scale
  (:require
   [clojure.core.match :refer [match]]
   [cljs.test :refer [deftest is]]
   ;; [tupelo.core]
   [app.color :as color]
   [app.utils :as utils :refer [forv]]))

(defn axis-linear
  ([xs] (axis-linear xs {}))
  ([xs
    {:keys [range]
     :or   {range [-1 1]}
     :as   opts}]
   {:type   [:linear :x]
    :domain (utils/extrema xs)
    :range  range}
   ))

(defn apply-axis-linear
  [{:keys [domain range]} x]
  (utils/linearly-interpolate domain range x))

(defn color-continuous
  "Generate a scale-spec from numeric values `xs` to a color spectrum.

  It linearly maps `xs` into [0 1] and then applys the `spectrum` function to get a color.

  The `spectrum` is a function from [0 1] to colors.

  The `missing-color` will be used in the `scale` function when an unexpected value
  is encountered.
  "
  ([xs] (color-continuous xs {}))
  ([xs
    {:keys [spectrum missing-color]
     :or   {spectrum      color/blues
            missing-color "#000000"}}]
   {:type     [:continuous :color]
    :missing  missing-color
    :domain   (utils/extrema xs)
    :trans-fn spectrum}
   ))

(comment
  (let [xs (range 11)]
    (color-continuous xs))
  )

(defn apply-color-continuous
  [{:keys [missing domain trans-fn] :as spec} x]
  (let [z (utils/linearly-interpolate domain [0 1] x)]
    (trans-fn z)))

(deftest test-color-continous
  (is (=
       ("#56b1f7" "#4fa4e5" "#4996d3" "#4289c1" "#3b7baf"
        "#356e9d"
        "#2e618b"
        "#275379"
        "#204667"
        "#1a3855"
        "#132b43")
       (let [xs (range 11)]
         (map #(apply-color-continuous (color-continuous xs) %) xs))))

  )

(defn color-map
  "Generate a scale-spec from categorical values `xs` to a list of colors.

  The list of colors is specified in the option `colors`.

  If `cycle-colors?` is true, the colors will be cycled when there are more levels
  than colors. Otherwise, the `others-color` will be used for the extra levels.

  The `missing-color` will be used in the `scale` function when an unexpected value
  is encountered.
  "
  ([xs] (color-map xs {}))
  ([xs
    {:keys [colors cycle-colors? missing-color extra-color]
     :or   {colors        color/categorical-10
            cycle-colors? false
            missing-color "#000000"
            extra-color   "#777777"}
     :as   opts}]
   ;; tally the levels
   (let [colors_ (if cycle-colors?
                   (apply concat (repeat colors))
                   (concat colors (repeat extra-color))
                   )

         levels (vec (sort (set xs)))
         n      (count levels)]
     {:type    [:map :color]
      :missing missing-color
      :inputs  levels
      :outputs (vec (take n colors_))}
     )))

(defn apply-color-map
  [{:keys [missing inputs outputs] :as spec} x]
  (let [m (zipmap inputs outputs)]
    (get m x missing)))

(defn apply-scale
  "Apply scale to a value `x` according to a scale-spec `s`, outputing another vector.

  This ia pure function on `x` and `s`. All global plotting parameters should
  already been factored into `s`.
  "
  [{:keys [type] :as s} x]
  (match type
         [:map :color] (apply-color-map s x)
         [:linear _] (apply-axis-linear s x)
         [:continuous :color] (apply-color-continuous s x)

         :else (throw (ex-info "unknown scale-spec" {:scale-spec s}))
         )
  )

(deftest test-apply-scale
  (is (=
       (let [xs ["apple" "apple" "orange" "banana" "apple"]]
         (apply-scale (color-map color/categorical-10 xs) xs))
       ["#1f77b4" "#1f77b4" "#2ca02c" "#ff7f0e" "#1f77b4"]))
  (is (=
       (let [xs [1 2 3 10 11]]
         (apply-scale (axis-linear xs) xs))
       [-1 -0.8 -0.6 0.8 1]))
  (is (=
       (let [xs [1 2 3 10 11]]
         (apply-scale (axis-linear xs {:range [0 1]}) xs))
       [0 0.1 0.2 0.9 1])))

(comment

  )

;; (comment
;;   ;; applied spec saves some computational efforts, and is designed to be
;;   ;; enough for drawing the legend
;;   (let [applied-spec (apply-spec spec plot-params vec)]
;;     (scale applied-spec vec)
;;     (legend applied-spec)               ;note `vec` is conspicuously missing
;;     )
;;   )

;; (comment
;;   ;; usage
;;   (let [xs (vec (map str (range 30)))]
;;     (color-map categorical-10 xs)
;;     )

;;   (let [xs (vec (map str (range 30)))]
;;     (color-map categorical-10 xs {:cycle-colors? true})
;;     )

;;   (tupelo.core/zip*)

;;   )


;; ;; applied-spec
;; {:type    [:color :map]
;;  :default "#000000"
;;  :items   [["apple" "#cb94d"]
;;            ["orange" "#f4a15f"]
;;            ["banana" "#a4aa2b"]]}

;; ;; transpec
;; {:type       [:x :map]
;;  :candidates categorical-10
;;  }

;; ;; applied-spec
;; {:type  [:x :map]
;;  :items [["apple" -1]
;;          ["orange" 0]
;;          ["banana" 1]]}

;; ;; spec
;; {:type [:x :continous]}

;; ;; applied-spec
;; {:type   [:x :continous]
;;  :domain [-73 42]
;;  :range  [-1 1]}

;; (= plot-params
;;    {:x {:range [-1 1]}
;;     :y {:range [-1 1]}
;;     :z {:range [-1 1]}
;;     })


;; (comment
;;   (cols-to-rows (js->clj (.-data test-data)))

;;   (d/div {}

;;          )

;;   {:interpolation :linear
;;    :domain        [-83 142]
;;    :range         [(->hsl 0.2 0.7 0.1) (->hsl 0.1 1.0 0.1)]}

;;   (= c-scale
;;      {:interpolation :none
;;       :domain        ["apple" "orange" "banana"]
;;       :range         ["#f00" "#ff0" "#fff"]})

;;   (= x-scale
;;      {:interpolation :linear
;;       :domain        [-83 142]
;;       :range         [-1 1]})

;;   {:type [:color :manual]
;;    :map  {"apple"  "1f77b4"
;;           "orange" "ff7f0e"
;;           "banana" "2ca02c"}}

;;   (= categorical-10
;;      ["1f77b4" "ff7f0e" "2ca02c" "d62728" "9467bd"
;;       "8c564b" "e377c2" "7f7f7f" "bcbd22" "17becf"]
;;      )

;;   ;; Reactive plotting is a list of scaling piplines that turns information in
;;   ;; the data into various aesthetics.
;;   ;;
;;   ;;                           these are either a transformer or a mapper
;;   ;;                                              ↓
;;   ;;            ┌──🮤x-extractor🮥── x-vals ──🮤linear-scaler🮥── x-screen-coordinates ──┐
;;   ;;     data ──┼──🮤y-extractor🮥── y-vals ──🮤linear-scaler🮥── y-screen-coordinates ──┼──🭬 element
;;   ;;            ├──🮤z-extractor🮥── z-vals ──🮤linear-scaler🮥── z-screen-coordinates ──┤
;;   ;;            │                                                                    │
;;   ;;            └──🮤c-extractor🮥── c-vals ──🮤manual-mapper🮥── colors ────────────────┘
;;   ;;
;;   ;;   transformer = a function that turns a numeric/character/logical/categorical vector into aes values
;;   ;;
;;   ;; If we don't concern ourselves with legend-drawing, then both the extractors and
;;   ;; the transformers can be simple functions.
;;   ;;
;;   ;; However, if we represent the transformer as a function in the host
;;   ;; language, (as it is usually done,) it is typically very difficult for us to
;;   ;; automatically draw legends using it. The reason we would want to auto-draw
;;   ;; legends using a transformer, is that the job of a transformer typically
;;   ;; requires it computing all the things necessary for drawing a legend. For
;;   ;; example, in order to map a numerical vector into the x-axis, the
;;   ;; transformer would have to figure out the extrema of the vector. Well,
;;   ;; drawing the legend would have to require computing the extrema as well!
;;   ;;
;;   ;;
;;   ;; We focus on a special case, i.e.,
;;   ;;
;;   ;;   1. The data is a dataframe, implying that the extractors are trivial column accessions
;;   ;;   2. The data is a dataframe
;;   ;;
;;   ;; A _dataframe_ is abstractly defined as a list of maps, with all the maps in
;;   ;; the list having the same set of keys. A representation of a dataframe that
;;   ;; is literally a list of maps is said to be in the _rows-format_. A dataframe
;;   ;; could also be in the _columns-format_. This is when it is represented as a
;;   ;; map of lists, with all the lists in the map having the same length. The two
;;   ;; representations could be easily converted back and forth, with the
;;   ;; column-format being more compact.

;;   ;; A _transpec_ (short for transformation specification) is a value
;;   ;; that specifies how to define a data transformation process. For example,
;;   ;; a linear scale would map a numerical vector into another numerical vector
;;   ;; following a linear formula that has some parameters. A transpec captures
;;   ;; all the parameters that are _orthogonal_ to the vector to be transformed,
;;   ;; as well as the plot parameters.
;;   ;;
;;   ;; For example, when plotting we need to map a column of numbers (i.e., a
;;   ;; numerical vector) into screen coordinates _x_ axis, the final function


;;   ;; applied-transpec is more like what D3.scales store
;;   ;; TODO: does the transpec needs to be stored in a concrete value or it simply
;;   ;;   is parameters sent to the constructor of the applied-transpec?

;;   (transpec/gen-color-map)

;;   ;; applied-spec
;;   {:type    [:color :map]
;;    :default "#000000"
;;    :items   [["apple" "#cb94d"]
;;              ["orange" "#f4a15f"]
;;              ["banana" "#a4aa2b"]]}

;;   ;; transpec
;;   {:type       [:x :map]
;;    :candidates categorical-10
;;    }

;;   ;; applied-spec
;;   {:type  [:x :map]
;;    :items [["apple" -1]
;;            ["orange" 0]
;;            ["banana" 1]]}

;;   ;; spec
;;   {:type [:x :continous]}

;;   ;; applied-spec
;;   {:type   [:x :continous]
;;    :domain [-73 42]
;;    :range  [-1 1]}

;;   (= plot-params
;;      {:x {:range [-1 1]}
;;       :y {:range [-1 1]}
;;       :z {:range [-1 1]}
;;       })

;;   ;; applied spec saves some computational efforts, and is designed to be
;;   ;; enough for drawing the legend
;;   (let [applied-spec (apply-spec spec plot-params vec)]
;;     (scale applied-spec vec)
;;     (legend applied-spec)               ;note `vec` is conspicuously missing
;;     )

;;   (def categorical-10
;;     ["1f77b4" "ff7f0e" "2ca02c" "d62728" "9467bd"
;;      "8c564b" "e377c2" "7f7f7f" "bcbd22" "17becf"])

;;   (defn extrema
;;     [data]
;;     [(apply min data) (apply max data)])

;;   (defn scale
;;     [{:keys [interpolation domain range] :as scale-params} x]
;;     (cond
;;       (fn? interpolation) asdfasdf
;;       :else               (case interpolation
;;                             :none
;;                             ;; TODO

;;                             :linear
;;                             ;; TODO
;;                             ))
;;     ;; TODO
;;     ;; output: y
;;     )



;;   )
