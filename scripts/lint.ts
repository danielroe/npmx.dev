/**
 * This script runs oxlint and oxfmt in a CI environment, without the need to install the entire
 * project. It reads the required version from pnpm-lock.yaml and executes the linters accordingly.
 * It's "stupid by design" so it could work in minimal Node.js environments.
 */

import { readFileSync } from 'node:fs'
import { getDependencyVersion, runCommand } from './utils.ts'

const lockfileContent = readFileSync('pnpm-lock.yaml', 'utf8')
const lines = lockfileContent.split(/\n/)

const oxlintVersion = getDependencyVersion('oxlint')
const oxfmtVersion = getDependencyVersion('oxfmt')

runCommand('pnpx', [`oxlint@${oxlintVersion}`])
runCommand('pnpx', [`oxfmt@${oxfmtVersion}`, '--check'])
