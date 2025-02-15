import cases from 'jest-in-case'

import {winPathSerializer} from './helpers/serializers'

expect.addSnapshotSerializer(winPathSerializer)

cases(
  'pre-commit',
  ({
    args = [],
    utils = require('../../utils'),
    hasPkgProp = () => false,
    hasFile = () => false,
  }) => {
    // beforeEach
    const {sync: crossSpawnSyncMock} = require('cross-spawn')
    const originalArgv = process.argv
    const originalExit = process.exit
    Object.assign(utils, {
      hasPkgProp,
      hasFile,
      resolveBin: (modName, {executable = modName} = {}) => executable,
    })
    process.exit = jest.fn()

    process.argv = ['node', '../pre-commit', ...args]

    try {
      // tests
      require('../pre-commit')
      expect(crossSpawnSyncMock).toHaveBeenCalledTimes(2)
      const [firstCall, secondCall] = crossSpawnSyncMock.mock.calls
      const [scriptOne, calledArgsOne] = firstCall
      expect([scriptOne, ...calledArgsOne].join(' ')).toMatchSnapshot('pre-commit scriptOne')
      const [scriptTwo, calledArgsTwo] = secondCall
      expect([scriptTwo, ...calledArgsTwo].join(' ')).toMatchSnapshot('pre-commit scriptTwo')
    } catch (error) {
      throw error
    } finally {
      // afterEach
      process.exit = originalExit
      process.argv = originalArgv
      jest.resetModules()
    }
  },
  {
    'calls lint-staged CLI with default args': {},
    'does not use built-in config with --config': {
      args: ['--config', './custom-config.js'],
    },
    'does not use built-in config with .lintstagedrc file': {
      hasFile: filename => filename === '.lintstagedrc',
    },
    'does not use built-in config with lint-staged.config.js file': {
      hasFile: filename => filename === 'lint-staged.config.js',
    },
    'does not use built-in config with lint-staged pkg prop': {
      hasPkgProp: prop => prop === 'lint-staged',
    },
    'forwards args': {
      args: ['--verbose'],
    },
  },
)
