
function willItFly(q: number[], w: number): boolean {
    // Write a function that returns True if the object q will fly, and False otherwise.
    // The object q will fly if it's balanced (it is a palindromic list) and the sum of its elements is less than or equal the maximum possible weight w.

    // Example:
    // willItFly([1, 2], 5) ➞ False 
    // 1+2 is less than the maximum possible weight, but it's unbalanced.

    // willItFly([3, 2, 3], 1) ➞ False
    // it's balanced, but 3+2+3 is more than the maximum possible weight.

    // willItFly([3, 2, 3], 9) ➞ True
    // 3+2+3 is less than the maximum possible weight, and it's balanced.

    // willItFly([3], 5) ➞ True
    // 3 is less than the maximum possible weight, and it's balanced.
}
