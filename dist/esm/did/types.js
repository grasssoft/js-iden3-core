export class Param {
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
export const initDIDParams = Object.freeze({
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