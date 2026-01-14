#!/usr/bin/env node
/**
 * Build script for creating a macOS .app bundle
 *
 * This script:
 * 1. Creates the .app bundle structure
 * 2. Copies the SEA binary into the bundle
 * 3. Creates Info.plist with proper configuration
 * 4. Optionally signs the bundle
 */

import { execSync } from 'child_process'
import {
  copyFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  chmodSync,
  rmSync
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const buildDir = join(rootDir, 'build')
const appName = 'Servo'
const appBundle = join(buildDir, `${appName}.app`)
const bundleId = 'app.getservo.servo'
const version = '0.1.0'

console.log('🍎 Building Servo.app bundle...\n')

// Check if SEA binary exists
const seaBinary = join(buildDir, 'servo')
if (!existsSync(seaBinary)) {
  console.error('❌ SEA binary not found. Run build:sea first.')
  console.error(`   Expected: ${seaBinary}`)
  process.exit(1)
}

// Remove existing .app if it exists
if (existsSync(appBundle)) {
  console.log('🗑️  Removing existing .app bundle...')
  rmSync(appBundle, { recursive: true })
}

// Create .app structure
console.log('📁 Creating .app bundle structure...')
const contentsDir = join(appBundle, 'Contents')
const macosDir = join(contentsDir, 'MacOS')
const resourcesDir = join(contentsDir, 'Resources')

mkdirSync(macosDir, { recursive: true })
mkdirSync(resourcesDir, { recursive: true })

// Copy binary
console.log('📋 Copying binary...')
const targetBinary = join(macosDir, appName)
copyFileSync(seaBinary, targetBinary)
chmodSync(targetBinary, 0o755)

// Create Info.plist
console.log('📝 Creating Info.plist...')
const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>${appName}</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundleDisplayName</key>
    <string>${appName}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${version}</string>
    <key>CFBundleVersion</key>
    <string>${version}</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2025 Dragos Strugar. MIT License.</string>
    <key>LSBackgroundOnly</key>
    <false/>
</dict>
</plist>
`
writeFileSync(join(contentsDir, 'Info.plist'), infoPlist)

// Create PkgInfo
writeFileSync(join(contentsDir, 'PkgInfo'), 'APPL????')

// Create a simple icon placeholder (optional - can add real icon later)
// For now, we'll skip the icon

// Sign the app (ad-hoc for local use)
console.log('🔐 Signing .app bundle (ad-hoc)...')
try {
  execSync(`codesign --force --deep --sign - "${appBundle}"`, { stdio: 'inherit' })
} catch (error) {
  console.warn('⚠️  Signing failed (may need to run manually)')
}

console.log('\n✅ Build complete!')
console.log(`   App: ${appBundle}`)

// Calculate size
const sizeOutput = execSync(`du -sh "${appBundle}"`, { encoding: 'utf-8' })
console.log(`   Size: ${sizeOutput.trim().split('\t')[0]}`)

console.log('\n📋 Installation:')
console.log('   1. Copy to Applications:')
console.log(`      cp -r "${appBundle}" /Applications/`)
console.log('')
console.log('   2. Grant permissions in System Settings > Privacy & Security:')
console.log('      - Accessibility')
console.log('      - Screen Recording')
console.log('      - Automation (for System Events)')
console.log('')
console.log('   3. Update your MCP config (~/.mcp.json or project .mcp.json):')
console.log(`      {
        "mcpServers": {
          "servo": {
            "command": "/Applications/${appName}.app/Contents/MacOS/${appName}"
          }
        }
      }`)
