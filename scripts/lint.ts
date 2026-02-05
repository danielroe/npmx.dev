/**
 * This script runs oxlint and oxfmt in a CI environment, without the need to install the entire
 * project. It reads the required version from pnpm-lock.yaml and executes the linters accordingly.
 * It's "stupid by design" so it could work in minimal Node.js environments.
 */

import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const projectDir = process.cwd()

function getDependencyVersion(dependencyName: string): string {
  const result = spawnSync('npm', ['pkg', 'get', `devDependencies.${dependencyName}`], {
    encoding: 'utf8',
  })

  if (result.status) {
    throw new Error(`Command failed: pnpm info ${dependencyName} version`)
  }

  return JSON.parse(result.stdout)
}

function runCommand(command: string, args: string[], cwd?: string) {
  const result = spawnSync(command, args, { stdio: 'inherit', cwd })

  if (result.status) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
}

const oxlintVersion = getDependencyVersion('oxlint')
const oxfmtVersion = getDependencyVersion('oxfmt')
const e18eVersion = getDependencyVersion('@e18e/eslint-plugin')

// Create a temp dir because:
// 1. oxlint seems to try to resolve plugins from the dir of the config file
// 2. pnpx/pnpm dlx doesn't have a clue about peers (plugins here), so doesn't have a way to install them
const tempDir = mkdtempSync(join(tmpdir(), 'oxlint-'))
try {
  writeFileSync(join(tempDir, 'package.json'), '{"name": "temp", "version": "1.0.0"}')
  cpSync('.oxlintrc.json', join(tempDir, '.oxlintrc.json'))
  runCommand(
    'pnpm',
    ['install', '-D', `oxlint@${oxlintVersion}`, `@e18e/eslint-plugin@${e18eVersion}`],
    tempDir,
  )
  runCommand('pnpm', ['exec', 'oxlint', '-c', join(tempDir, '.oxlintrc.json'), projectDir], tempDir)
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

runCommand('pnpx', [`oxfmt@${oxfmtVersion}`, '--check'])
