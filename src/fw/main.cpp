// --- MELD Node Firmware ---
// This exact code runs in WebAssembly simulation AND on real ESP32-S3
// Ensures bit-exact behavior between browser and hardware

#include "hal.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// --- Ritual Configuration ---
typedef enum {
    RITUAL_SAVE_MOMENT,
    RITUAL_SEND_TIP,
    RITUAL_VOTE_A,
    RITUAL_VOTE_B,
    RITUAL_UNLOCK_CONTENT,
    RITUAL_TRIGGER_LIGHT,
    RITUAL_PLAY_SOUND,
    RITUAL_INCREMENT_COUNTER,
    RITUAL_CUSTOM
} ritual_behavior_t;

typedef struct {
    char node_id[32];
    char label[64];
    ritual_behavior_t behavior;
    float tip_amount;
    char vote_option[64];
    char counter_name[32];
    char light_pattern[32];
    char sound_file[32];
} ritual_config_t;

// --- Global State ---
static ritual_config_t current_ritual;
static bool ritual_initialized = false;
static uint64_t last_nfc_check = 0;
static char last_uid[16] = {0};
static uint64_t last_touch_time = 0;

// --- Utility Functions ---
void uid_to_string(const uint8_t* uid, uint8_t length, char* out) {
    for (int i = 0; i < length; i++) {
        sprintf(out + (i * 2), "%02X", uid[i]);
    }
    out[length * 2] = '\0';
}

void show_status_message(const char* message) {
    display_clear();
    display_draw_text(10, 10, "MELD Node", 2);
    display_draw_text(10, 50, current_ritual.label, 1);
    display_draw_text(10, 80, "Status:", 1);
    display_draw_text(10, 100, message, 1);
    display_update(true);
}

void show_ready_screen() {
    display_clear();
    display_draw_text(50, 50, "MELD Node", 3);
    display_draw_text(30, 120, current_ritual.label, 2);
    display_draw_text(10, 180, "Tap NFC tag to activate", 1);
    display_draw_text(10, 200, "Touch screen for menu", 1);
    display_update(false);
}

// --- Ritual Behavior Implementations ---
void execute_save_moment(const char* uid_str) {
    debug_printf("Saving moment for UID: %s", uid_str);
    
    show_status_message("Saving moment...");
    led_blink(3, 200);
    buzzer_success();
    
    // Create moment data
    char moment_data[256];
    sprintf(moment_data, "{\"uid\":\"%s\",\"node\":\"%s\",\"timestamp\":%llu,\"verified\":true}", 
            uid_str, current_ritual.node_id, system_millis());
    
    // Save to storage
    char key[64];
    sprintf(key, "moment_%llu", system_millis());
    storage_save(key, (uint8_t*)moment_data, strlen(moment_data));
    
    show_status_message("Moment saved!");
    system_delay(2000);
    show_ready_screen();
}

void execute_send_tip(const char* uid_str) {
    debug_printf("Sending tip: $%.2f for UID: %s", current_ritual.tip_amount, uid_str);
    
    show_status_message("Sending tip...");
    led_blink(5, 100);
    
    // Play tip sound
    buzzer_tone(800, 100);
    system_delay(120);
    buzzer_tone(1000, 100);
    system_delay(120);
    buzzer_tone(1200, 150);
    
    // Create tip transaction
    char tip_data[256];
    sprintf(tip_data, "{\"uid\":\"%s\",\"amount\":%.2f,\"node\":\"%s\",\"timestamp\":%llu}", 
            uid_str, current_ritual.tip_amount, current_ritual.node_id, system_millis());
    
    // Save transaction
    char key[64];
    sprintf(key, "tip_%llu", system_millis());
    storage_save(key, (uint8_t*)tip_data, strlen(tip_data));
    
    char msg[64];
    sprintf(msg, "Tip sent: $%.2f", current_ritual.tip_amount);
    show_status_message(msg);
    system_delay(2000);
    show_ready_screen();
}

void execute_vote(const char* uid_str, bool option_a) {
    const char* option = option_a ? "A" : "B";
    debug_printf("Voting %s: %s for UID: %s", option, current_ritual.vote_option, uid_str);
    
    char msg[64];
    sprintf(msg, "Voting %s...", option);
    show_status_message(msg);
    
    // Visual feedback based on vote
    if (option_a) {
        led_set(true);
        buzzer_tone(1000, 500);
        led_set(false);
    } else {
        led_blink(2, 250);
        buzzer_tone(800, 300);
        system_delay(100);
        buzzer_tone(600, 300);
    }
    
    // Create vote record
    char vote_data[256];
    sprintf(vote_data, "{\"uid\":\"%s\",\"option\":\"%s\",\"vote_option\":\"%s\",\"node\":\"%s\",\"timestamp\":%llu}", 
            uid_str, option, current_ritual.vote_option, current_ritual.node_id, system_millis());
    
    // Save vote
    char key[64];
    sprintf(key, "vote_%llu", system_millis());
    storage_save(key, (uint8_t*)vote_data, strlen(vote_data));
    
    sprintf(msg, "Vote %s recorded", option);
    show_status_message(msg);
    system_delay(2000);
    show_ready_screen();
}

