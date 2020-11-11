(ns app.utils
  (:require
   ;; [tupelo.core]
   [cljs.test :refer [deftest is testing run-tests]]))

(defmacro forv
  "Like clojure.core/for but returns results in a vector.
  Wraps the loop body in a `do` as with `doseq`. Not lazy."
  [bindings-vec & body-forms]
  `(vec (for ~bindings-vec
          (do ~@body-forms))))

(defn zipping
  "
  Zipping logic extracted from core/zipmap

  `f` has the signature `(f s x y)` where `s` is the last accumuated value.

  `l` is the initial value of `s`.
  "
  [l f xs ys]
  (loop [s   l
         xs_ (seq xs)
         ys_ (seq ys)]
    (if (and xs_ ys_)
      (recur (f s (first xs_) (first ys_))
             (next xs_)
             (next ys_))
      s)))

(defn zipvec
  [xs ys]
  (zipping [] (fn [s x y] (conj s [x y])) xs ys))

(deftest test-zipvec
  (is (=
       (zipvec [1 2 3 4] [:foo :bar :baz :bek])
       [[1 :foo] [2 :bar] [3 :baz] [4 :bek]]))
  (is (=
       (zipvec [1 2 3 4] [:foo :bar :baz :bek :buuk])
       [[1 :foo] [2 :bar] [3 :baz] [4 :bek]]))
  (is (=
       (zipvec [1 2 3 4] (repeat :foo))
       [[1 :foo] [2 :foo] [3 :foo] [4 :foo]]))
  (is (=
       (zipvec [1 2 3 4] [:foo])
       [[1 :foo]]))
  (is (=
       (zipvec [] [])
       [])))

(defn map-vals
  "Transforms each value in a map using the supplied `tx-fn`:

    (t/map-vals {:a 1 :b 2 :c 3} inc)                  =>  {:a 2,   :b 3,   :c 4}
    (t/map-vals {:a 1 :b 2 :c 3} {1 101 2 202 3 303})  =>  {:a 101, :b 202, :c 303} "
  [map-in tx-fn & tx-args]
  (let [tuple-seq-orig (vec map-in)
        tuple-seq-out  (for [[tuple-key tuple-val] tuple-seq-orig]
                         [tuple-key (apply tx-fn tuple-val tx-args)])
        map-out        (into {} tuple-seq-out)]
    map-out))

(defn extrema
  [xs]
  (if (empty? xs)
    (throw (ex-info "xs is empty" {:xs xs}))
    [(apply min xs) (apply max xs)]))

(deftest test-extrema
  (is (= (extrema [0 -1 0 10 0])
         [-1 10]))
  (is (thrown? js/Error (extrema [])
         [nil nil])))
