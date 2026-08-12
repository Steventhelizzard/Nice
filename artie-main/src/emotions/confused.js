import { setFace } from '../utils/face.js';
import { addTimeout } from '../utils/emotion.js';

const FACE = '(｡_ʖ｡)';

function init() {
    setFace(FACE);
    scheduleNextRollEyes();
}

function cleanup() {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (leftEye) leftEye.classList.remove('rolling');
    if (rightEye) rightEye.classList.remove('rolling');
}

function rollEyes() {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (!leftEye || !rightEye) return;

    leftEye.classList.add('rolling');
    rightEye.classList.add('rolling');

    addTimeout(() => {
        const le = document.querySelector('.left-eye');
        const re = document.querySelector('.right-eye');
        if (le) le.classList.remove('rolling');
        if (re) re.classList.remove('rolling');
    }, 2000);
}

function scheduleNextRollEyes() {
    const delay = Math.random() * 5000 + 1000;
    addTimeout(() => {
        rollEyes();
        scheduleNextRollEyes();
    }, delay);
}

export { init, cleanup };
