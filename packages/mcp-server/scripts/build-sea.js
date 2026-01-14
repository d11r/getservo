#!/usr/bin/env node
/**
 * Build script for creating a Node.js Single Executable Application (SEA)
 *
 * This script:
 * 1. Bundles the MCP server into a single JS file using esbuild
 * 2. Creates a SEA blob using Node.js built-in SEA support
 * 3. Injects the blob into a copy of the Node.js binary
 */

import { execSync, spawnSync } from 'child_process'
import { copyFileSync, writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const distDir = join(rootDir, 'dist')
const buildDir = join(rootDir, 'build')

// Ensure directories exist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}
if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true })
}

console.log('🔨 Building Servo MCP Server as Single Executable...\n')

// Step 1: Bundle with esbuild (CJS format for SEA)
console.log('📦 Step 1: Bundling with esbuild (CommonJS for SEA)...')
execSync('pnpm build:cjs', { cwd: rootDir, stdio: 'inherit' })

// Step 2: Create SEA config
console.log('\n📝 Step 2: Creating SEA configuration...')
const seaConfig = {
  main: join(distDir, 'index.cjs'),
  output: join(buildDir, 'sea-prep.blob'),
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: true
}
const seaConfigPath = join(buildDir, 'sea-config.json')
writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2))
console.log(`  Created: ${seaConfigPath}`)

// Step 3: Generate the blob
console.log('\n🔧 Step 3: Generating SEA blob...')
const generateResult = spawnSync(process.execPath, [
  '--experimental-sea-config',
  seaConfigPath
], { stdio: 'inherit' })

if (generateResult.status !== 0) {
  console.error('Failed to generate SEA blob')
  process.exit(1)
}

// Step 4: Copy Node.js binary
console.log('\n📋 Step 4: Copying Node.js binary...')
const nodeBinary = process.execPath
const outputBinary = join(buildDir, 'servo')

// Remove existing binary if it exists
if (existsSync(outputBinary)) {
  unlinkSync(outputBinary)
}

copyFileSync(nodeBinary, outputBinary)
console.log(`  Copied: ${nodeBinary} -> ${outputBinary}`)

// Step 5: Inject the blob (platform-specific)
console.log('\n💉 Step 5: Injecting SEA blob into binary...')
const blobPath = join(buildDir, 'sea-prep.blob')

if (process.platform === 'darwin') {
  // macOS: Use postject with codesign removal first
  console.log('  Platform: macOS')

  // Remove existing signature (required before injection)
  try {
    execSync(`codesign --remove-signature "${outputBinary}"`, { stdio: 'inherit' })
  } catch {
    // Ignore if no signature exists
  }

  // Inject using pnpm exec postject (uses local dependency)
  execSync(
    `pnpm exec postject "${outputBinary}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`,
    { cwd: rootDir, stdio: 'inherit' }
  )

  // Re-sign (ad-hoc signing for local use)
  execSync(`codesign --sign - "${outputBinary}"`, { stdio: 'inherit' })

} else if (process.platform === 'win32') {
  // Windows: Use postject directly
  console.log('  Platform: Windows')
  execSync(
    `pnpm exec postject "${outputBinary}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    { cwd: rootDir, stdio: 'inherit' }
  )
} else {
  // Linux: Use postject directly
  console.log('  Platform: Linux')
  execSync(
    `pnpm exec postject "${outputBinary}" NODE_SEA_BLOB "${blobPath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    { cwd: rootDir, stdio: 'inherit' }
  )
}

console.log('\n✅ Build complete!')
console.log(`   Binary: ${outputBinary}`)

// Show file size
const stats = readFileSync(outputBinary)
const sizeMB = (stats.length / 1024 / 1024).toFixed(1)
console.log(`   Size: ${sizeMB} MB`)

console.log('\n📋 Next steps:')
console.log('   1. Run: node scripts/build-app.js  (to create .app bundle)')
console.log('   2. Or test directly: ./build/servo')
