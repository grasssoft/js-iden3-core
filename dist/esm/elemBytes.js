import { Constants } from './constants';
import { sha256 } from 'cross-sha256';
import { checkBigIntInField, fromLittleEndian, toLittleEndian } from './utils';
import { Hex } from '@iden3/js-crypto';
export class BytesHelper {
    static intToBytes(int) {
        return BytesHelper.intToNBytes(int, Constants.BYTES_LENGTH);
    }
    static intToNBytes(int, n) {
        return Uint8Array.from(toLittleEndian(int, n));
    }
    static checkChecksum(bytes) {
        const { typ, genesis, checksum } = BytesHelper.decomposeBytes(bytes);
        if (!checksum.length || JSON.stringify(Uint8Array.from([0, 0])) === JSON.stringify(checksum)) {
            return false;
        }
        const c = BytesHelper.calculateChecksum(typ, genesis);
        return JSON.stringify(c) === JSON.stringify(checksum);
    }
    static decomposeBytes(b) {
        const offset = 2;
        const len = b.length - offset;
        return {
            typ: b.slice(0, offset),
            genesis: b.slice(offset, len),
            checksum: b.slice(-offset)
        };
    }
    static calculateChecksum(typ, genesis) {
        const toChecksum = [...typ, ...genesis];
        const s = toChecksum.reduce((acc, cur) => acc + cur, 0);
        const checksum = [s >> 8, s & 0xff];
        return Uint8Array.from(checksum.reverse());
    }
    static hashBytes(str) {
        const hash = new sha256().update(str).digest();
        return new Uint8Array(hash);
    }
    static hexToBytes(str) {
        const buffer = Buffer.from(str, 'hex');
        return Uint8Array.from(buffer);
    }
    static bytesToHex(bytes) {
        const hex = [];
        for (let i = 0; i < bytes.length; i++) {
            const current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
            hex.push((current >>> 4).toString(16));
            hex.push((current & 0xf).toString(16));
        }
        return hex.join('');
    }
    static bytesToInt(bytes) {
        return fromLittleEndian(bytes);
    }
}
export class ElemBytes {
    constructor(bytes) {
        this._bytes = new Uint8Array(Constants.BYTES_LENGTH);
        if (bytes) {
            this._bytes = bytes;
        }
        if (this._bytes.length !== Constants.BYTES_LENGTH) {
            throw new Error('Invalid bytes length');
        }
    }
    get bytes() {
        return this._bytes;
    }
    set bytes(value) {
        this._bytes = value;
    }
    toBigInt() {
        return BytesHelper.bytesToInt(this._bytes);
    }
    setBigInt(n) {
        if (!checkBigIntInField(n)) {
            throw Constants.ERRORS.DATA_OVERFLOW;
        }
        this._bytes = BytesHelper.intToBytes(n);
        return this;
    }
    slotFromHex(hex) {
        const bytes = Hex.decodeString(hex);
        if (bytes.length !== Constants.BYTES_LENGTH) {
            throw new Error('Invalid bytes length');
        }
        this._bytes.set(bytes, 0);
        return this;
    }
    hex() {
        return Hex.encodeString(this._bytes);
    }
    // ElemBytesToInts converts slice of ElemBytes to slice of *big.Int
    static elemBytesToInts(elements) {
        const result = [];
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            result.push(element.toBigInt());
        }
        return result;
    }
    static fromInt(i) {
        if (!checkBigIntInField(i)) {
            throw Constants.ERRORS.DATA_OVERFLOW;
        }
        const bytes = BytesHelper.intToBytes(i);
        return new ElemBytes(bytes);
    }
}
//# sourceMappingURL=elemBytes.js.map