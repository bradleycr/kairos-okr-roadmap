#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

// Read the YAML file
const yamlContent = fs.readFileSync('okrs.yml', 'utf8');
const data = yaml.load(yamlContent);

// Helper to format date as YYYY-MM-DD
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
}

// Generate Mermaid timeline chart from YAML data
function generateTimelineChart(objectives) {
    let timeline = `timeline\n    title KairOS 2025 Timeline\n`;
    objectives.forEach(obj => {
        timeline += `    ${obj.id}: ${obj.title}\n`;
        if (obj.krs && obj.krs.length > 0) {
            obj.krs.forEach(kr => {
                timeline += `        : ${kr.id} ${kr.title.length > 30 ? kr.title.substring(0, 30) + '...' : kr.title}\n`;
            });
        }
    });
    return timeline;
}

// Generate legend table for all KRs
function generateLegendTable(objectives) {
    let table = `| ID | Full Task Name | Due Date |\n|----|----------------|----------|\n`;
    objectives.forEach(obj => {
        if (obj.krs && obj.krs.length > 0) {
            obj.krs.forEach(kr => {
                table += `| ${kr.id} | ${kr.title.replace(/[|]/g, '')} | ${formatDate(kr.end)} |\n`;
            });
        }
    });
    return table;
}

// Update the roadmap with current data
function updateRoadmap() {
    let roadmap = fs.readFileSync('ROADMAP.md', 'utf8');
    // Remove any existing mermaid blocks (Gantt or timeline)
    roadmap = roadmap.replace(/```mermaid[\s\S]*?```/g, '');
    // Insert the timeline chart at the right place
    const timelineChart = generateTimelineChart(data.objectives);
    roadmap = roadmap.replace(/(## 📅 2025 Roadmap Overview[\s\S]*?\n---\n)/, `$1\n## 🕒 Timeline Overview\n\n\`\`\`mermaid\n${timelineChart}\`\`\`\n`);
    // Add legend table after the timeline chart
    const legendTable = generateLegendTable(data.objectives);
    roadmap = roadmap.replace(/(\`\`\`mermaid[\s\S]*?\`\`\`)/, `$1\n\n#### 🗂️ Timeline Legend\n\n${legendTable}`);
    // Update north star
    const northStarRegex = /> \*\*North Star\*\*: .*/;
    roadmap = roadmap.replace(northStarRegex, `> **North Star**: ${data.north_star}`);
    fs.writeFileSync('ROADMAP.md', roadmap);
    console.log('✅ Roadmap updated with Mermaid timeline and legend only!');
}

try {
    require('js-yaml');
    updateRoadmap();
} catch (error) {
    console.log('📦 Installing js-yaml...');
    require('child_process').execSync('npm install js-yaml', { stdio: 'inherit' });
    updateRoadmap();
}
