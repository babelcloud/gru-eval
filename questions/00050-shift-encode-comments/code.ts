
function encode_shift(s: string): string {
    // returns encoded string by shifting every character by 5 in the alphabet.
    // return "".join([chr(((ord(ch) + 5 - ord("a")) % 26) + ord("a")) for ch in s]);
    return s.split('').map((ch) => String.fromCharCode(((ch.charCodeAt(0) + 5 - 'a'.charCodeAt(0)) % 26) + 'a'.charCodeAt(0))).join('');
}

function decode_shift(s: string): string {
    // takes as input string encoded with encode_shift function. Returns decoded string.
    return s.split('').map((ch) => String.fromCharCode((((ch.charCodeAt(0) - 5 - 'a'.charCodeAt(0)) + 26) % 26) + 'a'.charCodeAt(0))).join('');
}
