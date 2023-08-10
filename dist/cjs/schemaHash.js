"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaHash = void 0;
const js_crypto_1 = require("@iden3/js-crypto");
const constants_1 = require("./constants");
const elemBytes_1 = require("./elemBytes");
class SchemaHash {
    /**
     * Constructor
     * @param bytes
     */
    constructor(bytes) {
        this._bytes = new Uint8Array(constants_1.Constants.SCHEMA.HASH_LENGTH);
        if (bytes) {
            this._bytes = bytes;
        }
        if (this.bytes.length !== constants_1.Constants.SCHEMA.HASH_LENGTH) {
            throw new Error(`Schema hash must be ${constants_1.Constants.SCHEMA.HASH_LENGTH} bytes long`);
        }
    }
    get bytes() {
        return this._bytes;
    }
    /**
     * MarshalText returns HEX representation of SchemaHash.
     * @returns {Uint8Array} 32 bytes//
     */
    marshalTextBytes() {
        return js_crypto_1.Hex.encode(this.bytes);
    }
    marshalText() {
        return js_crypto_1.Hex.encodeString(this.bytes);
    }
    /**
     * NewSchemaHashFromHex creates new SchemaHash from hex string
     * @param s
     * @returns {SchemaHash}
     */
    static newSchemaHashFromHex(s) {
        const schemaEncodedBytes = js_crypto_1.Hex.decodeString(s);
        if (schemaEncodedBytes.length !== constants_1.Constants.SCHEMA.HASH_LENGTH) {
            throw new Error(`invalid schema hash length: ${schemaEncodedBytes.length}`);
        }
        return new SchemaHash(schemaEncodedBytes);
    }
    /**
     * NewSchemaHashFromInt creates new SchemaHash from big.Int
     * @param i
     * @returns
     */
    static newSchemaHashFromInt(i) {
        const bytes = elemBytes_1.BytesHelper.intToNBytes(i, constants_1.Constants.SCHEMA.HASH_LENGTH);
        const start = constants_1.Constants.SCHEMA.HASH_LENGTH - bytes.length;
        return new SchemaHash(elemBytes_1.BytesHelper.intToBytes(i).slice(start, constants_1.Constants.SCHEMA.HASH_LENGTH));
    }
    /**
     * Convert SchemaHash to big.Int
     * @returns {bigint}
     */
    bigInt() {
        return elemBytes_1.BytesHelper.bytesToInt(this.bytes);
    }
}
exports.SchemaHash = SchemaHash;
// authSchemaHash predefined value of auth schema, used for auth claim during identity creation.
// This schema is hardcoded in the identity circuits and used to verify user's auth claim.
// Keccak256(https://schema.iden3.io/core/jsonld/auth.jsonld#AuthBJJCredential) last 16 bytes
// Hex: cca3371a6cb1b715004407e325bd993c
// BigInt: 80551937543569765027552589160822318028
SchemaHash.authSchemaHash = new SchemaHash(Uint8Array.from([204, 163, 55, 26, 108, 177, 183, 21, 0, 68, 7, 227, 37, 189, 153, 60]));
//# sourceMappingURL=schemaHash.js.map