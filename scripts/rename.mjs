#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
if (args.includes('--help')) {
  console.log('npm run rename -- --name @your-scope/my-pack --project-id my-pack --namespace my-pack')
  process.exit(0)
}
const options = {}
for (let i = 0; i < args.length; i += 2) {
  if (
    !['--name', '--project-id', '--namespace'].includes(args[i]) ||
    options[args[i]] ||
    !args[i + 1] ||
    args[i + 1].startsWith('--')
  )
    throw new Error(`Unknown, duplicate or incomplete option: ${args[i]}`)
  options[args[i]] = args[i + 1]
}
if (
  !/^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/.test(options['--name'] ?? '') ||
  options['--name'].length > 214
)
  throw new Error('Provide a lowercase npm package name.')
if (
  !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(options['--project-id'] ?? '') ||
  ['base', 'constructor', 'prototype'].includes(options['--project-id'])
)
  throw new Error('Provide a non-reserved project ID (1–80 letters, digits, dots, underscores or hyphens).')
if (!/^[a-z0-9][a-z0-9_.-]{0,79}$/.test(options['--namespace'] ?? '') || options['--namespace'] === 'base')
  throw new Error('Provide a non-reserved lowercase namespace (1–80 characters).')

const packagePath = resolve('package.json'),
  contentPath = resolve('content.json')
const manifest = JSON.parse(await readFile(packagePath, 'utf8'))
const oldId = manifest.arcadia.projectId
const content = JSON.parse(await readFile(contentPath, 'utf8'))
function rewrite(value) {
  if (Array.isArray(value)) return value.map(rewrite)
  if (!value || typeof value !== 'object') return value
  const result = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]))
  if (result.$ref?.projectId === oldId) result.$ref.projectId = options['--project-id']
  return result
}
manifest.name = options['--name']
manifest.arcadia.projectId = options['--project-id']
manifest.arcadia.namespace = options['--namespace']
await writeFile(packagePath, JSON.stringify(manifest, null, 2) + '\n')
await writeFile(contentPath, JSON.stringify(rewrite(content), null, 2) + '\n')
console.log(
  `Renamed to ${manifest.name}. Update repository metadata before publishing. Keep projectId and namespace stable after sharing.`,
)
