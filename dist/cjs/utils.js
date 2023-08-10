"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genesisFromEthAddress = exports.StringUtils = exports.idenState = exports.checkBigIntArrayInField = exports.checkBigIntInField = exports.getDateFromUnixTimestamp = exports.getUnixTimestamp = exports.getUint64 = exports.putUint64 = exports.getUint32 = exports.putUint32 = exports.toBigEndian = exports.toLittleEndian = exports.fromBigEndian = exports.fromLittleEndian = void 0;
const js_crypto_1 = require("@iden3/js-crypto");
const constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/no-var-requires
function fromLittleEndian(bytes) {
    const n256 = BigInt(256);
    let result = BigInt(0);
    let base = BigInt(1);
    bytes.forEach((byte) => {
        result += base * BigInt(byte);
        base = base * n256;
    });
    return result;
}
exports.fromLittleEndian = fromLittleEndian;
function fromBigEndian(bytes) {
    return fromLittleEndian(bytes.reverse());
}
exports.fromBigEndian = fromBigEndian;
function toLittleEndian(bigNumber, len = 31) {
    const n256 = BigInt(256);
    const result = new Uint8Array(len);
    let i = 0;
    while (bigNumber > BigInt(0)) {
        result[i] = Number(bigNumber % n256);
        bigNumber = bigNumber / n256;
        i += 1;
    }
    return result;
}
exports.toLittleEndian = toLittleEndian;
function toBigEndian(bigNumber, len = 31) {
    return toLittleEndian(bigNumber, len).reverse();
}
exports.toBigEndian = toBigEndian;
function putUint32(n) {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setUint32(0, n, true);
    return new Uint8Array(buf);
}
exports.putUint32 = putUint32;
function getUint32(arr) {
    const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
    return new DataView(buf).getUint32(0, true);
}
exports.getUint32 = getUint32;
function putUint64(n) {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setBigUint64(0, n, true);
    return new Uint8Array(buf);
}
exports.putUint64 = putUint64;
function getUint64(arr) {
    const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
    return new DataView(buf).getBigUint64(0, true);
}
exports.getUint64 = getUint64;
function getUnixTimestamp(d) {
    return Math.floor(d.getTime() / 1000);
}
exports.getUnixTimestamp = getUnixTimestamp;
function getDateFromUnixTimestamp(n) {
    return new Date(n * 1000);
}
exports.getDateFromUnixTimestamp = getDateFromUnixTimestamp;
// checkBigIntInField checks if given *big.Int fits in a Field Q element
function checkBigIntInField(a) {
    return a < constants_1.Constants.Q;
}
exports.checkBigIntInField = checkBigIntInField;
function checkBigIntArrayInField(arr) {
    return arr.every((n) => checkBigIntInField(n));
}
exports.checkBigIntArrayInField = checkBigIntArrayInField;
// IdenState calculates the Identity State from the Claims Tree Root,
// Revocation Tree Root and Roots Tree Root.
function idenState(clr, rer, ror) {
    return js_crypto_1.poseidon.hash([clr, rer, ror]);
}
exports.idenState = idenState;
class StringUtils {
    static isNotValidIDChar(char) {
        return (StringUtils.isNotAlpha(char) && StringUtils.isNotDigit(char) && char !== '.' && char !== '-');
    }
    static isNotValidParamChar(char) {
        return (StringUtils.isNotAlpha(char) &&
            StringUtils.isNotDigit(char) &&
            char !== '.' &&
            char !== '-' &&
            char !== '_' &&
            char !== ':');
    }
    static isNotValidQueryOrFragmentChar(char) {
        return StringUtils.isNotValidPathChar(char) && char !== '/' && char !== '?';
    }
    static isNotValidPathChar(char) {
        return StringUtils.isNotUnreservedOrSubdelim(char) && char !== ':' && char !== '@';
    }
    static isNotUnreservedOrSubdelim(char) {
        switch (char) {
            case '-':
            case '.':
            case '_':
            case '~':
            case '!':
            case '$':
            case '&':
            case "'":
            case '(':
            case ')':
            case '*':
            case '+':
            case ',':
            case ';':
            case '=':
                return false;
            default:
                if (StringUtils.isNotAlpha(char) && StringUtils.isNotDigit(char)) {
                    return true;
                }
                return false;
        }
    }
    static isNotHexDigit(char) {
        return (StringUtils.isNotDigit(char) &&
            (char < '\x41' || char > '\x46') &&
            (char < '\x61' || char > '\x66'));
    }
    static isNotDigit(char) {
        // '\x30' is digit 0, '\x39' is digit 9
        return char < '\x30' || char > '\x39';
    }
    // StringUtils.isNotAlpha returns true if a byte is not a big letter between A-Z or small letter between a-z
    // https://tools.ietf.org/html/rfc5234#appendix-B.1
    static isNotAlpha(char) {
        return StringUtils.isNotSmallLetter(char) && StringUtils.isNotBigLetter(char);
    }
    // isNotBigLetter returns true if a byte is not a big letter between A-Z
    // in US-ASCII http://www.columbia.edu/kermit/ascii.html
    // https://tools.ietf.org/html/rfc5234#appendix-B.1
    static isNotBigLetter(char) {
        // '\x41' is big letter A, '\x5A' small letter Z
        return char < '\x41' || char > '\x5A';
    }
    // isNotSmallLetter returns true if a byte is not a small letter between a-z
    // in US-ASCII http://www.columbia.edu/kermit/ascii.html
    // https://tools.ietf.org/html/rfc5234#appendix-B.1
    static isNotSmallLetter(char) {
        // '\x61' is small letter a, '\x7A' small letter z
        return char < '\x61' || char > '\x7A';
    }
}
exports.StringUtils = StringUtils;
const genesisFromEthAddress = (addr) => {
    return Uint8Array.from([...new Uint8Array(7), ...addr]);
};
exports.genesisFromEthAddress = genesisFromEthAddress;
//# sourceMappingURL=utils.js.map