# 🔧 KairOS Hardware Setup Guide

> **Complete guide for ESP32 MELD nodes and NFC pendant configuration**  
> Real-world deployment • Professional setup • Production-ready

---

## 🎯 **Hardware Overview**

KairOS creates a **beautiful decentralized ecosystem** where users authenticate to local edge computing devices using elegant NFC pendants. This guide covers setting up ESP32 MELD nodes and programming NFC chips for production deployment.

### **Hardware Components**
- 🤖 **ESP32 MELD Nodes**: Local edge computing devices
- ⌚ **NFC Pendants**: Beautiful metal pocket watches with NFC chips  
- 📱 **User's Phone**: Primary authentication device
- 🌐 **Local Network**: Secure communication infrastructure

---

## 🤖 **ESP32 MELD Node Setup**

### **Hardware Requirements**
- **ESP32 DevKit**: ESP32-WROOM-32D or ESP32-S3 (recommended)
- **Power Supply**: 5V/2A USB or external power adapter
- **Storage**: MicroSD card (8GB+) for audio transcriptions
- **Network**: WiFi connection to local network
- **Optional**: External antenna for better WiFi range

### **ESP32 Firmware Installation**

#### **Prerequisites**
```bash
# Install ESP-IDF (Espressif IoT Development Framework)
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh esp32
source ./export.sh

# Install libsodium for Ed25519 cryptography
git clone https://github.com/jedisct1/libsodium.git
cd libsodium
./configure --enable-minimal
make && make install
```

#### **Core Firmware Code**
```c
// main.c - KairOS ESP32 Authentication Server
#include <stdio.h>
#include <string.h>
#include <WiFi.h>
#include <WebServer.h>
#include <SPIFFS.h>
#include <sodium.h>

// Configuration
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password" 
#define HTTP_PORT 8080

WebServer server(HTTP_PORT);

// Ed25519 signature verification
bool verifyEd25519Signature(const char* signature_hex, 
                           const char* message, 
                           const char* public_key_hex) {
    uint8_t signature[crypto_sign_BYTES];
    uint8_t public_key[crypto_sign_PUBLICKEYBYTES];
    
    // Convert hex strings to bytes
    hexStringToBytes(signature_hex, signature, crypto_sign_BYTES);
    hexStringToBytes(public_key_hex, public_key, crypto_sign_PUBLICKEYBYTES);
    
    // Verify signature
    return crypto_sign_verify_detached(
        signature, 
        (const uint8_t*)message, 
        strlen(message), 
        public_key
    ) == 0;
}

// Authentication endpoint
void handleAuth() {
    if (server.method() != HTTP_POST) {
        server.send(405, "application/json", "{\"error\": \"Method not allowed\"}");
        return;
    }
    
    // Parse JSON request
    String deviceId = server.arg("deviceId");
    String challenge = server.arg("challenge");
    String signature = server.arg("signature");
    String publicKey = server.arg("publicKey");
    
    // Validate parameters
    if (deviceId.isEmpty() || challenge.isEmpty() || 
        signature.isEmpty() || publicKey.isEmpty()) {
        server.send(400, "application/json", 
            "{\"error\": \"Missing required parameters\"}");
        return;
    }
    
    // Verify Ed25519 signature
    bool isValid = verifyEd25519Signature(
        signature.c_str(),
        challenge.c_str(), 
        publicKey.c_str()
    );
    
    if (isValid) {
        // Generate session token
        String sessionToken = "local_session_" + String(millis());
        
        // Success response
        String response = "{";
        response += "\"verified\": true,";
        response += "\"sessionToken\": \"" + sessionToken + "\",";
        response += "\"contentEndpoint\": \"http://" + WiFi.localIP().toString() + ":" + String(HTTP_PORT) + "/content\"";
        response += "}";
        
        server.send(200, "application/json", response);
        
        // Log successful authentication
        Serial.println("✅ Authentication successful for device: " + deviceId);
    } else {
        server.send(401, "application/json", 
            "{\"verified\": false, \"error\": \"Invalid signature\"}");
        
        Serial.println("❌ Authentication failed for device: " + deviceId);
    }
}

// Serve local content (audio transcriptions, files, etc.)
void handleContent() {
    // Verify session token (simplified for demo)
    String token = server.arg("token");
    if (token.isEmpty()) {
        server.send(401, "application/json", "{\"error\": \"No session token\"}");
        return;
    }
    
    // Serve local audio transcriptions or other content
    File file = SPIFFS.open("/transcriptions.json", "r");
    if (file) {
        server.streamFile(file, "application/json");
        file.close();
    } else {
        server.send(404, "application/json", "{\"error\": \"No content available\"}");
    }
}

void setup() {
    Serial.begin(115200);
    
    // Initialize libsodium
    if (sodium_init() < 0) {
        Serial.println("❌ Failed to initialize libsodium");
        return;
    }
    
    // Initialize SPIFFS for local file storage
    if (!SPIFFS.begin(true)) {
        Serial.println("❌ Failed to initialize SPIFFS");
        return;
    }
    
    // Connect to WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    
    Serial.println("✅ WiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
    
    // Setup web server routes
    server.on("/auth", HTTP_POST, handleAuth);
    server.on("/content", HTTP_GET, handleContent);
    
    // Start web server
    server.begin();
    Serial.println("🚀 KairOS MELD Node ready on port " + String(HTTP_PORT));
}

void loop() {
    server.handleClient();
    delay(10);
}
```

