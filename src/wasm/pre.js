// --- JavaScript Bridge for WebAssembly ---
// These functions are called from C++ WebAssembly code

// Global references that will be set by the React component
var displayFramebuffer = null;
var touchEventCallback = null;
var nfcEventCallback = null;
var ledStateCallback = null;
var buzzerCallback = null;
var debugCallback = null;

// Storage simulation using localStorage
var storagePrefix = "meld_node_";

// --- Display Functions ---
function js_display_clear() {
    if (displayFramebuffer) {
        displayFramebuffer.clear();
    }
}

function js_display_set_pixel(x, y, black) {
    if (displayFramebuffer) {
        displayFramebuffer.setPixel(x, y, black);
    }
}

function js_display_draw_text(x, y, textPtr, size) {
    if (displayFramebuffer && textPtr) {
        var text = UTF8ToString(textPtr);
        displayFramebuffer.drawText(x, y, text, size);
    }
}

function js_display_update(partial) {
    if (partial && window.displayPartialUpdate) {
        window.displayPartialUpdate();
    } else if (window.displayFullRefresh) {
        window.displayFullRefresh();
    }
}

// --- LED Functions ---
function js_led_set(on) {
    if (ledStateCallback) {
        ledStateCallback(on);
    }
}

// --- Buzzer Functions ---
function js_buzzer_tone(frequency, duration) {
    if (buzzerCallback) {
        buzzerCallback(frequency, duration);
    }
}

// --- Storage Functions ---
function js_storage_save(keyPtr, dataPtr, length) {
    if (!keyPtr || !dataPtr || length <= 0) return false;
    
    try {
        var key = storagePrefix + UTF8ToString(keyPtr);
        var data = new Uint8Array(Module.HEAPU8.buffer, dataPtr, length);
        var base64 = btoa(String.fromCharCode.apply(null, data));
        localStorage.setItem(key, base64);
        return true;
    } catch (e) {
        console.error("Storage save error:", e);
        return false;
    }
}

function js_storage_load(keyPtr, dataPtr, maxLength) {
    if (!keyPtr || !dataPtr || maxLength <= 0) return 0;
    
    try {
        var key = storagePrefix + UTF8ToString(keyPtr);
        var base64 = localStorage.getItem(key);
        if (!base64) return 0;
        
        var data = atob(base64);
        var length = Math.min(data.length, maxLength);
        
        for (var i = 0; i < length; i++) {
            Module.HEAPU8[dataPtr + i] = data.charCodeAt(i);
        }
        
        return length;
    } catch (e) {
        console.error("Storage load error:", e);
        return 0;
    }
}

function js_storage_delete(keyPtr) {
    if (!keyPtr) return false;
    
    try {
        var key = storagePrefix + UTF8ToString(keyPtr);
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error("Storage delete error:", e);
        return false;
    }
}

// --- System Functions ---
function js_system_millis() {
    return Date.now();
}

function js_debug_print(messagePtr) {
    if (messagePtr) {
        var message = UTF8ToString(messagePtr);
        console.log("[MELD Node]", message);
        if (debugCallback) {
            debugCallback(message);
        }
    }
}

// --- NFC Write Function ---
function js_nfc_write_tag(dataPtr, length) {
    // This would integrate with Web NFC API in a real implementation
    console.log("NFC write requested:", length, "bytes");
    return true;
} 