(ns app.main
  (:require
   ["react" :as react]
   ["react-dom" :as react-dom]
   ["react-dom" :as react-dom]))

(defn root
  []
  (react/createElement "div" nil "hello world"))

(defn init!
  []
  (println "Hello!")
  (let [root-el (js/document.getElementById "root")]
    (react-dom/render (root) root-el))
  )

(deftype Bag [store]
  Object
  (add [_ x] (.push store x))
  (print [_] (.log js/console store)))

(defn bag [arr] (Bag. arr))

(defprotocol MyBag
  (add [this val])
  (print [this]))

(extend-type Bag
  MyBag
  (add [this val]
    (.push (.-store this) val))
  (print [this]
    (.log js/console (.-store this))))

;; (def mybag (Bag.))
;; (add mybag 2)
;; (add mybag 3)
;; (print mybag)
