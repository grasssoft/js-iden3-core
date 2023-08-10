export declare const Constants: Readonly<{
    ERRORS: {
        DATA_OVERFLOW: Error;
        INCORRECT_ID_POSITION: Error;
        NO_ID: Error;
        INVALID_SUBJECT_POSITION: Error;
        INCORRECT_MERKLIZED_POSITION: Error;
        NO_MERKLIZED_ROOT: Error;
        NETWORK_NOT_SUPPORTED_FOR_DID: Error;
        UNSUPPORTED_BLOCKCHAIN_FOR_DID: Error;
        UNSUPPORTED_DID_METHOD: Error;
        UNKNOWN_DID_METHOD: Error;
        INCORRECT_DID: Error;
        UNSUPPORTED_ID: Error;
    };
    SCHEMA: {
        HASH_LENGTH: number;
    };
    ETH_ADDRESS_LENGTH: 20;
    BYTES_LENGTH: 32;
    ELEM_BYTES_LENGTH: 4;
    NONCE_BYTES_LENGTH: 8;
    Q: bigint;
    ID: {
        TYPE_DEFAULT: Uint8Array;
        TYPE_READONLY: Uint8Array;
        ID_LENGTH: number;
    };
    DID: {
        DID_SCHEMA: string;
    };
    GENESIS_LENGTH: 27;
}>;
export declare enum Blockchain {
    Ethereum = "eth",
    Polygon = "polygon",
    Besu = "besu",
    Unknown = "unknown",
    NoChain = "",
    ReadOnly = "readonly"
}
export declare enum NetworkId {
    Main = "main",
    Test = "test",
    Mumbai = "mumbai",
    Goerli = "goerli",
    Unknown = "unknown",
    NoNetwork = ""
}
export declare enum DidMethod {
    Iden3 = "iden3",
    PolygonId = "polygonid",
    Nbo = "nbo",
    Other = ""
}
export declare const DidMethodByte: {
    [key: string]: number;
};
export declare const DidMethodNetwork: {
    [k: string]: {
        [k: string]: number;
    };
};
