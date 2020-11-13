(ns app.utils)

(defmacro forv
  "Like clojure.core/for but returns results in a vector.
  Wraps the loop body in a `do` as with `doseq`. Not lazy."
  [bindings-vec & body-forms]
  `(vec (for ~bindings-vec
          (do ~@body-forms))))
