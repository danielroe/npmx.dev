/**
 * This script runs knip in a CI environment, without the need to install the entire project. It
 * reads the required version from pnpm-lock.yaml and executes the linter accordingly. It's "stupid
 * by design" so it could work in minimal Node.js environments.
 */

import { getDependencyVersion, runCommand } from './utils.ts'

const knipVersion = getDependencyVersion('knip')

runCommand('pnpx', [`knip@${knipVersion}`])
