;;; Directory Local Variables
;;; For more information see (info "(emacs) Directory Variables")

((clojure-mode . ((cider-custom-cljs-repl-init-form . "(do (require '[shadow.cljs.devtools.api :as shadow]) (shadow/watch :main) (shadow/nrepl-select :main))")
                  (cider-default-cljs-repl . custom))))
