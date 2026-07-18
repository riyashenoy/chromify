

![Chromify banner](./readme%20images/chromify_banner.png)
# Chromify
Turn any PNG, SVG, or typed text into shiny sterling chrome, directly in your browser.

Chromify is an interactive chrome-effect playground built entirely with React and the Canvas 2D API. You can upload a shape, type out some text, or use one of the built-in examples, then customize it with bevels, reflections, metallic banding, colorful rim lights, glows, and shadows.

No backend. No WebGL. No AI image generation. Just a lot of pixels and JavaScript.

## What it does

Chromify takes a flat 2D shape and makes it look like polished metal.

You can adjust how rounded or bubbly the shape feels, move the lighting around, add colorful reflections, create soft glows, and export the final result as a transparent PNG.

Everything happens locally in the browser, so uploaded images never leave your computer.

## Features

* Upload PNG or SVG files
* Create chrome text using multiple display fonts
* Start with a built-in demo shape
* Apply Sterling, Mirror, Banded, and Bubble presets
* Switch between rounded and full-bubble edge styles
* Adjust bevel, depth, contrast, and metallic banding
* Control shine and light direction
* Add custom chrome tints with a full hue picker
* Create single-color or two-color gradient glows
* Customize drop-shadow opacity, blur, and distance
* Preview designs on dark, light, or checkerboard backgrounds
* Export transparent PNGs at 1200px

## How it works

Chromify uses the alpha or brightness of the input to create a mask of the original shape.

That mask is blurred into a height field, which gives the shape a rounded, beveled surface. The app then calculates a surface normal for every pixel by measuring the slope of that height field.

Those normals are used to generate:

* Procedural chrome reflections
* Light and dark metallic bands
* Directional specular highlights
* Colored reflections and rim lighting
* Soft glow and shadow effects

It is similar to normal mapping inside a game engine, except the normal information is generated directly from the uploaded shape instead of coming from a pre-made texture.

The live preview renders at 512px to keep everything responsive. When exporting, Chromify runs the full rendering pipeline again at 1200px for a cleaner result.

## Stack

* React
* JavaScript
* Canvas 2D API
* `ImageData`
* CSS

There are no image-processing libraries, shaders, WebGL scenes, backend services, or uploaded-file storage.

## Running locally

```bash
git clone https://github.com/<you>/chromify.git
cd chromify
npm install
npm run dev
```

