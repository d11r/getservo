#!/usr/bin/env node

/**
 * Build script for native binaries.
 *
 * This script compiles the Swift and C# binaries for the current platform.
 * For cross-platform builds, we rely on CI to build on the appropriate platform.
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { platform, arch } from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const binDir = join(rootDir, 'bin')
const nativeDir = join(rootDir, 'native')

// Ensure bin directory exists
if (!existsSync(binDir)) {
  mkdirSync(binDir, { recursive: true })
}

const currentPlatform = platform()
const currentArch = arch()

console.log(`Building native binaries for ${currentPlatform}-${currentArch}...`)

if (currentPlatform === 'darwin') {
  // Build macOS binary
  const macosDir = join(nativeDir, 'macos')
  const outputName = currentArch === 'arm64' ? 'servo-helper-darwin-arm64' : 'servo-helper-darwin-x64'
  const outputPath = join(binDir, outputName)

  console.log(`Compiling Swift binary: ${outputName}`)

  try {
    execSync(
      `swiftc -O -o "${outputPath}" Sources/main.swift -framework Cocoa -framework CoreGraphics -framework ApplicationServices`,
      {
        cwd: macosDir,
        stdio: 'inherit'
      }
    )
    console.log(`✓ Built ${outputName}`)
  } catch (error) {
    console.error(`✗ Failed to build macOS binary:`, error.message)
    process.exit(1)
  }
} else if (currentPlatform === 'win32') {
  // Build Windows binary
  const windowsDir = join(nativeDir, 'windows')
  const outputPath = join(binDir, 'servo-helper-win32-x64.exe')

  console.log('Compiling C# binary: servo-helper-win32-x64.exe')

  try {
    // Check if dotnet is available
    execSync('dotnet --version', { stdio: 'pipe' })

    // Build and publish as single file
    execSync(
      'dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o ../../../bin',
      {
        cwd: windowsDir,
        stdio: 'inherit'
      }
    )

    console.log('✓ Built servo-helper-win32-x64.exe')
  } catch (error) {
    console.error('✗ Failed to build Windows binary:', error.message)
    console.error('Make sure .NET 6.0 SDK is installed: https://dotnet.microsoft.com/download')
    process.exit(1)
  }
} else {
  console.error(`Unsupported platform: ${currentPlatform}`)
  console.error('Servo only supports macOS and Windows.')
  process.exit(1)
}

console.log('\nNative binary build complete!')
