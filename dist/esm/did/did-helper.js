import { Constants, DidMethodByte, DidMethodNetwork } from '../constants';
// DIDNetworkFlag is a structure to represent DID blockchain and network id
export class DIDNetworkFlag {
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
// BuildDIDType builds bytes type from chain and network
export function buildDIDType(method, blockchain, network) {
    const fb = DidMethodByte[method];
    if (!fb) {
        throw Constants.ERRORS.UNSUPPORTED_DID_METHOD;
    }
    const methodFn = DidMethodNetwork[method];
    if (!methodFn) {
        throw Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID;
    }
    const sb = methodFn[new DIDNetworkFlag(blockchain, network).toString()];
    if (typeof sb !== 'number') {
        throw new Error(`blockchain ${blockchain.toString() ?? '-'} and network ${network.toString() ?? '-'} is not defined in core lib`);
    }
    return Uint8Array.from([fb, sb]);
}
// FindNetworkIDForDIDMethodByValue finds network by byte value
export function findNetworkIDForDIDMethodByValue(method, byteNumber) {
    const methodMap = DidMethodNetwork[method];
    if (!methodMap) {
        throw Constants.ERRORS.UNSUPPORTED_DID_METHOD;
    }
    for (const [key, value] of Object.entries(methodMap)) {
        if (value === byteNumber) {
            return DIDNetworkFlag.fromString(key).networkId;
        }
    }
    throw Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID;
}
// findBlockchainForDIDMethodByValue finds blockchain type by byte value
export function findBlockchainForDIDMethodByValue(method, byteNumber) {
    const methodMap = DidMethodNetwork[method];
    if (!methodMap) {
        throw new Error(`${Constants.ERRORS.NETWORK_NOT_SUPPORTED_FOR_DID}: did method ${method} is not defined in core lib`);
    }
    for (const [key, value] of Object.entries(methodMap)) {
        if (value === byteNumber) {
            return DIDNetworkFlag.fromString(key).blockchain;
        }
    }
    throw Constants.ERRORS.UNSUPPORTED_BLOCKCHAIN_FOR_DID;
}
// findDIDMethodByValue finds did method by its byte value
export function findDIDMethodByValue(byteNumber) {
    for (const [key, value] of Object.entries(DidMethodByte)) {
        if (value === byteNumber) {
            return key;
        }
    }
    throw Constants.ERRORS.UNSUPPORTED_DID_METHOD;
}
//# sourceMappingURL=did-helper.js.map