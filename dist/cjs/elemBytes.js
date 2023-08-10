"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElemBytes = exports.BytesHelper = void 0;
const constants_1 = require("./constants");
const cross_sha256_1 = require("cross-sha256");
const utils_1 = require("./utils");
const js_crypto_1 = require("@iden3/js-crypto");
class BytesHelper {
    static intToBytes(int) {
        return BytesHelper.intToNBytes(int, constants_1.Constants.BYTES_LENGTH);
    }
    static intToNBytes(int, n) {
        return Uint8Array.from((0, utils_1.toLittleEndian)(int, n));
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
        const hash = new cross_sha256_1.sha256().update(str).digest();
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
        return (0, utils_1.fromLittleEndian)(bytes);
    }
}
exports.BytesHelper = BytesHelper;
class ElemBytes {
    constructor(bytes) {
        this._bytes = new Uint8Array(constants_1.Constants.BYTES_LENGTH);
        if (bytes) {
            this._bytes = bytes;
        }
        if (this._bytes.length !== constants_1.Constants.BYTES_LENGTH) {
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
        if (!(0, utils_1.checkBigIntInField)(n)) {
            throw constants_1.Constants.ERRORS.DATA_OVERFLOW;
        }
        this._bytes = BytesHelper.intToBytes(n);
        return this;
    }
    slotFromHex(hex) {
        const bytes = js_crypto_1.Hex.decodeString(hex);
        if (bytes.length !== constants_1.Constants.BYTES_LENGTH) {
            throw new Error('Invalid bytes length');
        }
        this._bytes.set(bytes, 0);
        return this;
    }
    hex() {
        return js_crypto_1.Hex.encodeString(this._bytes);
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
        if (!(0, utils_1.checkBigIntInField)(i)) {
            throw constants_1.Constants.ERRORS.DATA_OVERFLOW;
        }
        const bytes = BytesHelper.intToBytes(i);
        return new ElemBytes(bytes);
    }
}
exports.ElemBytes = ElemBytes;
//# sourceMappingURL=elemBytes.js.map