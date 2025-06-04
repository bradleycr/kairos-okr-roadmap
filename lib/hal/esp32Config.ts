/**
 * ESP32 Configuration for MELD Crypto Identity + NFC System
 * Optimized for e-paper displays and low-power operation
 * Removes emoji authentication in favor of cryptographic security
 */

export interface ESP32Config {
  // Hardware Configuration
  hardware: {
    // NFC Module (PN532 recommended)
    nfc: {
      spi_cs: number
      spi_clk: number
      spi_mosi: number
      spi_miso: number
      irq_pin: number
      reset_pin: number
    }
    
    // E-paper Display (296x296 square display for optimal readability)
    epaper: {
      cs_pin: number
      dc_pin: number
      rst_pin: number
      busy_pin: number
      width: number
      height: number
      type: 'bw' | 'red' | 'yellow' // Black/white, Red, or Yellow
    }
    
    // Audio feedback (buzzer for interaction confirmation)
    buzzer: {
      pin: number
      enabled: boolean
    }
    
    // Power management
    power: {
      enable_deep_sleep: boolean
      sleep_timeout_ms: number
      wake_on_nfc: boolean
    }
  }
  
  // Cryptographic Configuration
  crypto: {
    // Ed25519 signature verification
    signature_algorithm: 'Ed25519'
    
    // Hash algorithm for moments
    hash_algorithm: 'SHA256'
    
    // Maximum signature verification time (ms)
    max_verification_time: number
    
    // Store encrypted moments locally
    local_storage_encrypted: boolean
    
    // Maximum stored moments before cleanup
    max_stored_moments: number
  }
  
  // Network Configuration
  network: {
    wifi_ssid?: string
    wifi_password?: string
    
    // Mesh networking for offline operation
    mesh_enabled: boolean
    mesh_prefix: string
    mesh_password: string
    
    // IPFS integration for distributed storage
    ipfs_enabled: boolean
    ipfs_node_url?: string
    
    // NFC Account Sync
    nfc_sync_enabled: boolean
    platform_api_url: string
    sync_interval_ms: number
    offline_mode: boolean
    cache_accounts_locally: boolean
    max_cached_accounts: number
  }
  
  // Display Configuration
  display: {
    // Font configuration optimized for e-paper
    fonts: {
      mono_font: string
      bold_font: string
      icon_font: string
    }
    
    // Screen layouts
    layouts: {
      idle_screen: EpaperLayout
      nfc_detection: EpaperLayout
      crypto_auth: EpaperLayout
      ritual_execution: EpaperLayout
      success_screen: EpaperLayout
      error_screen: EpaperLayout
    }
    
    // Refresh configuration
    refresh: {
      full_refresh_interval: number // Full e-paper refresh cycles
      partial_refresh_enabled: boolean
      invert_on_tap: boolean
    }
  }
  
  // Ritual Configuration
  rituals: {
    default_ritual_id: string
    max_rituals: number
    auto_execute: boolean
    
    // Supported behaviors (ESP32 optimized)
    supported_behaviors: RitualBehavior[]
  }
}

export interface EpaperLayout {
  title: {
    text: string
    x: number
    y: number
    font_size: number
  }
  content: {
    x: number
    y: number
    width: number
    height: number
    font_size: number
    alignment: 'left' | 'center' | 'right'
  }
  status_bar: {
    show_battery: boolean
    show_wifi: boolean
    show_time: boolean
    height: number
  }
  animations: {
    enabled: boolean
    type: 'none' | 'fade' | 'slide' | 'invert'
    duration_ms: number
  }
}

export type RitualBehavior = 
  | 'save_moment'
  | 'increment_counter' 
  | 'trigger_light'
  | 'play_sound'
  | 'send_signal'
  | 'log_interaction'

