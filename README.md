ZP: 3D scatter plot
===================

ZP leverages **WebGL** and implements **relational-data plotting language**
(similar to `ggplot2` in R) to allow for visualizing three-dimensional data
points in a highly interactive and feature-rich environment with minimal visual
noise.

This package is written in JavaScript but I made an [interfacing R
package](https://github.com/w9/zp-r), using
[htmlwidgets](http://www.htmlwidgets.org/) which can be run in R-Studio.

[Play with it now!](http://60g.org/zp)

![screencast](https://github.com/w9/w9.github.io/blob/master/zp-screencast.gif)

Bug reports, suggestions and pull requests are very welcome.

Features
--------

ZP is the 3D plotting tool *I* have always wanted. Currently it has the following features:

* WebGL interactive 3D graphics
* automatically figure out the most comfortable point sizes and box dimensions
* great performance for up to 1,000 points (10,000 if your have a decent GPU)
* ggplot2-like relational data language (which means legends are drawn automatically)
* allows for multiple scales (coordinates and/or color) and seamless transitioning
* allows for picking data dynamically
* allows for adjusting of aspect ratio
* orthogonal views

Planned Features
----------------

These are listed by their priority. This list will be constantly updated.

* continuous scales
* better support for handling missing coordinate values across scales, possibly by implementing D3 style "enter" and "exit"
* instant type searching
* floating labels (supplied by specifying a column of the data frame)
* box selection, and more sophisticated communication with the container (like a shiny app or the web page that embeds it)
* much higher quality R-interface
* interface to Python, Julia, and other languages

Default Key Bindings
--------------------

* <kbd>w</kbd><kbd>a</kbd><kbd>s</kbd><kbd>d</kbd> - rotation
* <kbd>Arrow Keys</kbd> - panning
* <kbd>j</kbd><kbd>k</kbd> - switch scales

Tips
----

* As part of the philosophy of this package, every feature should work with every
  other feature as expected. For example, you can do point selecting, zooming,
  and scale switching in orthographic views as well.
* Holding <kbd>Ctrl</kbd> while clicking discrete color legend item will only
  show selected level
* `null` (equivalent to `NA` in R) color values will be displayed as "none" and
  the color is dimmed by default, very convenient if you have a large
  uninteresting background level in your color factors.
