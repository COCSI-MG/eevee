function fatorial(n: number): number {
    if (n === 0 || n === 1) {
        return 1;
    }
    return n * fatorial(n - 1);
}

module.exports = fatorial;