// Default ESP32 Configuration
export const DEFAULT_ESP32_CONFIG: ESP32Config = {
  hardware: {
    nfc: {
      spi_cs: 5,
      spi_clk: 18,
      spi_mosi: 23,
      spi_miso: 19,
      irq_pin: 4,
      reset_pin: 2
    },
    epaper: {
      cs_pin: 15,
      dc_pin: 27,
      rst_pin: 26,
      busy_pin: 25,
      width: 296,
      height: 296,
      type: 'bw'
    },
    buzzer: {
      pin: 22,
      enabled: true
    },
    power: {
      enable_deep_sleep: true,
      sleep_timeout_ms: 30000, // 30 seconds
      wake_on_nfc: true
    }
  },
  
  crypto: {
    signature_algorithm: 'Ed25519',
    hash_algorithm: 'SHA256',
    max_verification_time: 200, // 200ms for Ed25519 verification
    local_storage_encrypted: true,
    max_stored_moments: 1000
  },
  
  network: {
    mesh_enabled: true,
    mesh_prefix: 'MELD_MESH',
    mesh_password: 'meld_secure_2024',
    ipfs_enabled: false,
    nfc_sync_enabled: true,
    platform_api_url: 'https://api.meld.com',
    sync_interval_ms: 60000, // 1 minute
    offline_mode: true,
    cache_accounts_locally: true,
    max_cached_accounts: 100
  },
  
  display: {
    fonts: {
      mono_font: 'DejaVu_Sans_Mono_8',
      bold_font: 'DejaVu_Sans_Mono_Bold_12',
      icon_font: 'FontAwesome_16'
    },
    
    layouts: {
      idle_screen: {
        title: {
          text: 'MELD',
          x: 148,
          y: 30,
          font_size: 24
        },
        content: {
          x: 10,
          y: 50,
          width: 276,
          height: 60,
          font_size: 12,
          alignment: 'center'
        },
        status_bar: {
          show_battery: true,
          show_wifi: true,
          show_time: false,
          height: 16
        },
        animations: {
          enabled: true,
          type: 'invert',
          duration_ms: 500
        }
      },
      
      nfc_detection: {
        title: {
          text: 'NFC Detection',
          x: 148,
          y: 25,
          font_size: 16
        },
        content: {
          x: 10,
          y: 45,
          width: 276,
          height: 65,
          font_size: 12,
          alignment: 'center'
        },
        status_bar: {
          show_battery: false,
          show_wifi: false,
          show_time: false,
          height: 0
        },
        animations: {
          enabled: true,
          type: 'fade',
          duration_ms: 300
        }
      },
      
      crypto_auth: {
        title: {
          text: 'Crypto Auth',
          x: 148,
          y: 25,
          font_size: 16
        },
        content: {
          x: 10,
          y: 45,
          width: 276,
          height: 65,
          font_size: 12,
          alignment: 'center'
        },
        status_bar: {
          show_battery: false,
          show_wifi: false,
          show_time: false,
          height: 0
        },
        animations: {
          enabled: true,
          type: 'invert',
          duration_ms: 200
        }
      },
      
      ritual_execution: {
        title: {
          text: 'Executing',
          x: 148,
          y: 25,
          font_size: 16
        },
        content: {
          x: 10,
          y: 45,
          width: 276,
          height: 65,
          font_size: 12,
          alignment: 'center'
        },
        status_bar: {
          show_battery: false,
          show_wifi: false,
          show_time: false,
          height: 0
        },
        animations: {
          enabled: true,
          type: 'slide',
          duration_ms: 400
        }
      },
      
      success_screen: {
        title: {
          text: 'Success!',
          x: 148,
          y: 25,
          font_size: 18
        },
        content: {
          x: 10,
          y: 50,
          width: 276,
          height: 60,
          font_size: 14,
          alignment: 'center'
        },
        status_bar: {
          show_battery: false,
          show_wifi: false,
          show_time: false,
          height: 0
        },
        animations: {
          enabled: true,
          type: 'invert',
          duration_ms: 800
        }
      },
      
      error_screen: {
        title: {
          text: 'Error',
          x: 148,
          y: 25,
          font_size: 16
        },
        content: {
          x: 10,
          y: 45,
          width: 276,
          height: 65,
          font_size: 12,
          alignment: 'center'
        },
        status_bar: {
          show_battery: false,
          show_wifi: false,
          show_time: false,
          height: 0
        },
        animations: {
          enabled: false,
          type: 'none',
          duration_ms: 0
        }
      }
    },
    
    refresh: {
      full_refresh_interval: 10, // Every 10 interactions
      partial_refresh_enabled: true,
      invert_on_tap: true
    }
  },
  
  rituals: {
    default_ritual_id: 'default-crypto-moments',
    max_rituals: 5,
    auto_execute: true,
    supported_behaviors: [
      'save_moment',
      'increment_counter',
      'trigger_light',
      'play_sound',
      'send_signal',
      'log_interaction'
    ]
  }
}

/**
 * Generate Arduino sketch code for ESP32
 */
