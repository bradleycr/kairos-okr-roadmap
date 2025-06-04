// --- WebAssembly HAL Implementation ---
// Provides the same HAL interface as ESP32 but uses browser APIs
// Ensures bit-exact behavior between WebAssembly and real hardware

#include "../fw/hal.h"
#include <emscripten.h>
#include <emscripten/html5.h>
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <stdlib.h>
#include <queue>
#include <map>

// --- JavaScript Interface ---
extern "C" {
    // Display functions exposed to C++
    EMSCRIPTEN_KEEPALIVE void js_display_clear();
    EMSCRIPTEN_KEEPALIVE void js_display_set_pixel(uint16_t x, uint16_t y, bool black);
    EMSCRIPTEN_KEEPALIVE void js_display_draw_text(uint16_t x, uint16_t y, const char* text, uint8_t size);
    EMSCRIPTEN_KEEPALIVE void js_display_update(bool partial);
    
    // Touch functions
    EMSCRIPTEN_KEEPALIVE void js_touch_push_event(uint16_t x, uint16_t y, uint8_t type, uint64_t timestamp);
    
    // NFC functions
    EMSCRIPTEN_KEEPALIVE void js_nfc_push_tag(const uint8_t* uid, uint8_t uid_length, 
                                              const uint8_t* ndef, uint16_t ndef_length);
    EMSCRIPTEN_KEEPALIVE bool js_nfc_write_tag(const uint8_t* ndef, uint16_t length);
    
    // LED/Buzzer feedback
    EMSCRIPTEN_KEEPALIVE void js_led_set(bool on);
    EMSCRIPTEN_KEEPALIVE void js_buzzer_tone(uint16_t frequency, uint16_t duration);
    
    // Storage functions
    EMSCRIPTEN_KEEPALIVE bool js_storage_save(const char* key, const uint8_t* data, uint16_t length);
    EMSCRIPTEN_KEEPALIVE uint16_t js_storage_load(const char* key, uint8_t* data, uint16_t max_length);
    EMSCRIPTEN_KEEPALIVE bool js_storage_delete(const char* key);
    
    // System functions
    EMSCRIPTEN_KEEPALIVE uint64_t js_system_millis();
    EMSCRIPTEN_KEEPALIVE void js_debug_print(const char* message);
}

// --- Global State ---
static std::queue<touch_event_t> touch_queue;
static std::queue<nfc_tag_t> nfc_queue;
static bool display_initialized = false;
static bool nfc_initialized = false;
static bool touch_initialized = false;

// --- Display Functions ---
void display_init() {
    display_initialized = true;
    js_display_clear();
    debug_print("Display initialized (WebAssembly)");
}

void display_clear() {
    if (!display_initialized) return;
    js_display_clear();
}

void display_set_pixel(uint16_t x, uint16_t y, bool black) {
    if (!display_initialized) return;
    if (x >= DISPLAY_WIDTH || y >= DISPLAY_HEIGHT) return;
    js_display_set_pixel(x, y, black);
}

void display_draw_text(uint16_t x, uint16_t y, const char* text, uint8_t size) {
    if (!display_initialized || !text) return;
    js_display_draw_text(x, y, text, size);
}

void display_update(bool partial) {
    if (!display_initialized) return;
    js_display_update(partial);
}

// --- NFC Functions ---
void nfc_init() {
    nfc_initialized = true;
    debug_print("NFC initialized (WebAssembly)");
}

bool nfc_tag_present() {
    return !nfc_queue.empty();
}

int nfc_get_uid(uint8_t* out) {
    if (!nfc_initialized || !out || nfc_queue.empty()) return 0;
    
    const nfc_tag_t& tag = nfc_queue.front();
    memcpy(out, tag.uid, tag.uid_length);
    return tag.uid_length;
}

int nfc_read_ndef(uint8_t* out) {
    if (!nfc_initialized || !out || nfc_queue.empty()) return 0;
    
    const nfc_tag_t& tag = nfc_queue.front();
    memcpy(out, tag.ndef, tag.ndef_length);
    return tag.ndef_length;
}

