/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const BASE_CONFIG = require('../../../scripts/jest/base.config');
const PRESET_CONFIG = require('./jest-preset');

module.exports = {
    ...BASE_CONFIG,
    ...PRESET_CONFIG,

    displayName: 'lwc-jest-preset',

    // Disable coverage entirely for this package. This package overrides the jest configuration
    // to test its internals. Because of this the coverage reports the fixtures code and not the
    // package's logic.
    coveragePathIgnorePatterns: [
        '<rootDir>/src',
    ],
};