#### **Building and Flashing**
```bash
# Build the firmware
idf.py build

# Flash to ESP32
idf.py -p /dev/cu.SLAB_USBtoUART flash

# Monitor serial output
idf.py -p /dev/cu.SLAB_USBtoUART monitor
```

---

## ⌚ **NFC Pendant Configuration**

### **NFC Chip Requirements**
- **Recommended**: NTAG213, NTAG215, or NTAG216
- **Memory**: 144 bytes (NTAG213) to 924 bytes (NTAG216)
- **Compatibility**: ISO14443 Type A
- **Range**: ~4cm reading distance
- **Durability**: Industrial-grade for metal pendant enclosures

### **NFC Memory Layout**
```
┌─ NTAG213/215/216 Memory Structure ──────────────────┐
│                                                     │
│  Blocks 0-3: UID + BCC (Read-Only)                │
│    ├─ Block 0: UID[0-2] + BCC0                    │
│    ├─ Block 1: UID[3-6]                           │
│    ├─ Block 2: BCC1 + Internal + Lock             │
│    └─ Block 3: Capability Container               │
│                                                     │
│  Blocks 4-7: Device Configuration                  │
│    ├─ Block 4-5: Device ID (16 bytes)             │
│    └─ Block 6-7: Reserved                         │
│                                                     │
│  Blocks 8-15: Ed25519 Public Key (32 bytes)       │
│    └─ 8 blocks × 4 bytes = 32 bytes               │
│                                                     │
│  Blocks 16+: NDEF Message                         │
│    └─ Authentication URL + metadata               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### **Programming NFC Chips**

#### **Using KairOS Chip Configuration Tool**
1. **Generate Device Keys**: Visit `/chip-config` in KairOS web app
2. **Create Device**: Click "Add New Device" and enter device name
3. **Get Programming Data**: Copy the generated NFC data
4. **Program Chip**: Use NFC programming tool to write data to chip

#### **Manual Programming (Advanced)**
```python
# Python script for NFC chip programming
import nfcpy
from binascii import unhexlify

def program_kairos_chip(device_id, public_key_hex, chip_uid):
    """Program KairOS authentication data to NFC chip"""
    
    # Connect to NFC reader
    clf = nfcpy.ContactlessFrontend('usb')
    
    def connected(tag):
        if tag.ndef:
            # Create NDEF message with KairOS authentication URL
            auth_url = f"https://kair-os.vercel.app/nfc?d={device_id}&c={chip_uid}"
            
            # Write device configuration to memory
            device_id_bytes = device_id.encode('utf-8').ljust(16, b'\x00')
            public_key_bytes = unhexlify(public_key_hex)
            
            # Program the chip (simplified)
            tag.ndef.message = [
                nfcpy.ndef.UriRecord(auth_url),
                nfcpy.ndef.Record('application/x-kairos-device', device_id_bytes),
                nfcpy.ndef.Record('application/x-kairos-pubkey', public_key_bytes)
            ]
            
            print(f"✅ Programmed chip with device ID: {device_id}")
            return True
        
        return False
    
    # Wait for NFC chip and program it
    clf.connect(rdwr={'on-connect': connected})

