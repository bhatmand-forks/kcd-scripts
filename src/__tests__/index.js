import path from 'path'
import slash from 'slash'
import cases from 'jest-in-case'

const projectRoot = path.join(__dirname, '../../')

expect.addSnapshotSerializer({
  print: val => slash(val.replace(projectRoot, '<PROJECT_ROOT>/')),
  test: val => typeof val === 'string' && val.includes(projectRoot),
})

cases(
  'format',
  ({snapshotLog = false, throws = false, signal = false, args = []}) => {
    // beforeEach
    const {sync: crossSpawnSyncMock} = require('cross-spawn')
    const originalExit = process.exit
    const originalArgv = process.argv
    const originalLog = console.log
    process.exit = jest.fn()
    console.log = jest.fn()
    try {
      // tests
      process.argv = ['node', '../', ...args]
      crossSpawnSyncMock.mockClear()
      if (signal) {
        crossSpawnSyncMock.mockReturnValueOnce({result: 1, signal})
      }
      require('../')
      if (snapshotLog) {
        expect(console.log.mock.calls).toMatchSnapshot('format snapshotLog')
      } else if (signal) {
        expect(process.exit).toHaveBeenCalledTimes(1)
        expect(process.exit).toHaveBeenCalledWith(1)
        expect(console.log.mock.calls).toMatchSnapshot('format signal')
      } else {
        expect(crossSpawnSyncMock).toHaveBeenCalledTimes(1)
        const [firstCall] = crossSpawnSyncMock.mock.calls
        const [script, calledArgs] = firstCall
        expect([script, ...calledArgs].join(' ')).toMatchSnapshot('format script')
      }
    } catch (error) {
      if (throws) {
        expect(error.message).toMatchSnapshot('format error')
      } else {
        throw error
      }
    } finally {
      // afterEach
      process.exit = originalExit
      process.argv = originalArgv
      console.log = originalLog
      jest.resetModules()
    }
  },
  {
    'calls node with the script path and args': {
      args: ['test', '--no-watch'],
    },
    'calls node with the script path and args including inspect-brk argument': {
      args: ['--inspect-brk=3080', 'test', '--no-watch'],
    },
    'throws unknown script': {
      args: ['unknown-script'],
      throws: true,
    },
    'logs help with no args': {
      snapshotLog: true,
    },
    'logs for SIGKILL signal': {
      args: ['lint'],
      signal: 'SIGKILL',
    },
    'logs for SIGTERM signal': {
      args: ['build'],
      signal: 'SIGTERM',
    },
    'does not log for other signals': {
      args: ['test'],
      signal: 'SIGBREAK',
    },
  },
)

/* eslint complexity:0 */
