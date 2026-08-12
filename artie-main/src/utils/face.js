function setFace(faceString) {
    const element = document.getElementById('face')
    const classMap = {
        0: 'cheek left-cheek',
        1: 'eye left-eye',
        2: 'mouth left-mouth',
        3: 'mouth right-mouth',
        4: 'eye right-eye',
        5: 'cheek right-cheek',
    }

    if (element) {
        element.innerHTML = faceString
            .split('')
            .map((char, index) => {
                const className = classMap[index] || '';
                return `<div class="${className}">${char}</div>`;
            })
            .join('')
    }
}

export { setFace }
