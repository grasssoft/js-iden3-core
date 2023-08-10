"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDIDParams = exports.Param = void 0;
class Param {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    toString() {
        if (!this.name) {
            return '';
        }
        if (!this.value) {
            return this.name;
        }
        return `${this.name}=${this.value}`;
    }
}
exports.Param = Param;
exports.initDIDParams = Object.freeze({
    method: '',
    id: '',
    idStrings: [],
    params: [],
    path: '',
    pathSegments: [],
    query: '',
    fragment: ''
});
//# sourceMappingURL=types.js.map