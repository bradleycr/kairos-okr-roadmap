# 🎯 KairOS OKR Roadmap

A comprehensive, editable Markdown roadmap for KairOS objectives and key results.

## 📋 Overview

This repository contains a beautifully designed, easily editable Markdown roadmap that stays in sync with the `okrs.yml` data file. The roadmap includes:

- **🌟 Vision & North Star**: Clear mission and principles
- **📅 Quarterly Objectives**: Detailed OKRs with timelines
- **📊 Gantt Charts**: Visual project timelines using Mermaid
- **🎯 Key Milestones**: Major releases and deliverables
- **🛠️ Technical Architecture**: System overview and tech stack
- **🤝 Community Guidelines**: How to contribute and get involved

## 🚀 Quick Start

### View the Roadmap
Simply open `ROADMAP.md` in any Markdown viewer:
- **GitHub**: Automatically renders with Mermaid charts
- **VS Code**: Use Markdown preview with Mermaid extension
- **Obsidian**: Native Markdown and Mermaid support

### Edit the Roadmap
1. **Edit Data**: Modify `okrs.yml` to update objectives and key results
2. **Sync Changes**: Run `node sync-roadmap.js` to update the Markdown
3. **Manual Edits**: Edit `ROADMAP.md` directly for content changes

### Sync with YAML Data
```bash
# Update roadmap from okrs.yml
node sync-roadmap.js

# The script will:
# ✅ Update Gantt charts
# ✅ Sync North Star vision
# ✅ Update objective counts
```

## 📁 File Structure

```
├── ROADMAP.md          # Main roadmap document
├── okrs.yml           # OKR data source
├── sync-roadmap.js    # Sync script
├── README.md          # This file
└── package.json       # Dependencies
```

## 🎨 Features

### ✨ What's Included
- **📊 Dynamic Gantt Charts**: Auto-generated from YAML data
- **🎯 Progress Tracking**: Visual indicators for KR status
- **📅 Timeline Views**: Clear quarterly planning
- **🔄 Easy Editing**: Simple YAML editing with Markdown output
- **📱 Mobile Friendly**: Responsive design for all devices

### 🛠️ Technical Benefits
- **No Complex Setup**: Just Markdown and Node.js
- **Version Control Friendly**: Git-friendly text files
- **Easy Collaboration**: Standard Markdown editing
- **Flexible Viewing**: Works in any Markdown viewer
- **Automated Sync**: Script keeps content in sync

## 📝 Editing Guide

### Edit OKRs in YAML
```yaml
objectives:
  - id: Q1
    title: "Your Objective Title"
    owner: "Owner Name"
    end: "2025-03-31"
    krs:
      - id: Q1a
        title: "Key Result Description"
        end: "2025-01-15"
        progress: 75  # Optional progress percentage
```

### Update Roadmap Content
1. Edit `okrs.yml` for data changes
2. Run `node sync-roadmap.js` to sync
3. Edit `ROADMAP.md` directly for content/formatting changes

### Add New Sections
The roadmap is fully editable Markdown. Add new sections by editing `ROADMAP.md`:
- Architecture diagrams
- Community guidelines
- Technical specifications
- Meeting notes

## 🔄 Automation

### GitHub Actions (Optional)
Add this to `.github/workflows/sync-roadmap.yml`:
```yaml
name: Sync Roadmap
on:
  push:
    paths: ['okrs.yml']
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: node sync-roadmap.js
      - run: git add ROADMAP.md && git commit -m "Update roadmap" && git push
```

## 🎯 Benefits Over Interactive HTML

### ✅ Advantages
- **📝 Easy Editing**: Standard Markdown editing
- **🔄 Version Control**: Git-friendly text files
- **📱 Universal Viewing**: Works everywhere Markdown does
- **🚀 No Dependencies**: No complex web server setup
- **🤝 Collaborative**: Easy for teams to edit together
- **📊 Still Visual**: Mermaid charts provide visual timelines

### 🎨 Professional Appearance
- Beautiful formatting with emojis and tables
- Gantt charts for visual project planning
- Clear section organization
- Mobile-responsive design
- Professional typography

## 🛠️ Dependencies

```json
{
  "dependencies": {
    "js-yaml": "^4.1.0"
  }
}
```

Install with: `npm install`

## 🤝 Contributing

1. **Fork** the repository
2. **Edit** `okrs.yml` or `ROADMAP.md`
3. **Sync** changes with `node sync-roadmap.js`
4. **Submit** a pull request

## 📞 Support

- **📧 Issues**: Use GitHub Issues for questions
- **💬 Discussions**: GitHub Discussions for ideas
- **📖 Docs**: See `ROADMAP.md` for full documentation

---

*Simple, beautiful, and easy to maintain roadmap for KairOS development.*
