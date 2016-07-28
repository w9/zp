ZP: 3D scatter plot
===================

ZP leverages **WebGL** and implements **relational-data plotting language** (similar to `ggplot2` in R),
presenting an elegant way to visualize data points with interactive 3D graphics. This package is
written in JavaScript but I made an [R interface](https://github.com/w9/zp-r), using htmlwidgets. This
R-package can be run in R-Studio.

![screencast](screencast.gif)

Features
--------

* WebGL interactive 3D graphics
* great performance for upto 1,000 points (10,000 if your have a decent GPU)
* ggplot2-like relational data language (which means legends are drawn automatically)
* allows for multiple scales (coordinates and/or color) and seamless transitioning
* allows for picking data dynamically
* allows for adjusting of aspect ratio
* orthogonal views

