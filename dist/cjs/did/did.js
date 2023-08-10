"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DID = void 0;
const id_1 = require("../id");
const constants_1 = require("../constants");
const elemBytes_1 = require("../elemBytes");
const did_helper_1 = require("./did-helper");
const did_parser_1 = require("./did-parser");
const cross_sha256_1 = require("cross-sha256");
// DID Decentralized Identifiers (DIDs)
// https://w3c.github.io/did-core/#did-syntax
class DID {
    constructor(d) {
        this.method = '';
        this.id = '';
        this.idStrings = [];
        this.params = [];
        this.path = '';
        this.pathSegments = [];
        this.query = '';
        this.fragment = '';
        if (d) {
            Object.assign(this, d);
        }
    }
    isUrl() {
        return (this.params.length > 0 ||
            !!this.path ||
            this.pathSegments.length > 0 ||
            !!this.query ||
            !!this.fragment);
    }
    string() {
        const buff = ['did:'];
        if (this.method) {
            buff.push(`${this.method}:`);
        }
        else {
            return '';
        }
        if (this.id) {
            buff.push(this.id);
        }
        else if (this.idStrings.length) {
            buff.push(this.idStrings.join(':'));
        }
        else {
            return '';
        }
        if (this.params.length) {
            for (const param of this.params) {
                const p = param.toString();
                if (p) {
                    buff.push(`;${p}`);
                }
                else {
                    return '';
                }
            }
        }
        if (this.path) {
            buff.push(`/${this.path}`);
        }
        else if (this.pathSegments.length) {
            buff.push(`/${this.pathSegments.join('/')}`);
        }
        if (this.query) {
            buff.push(`?${this.query}`);
        }
        if (this.fragment) {
            buff.push(`#${this.fragment}`);
        }
        return buff.join('');
    }
    static parse(s) {
        const parser = new did_parser_1.Parser(s);
        let parserState = parser.checkLength();
        while (parserState) {
            parserState = parserState();
        }
        parser.out.id = parser.out.idStrings.join(':');
        parser.out.path = parser.out.pathSegments.join('/');
        return new DID(parser.out);
    }
    static decodePartsFromId(id) {
        const method = (0, did_helper_1.findDIDMethodByValue)(id.bytes[0]);
        const blockchain = (0, did_helper_1.findBlockchainForDIDMethodByValue)(method, id.bytes[1]);
        const networkId = (0, did_helper_1.findNetworkIDForDIDMethodByValue)(method, id.bytes[1]);
        return { method, blockchain, networkId };
    }
    static networkIdFromId(id) {
        return DID.throwIfDIDUnsupported(id).networkId;
    }
    static methodFromId(id) {
        return DID.throwIfDIDUnsupported(id).method;
    }
    static blockchainFromId(id) {
        return DID.throwIfDIDUnsupported(id).blockchain;
    }
    static throwIfDIDUnsupported(id) {
        const { method, blockchain, networkId } = DID.decodePartsFromId(id);
        if (DID.isUnsupported(method, blockchain, networkId)) {
            throw new Error(`${constants_1.Constants.ERRORS.UNKNOWN_DID_METHOD.message}: unsupported DID`);
        }
        return { method, blockchain, networkId };
    }
    // DIDGenesisFromIdenState calculates the genesis ID from an Identity State and returns it as DID
    static newFromIdenState(typ, state) {
        const id = id_1.Id.idGenesisFromIdenState(typ, state);
        return DID.parseFromId(id);
    }
    // NewDID creates a new *w3c.DID from the type and the genesis
    static new(typ, genesis) {
        return DID.parseFromId(new id_1.Id(typ, genesis));
    }
    // ParseDIDFromID returns DID from ID
    static parseFromId(id) {
        if (!elemBytes_1.BytesHelper.checkChecksum(id.bytes)) {
            throw new Error(`${constants_1.Constants.ERRORS.UNSUPPORTED_ID.message}: invalid checksum`);
        }
        const { method, blockchain, networkId } = DID.throwIfDIDUnsupported(id);
        const didParts = [constants_1.Constants.DID.DID_SCHEMA, method.toString(), blockchain.toString()];
        if (networkId) {
            didParts.push(networkId.toString());
        }
        didParts.push(id.string());
        const didString = didParts.join(':');
        const did = DID.parse(didString);
        return did;
    }
    static idFromDID(did) {
        let id;
        try {
            id = DID.getIdFromDID(did);
        }
        catch (error) {
            if (error.message === constants_1.Constants.ERRORS.UNKNOWN_DID_METHOD.message) {
                return DID.idFromUnsupportedDID(did);
            }
            throw error;
        }
        return id;
    }
    static isUnsupported(method, blockchain, networkId) {
        return (method == constants_1.DidMethod.Other &&
            blockchain == constants_1.Blockchain.Unknown &&
            networkId == constants_1.NetworkId.Unknown);
    }
    static idFromUnsupportedDID(did) {
        const hash = Uint8Array.from(new cross_sha256_1.sha256().update(did.string()).digest());
        const genesis = new Uint8Array(27);
        const idSlice = hash.slice(hash.length - constants_1.Constants.GENESIS_LENGTH);
        for (let i = 0; i < genesis.length; i++) {
            genesis[i] = idSlice[i] ?? 0;
        }
        const flg = new did_helper_1.DIDNetworkFlag(constants_1.Blockchain.Unknown, constants_1.NetworkId.Unknown);
        const tp = Uint8Array.from([
            constants_1.DidMethodByte[constants_1.DidMethod.Other],
            constants_1.DidMethodNetwork[constants_1.DidMethod.Other][flg.toString()]
        ]);
        return new id_1.Id(tp, genesis);
    }
    static getIdFromDID(did) {
        const method = did.method;
        const methodByte = constants_1.DidMethodByte[method];
        if (!methodByte || method === constants_1.DidMethod.Other) {
            throw constants_1.Constants.ERRORS.UNKNOWN_DID_METHOD;
        }
        if (did.idStrings.length > 3 || did.idStrings.length < 2) {
            throw new Error(`${constants_1.Constants.ERRORS.INCORRECT_DID}: unexpected number of ID strings`);
        }
        const id = id_1.Id.fromString(did.idStrings[did.idStrings.length - 1]);
        if (!elemBytes_1.BytesHelper.checkChecksum(id.bytes)) {
            throw new Error(`${constants_1.Constants.ERRORS.INCORRECT_DID}: incorrect ID checksum`);
        }
        const { method: method2, blockchain, networkId } = DID.decodePartsFromId(id);
        if (method2.toString() !== method.toString()) {
            throw new Error(`${constants_1.Constants.ERRORS.INCORRECT_DID}: methods in Id and DID are different`);
        }
        if (blockchain.toString() !== did.idStrings[0]) {
            throw new Error(`${constants_1.Constants.ERRORS.INCORRECT_DID}: blockchains in ID and DID are different`);
        }
        if (did.idStrings.length > 2 && networkId.toString() != did.idStrings[1]) {
            throw new Error(`${constants_1.Constants.ERRORS.INCORRECT_DID}: networkIDs in Id and DID are different`);
        }
        return id;
    }
}
exports.DID = DID;
//# sourceMappingURL=did.js.map