import fs from 'node:fs'

const [base, target] = process.argv.slice(2)
if (!base || !target) {
  console.error('usage: node validate.mjs <zh-CN.json> <lang.json>')
  process.exit(1)
}

const a = JSON.parse(fs.readFileSync(base, 'utf8'))
const b = JSON.parse(fs.readFileSync(target, 'utf8'))

// Flatten a JSON locale object into dotted key paths, recursing into nested
// objects (only the "language" block is nested in this project).
function flat(obj, pre = '') {
  const res = new Set()
  for (const [k, v] of Object.entries(obj)) {
    const p = pre ? `${pre}.${k}` : k
    if (v !== null && typeof v === 'object') {
      for (const x of flat(v, p)) res.add(x)
    } else {
      res.add(p)
    }
  }
  return res
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj)
}

const ka = [...flat(a)].sort()
const kb = [...flat(b)].sort()

let exit = false

const missing = ka.filter(k => !kb.includes(k))
const extra = kb.filter(k => !ka.includes(k))
// A value that equals its leaf key means it is still the English placeholder.
const untranslated = ka.filter(k => {
  const v = get(b, k)
  return typeof v === 'string' && v === k.split('.').pop()
})

if (missing.length) {
  console.log(`MISSING (in ${target}, not in ${base}):`)
  console.log(missing.join('\n'))
  exit = true
}
if (extra.length) {
  console.log(`EXTRA (in ${target}, not in ${base}):`)
  console.log(extra.join('\n'))
  exit = true
}
if (untranslated.length) {
  console.log(`UNTRANSLATED (value equals its key) in ${target}:`)
  console.log(untranslated.join('\n'))
  exit = true
}

if (!exit) console.log(`OK ${target}: all keys match ${base}, nothing untranslated`)
process.exitCode = exit ? 1 : 0