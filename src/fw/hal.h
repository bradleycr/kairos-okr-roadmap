// --- MELD Node Hardware Abstraction Layer ---
// Works identically in WebAssembly simulation and on real ESP32-S3
// Ensures bit-exact behavior between browser and hardware

#pragma once

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// --- Display Functions ---
#define DISPLAY_WIDTH  296
#define DISPLAY_HEIGHT 296

/**
 * Initialize the e-paper display
 */
void display_init();

/**
 * Clear the display buffer (set to white)
 */
void display_clear();

/**
 * Set a pixel in the display buffer
 * @param x X coordinate (0-295)
 * @param y Y coordinate (0-295) 
 * @param black true for black pixel, false for white
 */
void display_set_pixel(uint16_t x, uint16_t y, bool black);

/**
 * Draw text at position
 * @param x X coordinate
 * @param y Y coordinate
 * @param text Text to draw
 * @param size Text size (1-4)
 */
void display_draw_text(uint16_t x, uint16_t y, const char* text, uint8_t size);

/**
 * Update display with current buffer contents
 * @param partial true for partial update (faster), false for full refresh
 */
void display_update(bool partial);

// --- NFC Functions ---
typedef struct {
    uint8_t uid[7];      // NFC tag UID (up to 7 bytes)
    uint8_t uid_length;  // Actual UID length
    uint8_t ndef[512];   // NDEF payload
    uint16_t ndef_length; // NDEF payload length
    uint64_t timestamp;   // When tag was detected
} nfc_tag_t;

/**
 * Initialize NFC reader
 */
void nfc_init();

/**
 * Check if NFC tag is present
 * @return true if tag detected
 */
bool nfc_tag_present();

/**
 * Get UID of current tag
 * @param out Buffer to store UID (min 7 bytes)
 * @return Length of UID, or 0 if no tag
 */
int nfc_get_uid(uint8_t* out);

/**
 * Read NDEF record from current tag
 * @param out Buffer to store NDEF data (min 512 bytes)
 * @return Length of NDEF data, or 0 if error
 */
int nfc_read_ndef(uint8_t* out);

/**
 * Write NDEF record to current tag
 * @param buf NDEF data to write
 * @param len Length of NDEF data
 * @return true if successful
 */
bool nfc_write_ndef(const uint8_t* buf, int len);

// --- Touch Functions ---
typedef struct {
    uint16_t x;         // X coordinate
    uint16_t y;         // Y coordinate
    uint8_t type;       // 0=touch_down, 1=touch_move, 2=touch_up
    uint64_t timestamp; // Timestamp in milliseconds
} touch_event_t;

/**
 * Initialize touch controller
 */
void touch_init();

/**
 * Read next touch event
 * @param out Pointer to store touch event
 * @return true if event available
 */
bool touch_read(touch_event_t* out);

// --- System Functions ---
/**
 * Get current timestamp in milliseconds
 */
uint64_t system_millis();

/**
 * Delay execution
 * @param ms Milliseconds to delay
 */
void system_delay(uint32_t ms);

/**
 * Print debug message
 * @param message Message to print
 */
void debug_print(const char* message);

/**
 * Print debug message with formatting
 * @param format Printf-style format string
 * @param ... Arguments for format string
 */
void debug_printf(const char* format, ...);

// --- LED Functions ---
/**
 * Set onboard LED state
 * @param on true to turn on, false to turn off
 */
void led_set(bool on);

/**
 * Blink LED
 * @param times Number of blinks
 * @param delay_ms Delay between blinks
 */
void led_blink(int times, int delay_ms);

// --- Buzzer Functions ---
/**
 * Play tone on buzzer
 * @param frequency Frequency in Hz
 * @param duration Duration in milliseconds
 */
void buzzer_tone(uint16_t frequency, uint16_t duration);

/**
 * Play success sound
 */
void buzzer_success();

/**
 * Play error sound
 */
void buzzer_error();

// --- Memory Functions ---
/**
 * Save data to persistent storage
 * @param key Storage key
 * @param data Data to save
 * @param length Data length
 * @return true if successful
 */
bool storage_save(const char* key, const uint8_t* data, uint16_t length);

/**
 * Load data from persistent storage
 * @param key Storage key
 * @param data Buffer to load data into
 * @param max_length Maximum buffer size
 * @return Length of loaded data, or 0 if not found
 */
uint16_t storage_load(const char* key, uint8_t* data, uint16_t max_length);

/**
 * Delete data from persistent storage
 * @param key Storage key
 * @return true if successful
 */
bool storage_delete(const char* key);

#ifdef __cplusplus
}
#endif 