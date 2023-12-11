import { exec, execSync } from 'child_process'
import fs from 'fs'
import { run } from '@mermaid-js/mermaid-cli'
import path, { dirname } from 'path'

const __dirname = dirname('')
const arch = process.platform + process.arch
const platform = {
  darwinarm64: 'mac_arm',
  darwinx64: 'mac',
  linuxx64: 'linux',
  win32x64: 'win64',
  win32ia32: 'win32',
}

const mermaidDiagramPath = path.resolve(__dirname, 'diagrams/mermaid')
const mermaidDiagramImages = path.resolve(__dirname, 'diagrams/images')

async function generateDiagrams() {
  try {
    console.log('Creating diagrams in progress...')
    const cmd = `npx @puppeteer/browsers install chromium --platform ${platform[arch]}`

    const { stdout } = await execPromise(cmd)
    const [, chromiumPath] = stdout.split(' ')

    const files = fs.readdirSync(mermaidDiagramPath)
    console.log(`Found ${files.length} mermaid files. Generating diagrams...`)

    const mermaidDiagrams = files.map((file, idx) =>
      generateDiagram(file, chromiumPath)
    )
    await Promise.all(mermaidDiagrams)

    console.log('All diagrams have been generated successfully.')
    execSync(`rm -rf chromium`)
  } catch (error) {
    console.error('An error occurred:', error.message)
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

async function generateDiagram(file, chromiumPath) {
  const inputPath = path.join(mermaidDiagramPath, file)
  const outputPath = path.join(mermaidDiagramImages, file.replace('mmd', 'png'))

  console.log(`Processing ${file}...`)
  await run(inputPath, outputPath, {
    puppeteerConfig: {
      headless: 'new',
      executablePath: chromiumPath.trim(),
    },
  })
}

generateDiagrams()
