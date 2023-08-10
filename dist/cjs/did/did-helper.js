"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDIDMethodByValue = exports.findBlockchainForDIDMethodByValue = exports.findNetworkIDForDIDMethodByValue = exports.buildDIDType = exports.DIDNetworkFlag = void 0;
const constants_1 = require("../constants");
// DIDNetworkFlag is a structure to represent DID blockchain and network id
class DIDNetworkFlag {
    constructor(blockchain, networkId) {
        this.blockchain = blockchain;
        this.networkId = networkId;
    }
    toString() {
        return `${this.blockchain}:${this.networkId}`;
    }
    static fromString(s) {
        const [blockchain, networkId] = s.split(':');
        return new DIDNetworkFlag(blockchain.replace('_', ''), networkId.replace('_', ''));
    }
}
exports.DIDNetworkFlag = DIDNetworkFlag;
// BuildDIDType builds bytes type from chain and network
function buildDIDType(method, blockchain, network) {
    const fb = constants_1.DidMethodByte[method];
    if (!fb) {
        throw constants_1.Constants.ERRORS.UNSUPPORTED_DID_METHOD;
    }
    const methodFn = constants_1.DidMethodNetwork[method];
    if (!methodFn) {
        throw constants_1.Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID;
    }
    const sb = methodFn[new DIDNetworkFlag(blockchain, network).toString()];
    if (typeof sb !== 'number') {
        throw new Error(`blockchain ${blockchain.toString() ?? '-'} and network ${network.toString() ?? '-'} is not defined in core lib`);
    }
    return Uint8Array.from([fb, sb]);
}
exports.buildDIDType = buildDIDType;
// FindNetworkIDForDIDMethodByValue finds network by byte value
function findNetworkIDForDIDMethodByValue(method, byteNumber) {
    const methodMap = constants_1.DidMethodNetwork[method];
    if (!methodMap) {
        throw constants_1.Constants.ERRORS.UNSUPPORTED_DID_METHOD;
    }
    for (const [key, value] of Object.entries(methodMap)) {
        if (value === byteNumber) {
            return DIDNetworkFlag.fromString(key).networkId;
        }
    }
    throw constants_1.Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID;
}
exports.findNetworkIDForDIDMethodByValue = findNetworkIDForDIDMethodByValue;
// findBlockchainForDIDMethodByValue finds blockchain type by byte value
function findBlockchainForDIDMethodByValue(method, byteNumber) {
    const methodMap = constants_1.DidMethodNetwork[method];
    if (!methodMap) {
        throw new Error(`${constants_1.Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID}: did method ${method} is not defined in core lib`);
    }
    for (const [key, value] of Object.entries(methodMap)) {
        if (value === byteNumber) {
            return DIDNetworkFlag.fromString(key).blockchain;
        }
    }
    throw constants_1.Constants.ERRORS.UNSUPPORTED_BLOCKCHAIN_FOR_DID;
}
exports.findBlockchainForDIDMethodByValue = findBlockchainForDIDMethodByValue;
// findDIDMethodByValue finds did method by its byte value
function findDIDMethodByValue(byteNumber) {
    for (const [key, value] of Object.entries(constants_1.DidMethodByte)) {
        if (value === byteNumber) {
            return key;
        }
    }
    throw constants_1.Constants.ERRORS.UNSUPPORTED_DID_METHOD;
}
exports.findDIDMethodByValue = findDIDMethodByValue;
//# sourceMappingURL=did-helper.js.map