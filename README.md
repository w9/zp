ZP: 3D scatter plot
===================

ZP leverages **WebGL** and implements **relational-data plotting language**
(similar to `ggplot2` in R), presenting an elegant way for visualizing
three-dimensional data points with a clean and sweet UI. This package is
written in JavaScript but I made an [interfacing R package](https://github.com/w9/zp-r),
using [htmlwidgets](http://www.htmlwidgets.org/) which can be run in R-Studio.

Bug reports, suggestions and pull requests are very welcome.

Play with it [here](http://60g.org/zp)!

![screencast](screencast.gif)

Features
--------

* WebGL interactive 3D graphics
* great performance for up to 1,000 points (10,000 if your have a decent GPU)
* ggplot2-like relational data language (which means legends are drawn automatically)
* allows for multiple scales (coordinates and/or color) and seamless transitioning
* allows for picking data dynamically
* allows for adjusting of aspect ratio
* orthogonal views

Planned Features
----------------

* continuous scales
* box selection
* high quality R-interface
* interface to Python, Julia, and other languages
