import { Hex } from '@iden3/js-crypto';
import { Constants } from './constants';
import { BytesHelper } from './elemBytes';
export class SchemaHash {
    /**
     * Constructor
     * @param bytes
     */
    constructor(bytes) {
        this._bytes = new Uint8Array(Constants.SCHEMA.HASH_LENGTH);
        if (bytes) {
            this._bytes = bytes;
        }
        if (this.bytes.length !== Constants.SCHEMA.HASH_LENGTH) {
            throw new Error(`Schema hash must be ${Constants.SCHEMA.HASH_LENGTH} bytes long`);
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
        return Hex.encode(this.bytes);
    }
    marshalText() {
        return Hex.encodeString(this.bytes);
    }
    /**
     * NewSchemaHashFromHex creates new SchemaHash from hex string
     * @param s
     * @returns {SchemaHash}
     */
    static newSchemaHashFromHex(s) {
        const schemaEncodedBytes = Hex.decodeString(s);
        if (schemaEncodedBytes.length !== Constants.SCHEMA.HASH_LENGTH) {
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
        const bytes = BytesHelper.intToNBytes(i, Constants.SCHEMA.HASH_LENGTH);
        const start = Constants.SCHEMA.HASH_LENGTH - bytes.length;
        return new SchemaHash(BytesHelper.intToBytes(i).slice(start, Constants.SCHEMA.HASH_LENGTH));
    }
    /**
     * Convert SchemaHash to big.Int
     * @returns {bigint}
     */
    bigInt() {
        return BytesHelper.bytesToInt(this.bytes);
    }
}
// authSchemaHash predefined value of auth schema, used for auth claim during identity creation.
// This schema is hardcoded in the identity circuits and used to verify user's auth claim.
// Keccak256(https://schema.iden3.io/core/jsonld/auth.jsonld#AuthBJJCredential) last 16 bytes
// Hex: cca3371a6cb1b715004407e325bd993c
// BigInt: 80551937543569765027552589160822318028
SchemaHash.authSchemaHash = new SchemaHash(Uint8Array.from([204, 163, 55, 26, 108, 177, 183, 21, 0, 68, 7, 227, 37, 189, 153, 60]));
//# sourceMappingURL=schemaHash.js.map