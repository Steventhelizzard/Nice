import { setFaceShape } from '../utils/face.js';
import { addTimeout } from '../utils/emotion.js';

function init() {
    setFaceShape({ eyes: 'round', mouth: 'flat', cheeks: false });
    scheduleNextBlink();
}

function cleanup() {
    // Nothing extra to clean up
}

function blink(duration = 350) {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (!leftEye || !rightEye) return;

    leftEye.classList.add('blink');
    rightEye.classList.add('blink');

    addTimeout(() => {
        const le = document.querySelector('.left-eye');
        const re = document.querySelector('.right-eye');
        if (le) le.classList.remove('blink');
        if (re) re.classList.remove('blink');
    }, duration);
}

function scheduleNextBlink() {
    const delay = Math.random() * 3500 + 750;
    addTimeout(() => {
        blink();
        scheduleNextBlink();
    }, delay);
}

export { init, cleanup };
