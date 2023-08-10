import { SchemaHash } from './schemaHash';
import { ElemBytes } from './elemBytes';
import { Constants } from './constants';
import { Id } from './id';
import { checkBigIntArrayInField, checkBigIntInField, getDateFromUnixTimestamp, getUint32, getUint64, getUnixTimestamp, putUint32, putUint64 as getBytesFromUint64 } from './utils';
import { Hex, poseidon } from '@iden3/js-crypto';
/*
Claim structure

Index:
 i_0: [ 128  bits ] claim schema
      [ 32 bits ] option flags
          [3] Subject:
            000: A.1 Self
            001: invalid
            010: A.2.i OtherIden Index
            011: A.2.v OtherIden Value
            100: B.i Object Index
            101: B.v Object Value
          [1] Expiration: bool
          [1] Updatable: bool
          [3] Merklized: data is merklized root is stored in the:
            000: none
            001: C.i Root Index (root located in i_2)
            010: C.v Root Value (root located in v_2)
          [24] 0
      [ 32 bits ] version (optional?)
      [ 61 bits ] 0 - reserved for future use
 i_1: [ 248 bits] identity (case b) (optional)
      [  5 bits ] 0
 i_2: [ 253 bits] 0
 i_3: [ 253 bits] 0
Value:
 v_0: [ 64 bits ]  revocation nonce
      [ 64 bits ]  expiration date (optional)
      [ 125 bits] 0 - reserved
 v_1: [ 248 bits] identity (case c) (optional)
      [  5 bits ] 0
 v_2: [ 253 bits] 0
 v_3: [ 253 bits] 0
*/
export var SlotName;
(function (SlotName) {
    SlotName["IndexA"] = "IndexA";
    SlotName["IndexB"] = "IndexB";
    SlotName["ValueA"] = "ValueA";
    SlotName["ValueB"] = "ValueB";
})(SlotName || (SlotName = {}));
// ErrSlotOverflow means some ElemBytes overflows Q Field. And wraps the name
// of overflowed slot.
export class ErrSlotOverflow extends Error {
    constructor(msg) {
        super(`Slot ${msg} not in field (too large)`);
        Object.setPrototypeOf(this, ErrSlotOverflow.prototype);
    }
}
// subjectFlag for the time being describes the location of Id (in index or value
// slots or nowhere at all).
//
// Values subjectFlagInvalid presents for backward compatibility and for now means nothing.
export var SubjectFlag;
(function (SubjectFlag) {
    SubjectFlag[SubjectFlag["Self"] = 0] = "Self";
    SubjectFlag[SubjectFlag["Invalid"] = 1] = "Invalid";
    SubjectFlag[SubjectFlag["OtherIdenIndex"] = 2] = "OtherIdenIndex";
    SubjectFlag[SubjectFlag["OtherIdenValue"] = 3] = "OtherIdenValue";
})(SubjectFlag || (SubjectFlag = {}));
export var IdPosition;
(function (IdPosition) {
    IdPosition[IdPosition["None"] = 0] = "None";
    IdPosition[IdPosition["Index"] = 1] = "Index";
    IdPosition[IdPosition["Value"] = 2] = "Value";
})(IdPosition || (IdPosition = {}));
// merklizedFlag for the time being describes the location of root (in index or value
// slots or nowhere at all).
//
// Values merklizedFlagIndex indicates that root is located in index[2] slots.
// Values merklizedFlagValue indicates that root is located in value[2] slots.
export var MerklizedFlag;
(function (MerklizedFlag) {
    MerklizedFlag[MerklizedFlag["None"] = 0] = "None";
    MerklizedFlag[MerklizedFlag["Index"] = 32] = "Index";
    MerklizedFlag[MerklizedFlag["Value"] = 64] = "Value";
    MerklizedFlag[MerklizedFlag["Invalid"] = 128] = "Invalid";
})(MerklizedFlag || (MerklizedFlag = {}));
export var MerklizedRootPosition;
(function (MerklizedRootPosition) {
    MerklizedRootPosition[MerklizedRootPosition["None"] = 0] = "None";
    MerklizedRootPosition[MerklizedRootPosition["Index"] = 1] = "Index";
    MerklizedRootPosition[MerklizedRootPosition["Value"] = 2] = "Value";
})(MerklizedRootPosition || (MerklizedRootPosition = {}));
export var Flags;
(function (Flags) {
    Flags[Flags["ByteIdx"] = 16] = "ByteIdx";
    Flags[Flags["ExpirationBitIdx"] = 3] = "ExpirationBitIdx";
    Flags[Flags["UpdatableBitIdx"] = 4] = "UpdatableBitIdx";
})(Flags || (Flags = {}));
export class Claim {
    constructor() {
        this._index = [];
        this._value = [];
        for (let i = 0; i < Constants.ELEM_BYTES_LENGTH; i++) {
            this._index[i] = new ElemBytes();
            this._value[i] = new ElemBytes();
        }
    }
    // NewClaim creates new Claim with specified SchemaHash and any number of
    // options. Using options you can specify any field in claim.
    static newClaim(sh, ...args) {
        const c = new Claim();
        c.setSchemaHash(sh);
        for (let i = 0; i < args.length; i++) {
            const fn = args[i];
            fn(c);
        }
        return c;
    }
    // GetSchemaHash return copy of claim's schema hash.
    getSchemaHash() {
        return new SchemaHash(this._index[0].bytes.slice(0, Constants.SCHEMA.HASH_LENGTH));
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
    }
    get index() {
        return this._index;
    }
    set index(value) {
        this._index = value;
    }
    // SetSchemaHash updates claim's schema hash.
    setSchemaHash(sh) {
        this._index[0] = new ElemBytes(Uint8Array.from([...sh.bytes, ...new Array(Constants.SCHEMA.HASH_LENGTH).fill(0)]));
    }
    setSubject(s) {
        // clean first 3 bits
        this._index[0].bytes[Flags.ByteIdx] &= 0b11111000;
        this._index[0].bytes[Flags.ByteIdx] |= s;
    }
    getSubject() {
        let sbj = this._index[0].bytes[Flags.ByteIdx];
        // clean all except first 3 bits
        sbj &= 0b00000111;
        return sbj;
    }
    setFlagExpiration(val) {
        if (val) {
            this._index[0].bytes[Flags.ByteIdx] |= 0b1 << Flags.ExpirationBitIdx;
        }
        else {
            this._index[0].bytes[Flags.ByteIdx] &= ~(0b1 << Flags.ExpirationBitIdx);
        }
    }
    getFlagExpiration() {
        const mask = 0b1 << Flags.ExpirationBitIdx;
        return (this._index[0].bytes[Flags.ByteIdx] & mask) > 0;
    }
    // GetIDPosition returns the position at which the Id is stored.
    getIdPosition() {
        switch (this.getSubject()) {
            case SubjectFlag.Self:
                return IdPosition.None;
            case SubjectFlag.OtherIdenIndex:
                return IdPosition.Index;
            case SubjectFlag.OtherIdenValue:
                return IdPosition.Value;
            default:
                throw Constants.ERRORS.INVALID_SUBJECT_POSITION;
        }
    }
    // SetValueDataInts sets data to value slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    setValueDataInts(slotA, slotB) {
        this._value[2] = this.setSlotInt(slotA, SlotName.ValueA);
        this._value[3] = this.setSlotInt(slotB, SlotName.ValueB);
    }
    // SetValueDataBytes sets data to value slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    setValueDataBytes(slotA, slotB) {
        this._value[2] = this.setSlotBytes(slotA, SlotName.ValueA);
        this._value[3] = this.setSlotBytes(slotB, SlotName.ValueB);
    }
    // SetValueData sets data to value slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    setValueData(slotA, slotB) {
        const slotsAsInts = [slotA.toBigInt(), slotB.toBigInt()];
        if (!checkBigIntArrayInField(slotsAsInts)) {
            throw Constants.ERRORS.DATA_OVERFLOW;
        }
        this._value[2] = slotA;
        this._value[3] = slotB;
    }
    // SetIndexDataInts sets data to index slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    setIndexDataInts(slotA, slotB) {
        this._index[2] = this.setSlotInt(slotA, SlotName.IndexA);
        this._index[3] = this.setSlotInt(slotB, SlotName.IndexB);
    }
    // SetIndexDataBytes sets data to index slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    setIndexDataBytes(slotA, slotB) {
        this._index[2] = this.setSlotBytes(slotA, SlotName.IndexA);
        this._index[3] = this.setSlotBytes(slotB, SlotName.IndexB);
    }
    setSlotBytes(value, slotName) {
        const slot = new ElemBytes(value);
        if (!checkBigIntInField(slot.toBigInt())) {
            throw new ErrSlotOverflow(slotName);
        }
        return slot;
    }
    setFlagMerklized(s) {
        let f;
        switch (s) {
            case MerklizedRootPosition.Index:
                f = MerklizedFlag.Index;
                break;
            case MerklizedRootPosition.Value:
                f = MerklizedFlag.Value;
                break;
            default:
                f = MerklizedFlag.None;
        }
        // clean last 3 bits
        this.index[0].bytes[Flags.ByteIdx] &= 0b00011111;
        this.index[0].bytes[Flags.ByteIdx] |= f;
    }
    getMerklized() {
        let mt = this.index[0].bytes[Flags.ByteIdx];
        // clean all except last 3 bits
        mt &= 0b11100000;
        return mt;
    }
    // GetMerklizedPosition returns the position at which the Merklized flag is stored.
    getMerklizedPosition() {
        switch (this.getMerklized()) {
            case MerklizedFlag.None:
                return MerklizedRootPosition.None;
            case MerklizedFlag.Index:
                return MerklizedRootPosition.Index;
            case MerklizedFlag.Value:
                return MerklizedRootPosition.Value;
            default:
                throw Constants.ERRORS.INCORRECT_MERKLIZED_POSITION;
        }
    }
    setSlotInt(value, slotName) {
        if (!value) {
            value = BigInt(0);
        }
        if (!checkBigIntInField(value)) {
            throw new ErrSlotOverflow(slotName);
        }
        return new ElemBytes().setBigInt(value);
    }
    // SetIndexData sets data to index slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    setIndexData(slotA, slotB) {
        const slotsAsInts = [slotA.toBigInt(), slotB.toBigInt()];
        if (!checkBigIntArrayInField(slotsAsInts)) {
            throw Constants.ERRORS.DATA_OVERFLOW;
        }
        this._index[2] = slotA;
        this._index[3] = slotB;
    }
    resetExpirationDate() {
        this.setFlagExpiration(false);
        const bytes = Array.from({ length: Constants.NONCE_BYTES_LENGTH }, () => 0);
        const arr = Array.from(this._value[0].bytes);
        arr.splice(Constants.NONCE_BYTES_LENGTH, Constants.NONCE_BYTES_LENGTH, ...bytes);
        this._value[0] = new ElemBytes(Uint8Array.from(arr));
    }
    // GetExpirationDate returns expiration date and flag. Flag is true if
    // expiration date is present, false if null.
    getExpirationDate() {
        if (this.getFlagExpiration()) {
            const unixTimestamp = getUint64(this._value[0].bytes.slice(8, 16));
            return getDateFromUnixTimestamp(Number(unixTimestamp));
        }
        return null;
    }
    // SetExpirationDate sets expiration date to dt
    setExpirationDate(dt) {
        this.setFlagExpiration(true);
        const bytes = getBytesFromUint64(BigInt(getUnixTimestamp(dt)));
        const arr = Array.from(this._value[0].bytes);
        arr.splice(Constants.NONCE_BYTES_LENGTH, Constants.NONCE_BYTES_LENGTH, ...bytes);
        this._value[0] = new ElemBytes(Uint8Array.from(arr));
    }
    // GetRevocationNonce returns revocation nonce
    getRevocationNonce() {
        return getUint64(this._value[0].bytes.slice(0, 8));
    }
    // SetRevocationNonce sets claim's revocation nonce
    setRevocationNonce(nonce) {
        const bytes = getBytesFromUint64(nonce);
        if (bytes.length > Constants.NONCE_BYTES_LENGTH) {
            throw new Error('Nonce length is not valid');
        }
        const arr = Array.from(this._value[0].bytes);
        arr.splice(0, Constants.NONCE_BYTES_LENGTH, ...bytes);
        this._value[0] = new ElemBytes(Uint8Array.from(arr));
    }
    getValueId() {
        return Id.fromBytes(this._value[1].bytes.slice(0, -1));
    }
    // SetValueId sets id to value. Removes id from index if any.
    setValueId(id) {
        this.resetIndexId();
        this.setSubject(SubjectFlag.OtherIdenValue);
        const arr = Array.from(this._index[1].bytes);
        arr.splice(0, id.bytes.length, ...id.bytes);
        this._value[1] = new ElemBytes(Uint8Array.from(arr));
    }
    resetIndexId() {
        this._index[1] = new ElemBytes(new Uint8Array(Constants.BYTES_LENGTH).fill(0));
    }
    resetValueId() {
        this._value[1] = new ElemBytes(new Uint8Array(Constants.BYTES_LENGTH).fill(0));
    }
    getIndexId() {
        return Id.fromBytes(this._index[1].bytes.slice(0, -1));
    }
    // SetIndexId sets id to index. Removes id from value if any.
    setIndexId(id) {
        this.resetValueId();
        this.setSubject(SubjectFlag.OtherIdenIndex);
        const arr = Array.from(this._index[1].bytes);
        arr.splice(0, id.bytes.length, ...id.bytes);
        this._index[1] = new ElemBytes(Uint8Array.from(arr));
    }
    // SetVersion sets claim's version
    setVersion(ver) {
        const bytes = putUint32(ver);
        this._index[0].bytes[20] = bytes[0];
        this._index[0].bytes[21] = bytes[1];
        this._index[0].bytes[22] = bytes[2];
        this._index[0].bytes[23] = bytes[3];
    }
    // GetVersion returns claim's version
    getVersion() {
        return getUint32(this._index[0].bytes.slice(20, 24));
    }
    // SetFlagUpdatable sets claim's flag `updatable`
    setFlagUpdatable(val) {
        if (val) {
            this._index[0].bytes[Flags.ByteIdx] |= 0b1 << Flags.UpdatableBitIdx;
        }
        else {
            this._index[0].bytes[Flags.ByteIdx] &= ~(0b1 << Flags.UpdatableBitIdx);
        }
    }
    // HIndex calculates the hash of the Index of the Claim
    hIndex() {
        return poseidon.hash(ElemBytes.elemBytesToInts(this._index));
    }
    // GetFlagUpdatable returns claim's flag `updatable`
    getFlagUpdatable() {
        const mask = 0b1 << Flags.UpdatableBitIdx;
        return (this._index[0].bytes[Flags.ByteIdx] & mask) > 0;
    }
    // HValue calculates the hash of the Value of the Claim
    hValue() {
        return poseidon.hash(ElemBytes.elemBytesToInts(this._value));
    }
    // HiHv returns the HIndex and HValue of the Claim
    hiHv() {
        return { hi: this.hIndex(), hv: this.hValue() };
    }
    // SetIndexMerklizedRoot sets merklized root to index. Removes root from value[2] if any.
    setIndexMerklizedRoot(r) {
        this.resetValueMerklizedRoot();
        this.setFlagMerklized(MerklizedRootPosition.Index);
        this.index[2] = this.setSlotInt(r, SlotName.IndexA);
    }
    resetIndexMerklizedRoot() {
        this._index[2] = new ElemBytes(new Uint8Array(Constants.BYTES_LENGTH).fill(0));
    }
    // SetValueMerklizedRoot sets merklized root to value. Removes root from index[2] if any.
    setValueMerklizedRoot(r) {
        this.resetIndexMerklizedRoot();
        this.setFlagMerklized(MerklizedRootPosition.Value);
        this.value[2] = this.setSlotInt(r, SlotName.ValueA);
    }
    resetValueMerklizedRoot() {
        this._value[2] = new ElemBytes(new Uint8Array(Constants.BYTES_LENGTH).fill(0));
    }
    // GetMerklizedRoot returns merklized root from claim's index of value.
    // Returns error ErrNoMerklizedRoot if MerklizedRoot is not set.
    getMerklizedRoot() {
        switch (this.getMerklized()) {
            case MerklizedFlag.Index:
                return this.index[2].toBigInt();
            case MerklizedFlag.Value:
                return this.value[2].toBigInt();
            default:
                throw Constants.ERRORS.NO_MERKLIZED_ROOT;
        }
    }
    // resetId deletes Id from index and from value.
    resetId() {
        this.resetIndexId();
        this.resetValueId();
        this.setSubject(SubjectFlag.Self);
    }
    // GetId returns Id from claim's index of value.
    // Returns error ErrNoId if Id is not set.
    getId() {
        switch (this.getSubject()) {
            case SubjectFlag.OtherIdenIndex:
                return this.getIndexId();
            case SubjectFlag.OtherIdenValue:
                return this.getValueId();
            default:
                throw Constants.ERRORS.NO_ID;
        }
    }
    // RawSlots returns raw bytes of claim's index and value
    rawSlots() {
        return {
            index: this._index,
            value: this._value
        };
    }
    // RawSlotsAsInts returns slots as []bigint
    rawSlotsAsInts() {
        return [...ElemBytes.elemBytesToInts(this._index), ...ElemBytes.elemBytesToInts(this._value)];
    }
    clone() {
        return JSON.parse(JSON.stringify(this));
    }
    marshalJson() {
        return this.rawSlotsAsInts().map((b) => b.toString());
    }
    unMarshalJson(b) {
        const ints = JSON.parse(b).map((s) => BigInt(s));
        if (ints.length !== this._index.length + this._value.length) {
            throw new Error("invalid number of claim's slots");
        }
        this._index = [];
        this._value = [];
        for (let i = 0, j = Constants.ELEM_BYTES_LENGTH; i < ints.length / 2; i++, j++) {
            this._index[i] = new ElemBytes();
            this._index[i].setBigInt(ints[i]);
            this._value[i] = new ElemBytes();
            this._value[i].setBigInt(ints[j]);
        }
        return this;
    }
    marshalBinary() {
        const getBytes = (src) => src.reduce((acc, cur) => {
            return [...acc, ...cur.bytes];
        }, []);
        return Uint8Array.from(getBytes(this._index).concat(getBytes(this._value)));
    }
    // Hex returns hex representation of binary claim
    hex() {
        const b = this.marshalBinary();
        return Hex.encodeString(b);
    }
    fromHex(hex) {
        const b = Hex.decodeString(hex);
        this.unMarshalBinary(b);
        return this;
    }
    unMarshalBinary(data) {
        const wantLen = 2 * Constants.ELEM_BYTES_LENGTH * Constants.BYTES_LENGTH;
        if (data.length !== wantLen) {
            throw new Error('unexpected length of input data');
        }
        this._index = [];
        this._value = [];
        for (let i = 0, j = Constants.ELEM_BYTES_LENGTH; i < Constants.ELEM_BYTES_LENGTH; i++, j++) {
            this._index[i] = new ElemBytes(data.slice(i * Constants.BYTES_LENGTH, (i + 1) * Constants.BYTES_LENGTH));
            this._value[i] = new ElemBytes(data.slice(j * Constants.BYTES_LENGTH, (j + 1) * Constants.BYTES_LENGTH));
        }
    }
}
export class ClaimOptions {
    // WithFlagUpdatable sets claim's flag `updatable`
    static withFlagUpdatable(val) {
        return (c) => c.setFlagUpdatable(val);
    }
    // WithVersion sets claim's version
    static withVersion(ver) {
        return (c) => c.setVersion(ver);
    }
    // WithIndexId sets Id to claim's index
    static withIndexId(id) {
        return (c) => c.setIndexId(id);
    }
    // WithValueId sets Id to claim's value
    static withValueId(id) {
        return (c) => c.setValueId(id);
    }
    // WithFlagMerklized sets claim's flag `merklized`
    static withFlagMerklized(p) {
        return (c) => c.setFlagMerklized(p);
    }
    // WithId sets Id to claim's index or value depending on `pos`.
    static withId(id, pos) {
        return (c) => {
            switch (pos) {
                case IdPosition.Index:
                    c.setIndexId(id);
                    break;
                case IdPosition.Value:
                    c.setValueId(id);
                    break;
                default:
                    throw Constants.ERRORS.INCORRECT_ID_POSITION;
            }
        };
    }
    // WithRevocationNonce sets claim's revocation nonce.
    static withRevocationNonce(nonce) {
        return (c) => c.setRevocationNonce(nonce);
    }
    // WithExpirationDate sets claim's expiration date to `dt`.
    static withExpirationDate(dt) {
        return (c) => c.setExpirationDate(dt);
    }
    // WithIndexData sets data to index slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    static withIndexData(slotA, slotB) {
        return (c) => c.setIndexData(slotA, slotB);
    }
    // WithIndexDataBytes sets data to index slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    static withIndexDataBytes(slotA, slotB) {
        return (c) => c.setIndexDataBytes(slotA, slotB);
    }
    // WithIndexDataInts sets data to index slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    static withIndexDataInts(slotA, slotB) {
        return (c) => c.setIndexDataInts(slotA, slotB);
    }
    // WithValueData sets data to value slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    static withValueData(slotA, slotB) {
        return (c) => c.setValueData(slotA, slotB);
    }
    // WithValueDataBytes sets data to value slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    static withValueDataBytes(slotA, slotB) {
        return (c) => c.setValueDataBytes(slotA, slotB);
    }
    // WithValueDataInts sets data to value slots A & B.
    // Returns ErrSlotOverflow if slotA or slotB value are too big.
    static withValueDataInts(slotA, slotB) {
        return (c) => c.setValueDataInts(slotA, slotB);
    }
    // WithIndexMerklizedRoot sets root to index i_2
    // Returns ErrSlotOverflow if root value are too big.
    static withIndexMerklizedRoot(r) {
        return (c) => {
            c.setFlagMerklized(MerklizedRootPosition.Index);
            c.index[2] = c.setSlotInt(r, SlotName.IndexA);
        };
    }
    // WithValueMerklizedRoot sets root to value v_2
    // Returns ErrSlotOverflow if root value are too big.
    static withValueMerklizedRoot(r) {
        return (c) => {
            c.setFlagMerklized(MerklizedRootPosition.Value);
            c.value[2] = c.setSlotInt(r, SlotName.ValueA);
        };
    }
    // WithMerklizedRoot sets root to value v_2 or index i_2
    // Returns ErrSlotOverflow if root value are too big.
    static withMerklizedRoot(r, pos) {
        return (c) => {
            switch (pos) {
                case MerklizedRootPosition.Index:
                    c.setFlagMerklized(MerklizedRootPosition.Index);
                    c.index[2] = c.setSlotInt(r, SlotName.IndexA);
                    break;
                case MerklizedRootPosition.Value:
                    c.setFlagMerklized(MerklizedRootPosition.Value);
                    c.value[2] = c.setSlotInt(r, SlotName.ValueA);
                    break;
                default:
                    throw Constants.ERRORS.INCORRECT_MERKLIZED_POSITION;
            }
        };
    }
}
//# sourceMappingURL=claim.js.map