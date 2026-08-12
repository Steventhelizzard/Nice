import { setFace } from '../utils/face.js';

const FACE = '(‿_ʖ‿)';

function init() {
    setFace(FACE);
}

function cleanup() {
    // Nothing to clean up
}

export { init, cleanup };
