# KairOS OKR Roadmap 2025

**North Star:** Data Commons OS for democratic cryptography and privacy-preserving social computing.


**Horizon:** 2025-09-15

## Roadmap Visualization

```mermaid
gantt
    title KairOS OKR Roadmap 2025
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section J1: Repos split & docs
    commons-os repo live, CI green :active, J1a, 2025-01-01, 2025-07-10
    ritual-designer repo live, CI green :active, J1b, 2025-01-01, 2025-07-10
    flowers-demo repo live, CI green :active, J1c, 2025-01-01, 2025-07-10
    Shared types published as @kairos/common v0.1 :active, J1d, 2025-01-01, 2025-07-20
    MIT licence + CONTRIBUTING + 10-min dev script :active, J1e, 2025-01-01, 2025-07-31

    section J2: Identity & crypto solid
    1 000-tap stress test >98 % success, <50 ms :active, J2a, 2025-01-01, 2025-07-25
    Wallet sign-in ok (Chromium, Safari, PWA) :active, J2b, 2025-01-01, 2025-07-25
    W3C Credential Manifest export :active, J2c, 2025-01-01, 2025-07-31

    section J3: Way-of-Flowers web simulation
    Full ritual sim renders in browser :active, J3a, 2025-01-01, 2025-07-31

    section A1: Ritual-designer builds firmware
    Drag-and-drop sketch editor => ESP32 binary :active, A1a, 2025-01-01, 2025-08-15
    LAN OTA flash test passes on dev board :active, A1b, 2025-01-01, 2025-08-15
    First firmware burned, tap→bloom works :active, A1c, 2025-01-01, 2025-08-30

    section S1: Way-of-Flowers installation shipped
    Five nodes assembled & bench-tested 48 h :active, S1a, 2025-01-01, 2025-08-30
    Gallery mount complete (magnetic) 10 Sep :active, S1b, 2025-01-01, 2025-09-10
    200 NFC pendants minted :active, S1c, 2025-01-01, 2025-09-05
    90 % visitor ritual completion; logs exported :active, S1d, 2025-01-01, 2025-09-15

    section S2: Open-source readiness
    GitHub Actions green across repos :active, S2a, 2025-01-01, 2025-08-31
    Issue templates + linter merged :active, S2b, 2025-01-01, 2025-08-31
    Public docs site live on Pages :active, S2c, 2025-01-01, 2025-09-15

```

## Objectives Overview

| ID | Title | Owner | Due Date | Status |
|----|----|----|----|----|
| J1 | Repos split & docs | Sam | 2025-07-31 | 🟡 In Progress |
| J2 | Identity & crypto solid | Lea | 2025-07-31 | 🟡 In Progress |
| J3 | Way-of-Flowers web simulation | Mei | 2025-07-31 | 🟡 In Progress |
| A1 | Ritual-designer builds firmware | Noor | 2025-08-31 | 🟡 In Progress |
| S1 | Way-of-Flowers installation shipped | Mei | 2025-09-15 | 🟡 In Progress |
| S2 | Open-source readiness | Dan | 2025-09-15 | 🟡 In Progress |

## Key Results

### J1: Repos split & docs

- 🟡 **J1a:** commons-os repo live, CI green *(Due: 2025-07-10)*
- 🟡 **J1b:** ritual-designer repo live, CI green *(Due: 2025-07-10)*
- 🟡 **J1c:** flowers-demo repo live, CI green *(Due: 2025-07-10)*
- 🟡 **J1d:** Shared types published as @kairos/common v0.1 *(Due: 2025-07-20)*
- 🟡 **J1e:** MIT licence + CONTRIBUTING + 10-min dev script *(Due: 2025-07-31)*

### J2: Identity & crypto solid

- 🟡 **J2a:** 1 000-tap stress test >98 % success, <50 ms *(Due: 2025-07-25)*
- 🟡 **J2b:** Wallet sign-in ok (Chromium, Safari, PWA) *(Due: 2025-07-25)*
- 🟡 **J2c:** W3C Credential Manifest export *(Due: 2025-07-31)*

### J3: Way-of-Flowers web simulation

- 🟡 **J3a:** Full ritual sim renders in browser *(Due: 2025-07-31)*

### A1: Ritual-designer builds firmware

- 🟡 **A1a:** Drag-and-drop sketch editor => ESP32 binary *(Due: 2025-08-15)*
- 🟡 **A1b:** LAN OTA flash test passes on dev board *(Due: 2025-08-15)*
- 🟡 **A1c:** First firmware burned, tap→bloom works *(Due: 2025-08-30)*

### S1: Way-of-Flowers installation shipped

- 🟡 **S1a:** Five nodes assembled & bench-tested 48 h *(Due: 2025-08-30)*
- 🟡 **S1b:** Gallery mount complete (magnetic) 10 Sep *(Due: 2025-09-10)*
- 🟡 **S1c:** 200 NFC pendants minted *(Due: 2025-09-05)*
- 🟡 **S1d:** 90 % visitor ritual completion; logs exported *(Due: 2025-09-15)*

### S2: Open-source readiness

- 🟡 **S2a:** GitHub Actions green across repos *(Due: 2025-08-31)*
- 🟡 **S2b:** Issue templates + linter merged *(Due: 2025-08-31)*
- 🟡 **S2c:** Public docs site live on Pages *(Due: 2025-09-15)*


---

*Last updated: 2025-07-03*
*Edit [okrs.yml](./okrs.yml) to update this roadmap*
