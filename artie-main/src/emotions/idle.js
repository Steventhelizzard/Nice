import { setFace } from '../utils/face.js';
import { addTimeout } from '../utils/emotion.js';

const FACE = '(◕_ʖ◕)';

function init() {
    setFace(FACE);
    scheduleNextBlink();
    scheduleNextRollEyes();
}

function cleanup() {
    // Remove any CSS classes that might be lingering
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (leftEye) leftEye.classList.remove('rolling');
    if (rightEye) rightEye.classList.remove('rolling');
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
        // Only restore if elements still exist
        const le = document.querySelector('.left-eye');
        const re = document.querySelector('.right-eye');
        if (le) le.textContent = originalLeft;
        if (re) re.textContent = originalRight;
    }, duration);
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

function scheduleNextBlink() {
    const delay = Math.random() * 3000 + 1000;
    addTimeout(() => {
        swapEyes('-');
        scheduleNextBlink();
    }, delay);
}

function scheduleNextRollEyes() {
    const delay = Math.random() * 7000 + 4000;
    addTimeout(() => {
        rollEyes();
        scheduleNextRollEyes();
    }, delay);
}

export { init, cleanup };
