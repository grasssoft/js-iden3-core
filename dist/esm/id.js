import { Constants } from './constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base58Js = require('base58-js');
import { fromLittleEndian } from './utils';
import { BytesHelper, ElemBytes } from './elemBytes';
import { poseidon } from '@iden3/js-crypto';
// ID is a byte array with
// [  type  | root_genesis | checksum ]
// [2 bytes |   27 bytes   | 2 bytes  ]
// where the root_genesis are the first 28 bytes from the hash root_genesis
export class Id {
    constructor(typ, genesis) {
        this._checksum = BytesHelper.calculateChecksum(typ, genesis);
        this._bytes = Uint8Array.from([...typ, ...genesis, ...this._checksum]);
    }
    static getFromBytes(bytes) {
        const { typ, genesis } = BytesHelper.decomposeBytes(bytes);
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
        return fromLittleEndian(this._bytes);
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
        if (bytes.length !== Constants.ID.ID_LENGTH) {
            throw new Error('fromBytes error: byte array incorrect length');
        }
        if (bytes.every((i) => i === 0)) {
            throw new Error('fromBytes error: byte array empty');
        }
        const id = Id.getFromBytes(bytes);
        if (!BytesHelper.checkChecksum(bytes)) {
            throw new Error('fromBytes error: checksum error');
        }
        return id;
    }
    static fromString(s) {
        const bytes = base58Js.base58_to_binary(s);
        return Id.fromBytes(bytes);
    }
    static fromBigInt(bigInt) {
        const b = BytesHelper.intToNBytes(bigInt, Constants.ID.ID_LENGTH);
        return Id.fromBytes(b);
    }
    static profileId(id, nonce) {
        const bigIntHash = poseidon.hash([id.bigInt(), nonce]);
        const { typ } = BytesHelper.decomposeBytes(id.bytes);
        const genesis = BytesHelper.intToNBytes(bigIntHash, 27);
        return new Id(typ, genesis);
    }
    // IdGenesisFromIdenState calculates the genesis ID from an Identity State.
    static idGenesisFromIdenState(typ, //nolint:revive
    state) {
        const idenStateData = ElemBytes.fromInt(state);
        // we take last 27 bytes, because of swapped endianness
        const idGenesisBytes = idenStateData.bytes.slice(idenStateData.bytes.length - 27);
        return new Id(typ, idGenesisBytes);
    }
    static ethAddressFromId(id) {
        const isZeros = id.bytes.slice(2, 2 + 7).every((i) => i === 0);
        if (!isZeros) {
            throw new Error("can't get Ethereum address: high bytes of genesis are not zero");
        }
        return id.bytes.slice(2 + 7).slice(0, Constants.ETH_ADDRESS_LENGTH);
    }
}
//# sourceMappingURL=id.js.map