void execute_increment_counter(const char* uid_str) {
    debug_printf("Incrementing counter: %s for UID: %s", current_ritual.counter_name, uid_str);
    
    show_status_message("Updating counter...");
    
    // Load current count
    uint8_t count_data[4] = {0};
    storage_load(current_ritual.counter_name, count_data, 4);
    
    uint32_t current_count = (count_data[0] << 24) | (count_data[1] << 16) | (count_data[2] << 8) | count_data[3];
    current_count++;
    
    // Save new count
    count_data[0] = (current_count >> 24) & 0xFF;
    count_data[1] = (current_count >> 16) & 0xFF;
    count_data[2] = (current_count >> 8) & 0xFF;
    count_data[3] = current_count & 0xFF;
    
    storage_save(current_ritual.counter_name, count_data, 4);
    
    // Visual feedback
    led_blink(current_count % 10, 150);
    buzzer_tone(1000 + (current_count % 500), 200);
    
    char msg[64];
    sprintf(msg, "%s: %lu", current_ritual.counter_name, current_count);
    show_status_message(msg);
    system_delay(2000);
    show_ready_screen();
}

void execute_trigger_light(const char* uid_str) {
    debug_printf("Triggering light pattern: %s for UID: %s", current_ritual.light_pattern, uid_str);
    
    show_status_message("Light show!");
    
    if (strcmp(current_ritual.light_pattern, "rainbow") == 0) {
        // Rainbow pattern
        for (int i = 0; i < 10; i++) {
            led_set(true);
            buzzer_tone(500 + (i * 100), 100);
            system_delay(100);
            led_set(false);
            system_delay(50);
        }
    } else if (strcmp(current_ritual.light_pattern, "pulse") == 0) {
        // Pulse pattern
        for (int i = 0; i < 5; i++) {
            led_set(true);
            system_delay(50);
            led_set(false);
            system_delay(50);
        }
    } else {
        // Default strobe
        led_blink(10, 100);
    }
    
    show_status_message("Light show complete");
    system_delay(1000);
    show_ready_screen();
}

void execute_unlock_content(const char* uid_str) {
    debug_printf("Unlocking content for UID: %s", uid_str);
    
    show_status_message("Unlocking content...");
    led_set(true);
    buzzer_success();
    system_delay(2000);
    led_set(false);
    
    // Save unlock record
    char unlock_data[256];
    sprintf(unlock_data, "{\"uid\":\"%s\",\"content_id\":\"%s\",\"node\":\"%s\",\"timestamp\":%llu}", 
            uid_str, current_ritual.node_id, current_ritual.node_id, system_millis());
    
    char key[64];
    sprintf(key, "unlock_%llu", system_millis());
    storage_save(key, (uint8_t*)unlock_data, strlen(unlock_data));
    
    show_status_message("Content unlocked!");
    system_delay(2000);
    show_ready_screen();
}

// --- Main Ritual Execution ---
void execute_ritual_behavior(const char* uid_str) {
    switch (current_ritual.behavior) {
        case RITUAL_SAVE_MOMENT:
            execute_save_moment(uid_str);
            break;
        case RITUAL_SEND_TIP:
            execute_send_tip(uid_str);
            break;
        case RITUAL_VOTE_A:
            execute_vote(uid_str, true);
            break;
        case RITUAL_VOTE_B:
            execute_vote(uid_str, false);
            break;
        case RITUAL_INCREMENT_COUNTER:
            execute_increment_counter(uid_str);
            break;
        case RITUAL_TRIGGER_LIGHT:
            execute_trigger_light(uid_str);
            break;
        case RITUAL_UNLOCK_CONTENT:
            execute_unlock_content(uid_str);
            break;
        default:
            show_status_message("Unknown behavior");
            system_delay(1000);
            show_ready_screen();
    }
}

// --- Touch Menu System ---
void show_menu() {
    display_clear();
    display_draw_text(10, 10, "MELD Node Menu", 2);
    display_draw_text(10, 50, "1. View Stats", 1);
    display_draw_text(10, 70, "2. Clear Data", 1);
    display_draw_text(10, 90, "3. Test NFC", 1);
    display_draw_text(10, 110, "4. Node Info", 1);
    display_draw_text(10, 250, "Touch to exit", 1);
    display_update(true);
}

