import { setFace } from '../utils/face.js';
import { addTimeout } from '../utils/emotion.js';

const FACE = '(≖_ʖ≖)';

function init() {
    setFace(FACE);
    scheduleNextBlink();
}

function cleanup() {
    // Nothing extra to clean up
}

function swapEyes(newEyeChar, duration = 350) {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (!leftEye || !rightEye) return;

    const originalLeft = leftEye.textContent;
    const originalRight = rightEye.textContent;

    leftEye.textContent = newEyeChar;
    rightEye.textContent = newEyeChar;

    addTimeout(() => {
        const le = document.querySelector('.left-eye');
        const re = document.querySelector('.right-eye');
        if (le) le.textContent = originalLeft;
        if (re) re.textContent = originalRight;
    }, duration);
}

function scheduleNextBlink() {
    const delay = Math.random() * 3500 + 750;
    addTimeout(() => {
        swapEyes('-');
        scheduleNextBlink();
    }, delay);
}

export { init, cleanup };
