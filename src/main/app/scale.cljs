(ns app.scale
  (:require
   [clojure.core.match :refer-macros [match]]
   [cljs.test :refer-macros [deftest is]]
   [app.utils :as utils]))

(def categorical-10
  ["#1f77b4" "#ff7f0e" "#2ca02c" "#d62728" "#9467bd"
   "#8c564b" "#e377c2" "#7f7f7f" "#bcbd22" "#17becf"])

(defn apply-scale
  "Apply scale to a vector `xs` according to a scale-spec `s`, outputing another vector.

  This ia pure function on `xs` and `s`. All global plotting parameters should
  already been factored into `s`.
  "
  [s xs]
  (match s
         {:type    [:map :color]
          :missing missing
          :domain  d
          :range   r}
         (let [m       (zipmap d r)
               fetch-x (fn [x] (get m x missing))]
           (mapv fetch-x xs))
         )
  )

(deftest test-apply-scale
  (is (=
       (let [xs ["apple" "apple" "orange" "banana" "apple"]]
         (apply-scale (color-map categorical-10 xs) xs))
       ["#1f77b4" "#1f77b4" "#2ca02c" "#ff7f0e" "#1f77b4"])))

(comment

  ;; applied spec saves some computational efforts, and is designed to be
  ;; enough for drawing the legend
  (let [applied-spec (apply-spec spec plot-params vec)]
    (scale applied-spec vec)
    (legend applied-spec)               ;note `vec` is conspicuously missing
    )
  )

