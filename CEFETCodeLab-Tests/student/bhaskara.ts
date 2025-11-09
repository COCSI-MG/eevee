function calc_bhaskara(a: number, b: number, c: number): { x1: number, x2: number } {
    let asw = {
        x1: 0,
        x2: 0
    }
    let det: number

    det = Math.pow(b, 2) - 4 * a * c

    if (det < 0) {
        asw.x1 = NaN
        asw.x2 = NaN
    } else {
        asw.x1 = ((-1 * b) + Math.sqrt(det))/(2 * a)
        asw.x2 = ((-1 * b) - Math.sqrt(det))/(2 * a)
    }
    return asw
}

module.exports = calc_bhaskara