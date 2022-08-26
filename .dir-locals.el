;;; Directory Local Variables
;;; For more information see (info "(emacs) Directory Variables")

((clojure-mode . ((cider-custom-cljs-repl-init-form . "(do (require '[shadow.cljs.devtools.api :as shadow]) (shadow/watch :app) (shadow/nrepl-select :app))")
                  (cider-default-cljs-repl . custom))))
