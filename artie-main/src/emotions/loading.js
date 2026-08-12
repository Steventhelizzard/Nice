import { setFace } from '../utils/face.js';
import { addInterval } from '../utils/emotion.js';

const FACE = '(⠙,ʖ⠙)';

function init() {
    setFace(FACE);
    startLoadingAnimation();
}

function cleanup() {
    // Nothing extra to clean up - interval is cleared centrally
}

function startLoadingAnimation() {
    const pattern = ['⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏', '⠋'];
    let index = 0;

    addInterval(() => {
        setFace('(' + pattern[index] + ',ʖ' + pattern[index] + ')');
        index = (index + 1) % pattern.length;
    }, 150);
}

export { init, cleanup };
