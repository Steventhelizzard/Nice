import { setFaceShape } from '../utils/face.js';

function init() {
    setFaceShape({ eyes: 'closed', mouth: 'small', cheeks: false });
}

function cleanup() {
    // Nothing to clean up
}

export { init, cleanup };
