#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

// Read the YAML file
const yamlContent = fs.readFileSync('okrs.yml', 'utf8');
const data = yaml.load(yamlContent);

// Generate Gantt chart from YAML data
function generateGanttChart(objectives) {
    let ganttDefinition = `gantt
    title KairOS 2025 Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    
`;
    
    objectives.forEach(obj => {
        const sectionTitle = obj.title.length > 25 ? obj.title.substring(0, 25) + '...' : obj.title;
        ganttDefinition += `    section ${obj.id}: ${sectionTitle}\n`;
        
        if (obj.krs && obj.krs.length > 0) {
            obj.krs.forEach(kr => {
                const title = kr.title.length > 35 ? kr.title.substring(0, 35) + '...' : kr.title;
                const cleanTitle = title.replace(/[<>≥%]/g, '').replace(/\s+/g, ' ').trim();
                const status = getKRStatus(kr);
                ganttDefinition += `    ${cleanTitle} :${status}, ${kr.id}, 2025-01-01, ${kr.end}\n`;
            });
        } else {
            ganttDefinition += `    ${obj.title} :active, ${obj.id}, 2025-01-01, ${obj.end}\n`;
        }
    });
    
    return ganttDefinition;
}

function getKRStatus(kr) {
    const now = new Date();
    const endDate = new Date(kr.end);
    
    if (kr.progress !== undefined) {
        if (kr.progress >= 100) return 'done';
        if (kr.progress > 0) return 'active';
    }
    
    // Check if task is overdue
    if (now > endDate) return 'done';
    
    // Check if task is due soon (within 30 days)
    const daysUntilDue = (endDate - now) / (1000 * 60 * 60 * 24);
    if (daysUntilDue < 30) return 'crit';
    
    return 'active';
}

// Update the roadmap with current data
function updateRoadmap() {
    const roadmapTemplate = fs.readFileSync('ROADMAP.md', 'utf8');
    
    // Replace the Gantt chart
    const ganttChart = generateGanttChart(data.objectives);
    const ganttRegex = /```mermaid\ngantt[\s\S]*?```/;
    const updatedRoadmap = roadmapTemplate.replace(ganttRegex, `\`\`\`mermaid\n${ganttChart}\`\`\``);
    
    // Update north star
    const northStarRegex = /> \*\*North Star\*\*: .*/;
    const updatedWithNorthStar = updatedRoadmap.replace(northStarRegex, `> **North Star**: ${data.north_star}`);
    
    // Write the updated roadmap
    fs.writeFileSync('ROADMAP.md', updatedWithNorthStar);
    
    console.log('✅ Roadmap updated successfully!');
    console.log(`📊 Updated with ${data.objectives.length} objectives`);
    console.log(`🎯 North Star: ${data.north_star}`);
    
    // Show summary of key results
    const totalKRs = data.objectives.reduce((sum, obj) => sum + (obj.krs ? obj.krs.length : 0), 0);
    console.log(`📋 Total Key Results: ${totalKRs}`);
}

// Check if js-yaml is available
try {
    require('js-yaml');
    updateRoadmap();
} catch (error) {
    console.log('📦 Installing js-yaml...');
    require('child_process').execSync('npm install js-yaml', { stdio: 'inherit' });
    updateRoadmap();
}
