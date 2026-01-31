import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES_DIRECTORY = join(process.cwd(), 'i18n/locales')
const REFERENCE_FILE_NAME = 'en.json'
const TARGET_LOCALE_CODE = process.argv[2]

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
} as const

type NestedObject = { [key: string]: unknown }

const validateInput = (): void => {
  if (!TARGET_LOCALE_CODE) {
    console.error(
      `${COLORS.red}Error: Missing locale argument. Usage: pnpm i18n:check <locale>${COLORS.reset}`,
    )
    process.exit(1)
  }
}

const flattenObject = (obj: NestedObject, prefix = ''): Record<string, unknown> => {
  return Object.keys(obj).reduce<Record<string, unknown>>((acc, key) => {
    const propertyPath = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value as NestedObject, propertyPath))
    } else {
      acc[propertyPath] = value
    }
    return acc
  }, {})
}

const loadAndFlatten = (locale: string): string[] => {
  const filePath = join(LOCALES_DIRECTORY, locale.endsWith('.json') ? locale : `${locale}.json`)
  if (!existsSync(filePath)) {
    console.error(`${COLORS.red}Error: File not found at ${filePath}${COLORS.reset}`)
    process.exit(1)
  }
  const content = JSON.parse(readFileSync(filePath, 'utf-8')) as NestedObject
  return Object.keys(flattenObject(content))
}

const logSection = (
  title: string,
  keys: string[],
  color: string,
  icon: string,
  emptyMessage: string,
): void => {
  console.log(`\n${color}${icon} ${title}${COLORS.reset}`)
  if (keys.length === 0) {
    console.log(`  ${COLORS.green}${emptyMessage}${COLORS.reset}`)
    return
  }
  keys.forEach(key => console.log(`  - ${key}`))
}

const run = (): void => {
  validateInput()

  const referenceKeys = loadAndFlatten(REFERENCE_FILE_NAME)
  const targetKeys = loadAndFlatten(TARGET_LOCALE_CODE)

  const missingKeys = referenceKeys.filter(key => !targetKeys.includes(key))
  const extraneousKeys = targetKeys.filter(key => !referenceKeys.includes(key))

  console.log(
    `\n${COLORS.cyan}=== Deep Translation Audit: ${TARGET_LOCALE_CODE} ===${COLORS.reset}`,
  )

  logSection(
    'MISSING KEYS (Path exists in en.json but not in target)',
    missingKeys,
    COLORS.yellow,
    '',
    'No missing keys found.',
  )

  logSection(
    'EXTRANEOUS KEYS (Path exists in target but not in en.json)',
    extraneousKeys,
    COLORS.magenta,
    '',
    'No extraneous keys found.',
  )

  console.log(`\n${COLORS.cyan}==========================================${COLORS.reset}\n`)
}

run()