export function generateESP32Sketch(config: ESP32Config): string {
  return `
// MELD ESP32 Crypto Identity + NFC System
// Generated configuration
// Optimized for e-paper displays and cryptographic authentication

#include <WiFi.h>
#include <SPI.h>
#include <PN532_SPI.h>
#include <PN532.h>
#include <NfcAdapter.h>
#include <GxEPD2_BW.h>
#include <Ed25519.h>
#include <SHA256.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// Hardware Configuration
#define NFC_CS_PIN      ${config.hardware.nfc.spi_cs}
#define NFC_IRQ_PIN     ${config.hardware.nfc.irq_pin}
#define NFC_RESET_PIN   ${config.hardware.nfc.reset_pin}

#define EPAPER_CS_PIN   ${config.hardware.epaper.cs_pin}
#define EPAPER_DC_PIN   ${config.hardware.epaper.dc_pin}
#define EPAPER_RST_PIN  ${config.hardware.epaper.rst_pin}
#define EPAPER_BUSY_PIN ${config.hardware.epaper.busy_pin}

// Crypto Configuration
#define MAX_VERIFICATION_TIME ${config.crypto.max_verification_time}
#define MAX_STORED_MOMENTS    ${config.crypto.max_stored_moments}

// Network Configuration
const char* MESH_PREFIX = "${config.network.mesh_prefix}";
const char* MESH_PASSWORD = "${config.network.mesh_password}";
const unsigned long SYNC_INTERVAL = ${config.network.sync_interval_ms};

// Initialize hardware
PN532_SPI pn532spi(SPI, NFC_CS_PIN);
PN532 nfc(pn532spi);
GxEPD2_BW<GxEPD2_290_T5D, GxEPD2_290_T5D::HEIGHT> display(GxEPD2_290_T5D(EPAPER_CS_PIN, EPAPER_DC_PIN, EPAPER_RST_PIN, EPAPER_BUSY_PIN));
Preferences preferences;

// State management
enum SystemState {
  IDLE,
  NFC_DETECTION,
  CRYPTO_AUTH,
  RITUAL_EXECUTION,
  SUCCESS,
  ERROR
};

SystemState currentState = IDLE;
unsigned long lastActivity = 0;
bool deepSleepEnabled = ${config.hardware.power.enable_deep_sleep ? 'true' : 'false'};
unsigned long sleepTimeout = ${config.hardware.power.sleep_timeout_ms};

// Cryptographic functions
bool verifyEd25519Signature(uint8_t* publicKey, uint8_t* signature, uint8_t* message, size_t messageLen) {
  // ESP32-optimized Ed25519 verification
  // Returns true if signature is valid
  
  // Audio feedback for crypto operations
  tone(BUZZER_PIN, 1000, 100);
  
  // Implement Ed25519 verification here
  bool isValid = Ed25519::verify(signature, publicKey, message, messageLen);
  
  return isValid;
}

// NFC pendant detection and authentication
bool authenticatePendant() {
  // Audio feedback for NFC activity
  tone(BUZZER_PIN, 800, 50);
  
  uint8_t uid[7];
  uint8_t uidLength;
  
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
    // Read pendant data
    uint8_t pendantData[256];
    if (readPendantData(uid, uidLength, pendantData)) {
      // Extract public key and signature
      uint8_t publicKey[32];
      uint8_t signature[64];
      uint8_t message[128];
      
      // Parse pendant data (implement based on your protocol)
      if (parsePendantData(pendantData, publicKey, signature, message)) {
        // Verify cryptographic signature
        if (verifyEd25519Signature(publicKey, signature, message, strlen((char*)message))) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// E-paper display functions
void updateDisplay(SystemState state, const char* message) {
  display.setRotation(1);
  display.setFont(&FreeMonoBold12pt7b);
  display.setTextColor(GxEPD_BLACK);
  
  display.firstPage();
  do {
    display.fillScreen(GxEPD_WHITE);
    
    // Title based on state
    switch(state) {
      case IDLE:
        display.setCursor(${config.display.layouts.idle_screen.title.x}, ${config.display.layouts.idle_screen.title.y});
        display.print("${config.display.layouts.idle_screen.title.text}");
        break;
      case NFC_DETECTION:
        display.setCursor(${config.display.layouts.nfc_detection.title.x}, ${config.display.layouts.nfc_detection.title.y});
        display.print("${config.display.layouts.nfc_detection.title.text}");
        break;
      case CRYPTO_AUTH:
        display.setCursor(${config.display.layouts.crypto_auth.title.x}, ${config.display.layouts.crypto_auth.title.y});
        display.print("${config.display.layouts.crypto_auth.title.text}");
        break;
      case RITUAL_EXECUTION:
        display.setCursor(${config.display.layouts.ritual_execution.title.x}, ${config.display.layouts.ritual_execution.title.y});
        display.print("${config.display.layouts.ritual_execution.title.text}");
        break;
      case SUCCESS:
        display.setCursor(${config.display.layouts.success_screen.title.x}, ${config.display.layouts.success_screen.title.y});
        display.print("${config.display.layouts.success_screen.title.text}");
        break;
      case ERROR:
        display.setCursor(${config.display.layouts.error_screen.title.x}, ${config.display.layouts.error_screen.title.y});
        display.print("${config.display.layouts.error_screen.title.text}");
        break;
    }
    
    // Content message
    display.setFont(&FreeMono9pt7b);
    display.setCursor(${config.display.layouts.idle_screen.content.x}, ${config.display.layouts.idle_screen.content.y});
    display.print(message);
    
  } while (display.nextPage());
}

// Main setup
void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_NFC, OUTPUT);
  pinMode(LED_CRYPTO, OUTPUT);
  pinMode(LED_NETWORK, OUTPUT);
  
  // Initialize NFC
  nfc.begin();
  nfc.SAMConfig();
  
  // Initialize e-paper display
  display.init(115200);
  display.setRotation(1);
  
  // Initialize preferences
  preferences.begin("meld", false);
  
  // Show ready screen
  updateDisplay(IDLE, "Ready for NFC tap\\nSecure crypto auth");
  
  Serial.println("MELD ESP32 Crypto Identity System Ready");
}

// Main loop
void loop() {
  switch(currentState) {
    case IDLE:
      if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength)) {
        currentState = NFC_DETECTION;
        updateDisplay(NFC_DETECTION, "NFC pendant detected\\nVerifying identity...");
        lastActivity = millis();
      }
      
      // Check for sleep timeout
      if (deepSleepEnabled && (millis() - lastActivity > sleepTimeout)) {
        enterDeepSleep();
      }
      break;
      
    case NFC_DETECTION:
      currentState = CRYPTO_AUTH;
      updateDisplay(CRYPTO_AUTH, "Verifying Ed25519\\nsignature...");
      break;
      
    case CRYPTO_AUTH:
      if (authenticatePendant()) {
        currentState = RITUAL_EXECUTION;
        updateDisplay(RITUAL_EXECUTION, "Authentication success\\nExecuting ritual...");
      } else {
        currentState = ERROR;
        updateDisplay(ERROR, "Authentication failed\\nInvalid signature");
      }
      break;
      
    case RITUAL_EXECUTION:
      // Execute configured ritual behavior
      executeRitual();
      currentState = SUCCESS;
      updateDisplay(SUCCESS, "ZK Moment saved\\nsecurely!");
      break;
      
    case SUCCESS:
      delay(2000);
      currentState = IDLE;
      updateDisplay(IDLE, "Ready for next\\ninteraction");
      lastActivity = millis();
      break;
      
    case ERROR:
      delay(2000);
      currentState = IDLE;
      updateDisplay(IDLE, "Ready for NFC tap\\nSecure crypto auth");
      lastActivity = millis();
      break;
  }
  
  delay(100); // Small delay for stability
}

// Implement additional functions
bool readPendantData(uint8_t* uid, uint8_t uidLength, uint8_t* data) {
  // Implement NFC data reading
  return true;
}

bool parsePendantData(uint8_t* data, uint8_t* publicKey, uint8_t* signature, uint8_t* message) {
  // Implement pendant data parsing
  return true;
}

void executeRitual() {
  // Implement ritual execution based on configuration
  // Save moment with timestamp and cryptographic proof
  
  StaticJsonDocument<200> moment;
  moment["timestamp"] = millis();
  moment["node_id"] = "esp32_node_001";
  moment["behavior"] = "save_moment";
  moment["encrypted"] = ${config.crypto.local_storage_encrypted ? 'true' : 'false'};
  
  // Store moment in preferences
  String momentStr;
  serializeJson(moment, momentStr);
  
  int momentCount = preferences.getInt("moment_count", 0);
  String key = "moment_" + String(momentCount);
  preferences.putString(key.c_str(), momentStr);
  preferences.putInt("moment_count", momentCount + 1);
}

void enterDeepSleep() {
  // Configure wake up source
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_${config.hardware.nfc.irq_pin}, 0);
  
  // Show sleep message
  updateDisplay(IDLE, "Entering sleep mode\\nTap to wake");
  
  // Enter deep sleep
  esp_deep_sleep_start();
}
`.trim()
}

/**
 * Generate configuration validation
 */
export function validateESP32Config(config: ESP32Config): string[] {
  const errors: string[] = []
  
  // Validate pin assignments
  const usedPins = new Set([
    config.hardware.nfc.spi_cs,
    config.hardware.nfc.irq_pin,
    config.hardware.nfc.reset_pin,
    config.hardware.epaper.cs_pin,
    config.hardware.epaper.dc_pin,
    config.hardware.epaper.rst_pin,
    config.hardware.epaper.busy_pin,
    config.hardware.buzzer.pin
  ])
  
  if (usedPins.size !== 8) {
    errors.push('Pin conflict detected - each pin must be unique')
  }
  
  // Validate timing constraints
  if (config.crypto.max_verification_time > 1000) {
    errors.push('Crypto verification time too long for real-time interaction')
  }
  
  if (config.hardware.power.sleep_timeout_ms < 5000) {
    errors.push('Sleep timeout too short - may cause unexpected sleeps')
  }
  
  return errors
} 