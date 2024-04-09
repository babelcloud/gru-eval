
function poly(xs: number[], x: number): number {
    // Evaluates polynomial with coefficients xs at point x.
    // return xs[0] + xs[1] * x + xs[1] * x^2 + .... xs[n] * x^n
    return xs.reduce((accum, coeff, i) => accum + coeff * Math.pow(x, i), 0);
}

function find_zero(xs: number[]): number | undefined {
    /* xs are coefficients of a polynomial.
    find_zero find x such that poly(x) = 0.
    find_zero returns only only zero point, even if there are many.
    Moreover, find_zero only takes list xs having even number of coefficients
    and largest non zero coefficient as it guarantees
    a solution. */
    // Implementation to find a zero is not provided. This is a complex problem and needs an algorithm like the Newton-Raphson method.
    // The Typescript function signature is provided, but the implementation would depend on the chosen numerical method and is out of scope.
    return undefined;
}
