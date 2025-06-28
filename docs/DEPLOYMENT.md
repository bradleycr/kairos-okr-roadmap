# 🚀 KairOS Deployment Guide

> **Production deployment for decentralized authentication**  
> Vercel Edge Functions • ESP32 nodes (planned) • Monitoring

---

## 🎯 **Deployment Overview**

KairOS currently deploys as a **web application** on Vercel's edge network for global accessibility. ESP32 MELD nodes are **in development** and will operate on users' local networks for true decentralization and privacy.

### **Current Deployment Architecture**
```
┌─ Global Edge (Vercel) - ✅ DEPLOYED ─────────────┐
│  Web App: https://kair-os.vercel.app              │
│  ├─ Authentication UI                             │
│  ├─ Chip Configuration Tools                      │
│  ├─ Documentation & Demos                         │
│  └─ Edge API Routes (health, crypto generation)   │
└──────────────────────────────────────────────────┘
                           │
                           ▼
┌─ Local Networks - 🚧 IN DEVELOPMENT ─────────────┐
│  ESP32 MELD Nodes: 192.168.1.XXX:8080           │
│  ├─ Audio Transcription Devices (planned)        │
│  ├─ Local File Servers (planned)                 │
│  ├─ AI Inference Nodes (planned)                 │
│  └─ Custom Edge Computing Applications (planned) │
└──────────────────────────────────────────────────┘
```

---

## 🌐 **Web Application Deployment (Vercel)**

### **Prerequisites**
- Vercel account (free tier sufficient)
- GitHub repository with KairOS code
- Custom domain (optional)

### **Environment Variables**
```bash
# .env.local (for local development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development

# Vercel Production Environment
NEXT_PUBLIC_APP_URL=https://kair-os.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production
VERCEL_ENV=production
```

### **Vercel Configuration**
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "edge"
    }
  },
  "regions": ["iad1", "sfo1", "lhr1"],
  "rewrites": [
    {
      "source": "/docs/:path*",
      "destination": "/docs/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### **Deployment Steps**

#### **1. Automatic Deployment (Recommended)**
```bash
# Connect GitHub repository to Vercel
1. Visit https://vercel.com
2. Click "Import Project"
3. Select your KairOS repository
4. Configure environment variables
5. Deploy automatically on every git push
```

#### **2. Manual Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set up custom domain (optional)
vercel domains add kair-os.com
vercel alias kair-os.vercel.app kair-os.com
```

### **Performance Optimization**
```typescript
// next.config.mjs - Production optimizations
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    optimizes: true,
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analysis
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true',
  },
  
  // Edge runtime for API routes
  experimental: {
    runtime: 'edge',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ],
      },
    ]
  },
}

export default nextConfig
```

---

## 🤖 **ESP32 MELD Node Deployment (In Development)**

> **⚠️ STATUS**: ESP32 firmware is currently in development. The simulation works in browser, but physical hardware deployment is **planned future work** for open source contributors.

### **Production Firmware**
```c
// Production configuration
#define PRODUCTION_BUILD 1
#define ENABLE_OTA_UPDATES 1
#define ENABLE_HTTPS 1
#define DISABLE_DEBUG_SERIAL 1

// Security hardening
#define MAX_AUTH_ATTEMPTS 5
#define AUTH_RATE_LIMIT_MS 1000
#define SESSION_TIMEOUT_MS 3600000  // 1 hour

// Performance optimization
#define CRYPTO_HARDWARE_ACCELERATION 1
#define MEMORY_POOL_SIZE 8192
#define MAX_CONCURRENT_CONNECTIONS 20
```

### **OTA (Over-The-Air) Updates**
```c
// OTA update system
#include <ArduinoOTA.h>
#include <Update.h>

void setupOTA() {
    ArduinoOTA.setHostname("kairos-meld-node");
    ArduinoOTA.setPassword("your_ota_password");
    
    ArduinoOTA.onStart([]() {
        Serial.println("🔄 OTA Update Starting...");
    });
    
    ArduinoOTA.onEnd([]() {
        Serial.println("✅ OTA Update Complete");
    });
    
    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("❌ OTA Error: %u\n", error);
    });
    
    ArduinoOTA.begin();
}

void loop() {
    ArduinoOTA.handle();
    server.handleClient();
    // ... rest of loop
}
```

### **Mass Deployment Script**
```bash
#!/bin/bash
# deploy_meld_nodes.sh - Deploy firmware to multiple ESP32 devices

FIRMWARE_PATH="./kairos_meld_node.bin"
DEVICES=("192.168.1.100" "192.168.1.101" "192.168.1.102")

for device in "${DEVICES[@]}"; do
    echo "🚀 Deploying to $device..."
    
    # Upload firmware via OTA
    curl -X POST "http://$device:8080/update" \
         -H "Authorization: Bearer $OTA_TOKEN" \
         -F "firmware=@$FIRMWARE_PATH"
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully deployed to $device"
    else
        echo "❌ Failed to deploy to $device"
    fi
    
    sleep 5
done

echo "🎉 Mass deployment complete!"
```

---

## 🔧 **Infrastructure as Code**

### **Docker Deployment (Optional)**
```dockerfile
# Dockerfile - For containerized deployments
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### **Docker Compose for Local Development**
```yaml
# docker-compose.yml
version: '3.8'
services:
  kairos-web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    
  kairos-docs:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./docs:/usr/share/nginx/html
    restart: unless-stopped
```

### **Kubernetes Deployment (Enterprise)**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kairos-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kairos-web
  template:
    metadata:
      labels:
        app: kairos-web
    spec:
      containers:
      - name: kairos-web
        image: kairos:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: kairos-service
