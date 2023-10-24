"use strict";
/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiDeserializer = void 0;
const util_js_1 = require("../common/util.js");
/**
 * @internal
 */
class UnsupportedTypeError extends Error {
}
/**
 * @internal
 */
class BidiDeserializer {
    static deserializeNumber(value) {
        switch (value) {
            case '-0':
                return -0;
            case 'NaN':
                return NaN;
            case 'Infinity':
                return Infinity;
            case '-Infinity':
                return -Infinity;
            default:
                return value;
        }
    }
    static deserializeLocalValue(result) {
        switch (result.type) {
            case 'array':
                if (result.value) {
                    return result.value.map(value => {
                        return BidiDeserializer.deserializeLocalValue(value);
                    });
                }
                break;
            case 'set':
                if (result.value) {
                    return result.value.reduce((acc, value) => {
                        return acc.add(BidiDeserializer.deserializeLocalValue(value));
                    }, new Set());
                }
                break;
            case 'object':
                if (result.value) {
                    return result.value.reduce((acc, tuple) => {
                        const { key, value } = BidiDeserializer.deserializeTuple(tuple);
                        acc[key] = value;
                        return acc;
                    }, {});
                }
                break;
            case 'map':
                if (result.value) {
                    return result.value?.reduce((acc, tuple) => {
                        const { key, value } = BidiDeserializer.deserializeTuple(tuple);
                        return acc.set(key, value);
                    }, new Map());
                }
                break;
            case 'promise':
                return {};
            case 'regexp':
                return new RegExp(result.value.pattern, result.value.flags);
            case 'date':
                return new Date(result.value);
            case 'undefined':
                return undefined;
            case 'null':
                return null;
            case 'number':
                return BidiDeserializer.deserializeNumber(result.value);
            case 'bigint':
                return BigInt(result.value);
            case 'boolean':
                return Boolean(result.value);
            case 'string':
                return result.value;
        }
        throw new UnsupportedTypeError(`Deserialization of type ${result.type} not supported.`);
    }
    static deserializeTuple([serializedKey, serializedValue]) {
        const key = typeof serializedKey === 'string'
            ? serializedKey
            : BidiDeserializer.deserializeLocalValue(serializedKey);
        const value = BidiDeserializer.deserializeLocalValue(serializedValue);
        return { key, value };
    }
    static deserialize(result) {
        if (!result) {
            (0, util_js_1.debugError)('Service did not produce a result.');
            return undefined;
        }
        try {
            return BidiDeserializer.deserializeLocalValue(result);
        }
        catch (error) {
            if (error instanceof UnsupportedTypeError) {
                (0, util_js_1.debugError)(error.message);
                return undefined;
            }
            throw error;
        }
    }
}
exports.BidiDeserializer = BidiDeserializer;
//# sourceMappingURL=Deserializer.js.map