bool nfc_write_ndef(const uint8_t* buf, int len) {
    if (!nfc_initialized || !buf || len <= 0) return false;
    return js_nfc_write_tag(buf, len);
}

// --- Touch Functions ---
void touch_init() {
    touch_initialized = true;
    debug_print("Touch initialized (WebAssembly)");
}

bool touch_read(touch_event_t* out) {
    if (!touch_initialized || !out || touch_queue.empty()) return false;
    
    *out = touch_queue.front();
    touch_queue.pop();
    return true;
}

// --- System Functions ---
uint64_t system_millis() {
    return js_system_millis();
}

void system_delay(uint32_t ms) {
    // In WebAssembly, we can't block the main thread
    // This is handled by the main loop timing instead
    emscripten_sleep(ms);
}

void debug_print(const char* message) {
    if (message) {
        js_debug_print(message);
    }
}

void debug_printf(const char* format, ...) {
    if (!format) return;
    
    char buffer[512];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    
    debug_print(buffer);
}

// --- LED Functions ---
void led_set(bool on) {
    js_led_set(on);
}

void led_blink(int times, int delay_ms) {
    // Schedule blinks using emscripten async
    for (int i = 0; i < times; i++) {
        emscripten_async_call([](void* arg) {
            int* params = (int*)arg;
            int blink_num = params[0];
            int delay = params[1];
            
            js_led_set(true);
            emscripten_async_call([](void* arg) {
                js_led_set(false);
                free(arg);
            }, arg, delay);
        }, new int[2]{i, delay_ms}, i * delay_ms * 2);
    }
}

// --- Buzzer Functions ---
void buzzer_tone(uint16_t frequency, uint16_t duration) {
    js_buzzer_tone(frequency, duration);
}

void buzzer_success() {
    buzzer_tone(1000, 100);
    system_delay(120);
    buzzer_tone(1200, 100);
    system_delay(120);
    buzzer_tone(1400, 150);
}

void buzzer_error() {
    buzzer_tone(400, 300);
    system_delay(350);
    buzzer_tone(300, 300);
}

// --- Memory Functions ---
bool storage_save(const char* key, const uint8_t* data, uint16_t length) {
    if (!key || !data || length == 0) return false;
    return js_storage_save(key, data, length);
}

uint16_t storage_load(const char* key, uint8_t* data, uint16_t max_length) {
    if (!key || !data || max_length == 0) return 0;
    return js_storage_load(key, data, max_length);
}

bool storage_delete(const char* key) {
    if (!key) return false;
    return js_storage_delete(key);
}

// --- JavaScript Callback Functions ---
// These are called from JavaScript to push events into the C++ side

extern "C" {
    EMSCRIPTEN_KEEPALIVE void wasm_touch_event(uint16_t x, uint16_t y, uint8_t type, uint64_t timestamp) {
        if (!touch_initialized) return;
        
        touch_event_t event;
        event.x = x;
        event.y = y;
        event.type = type;
        event.timestamp = timestamp;
        
        touch_queue.push(event);
        
        // Limit queue size to prevent memory issues
        while (touch_queue.size() > 10) {
            touch_queue.pop();
        }
    }
    
    EMSCRIPTEN_KEEPALIVE void wasm_nfc_tag(const uint8_t* uid, uint8_t uid_length, 
                                           const uint8_t* ndef, uint16_t ndef_length) {
        if (!nfc_initialized) return;
        
        nfc_tag_t tag;
        tag.uid_length = uid_length < 7 ? uid_length : 7;
        memcpy(tag.uid, uid, tag.uid_length);
        
        tag.ndef_length = ndef_length < 512 ? ndef_length : 512;
        memcpy(tag.ndef, ndef, tag.ndef_length);
        
        tag.timestamp = system_millis();
        
        // Replace any existing tag (simulate single tag detection)
        while (!nfc_queue.empty()) {
            nfc_queue.pop();
        }
        nfc_queue.push(tag);
    }
    
    EMSCRIPTEN_KEEPALIVE void wasm_nfc_tag_removed() {
        // Clear NFC queue when tag is removed
        while (!nfc_queue.empty()) {
            nfc_queue.pop();
        }
    }
} 