spec:
  selector:
    app: kairos-web
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## 📊 **Monitoring & Analytics**

### **Application Performance Monitoring**
```typescript
// lib/monitoring.ts
import { Analytics } from '@vercel/analytics'

// Track authentication events
export function trackAuthentication(event: 'success' | 'failure', format: string) {
  Analytics.track('nfc_authentication', {
    result: event,
    format: format,
    timestamp: Date.now()
  })
}

// Track device registrations
export function trackDeviceRegistration(deviceType: string) {
  Analytics.track('device_registration', {
    deviceType: deviceType,
    timestamp: Date.now()
  })
}

// Performance monitoring
export function trackPageLoad(page: string, loadTime: number) {
  Analytics.track('page_performance', {
    page: page,
    loadTime: loadTime,
    timestamp: Date.now()
  })
}
```

### **ESP32 Node Monitoring**
```c
// Monitoring and health checks
void handleHealthCheck() {
    StaticJsonDocument<200> health;
    
    health["status"] = "healthy";
    health["uptime"] = millis();
    health["free_heap"] = ESP.getFreeHeap();
    health["wifi_rssi"] = WiFi.RSSI();
    health["auth_count"] = authenticationCount;
    health["last_auth"] = lastAuthenticationTime;
    
    String response;
    serializeJson(health, response);
    
    server.send(200, "application/json", response);
}

void handleMetrics() {
    StaticJsonDocument<300> metrics;
    
    metrics["authentication_total"] = authenticationCount;
    metrics["authentication_success"] = authSuccessCount;
    metrics["authentication_failure"] = authFailureCount;
    metrics["average_response_time"] = averageResponseTime;
    metrics["memory_usage"] = ESP.getHeapSize() - ESP.getFreeHeap();
    metrics["wifi_quality"] = WiFi.RSSI();
    
    String response;
    serializeJson(metrics, response);
    
    server.send(200, "application/json", response);
}
```

### **Centralized Logging (Optional)**
```typescript
// lib/logger.ts - Centralized logging system
class KairOSLogger {
  static async log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // Local logging
    console[level](message, data)
    
    // Optional: Send to logging service
    if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      }).catch(() => {
        // Fail silently - don't break user experience
      })
    }
  }
}

// Usage
KairOSLogger.log('info', 'User authenticated successfully', { deviceId, format })
KairOSLogger.log('error', 'Authentication failed', { error, deviceId })
```

---

## 🔐 **Security & Compliance**

### **SSL/TLS Configuration**
```bash
# Let's Encrypt for custom domains
certbot certonly --webroot -w /var/www/html -d kair-os.com

# Nginx configuration for enhanced security
server {
    listen 443 ssl http2;
    server_name kair-os.com;
    
    ssl_certificate /etc/letsencrypt/live/kair-os.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kair-os.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
}
```

### **ESP32 Security Hardening**
```c
// Security configuration
#define ENABLE_HTTPS 1
#define REQUIRE_CLIENT_CERTS 0  // Set to 1 for enterprise
#define MAX_FAILED_ATTEMPTS 5
#define LOCKOUT_DURATION_MS 300000  // 5 minutes

// Rate limiting
unsigned long lastAuthAttempt = 0;
int failedAttempts = 0;

bool isRateLimited() {
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        if (millis() - lastAuthAttempt < LOCKOUT_DURATION_MS) {
            return true;
        } else {
            failedAttempts = 0;  // Reset after lockout period
        }
    }
    return false;
}
```

---

## 🧪 **Testing & Validation**

### **Production Testing Checklist**
```bash
# Automated deployment testing
pnpm test:e2e              # End-to-end tests
pnpm test:load             # Load testing
pnpm test:security         # Security scanning
pnpm test:accessibility    # A11y testing

# Manual testing checklist
□ NFC authentication flow works on real devices
□ ESP32 nodes respond correctly to authentication
□ All UI components render properly across browsers
□ Mobile responsiveness works on iOS/Android
□ Error handling gracefully manages edge cases
□ Performance meets acceptable thresholds
```

### **Load Testing**
```typescript
// Load testing with Artillery or similar
// artillery.yml
config:
  target: 'https://kair-os.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Authentication Flow"
    flow:
      - get:
          url: "/nfc"
      - post:
          url: "/api/crypto/generate"
          json:
            deviceName: "Test Device"
      - get:
          url: "/nfc?d=test&c=test"
```

---

## 🎉 **Go-Live Process**

### **Pre-Launch Checklist**
- ✅ **Code Quality**: All tests pass, code review complete
- ✅ **Security**: Security audit passed, penetration testing complete
- ✅ **Performance**: Load testing meets requirements
- ✅ **Documentation**: All documentation updated and accurate
- ✅ **Monitoring**: Alerting and monitoring configured
- ✅ **Backup**: Backup and disaster recovery procedures in place

### **Launch Steps**
1. **Deploy to Production**: Push final code to production branch
2. **DNS Configuration**: Update DNS records to point to production
3. **SSL Certificates**: Ensure SSL certificates are valid and auto-renewing
4. **Monitoring Setup**: Verify all monitoring and alerting is active
5. **Team Notification**: Notify team of successful deployment
6. **User Communication**: Announce new features/updates to users

### **Post-Launch Monitoring**
```bash
# Monitor key metrics for 24-48 hours
- Response times < 200ms
- Error rate < 0.1%
- Authentication success rate > 99%
- User satisfaction scores
- System resource usage
```

---

This deployment guide ensures **professional, scalable, and secure** deployment of KairOS across both global edge infrastructure and local ESP32 networks. The result is a **production-ready system** that maintains the privacy and decentralization principles while providing enterprise-grade reliability! 🚀 