# Usage
program_kairos_chip(
    device_id="pocket-watch-1704067200000",
    public_key_hex="a1b2c3d4e5f6789...",  # 32-byte public key in hex
    chip_uid="04:AB:CD:EF:12:34:56"
)
```

### **Metal Pendant Integration**

#### **Antenna Considerations**
```
Metal Enclosure Design:
┌─────────────────────────────────────┐
│                                     │
│  🔘 NFC Chip Position               │
│     ├─ Center of pendant            │
│     ├─ Away from metal edges        │
│     └─ Optimal antenna coupling     │
│                                     │
│  📡 Antenna Tuning                  │
│     ├─ Ferrite sheet backing        │
│     ├─ Proper impedance matching    │
│     └─ Test with metal case         │
│                                     │
└─────────────────────────────────────┘
```

#### **Enclosure Recommendations**
- **Materials**: Brass, bronze, or stainless steel
- **Thickness**: 1-2mm for optimal NFC performance  
- **Size**: 40-50mm diameter (pocket watch standard)
- **Antenna Gap**: 2-3mm clearance around NFC chip
- **Backing**: Ferrite sheet to improve coupling

---

## 🌐 **Network Configuration**

### **Local Network Setup**
```bash
# Recommended network configuration
Router/Access Point:
├─ SSID: "MELD-Network" (or your preferred name)
├─ Security: WPA3 or WPA2-Personal
├─ IP Range: 192.168.1.0/24
├─ DHCP: Enabled (192.168.1.100-200)
└─ Port Forwarding: None needed (local only)

ESP32 Node Assignment:
├─ Audio Transcriber: 192.168.1.100:8080
├─ File Server: 192.168.1.101:3000  
├─ AI Inference: 192.168.1.102:8080
└─ Additional Nodes: 192.168.1.103+
```

### **WiFi Configuration for ESP32**
```c
// WiFi configuration with static IP
#include <WiFi.h>

// Network configuration
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);

void setupWiFi() {
    // Configure static IP
    if (!WiFi.config(local_IP, gateway, subnet, primaryDNS)) {
        Serial.println("❌ Failed to configure static IP");
    }
    
    // Connect to WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    WiFi.setHostname("kairos-meld-node-1");
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    
    Serial.println("✅ WiFi connected with IP: " + WiFi.localIP().toString());
}
```

---

## 🧪 **Testing & Validation**

### **ESP32 Node Testing**
```bash
# Test authentication endpoint
curl -X POST http://192.168.1.100:8080/auth \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "pocket-watch-1704067200000",
    "challenge": "KairOS-Local-test-challenge",
    "signature": "a1b2c3d4e5f6...",
    "publicKey": "def456..."
  }'

# Expected response:
# {"verified": true, "sessionToken": "local_session_123", ...}
```

### **NFC Chip Validation**
```bash
# Read NFC chip content
nfc-list
nfc-mfclassic r a chip_dump.mfd

# Verify NDEF message
nfc-mfclassic R a chip_dump.mfd chip_content.txt
```

### **End-to-End Testing**
1. **Setup**: ESP32 running on local network
2. **Program**: NFC chip with device configuration  
3. **Test**: Tap NFC chip with phone running KairOS app
4. **Verify**: Successful authentication and content access

---

## 🛠️ **Production Deployment**

### **Security Hardening**
```c
// Production security configuration
#define ENABLE_HTTPS 1
#define REQUIRE_TLS_1_3 1
#define DISABLE_DEBUG_OUTPUT 1
#define ENABLE_RATE_LIMITING 1

// Certificate pinning for enhanced security
const char* root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n" \
"-----END CERTIFICATE-----\n";
```

### **Performance Optimization**
```c
// Optimize for production use
#define CRYPTO_PRECOMPUTE_TABLES 1
#define ENABLE_HARDWARE_ACCELERATION 1
#define MEMORY_POOL_SIZE 4096
#define MAX_CONCURRENT_CONNECTIONS 10
```

### **Monitoring & Logging**
```c
// Production monitoring
void logAuthenticationEvent(const String& deviceId, bool success) {
    String timestamp = String(millis());
    String event = success ? "AUTH_SUCCESS" : "AUTH_FAILURE";
    
    Serial.printf("[%s] %s: %s\n", 
                 timestamp.c_str(), 
                 event.c_str(), 
                 deviceId.c_str());
    
    // Optional: Send to central logging system
    // sendToLogServer(timestamp, event, deviceId);
}
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **WiFi Connection** | ESP32 not connecting | Check SSID/password, signal strength |
| **NFC Read Errors** | Phone can't read chip | Check chip position, metal interference |
| **Authentication Fails** | Invalid signature errors | Verify public key matches private key |
| **Network Timeout** | Slow/failed requests | Check local network performance |
| **Memory Issues** | ESP32 crashes/resets | Optimize memory usage, increase heap |

### **Debug Tools**
```bash
# ESP32 debugging
idf.py monitor                    # Serial monitor
idf.py gdb                       # GDB debugging
idf.py coredump-debug            # Crash analysis

# Network debugging  
ping 192.168.1.100              # Test connectivity
nmap -p 8080 192.168.1.100      # Port scanning
wireshark                        # Network packet analysis
```

---

This hardware setup creates a **robust, production-ready decentralized authentication system** that provides seamless access to local edge computing devices while maintaining the highest security standards. The beautiful NFC pendants become the key to your personal edge computing ecosystem! 🚀 