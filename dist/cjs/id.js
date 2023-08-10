"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Id = void 0;
const constants_1 = require("./constants");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base58Js = require('base58-js');
const utils_1 = require("./utils");
const elemBytes_1 = require("./elemBytes");
const js_crypto_1 = require("@iden3/js-crypto");
// ID is a byte array with
// [  type  | root_genesis | checksum ]
// [2 bytes |   27 bytes   | 2 bytes  ]
// where the root_genesis are the first 28 bytes from the hash root_genesis
class Id {
    constructor(typ, genesis) {
        this._checksum = elemBytes_1.BytesHelper.calculateChecksum(typ, genesis);
        this._bytes = Uint8Array.from([...typ, ...genesis, ...this._checksum]);
    }
    static getFromBytes(bytes) {
        const { typ, genesis } = elemBytes_1.BytesHelper.decomposeBytes(bytes);
        return new Id(typ, genesis);
    }
    checksum() {
        return this._checksum;
    }
    string() {
        return base58Js.binary_to_base58(this._bytes);
    }
    get bytes() {
        return this._bytes;
    }
    set bytes(b) {
        this._bytes = b;
    }
    type() {
        return this._bytes.slice(0, 2);
    }
    bigInt() {
        return (0, utils_1.fromLittleEndian)(this._bytes);
    }
    equal(id) {
        return JSON.stringify(this._bytes) === JSON.stringify(id.bytes);
    }
    marshal() {
        return new TextEncoder().encode(this.string());
    }
    static unMarshal(b) {
        return Id.fromString(new TextDecoder().decode(b));
    }
    static fromBytes(b) {
        const bytes = b ?? Uint8Array.from([]);
        if (bytes.length !== constants_1.Constants.ID.ID_LENGTH) {
            throw new Error('fromBytes error: byte array incorrect length');
        }
        if (bytes.every((i) => i === 0)) {
            throw new Error('fromBytes error: byte array empty');
        }
        const id = Id.getFromBytes(bytes);
        if (!elemBytes_1.BytesHelper.checkChecksum(bytes)) {
            throw new Error('fromBytes error: checksum error');
        }
        return id;
    }
    static fromString(s) {
        const bytes = base58Js.base58_to_binary(s);
        return Id.fromBytes(bytes);
    }
    static fromBigInt(bigInt) {
        const b = elemBytes_1.BytesHelper.intToNBytes(bigInt, constants_1.Constants.ID.ID_LENGTH);
        return Id.fromBytes(b);
    }
    static profileId(id, nonce) {
        const bigIntHash = js_crypto_1.poseidon.hash([id.bigInt(), nonce]);
        const { typ } = elemBytes_1.BytesHelper.decomposeBytes(id.bytes);
        const genesis = elemBytes_1.BytesHelper.intToNBytes(bigIntHash, 27);
        return new Id(typ, genesis);
    }
    // IdGenesisFromIdenState calculates the genesis ID from an Identity State.
    static idGenesisFromIdenState(typ, //nolint:revive
    state) {
        const idenStateData = elemBytes_1.ElemBytes.fromInt(state);
        // we take last 27 bytes, because of swapped endianness
        const idGenesisBytes = idenStateData.bytes.slice(idenStateData.bytes.length - 27);
        return new Id(typ, idGenesisBytes);
    }
    static ethAddressFromId(id) {
        const isZeros = id.bytes.slice(2, 2 + 7).every((i) => i === 0);
        if (!isZeros) {
            throw new Error("can't get Ethereum address: high bytes of genesis are not zero");
        }
        return id.bytes.slice(2 + 7).slice(0, constants_1.Constants.ETH_ADDRESS_LENGTH);
    }
}
exports.Id = Id;
//# sourceMappingURL=id.js.map