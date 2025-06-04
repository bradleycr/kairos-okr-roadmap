#!/bin/bash

# --- MELD Node WebAssembly Build Script ---
# Compiles the exact same C++ code that runs on ESP32 into WebAssembly

set -e

echo "🔧 Building MELD Node WebAssembly..."

# Check if Emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten not found. Please install Emscripten first:"
    echo "   https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create build directory
mkdir -p build
cd build

# Configure with CMake
echo "📋 Configuring CMake..."
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release

# Build
echo "🚀 Compiling to WebAssembly..."
emmake make -j$(nproc)

echo "✅ WebAssembly build complete!"
echo "📦 Files generated:"
echo "   - meld-node.wasm"
echo "   - meld-node.js"
echo "   - meld-node.worker.js"
echo ""
echo "🎯 Files copied to public/ directory for Next.js"

cd .. 