import { poseidon } from '@iden3/js-crypto';
import { Constants } from './constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
export function fromLittleEndian(bytes) {
    const n256 = BigInt(256);
    let result = BigInt(0);
    let base = BigInt(1);
    bytes.forEach((byte) => {
        result += base * BigInt(byte);
        base = base * n256;
    });
    return result;
}
export function fromBigEndian(bytes) {
    return fromLittleEndian(bytes.reverse());
}
export function toLittleEndian(bigNumber, len = 31) {
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
export function toBigEndian(bigNumber, len = 31) {
    return toLittleEndian(bigNumber, len).reverse();
}
export function putUint32(n) {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setUint32(0, n, true);
    return new Uint8Array(buf);
}
export function getUint32(arr) {
    const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
    return new DataView(buf).getUint32(0, true);
}
export function putUint64(n) {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setBigUint64(0, n, true);
    return new Uint8Array(buf);
}
export function getUint64(arr) {
    const buf = arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
    return new DataView(buf).getBigUint64(0, true);
}
export function getUnixTimestamp(d) {
    return Math.floor(d.getTime() / 1000);
}
export function getDateFromUnixTimestamp(n) {
    return new Date(n * 1000);
}
// checkBigIntInField checks if given *big.Int fits in a Field Q element
export function checkBigIntInField(a) {
    return a < Constants.Q;
}
export function checkBigIntArrayInField(arr) {
    return arr.every((n) => checkBigIntInField(n));
}
// IdenState calculates the Identity State from the Claims Tree Root,
// Revocation Tree Root and Roots Tree Root.
export function idenState(clr, rer, ror) {
    return poseidon.hash([clr, rer, ror]);
}
export class StringUtils {
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
export const genesisFromEthAddress = (addr) => {
    return Uint8Array.from([...new Uint8Array(7), ...addr]);
};
//# sourceMappingURL=utils.js.map