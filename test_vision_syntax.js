import * as vision from './src/lib/vision.js';

console.log("Vision module imported successfully.");
if (typeof vision.identifyImage === 'function') {
    console.log("identifyImage function exists.");
} else {
    console.error("identifyImage function missing!");
}
