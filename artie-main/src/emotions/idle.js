import { setFaceShape } from '../utils/face.js';
import { addTimeout } from '../utils/emotion.js';

function init() {
    setFaceShape({ eyes: 'round', mouth: 'neutral', cheeks: false });
    scheduleNextBlink();
    scheduleNextPeek();
}

function cleanup() {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (leftEye) leftEye.classList.remove('peeking');
    if (rightEye) rightEye.classList.remove('peeking');
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

function peekEyes() {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (!leftEye || !rightEye) return;

    leftEye.classList.add('peeking');
    rightEye.classList.add('peeking');

    addTimeout(() => {
        const le = document.querySelector('.left-eye');
        const re = document.querySelector('.right-eye');
        if (le) le.classList.remove('peeking');
        if (re) re.classList.remove('peeking');
    }, 2000);
}

function scheduleNextBlink() {
    const delay = Math.random() * 3000 + 1000;
    addTimeout(() => {
        blink();
        scheduleNextBlink();
    }, delay);
}

function scheduleNextPeek() {
    const delay = Math.random() * 7000 + 4000;
    addTimeout(() => {
        peekEyes();
        scheduleNextPeek();
    }, delay);
}

export { init, cleanup };
