import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
const exec = promisify(execFile)
const script = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts/rename.mjs')

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'arcadia-template-rename-'))
  const manifest = {
    name: '@template/pack',
    private: true,
    arcadia: { projectId: 'old-pack', namespace: 'old-pack' },
  }
  const content = {
    data: {
      skills: [
        {
          behaviors: [
            {
              definitionId: {
                $ref: {
                  projectId: 'old-pack',
                  kind: 'behavior',
                  id: 'apply-slow',
                },
              },
            },
            {
              definitionId: {
                $ref: {
                  projectId: 'another-pack',
                  kind: 'behavior',
                  id: 'external',
                },
              },
            },
          ],
        },
      ],
    },
  }
  await writeFile(join(dir, 'package.json'), JSON.stringify(manifest))
  await writeFile(join(dir, 'content.json'), JSON.stringify(content))
  return dir
}
test('renaming changes stable local references together and preserves external package identities', async () => {
  const dir = await fixture()
  try {
    await exec(
      process.execPath,
      [script, '--name', '@me/frost', '--project-id', 'my-frost', '--namespace', 'frost'],
      { cwd: dir },
    )
    const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
    const content = JSON.parse(await readFile(join(dir, 'content.json'), 'utf8'))
    assert.equal(manifest.name, '@me/frost')
    assert.equal(manifest.arcadia.projectId, 'my-frost')
    assert.equal(manifest.arcadia.namespace, 'frost')
    assert.equal(manifest.private, true)
    assert.deepEqual(
      content.data.skills[0].behaviors.map((b) => b.definitionId.$ref.projectId),
      ['my-frost', 'another-pack'],
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
for (const namespace of ['base', '../outside', 'Invalid']) {
  test(`invalid namespace ${namespace} fails before modifying either file`, async () => {
    const dir = await fixture()
    try {
      const before = await Promise.all(
        ['package.json', 'content.json'].map((file) => readFile(join(dir, file), 'utf8')),
      )
      await assert.rejects(
        exec(
          process.execPath,
          [script, '--name', '@me/frost', '--project-id', 'my-frost', '--namespace', namespace],
          { cwd: dir },
        ),
      )
      const after = await Promise.all(
        ['package.json', 'content.json'].map((file) => readFile(join(dir, file), 'utf8')),
      )
      assert.deepEqual(after, before)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
}
