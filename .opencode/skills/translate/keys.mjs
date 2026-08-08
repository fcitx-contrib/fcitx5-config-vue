import { execSync } from 'node:child_process'
import fs from 'node:fs'

// Collect the canonical set of translation keys used by the t() function in the
// Vue/TS sources. Static keys appear as t('...') / t("...") and are literal.
// Dynamic template keys such as t(`language.${x}`) are resolved against the
// nested "language" block and are skipped here (they contain ${).
const out = execSync("grep -rln --include='*.vue' --include='*.ts' -- 't(' src").toString()
const files = out.split('\n').filter(Boolean)
const keys = new Set()

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8')
  for (const m of s.matchAll(/(?<![A-Za-z0-9_])t\s*\(\s*(['"`])([\s\S]*?)\1\s*[,)]/g)) {
    const k = m[2]
    if (!k.includes('${')) keys.add(k)
  }
}

for (const k of [...keys].sort()) console.log(k)