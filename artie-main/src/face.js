const FACE_PARTS = [
    { className: 'cheek left-cheek' },
    { className: 'eye left-eye' },
    { className: 'mouth left-mouth' },
    { className: 'mouth right-mouth' },
    { className: 'eye right-eye' },
    { className: 'cheek right-cheek' },
];

/**
 * Builds the static face DOM once. Individual emotions never touch
 * innerHTML directly anymore - they just toggle shape state on these
 * elements, so the browser never has to re-parse/re-layout the whole face.
 */
function buildFace() {
    const element = document.getElementById('face');
    if (!element) return;

    // Already built - don't rebuild (avoids restarting CSS animations).
    if (element.querySelector('.left-eye')) return;

    element.innerHTML = FACE_PARTS
        .map(({ className }) => `<div class="${className}"></div>`)
        .join('');
}

/**
 * Sets the resting shape of the face. `eyes` and `mouth` are keywords
 * (e.g. 'round', 'closed', 'droopy', 'smile', 'frown', 'wavy', 'talking',
 * 'loading', 'small') that map to CSS rules via [data-shape="..."].
 * `cheeks` is a boolean toggling the blush circles on/off.
 */
function setFaceShape({ eyes, mouth, cheeks } = {}) {
    buildFace();

    if (eyes) {
        const leftEye = document.querySelector('.left-eye');
        const rightEye = document.querySelector('.right-eye');
        if (leftEye) leftEye.dataset.shape = eyes;
        if (rightEye) rightEye.dataset.shape = eyes;
    }

    if (mouth) {
        const leftMouth = document.querySelector('.left-mouth');
        const rightMouth = document.querySelector('.right-mouth');
        if (leftMouth) leftMouth.dataset.shape = mouth;
        if (rightMouth) rightMouth.dataset.shape = mouth;
    }

    if (cheeks !== undefined) {
        const leftCheek = document.querySelector('.left-cheek');
        const rightCheek = document.querySelector('.right-cheek');
        if (leftCheek) leftCheek.classList.toggle('visible', cheeks);
        if (rightCheek) rightCheek.classList.toggle('visible', cheeks);
    }
}

export { buildFace, setFaceShape };
