import { setFace } from '../utils/face.js';

const FACE = '(╥ᵔʖ╥)';

function init() {
    setFace(FACE);
}

function cleanup() {
    // Nothing to clean up
}

export { init, cleanup };
