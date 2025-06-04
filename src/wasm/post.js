// --- Post-load JavaScript for WebAssembly Module ---
// Sets up the module after WebAssembly has loaded

// Set up the global bridge
if (typeof window !== 'undefined') {
    // Browser environment
    window.MELDNodeBridge = {
        setDisplayFramebuffer: function(framebuffer) {
            displayFramebuffer = framebuffer;
        },
        
        setLEDCallback: function(callback) {
            ledStateCallback = callback;
        },
        
        setBuzzerCallback: function(callback) {
            buzzerCallback = callback;
        },
        
        setDebugCallback: function(callback) {
            debugCallback = callback;
        },
        
        // Convenience functions for calling WASM from JavaScript
        sendTouchEvent: function(x, y, type) {
            if (Module && Module._wasm_touch_event) {
                Module._wasm_touch_event(x, y, type, Date.now());
            }
        },
        
        sendNFCTag: function(uid, ndef) {
            if (Module && Module._wasm_nfc_tag) {
                // Convert UID and NDEF to proper format
                var uidArray = new Uint8Array(uid);
                var ndefArray = new Uint8Array(ndef);
                
                // Allocate memory in WASM
                var uidPtr = Module._malloc(uidArray.length);
                var ndefPtr = Module._malloc(ndefArray.length);
                
                // Copy data to WASM memory
                Module.HEAPU8.set(uidArray, uidPtr);
                Module.HEAPU8.set(ndefArray, ndefPtr);
                
                // Call WASM function
                Module._wasm_nfc_tag(uidPtr, uidArray.length, ndefPtr, ndefArray.length);
                
                // Free memory
                Module._free(uidPtr);
                Module._free(ndefPtr);
            }
        },
        
        removeNFCTag: function() {
            if (Module && Module._wasm_nfc_tag_removed) {
                Module._wasm_nfc_tag_removed();
            }
        },
        
        setRitualConfig: function(nodeId, label, behavior, tipAmount, voteOption, counterName, lightPattern) {
            if (Module && Module._set_ritual_config) {
                // Allocate strings in WASM memory
                var nodeIdPtr = Module._malloc(nodeId.length + 1);
                var labelPtr = Module._malloc(label.length + 1);
                var voteOptionPtr = Module._malloc(voteOption.length + 1);
                var counterNamePtr = Module._malloc(counterName.length + 1);
                var lightPatternPtr = Module._malloc(lightPattern.length + 1);
                
                // Copy strings to WASM memory
                Module.stringToUTF8(nodeId, nodeIdPtr, nodeId.length + 1);
                Module.stringToUTF8(label, labelPtr, label.length + 1);
                Module.stringToUTF8(voteOption, voteOptionPtr, voteOption.length + 1);
                Module.stringToUTF8(counterName, counterNamePtr, counterName.length + 1);
                Module.stringToUTF8(lightPattern, lightPatternPtr, lightPattern.length + 1);
                
                // Call WASM function
                Module._set_ritual_config(nodeIdPtr, labelPtr, behavior, tipAmount, 
                                        voteOptionPtr, counterNamePtr, lightPatternPtr);
                
                // Free memory
                Module._free(nodeIdPtr);
                Module._free(labelPtr);
                Module._free(voteOptionPtr);
                Module._free(counterNamePtr);
                Module._free(lightPatternPtr);
            }
        }
    };
    
    console.log("🎯 MELD Node WebAssembly bridge ready!");
} 