// Mock WebAssembly module for development
// This will be replaced by the real Emscripten-generated file when building with WebAssembly

function createMockModule() {
  console.log('🟡 Using mock WebAssembly module for development')
  
  // Mock module that mimics Emscripten structure
  return {
    _wasm_setup: function() {
      console.log('Mock WASM setup')
    },
    _wasm_loop: function() {
      // Mock main loop - no-op in development
    },
    _set_ritual_config: function(nodeId, label, behavior, tipAmount, voteOption, counterName, lightPattern) {
      console.log('Mock ritual config set:', { nodeId, label, behavior })
    },
    _wasm_touch_event: function(x, y, type, timestamp) {
      console.log('Mock touch event:', { x, y, type })
    },
    _wasm_nfc_tag: function(uidPtr, uidLength, ndefPtr, ndefLength) {
      console.log('Mock NFC tag:', { uidLength, ndefLength })
    },
    _wasm_nfc_tag_removed: function() {
      console.log('Mock NFC tag removed')
    },
    _malloc: function(size) {
      return 0 // Mock malloc
    },
    _free: function(ptr) {
      // Mock free
    },
    HEAPU8: new Uint8Array(1024), // Mock heap
    stringToUTF8: function(str, ptr, maxBytes) {
      // Mock string conversion
    },
    UTF8ToString: function(ptr) {
      return 'mock string'
    }
  }
}

const MELDNodeWASM = async function(config) {
  return createMockModule()
}

// Add default export
MELDNodeWASM.default = MELDNodeWASM

export default MELDNodeWASM 