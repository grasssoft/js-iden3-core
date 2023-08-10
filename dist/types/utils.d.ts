export declare function fromLittleEndian(bytes: Uint8Array): bigint;
export declare function fromBigEndian(bytes: Uint8Array): bigint;
export declare function toLittleEndian(bigNumber: bigint, len?: number): Uint8Array;
export declare function toBigEndian(bigNumber: bigint, len?: number): Uint8Array;
export declare function putUint32(n: number): Uint8Array;
export declare function getUint32(arr: Uint8Array): number;
export declare function putUint64(n: bigint): Uint8Array;
export declare function getUint64(arr: Uint8Array): bigint;
export declare function getUnixTimestamp(d: Date): number;
export declare function getDateFromUnixTimestamp(n: number): Date;
export declare function checkBigIntInField(a: bigint): boolean;
export declare function checkBigIntArrayInField(arr: bigint[]): boolean;
export declare function idenState(clr: bigint, rer: bigint, ror: bigint): bigint;
export declare class StringUtils {
    static isNotValidIDChar(char: string): boolean;
    static isNotValidParamChar(char: string): boolean;
    static isNotValidQueryOrFragmentChar(char: string): boolean;
    static isNotValidPathChar(char: string): boolean;
    static isNotUnreservedOrSubdelim(char: string): boolean;
    static isNotHexDigit(char: string): boolean;
    static isNotDigit(char: string): boolean;
    static isNotAlpha(char: string): boolean;
    static isNotBigLetter(char: string): boolean;
    static isNotSmallLetter(char: string): boolean;
}
export declare const genesisFromEthAddress: (addr: Uint8Array) => Uint8Array;