(defn color-map
  "Generate a scale-spec from categorical values `xs` to a list of colors `colors`.

  If `cycle-colors?` is true, the colors will be cycled when there are more levels
  than colors. Otherwise, the `others-color` will be used for the extra levels.

  The `missing-color` will be used in the `scale` function when an unexpected value
  is encountered.
  "
  ([colors xs] (color-map colors xs {}))
  ([colors xs
    {:keys [cycle-colors? missing-color extra-color]
     :or   {cycle-colors? false
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
      :domain  levels
      :range   (vec (take n colors_))}
     )))

(comment
  ;; usage
  (let [xs (vec (map str (range 30)))]
    (color-map categorical-10 xs)
    )

  (let [xs (vec (map str (range 30)))]
    (color-map categorical-10 xs {:cycle-colors? true})
    )

  (tupelo.core/zip*)

  )


;; applied-spec
{:type    [:color :map]
 :default "#000000"
 :items   [["apple" "#cb94d"]
           ["orange" "#f4a15f"]
           ["banana" "#a4aa2b"]]}

;; transpec
{:type       [:x :map]
 :candidates categorical-10
 }

;; applied-spec
{:type  [:x :map]
 :items [["apple" -1]
         ["orange" 0]
         ["banana" 1]]}

;; spec
{:type [:x :continous]}

;; applied-spec
{:type   [:x :continous]
 :domain [-73 42]
 :range  [-1 1]}

(= plot-params
   {:x {:range [-1 1]}
    :y {:range [-1 1]}
    :z {:range [-1 1]}
    })


(comment
  (cols-to-rows (js->clj (.-data test-data)))

  (d/div {}

         )

  {:interpolation :linear
   :domain        [-83 142]
   :range         [(->hsl 0.2 0.7 0.1) (->hsl 0.1 1.0 0.1)]}

  (= c-scale
     {:interpolation :none
      :domain        ["apple" "orange" "banana"]
      :range         ["#f00" "#ff0" "#fff"]})

  (= x-scale
     {:interpolation :linear
      :domain        [-83 142]
      :range         [-1 1]})

  {:type [:color :manual]
   :map  {"apple"  "1f77b4"
          "orange" "ff7f0e"
          "banana" "2ca02c"}}

  (= categorical-10
     ["1f77b4" "ff7f0e" "2ca02c" "d62728" "9467bd"
      "8c564b" "e377c2" "7f7f7f" "bcbd22" "17becf"]
     )

  ;; Reactive plotting is a list of scaling piplines that turns information in
  ;; the data into various aesthetics.
  ;;
  ;;                           these are either a transformer or a mapper
  ;;                                              ↓
  ;;            ┌──🮤x-extractor🮥── x-vals ──🮤linear-scaler🮥── x-screen-coordinates ──┐
  ;;     data ──┼──🮤y-extractor🮥── y-vals ──🮤linear-scaler🮥── y-screen-coordinates ──┼──🭬 element
  ;;            ├──🮤z-extractor🮥── z-vals ──🮤linear-scaler🮥── z-screen-coordinates ──┤
  ;;            │                                                                    │
  ;;            └──🮤c-extractor🮥── c-vals ──🮤manual-mapper🮥── colors ────────────────┘
  ;;
  ;;   transformer = a function that turns a numeric/character/logical/categorical vector into aes values
  ;;
  ;; If we don't concern ourselves with legend-drawing, then both the extractors and
  ;; the transformers can be simple functions.
  ;;
  ;; However, if we represent the transformer as a function in the host
  ;; language, (as it is usually done,) it is typically very difficult for us to
  ;; automatically draw legends using it. The reason we would want to auto-draw
  ;; legends using a transformer, is that the job of a transformer typically
  ;; requires it computing all the things necessary for drawing a legend. For
  ;; example, in order to map a numerical vector into the x-axis, the
  ;; transformer would have to figure out the extrema of the vector. Well,
  ;; drawing the legend would have to require computing the extrema as well!
  ;;
  ;;
  ;; We focus on a special case, i.e.,
  ;;
  ;;   1. The data is a dataframe, implying that the extractors are trivial column accessions
  ;;   2. The data is a dataframe
  ;;
  ;; A _dataframe_ is abstractly defined as a list of maps, with all the maps in
  ;; the list having the same set of keys. A representation of a dataframe that
  ;; is literally a list of maps is said to be in the _rows-format_. A dataframe
  ;; could also be in the _columns-format_. This is when it is represented as a
  ;; map of lists, with all the lists in the map having the same length. The two
  ;; representations could be easily converted back and forth, with the
  ;; column-format being more compact.

  ;; A _transpec_ (short for transformation specification) is a value
  ;; that specifies how to define a data transformation process. For example,
  ;; a linear scale would map a numerical vector into another numerical vector
  ;; following a linear formula that has some parameters. A transpec captures
  ;; all the parameters that are _orthogonal_ to the vector to be transformed,
  ;; as well as the plot parameters.
  ;;
  ;; For example, when plotting we need to map a column of numbers (i.e., a
  ;; numerical vector) into screen coordinates _x_ axis, the final function


  ;; applied-transpec is more like what D3.scales store
  ;; TODO: does the transpec needs to be stored in a concrete value or it simply
  ;;   is parameters sent to the constructor of the applied-transpec?

  (transpec/gen-color-map)

  ;; applied-spec
  {:type    [:color :map]
   :default "#000000"
   :items   [["apple" "#cb94d"]
             ["orange" "#f4a15f"]
             ["banana" "#a4aa2b"]]}

  ;; transpec
  {:type       [:x :map]
   :candidates categorical-10
   }

  ;; applied-spec
  {:type  [:x :map]
   :items [["apple" -1]
           ["orange" 0]
           ["banana" 1]]}

  ;; spec
  {:type [:x :continous]}

  ;; applied-spec
  {:type   [:x :continous]
   :domain [-73 42]
   :range  [-1 1]}

  (= plot-params
     {:x {:range [-1 1]}
      :y {:range [-1 1]}
      :z {:range [-1 1]}
      })

  ;; applied spec saves some computational efforts, and is designed to be
  ;; enough for drawing the legend
  (let [applied-spec (apply-spec spec plot-params vec)]
    (scale applied-spec vec)
    (legend applied-spec)               ;note `vec` is conspicuously missing
    )

  (def categorical-10
    ["1f77b4" "ff7f0e" "2ca02c" "d62728" "9467bd"
     "8c564b" "e377c2" "7f7f7f" "bcbd22" "17becf"])

  (defn extrema
    [data]
    [(apply min data) (apply max data)])

  (defn scale
    [{:keys [interpolation domain range] :as scale-params} x]
    (cond
      (fn? interpolation) asdfasdf
      :else               (case interpolation
                            :none
                            ;; TODO

                            :linear
                            ;; TODO
                            ))
    ;; TODO
    ;; output: y
    )

  (let [id-getter    #(get % "gene")
        x-getter     #(get % "tsne1")
        y-getter     #(get % "tsne2")
        z-getter     #(get % "tsne3")
        c-getter     #(get % "avg_log_exp")
        x-scale-spec (:domain (extrema (map x-getter data)) :range [-1 1])
        y-scale-spec (:domain (extrema (map y-getter data)) :range [-1 1])
        z-scale-spec (:domain (extrema (map z-getter data)) :range [-1 1])
        c-scale-spec (color-map categorical-10 (map z-getter data))]
    (<>
     ($ ColorLegend {:scale c-scale-spec})
     ($ Canvas
        ;; ...
        (for [datum data]
          ($ Dot {:key (id-getter datum)
                  :x   (apply-scale x-scale-spec (x-getter datum))
                  :y   (apply-scale y-scale-spec (y-getter datum))
                  :z   (apply-scale z-scale-spec (z-getter datum))
                  :c   (apply-scale c-scale-spec (c-getter datum))}))))))
