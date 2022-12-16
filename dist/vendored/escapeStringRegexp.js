"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeStringRegexp = void 0;
function escapeStringRegexp(str) {
    if (typeof str !== "string") {
        throw new TypeError("Expected a string");
    }
    return str
        .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        .replace(/-/g, "\\x2d");
}
exports.escapeStringRegexp = escapeStringRegexp;
//# sourceMappingURL=escapeStringRegexp.js.map