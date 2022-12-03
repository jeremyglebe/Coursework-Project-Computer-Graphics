// Get the 'webgl' canvas element (surface to draw on)
const canvas = document.querySelector('#webgl');
// Get the WebGL context (lets you do webgl calls)
const gl = canvas.getContext('webgl');
// In the rare case that the browser doesn't support WebGL
if (!gl) {
    throw new Error('WebGL not supported');
}