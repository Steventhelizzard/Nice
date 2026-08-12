import { setFaceShape } from '../utils/face.js';
import { addTimeout } from '../utils/emotion.js';

function init() {
    setFaceShape({ eyes: 'round', mouth: 'smile', cheeks: true });
    scheduleNextBlink();
}

function cleanup() {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (leftEye) leftEye.classList.remove('happy-blink');
    if (rightEye) rightEye.classList.remove('happy-blink');
}

function blink(duration = 1000) {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (!leftEye || !rightEye) return;

    leftEye.classList.add('happy-blink');
    rightEye.classList.add('happy-blink');

    addTimeout(() => {
        const le = document.querySelector('.left-eye');
        const re = document.querySelector('.right-eye');
        if (le) le.classList.remove('happy-blink');
        if (re) re.classList.remove('happy-blink');
    }, duration);
}

function scheduleNextBlink() {
    const delay = Math.random() * 3000 + 1500;
    addTimeout(() => {
        blink();
        scheduleNextBlink();
    }, delay);
}

export { init, cleanup };
