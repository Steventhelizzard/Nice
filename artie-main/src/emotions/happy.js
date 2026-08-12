import { setFace } from '../utils/face.js';
import { addTimeout } from '../utils/emotion.js';

const FACE = '(°‿ʖ°)';

function init() {
    setFace(FACE);
    scheduleNextBlink();
}

function cleanup() {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (leftEye) leftEye.classList.remove('happy');
    if (rightEye) rightEye.classList.remove('happy');
}

function swapEyes(newEyeChar, duration = 1000) {
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (!leftEye || !rightEye) return;

    const originalLeft = leftEye.textContent;
    const originalRight = rightEye.textContent;

    leftEye.textContent = newEyeChar;
    rightEye.textContent = newEyeChar;
    leftEye.classList.add('happy');
    rightEye.classList.add('happy');

    addTimeout(() => {
        const le = document.querySelector('.left-eye');
        const re = document.querySelector('.right-eye');
        if (le) {
            le.textContent = originalLeft;
            le.classList.remove('happy');
        }
        if (re) {
            re.textContent = originalRight;
            re.classList.remove('happy');
        }
    }, duration);
}

function scheduleNextBlink() {
    const delay = Math.random() * 3000 + 1500;
    addTimeout(() => {
        swapEyes('ᵔ');
        scheduleNextBlink();
    }, delay);
}

export { init, cleanup };
