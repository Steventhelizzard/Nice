import { setFaceShape } from '../utils/face.js';

function init() {
    setFaceShape({ eyes: 'droopy', mouth: 'frown', cheeks: false });
}

function cleanup() {
    // Nothing to clean up
}

export { init, cleanup };
