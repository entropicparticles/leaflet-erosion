# leaflet-erosion

Generating erosioned-perlin-based procedural worlds with leaflet and web workers

I woked with leaflet-perlin () to include erosion and rivers. This is what I got, I hope you like it.

It is inspired by leaflet-fractal (github.com/aparshin/leaflet-fractal), uses code from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html for identifying points inside a simple polygon, and perlin noise is taken from Stefan Gustavson.

The grid is based in random quadrilaterals for future convenience. For the interpolation, I map the quadrilateral to a unit square and use a bilinear interpolation. (I also coded a weighted interpolation for the first tries, I kept the lines there in case.)

Do whatever you want with it, enjoy!

EntropicParticles

DEMO: https://entropicparticles.github.io/leaflet-erosion/

- Reload starting with the map layer instead:
https://entropicparticles.github.io/leaflet-erosion/####4

- Change the maximum elevation for the isometric view:
https://entropicparticles.github.io/leaflet-erosion/###16

- For a lesser dense grid:
https://entropicparticles.github.io/leaflet-erosion/#7

- even lesser:
https://entropicparticles.github.io/leaflet-erosion/#6

- Check the responsive grid density with the zoom level:
https://entropicparticles.github.io/leaflet-erosion/##5

- For a denser grid (wait for it, it's quite slow):
https://entropicparticles.github.io/leaflet-erosion/#9###4
