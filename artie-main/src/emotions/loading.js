import { setFaceShape } from '../utils/face.js';

function init() {
    // Eyes rest closed in thought while the mouth becomes an animated
    // "typing" indicator (two pulsing dots), driven entirely by CSS.
    setFaceShape({ eyes: 'closed', mouth: 'loading', cheeks: false });
}

function cleanup() {
    // Nothing extra to clean up - animation is pure CSS now
}

export { init, cleanup };
