/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import path from 'node:path';
import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { hasOwnProperty } from '@lwc/shared';
import * as CompilerErrors from '../compiler/error-info';
import type { LWCErrorInfo } from '../shared/types';

const ERROR_CODE_RANGES = {
    compiler: {
        min: 1001,
        max: 1999,
    },
};

interface CustomMatchers<R = unknown> {
    toBeUniqueCode: (key: string, seenErrorCodes: Set<number>) => R;
    toBeInRange: (range: { min: number; max: number }, key: string) => R;
}

declare module 'vitest' {
    // TypeScript interfaces get merged; this is a false positive
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Assertion<T = any> extends CustomMatchers<T> {}
    // TypeScript interfaces get merged; this is a false positive
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
    toBeInRange(code, { min, max }, key) {
        const pass = Number.isInteger(code) && code >= min && code <= max;
        const message = () =>
            `expected ${key}'s error code '${code}'${
                pass ? ' not ' : ' '
            }to be in the range ${min}-${max}`;

        return { message, pass };
    },

    toBeUniqueCode(code, key, seenErrorCodes: Set<number>) {
        const pass = !seenErrorCodes.has(code);
        const message = () =>
            `expected ${key}'s error code '${code}' to${
                pass ? ' not ' : ' '
            }be a unique error code`;

        return { message, pass };
    },
});

function traverseErrorInfo(
    object: any,
    fn: (errorInfo: LWCErrorInfo, path: string) => void,
    path: string
) {
    Object.keys(object).forEach((key) => {
        const property = object[key];
        if (property && hasOwnProperty.call(property, 'code')) {
            fn(property as LWCErrorInfo, `${path}.${key}`);
        } else if (property) {
            traverseErrorInfo(property, fn, `${path}.${key}`);
        }
    });
}

describe('error validation', () => {
    it('compiler error codes are in the correct range', () => {
        function validate(errorInfo: LWCErrorInfo, key: string) {
            expect(errorInfo.code).toBeInRange(ERROR_CODE_RANGES.compiler, key);
        }

        traverseErrorInfo(CompilerErrors, validate, 'compiler');
    });

    it('error codes are unique', () => {
        const seenCodes = new Set<number>();
        function checkUniqueness(errorInfo: LWCErrorInfo, key: string) {
            expect(errorInfo.code).toBeUniqueCode(key, seenCodes);
            seenCodes.add(errorInfo.code);
        }

        traverseErrorInfo(CompilerErrors, checkUniqueness, 'compiler');
    });

    it('"Next error code: XXXX" comment is updated in src/compiler/error-info/index.ts', () => {
        let lastErrorCode = 1001;
        traverseErrorInfo(
            CompilerErrors,
            (error) => {
                lastErrorCode = Math.max(lastErrorCode, error.code);
            },
            'compiler'
        );
        const expectedNextErrorCode = 1 + lastErrorCode;
        const errorInfo = fs.readFileSync(
            path.join(__dirname, '../compiler/error-info/index.ts'),
            'utf-8'
        );
        const actualNextErrorCode = parseInt(errorInfo.match(/Next error code: (\d+)/)![1], 10);
        expect(actualNextErrorCode).toEqual(expectedNextErrorCode);
    });
});
