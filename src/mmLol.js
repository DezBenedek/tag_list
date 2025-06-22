async function instantiate(buffer, imports = {}) {
    const adaptedImports = {
        env: Object.assign(Object.create(globalThis), imports.env || {}, {
            abort(message, fileName, lineNumber, columnNumber) {
                message = __liftString(message >>> 0);
                fileName = __liftString(fileName >>> 0);
                lineNumber = lineNumber >>> 0;
                columnNumber = columnNumber >>> 0;
                (() => {
                    throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
                })();
            },
        }),
    };
    const { instance: { exports }, module } = await WebAssembly.instantiate(buffer, adaptedImports);
    const memory = exports.memory || imports.env.memory;
    const adaptedExports = Object.setPrototypeOf({
        mmLol(input) {
            input = __lowerString(input) || __notnull();
            return __liftString(exports.mmLol(input) >>> 0);
        },
    }, exports);
    function __liftString(pointer) {
        if (!pointer) return null;
        const
            end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
            memoryU16 = new Uint16Array(memory.buffer);
        let
            start = pointer >>> 1,
            string = '';
        while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
        return string + String.fromCharCode(...memoryU16.subarray(start, end));
    }
    function __lowerString(value) {
        if (value == null) return 0;
        const
            length = value.length,
            pointer = exports.__new(length << 1, 2) >>> 0,
            memoryU16 = new Uint16Array(memory.buffer);
        for (let i = 0; i < length; ++i) memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
        return pointer;
    }
    function __notnull() {
        throw TypeError('value must not be null');
    }
    return adaptedExports;
}

const response = await fetch('https://nelly.tools/assets/js/mmLol.wasm');
const buffer = await response.arrayBuffer();
const wasm = await instantiate(buffer);

export const { memory, mmLol } = wasm;