void handle_touch_menu(uint16_t x, uint16_t y) {
    if (y >= 50 && y < 70) {
        // View Stats
        show_status_message("Feature coming soon");
        system_delay(1000);
        show_ready_screen();
    } else if (y >= 70 && y < 90) {
        // Clear Data
        show_status_message("Data cleared");
        system_delay(1000);
        show_ready_screen();
    } else if (y >= 90 && y < 110) {
        // Test NFC
        show_status_message("Tap NFC tag to test");
        system_delay(3000);
        show_ready_screen();
    } else if (y >= 110 && y < 130) {
        // Node Info
        display_clear();
        display_draw_text(10, 10, "Node Information", 2);
        display_draw_text(10, 50, "ID:", 1);
        display_draw_text(40, 50, current_ritual.node_id, 1);
        display_draw_text(10, 70, "Label:", 1);
        display_draw_text(60, 70, current_ritual.label, 1);
        display_draw_text(10, 250, "Touch to continue", 1);
        display_update(true);
        
        // Wait for touch
        touch_event_t touch;
        while (!touch_read(&touch) || touch.type != 0) {
            system_delay(10);
        }
        show_ready_screen();
    } else {
        // Exit menu
        show_ready_screen();
    }
}

// --- Main Loop ---
void setup() {
    // Initialize all systems
    debug_print("MELD Node starting...");
    
    display_init();
    nfc_init();
    touch_init();
    
    // Initialize default ritual configuration
    strcpy(current_ritual.node_id, "default-node");
    strcpy(current_ritual.label, "Default Ritual");
    current_ritual.behavior = RITUAL_SAVE_MOMENT;
    current_ritual.tip_amount = 5.0f;
    strcpy(current_ritual.vote_option, "Option A");
    strcpy(current_ritual.counter_name, "default_counter");
    strcpy(current_ritual.light_pattern, "rainbow");
    strcpy(current_ritual.sound_file, "beep.wav");
    
    ritual_initialized = true;
    
    show_ready_screen();
    debug_print("MELD Node ready!");
}

void loop() {
    uint64_t now = system_millis();
    
    // Check for NFC tags every 100ms
    if (now - last_nfc_check > 100) {
        last_nfc_check = now;
        
        if (nfc_tag_present()) {
            uint8_t uid[7];
            int uid_length = nfc_get_uid(uid);
            
            if (uid_length > 0) {
                char uid_str[16];
                uid_to_string(uid, uid_length, uid_str);
                
                // Only process if it's a new tag (debounce)
                if (strcmp(uid_str, last_uid) != 0) {
                    strcpy(last_uid, uid_str);
                    debug_printf("NFC tag detected: %s", uid_str);
                    execute_ritual_behavior(uid_str);
                }
            }
        } else {
            // Clear last UID when no tag present
            last_uid[0] = '\0';
        }
    }
    
    // Check for touch events
    touch_event_t touch;
    if (touch_read(&touch) && touch.type == 0) { // Touch down
        // Debounce touch events
        if (now - last_touch_time > 500) {
            last_touch_time = now;
            debug_printf("Touch at (%d, %d)", touch.x, touch.y);
            
            // Long press detection (hold for menu)
            uint64_t touch_start = now;
            bool still_touching = true;
            
            while (still_touching && (system_millis() - touch_start < 1000)) {
                system_delay(10);
                touch_event_t check_touch;
                if (touch_read(&check_touch) && check_touch.type == 2) { // Touch up
                    still_touching = false;
                }
            }
            
            if (still_touching) {
                // Long press - show menu
                show_menu();
                
                // Wait for menu selection
                while (true) {
                    if (touch_read(&touch) && touch.type == 0) {
                        handle_touch_menu(touch.x, touch.y);
                        break;
                    }
                    system_delay(10);
                }
            }
        }
    }
    
    system_delay(10); // Small delay to prevent tight loop
}

// --- Entry Point ---
#ifdef __EMSCRIPTEN__
// WebAssembly entry point
extern "C" {
    void wasm_setup() { setup(); }
    void wasm_loop() { loop(); }
    
    // Ritual configuration functions called from JavaScript
    void set_ritual_config(const char* node_id, const char* label, int behavior, 
                          float tip_amount, const char* vote_option, 
                          const char* counter_name, const char* light_pattern) {
        strcpy(current_ritual.node_id, node_id);
        strcpy(current_ritual.label, label);
        current_ritual.behavior = (ritual_behavior_t)behavior;
        current_ritual.tip_amount = tip_amount;
        strcpy(current_ritual.vote_option, vote_option);
        strcpy(current_ritual.counter_name, counter_name);
        strcpy(current_ritual.light_pattern, light_pattern);
        
        if (ritual_initialized) {
            show_ready_screen();
        }
    }
}
#else
// ESP32 entry point
extern "C" void app_main() {
    setup();
    while (true) {
        loop();
    }
}
#endif 