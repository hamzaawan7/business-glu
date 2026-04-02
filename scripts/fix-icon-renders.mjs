/**
 * Second pass: Convert icon name string renders to <Icon> component calls.
 * Patterns like {s.icon}, {typeIcons[x]}, {cfg.icon} → <Icon name={...} />
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, '..', 'resources', 'js', 'Pages');

function getFiles(dir) {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) results.push(...getFiles(fullPath));
        else if (item.name.endsWith('.tsx')) results.push(fullPath);
    }
    return results;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const relPath = path.relative(path.join(__dirname, '..'), filePath);

    // Pattern 1: <span className="text-lg">{typeIcons[x]}</span> or <span>{s.icon}</span>
    // Where the expression is the ONLY child → replace with <Icon>

    // {typeIcons[...] || 'fallback'} → <Icon name={typeIcons[...] || 'fallback'} className="..." />
    // {typeIcons[x]} → <Icon name={typeIcons[x]} className="..." />
    const typeIconsPatterns = [
        // {typeIcons[x] || 'fallback'} as standalone content
        /\{typeIcons\[([^\]]+)\]\s*\|\|\s*'([^']+)'\}/g,
        // {typeIcons[x] ?? 'fallback'} as standalone content
        /\{typeIcons\[([^\]]+)\]\s*\?\?\s*'([^']+)'\}/g,
    ];

    for (const pattern of typeIconsPatterns) {
        if (pattern.test(content)) {
            content = content.replace(pattern, '<Icon name={typeIcons[$1] || \'$2\'} className="w-4 h-4 inline-block" />');
            modified = true;
        }
        pattern.lastIndex = 0;
    }

    // {typeIcons[x]} {typeLabels[x]} → <Icon name={typeIcons[x]} className="..." /> {typeLabels[x]}
    const typeIconLabelPattern = /\{typeIcons\[([^\]]+)\]\}\s+\{typeLabels\[([^\]]+)\]\}/g;
    if (typeIconLabelPattern.test(content)) {
        content = content.replace(typeIconLabelPattern, '<Icon name={typeIcons[$1]} className="w-3.5 h-3.5 inline-block mr-1" /> {typeLabels[$2]}');
        modified = true;
    }
    typeIconLabelPattern.lastIndex = 0;

    // {typeIcons[x]} {typeLabels[x] || fallback}
    const typeIconLabelOrPattern = /\{typeIcons\[([^\]]+)\]\}\s+\{typeLabels\[([^\]]+)\]\s*\|\|\s*([^}]+)\}/g;
    if (typeIconLabelOrPattern.test(content)) {
        content = content.replace(typeIconLabelOrPattern, '<Icon name={typeIcons[$1]} className="w-3.5 h-3.5 inline-block mr-1" /> {typeLabels[$2] || $3}');
        modified = true;
    }
    typeIconLabelOrPattern.lastIndex = 0;

    // standalone {typeIcons[x]}
    const standaloneTypeIcons = /\{typeIcons\[([^\]]+)\]\}/g;
    if (standaloneTypeIcons.test(content)) {
        content = content.replace(standaloneTypeIcons, '<Icon name={typeIcons[$1]} className="w-4 h-4 inline-block" />');
        modified = true;
    }
    standaloneTypeIcons.lastIndex = 0;

    // {s.icon} patterns in stats cards, etc
    const sIconPattern = /\{s\.icon\}/g;
    if (sIconPattern.test(content)) {
        content = content.replace(sIconPattern, '<Icon name={s.icon} className="w-5 h-5" />');
        modified = true;
    }
    sIconPattern.lastIndex = 0;

    // {opt.icon} patterns
    const optIconPattern = /\{opt\.icon\}/g;
    if (optIconPattern.test(content)) {
        content = content.replace(optIconPattern, '<Icon name={opt.icon} className="w-4 h-4" />');
        modified = true;
    }
    optIconPattern.lastIndex = 0;

    // {cfg.icon} {cfg.label} patterns
    const cfgIconLabelPattern = /\{cfg\.icon\}\s+\{cfg\.label\}/g;
    if (cfgIconLabelPattern.test(content)) {
        content = content.replace(cfgIconLabelPattern, '<Icon name={cfg.icon} className="w-4 h-4 inline-block mr-1" /> {cfg.label}');
        modified = true;
    }
    cfgIconLabelPattern.lastIndex = 0;

    // standalone {cfg.icon}
    const cfgIconPattern = /\{cfg\.icon\}/g;
    if (cfgIconPattern.test(content)) {
        content = content.replace(cfgIconPattern, '<Icon name={cfg.icon} className="w-4 h-4 inline-block" />');
        modified = true;
    }
    cfgIconPattern.lastIndex = 0;

    // {ft.icon} {ft.label} in <option> tags
    const ftIconLabelPattern = /\{ft\.icon\}\s+\{ft\.label\}/g;
    if (ftIconLabelPattern.test(content)) {
        content = content.replace(ftIconLabelPattern, '{ft.label}');
        modified = true;
    }
    ftIconLabelPattern.lastIndex = 0;

    // {t.icon} {t.label} in <option> tags
    const tIconLabelPattern = /\{t\.icon\}\s+\{t\.label\}/g;
    if (tIconLabelPattern.test(content)) {
        content = content.replace(tIconLabelPattern, '{t.label}');
        modified = true;
    }
    tIconLabelPattern.lastIndex = 0;

    // {qt.icon} {qt.label} in <option>
    const qtIconLabelPattern = /\{qt\.icon\}\s+\{qt\.label\}/g;
    if (qtIconLabelPattern.test(content)) {
        content = content.replace(qtIconLabelPattern, '{qt.label}');
        modified = true;
    }
    qtIconLabelPattern.lastIndex = 0;

    // {c.icon} {c.name} → <Icon> {c.name}
    const cIconNamePattern = /\{c\.icon\}\s+\{c\.name\}/g;
    if (cIconNamePattern.test(content)) {
        content = content.replace(cIconNamePattern, '{c.name}');
        modified = true;
    }
    cIconNamePattern.lastIndex = 0;

    // {cat.icon} — used in knowledge base
    const catIconPattern = /\{cat\.icon\}/g;
    if (catIconPattern.test(content)) {
        content = content.replace(catIconPattern, '<Icon name={cat.icon || "folder-open"} className="w-4 h-4 inline-block" />');
        modified = true;
    }
    catIconPattern.lastIndex = 0;

    // article.category.icon patterns
    const artCatIconNamePattern = /\{article\.category\.icon\}\s+\{article\.category\.name\}/g;
    if (artCatIconNamePattern.test(content)) {
        content = content.replace(artCatIconNamePattern, '<Icon name={article.category.icon || "folder-open"} className="w-3.5 h-3.5 inline-block mr-1" /> {article.category.name}');
        modified = true;
    }
    artCatIconNamePattern.lastIndex = 0;

    const artCatIconPattern = /\{article\.category\?\.icon\s*\?\?\s*'([^']+)'\}/g;
    if (artCatIconPattern.test(content)) {
        content = content.replace(artCatIconPattern, '<Icon name={article.category?.icon ?? \'$1\'} className="w-4 h-4 inline-block" />');
        modified = true;
    }
    artCatIconPattern.lastIndex = 0;

    // viewArticle.category.icon patterns
    const viewArtCatPattern = /\{viewArticle\.category\.icon\}\s+\{viewArticle\.category\.name\}/g;
    if (viewArtCatPattern.test(content)) {
        content = content.replace(viewArtCatPattern, '<Icon name={viewArticle.category.icon || "folder-open"} className="w-3.5 h-3.5 inline-block mr-1" /> {viewArticle.category.name}');
        modified = true;
    }
    viewArtCatPattern.lastIndex = 0;

    // cat.icon in category filter buttons
    const catIconBtnPattern = /\{cat\.icon\}\s+\{cat\.name\}/g;
    if (catIconBtnPattern.test(content)) {
        content = content.replace(catIconBtnPattern, '<Icon name={cat.icon || "folder-open"} className="w-3.5 h-3.5 inline-block mr-1" /> {cat.name}');
        modified = true;
    }
    catIconBtnPattern.lastIndex = 0;

    // {typeIcons[k]} {v} in <option> tags — just show {v}
    const optionTypeIconPattern = /\{typeIcons\[k\]\}\s+\{v\}/g;
    if (optionTypeIconPattern.test(content)) {
        content = content.replace(optionTypeIconPattern, '{v}');
        modified = true;
    }
    optionTypeIconPattern.lastIndex = 0;

    // Handle isDone ? '✓' : typeIcons[...] — now is isDone ? '✓' : icon name string
    // Already fine, but the typeIcons[x] part needs wrapping

    // {typeIcons[obj.type]} standalone → wrap
    // Already handled above

    // Handle document type icons: typeIcons[doc.file_type...] || 'fallback'
    // Already handled by the typeIcons patterns above

    // Handle categoryIcons array rendering in KnowledgeBase
    // In the icon picker: {categoryIcons.map(icon => (<button ... >{icon}</button>))}
    // icon is now a string like 'folder-open' → needs <Icon name={icon} />
    const catIconsMapPattern = />\{icon\}</g;
    // Only replace if this file has categoryIcons
    if (content.includes('categoryIcons') && catIconsMapPattern.test(content)) {
        content = content.replace(catIconsMapPattern, '><Icon name={icon} className="w-5 h-5" />');
        modified = true;
    }
    catIconsMapPattern.lastIndex = 0;

    // Handle eventTypes icon in Timeline: {eventTypes.map(t => <option ...>{t.icon} {t.label}</option>)}
    // Already handled by t.icon pattern above

    // typeIcons in <option> tags — can't use <Icon> in options, remove them
    // <option value="announcement"><Icon name="megaphone" ... /> Announcement</option>
    // → <option value="announcement">Announcement</option>
    const iconInOptionPattern = /<Icon name="[^"]*" className="[^"]*" \/>\s*/g;
    // Only in option tags
    const optionWithIconPattern = /(<option[^>]*>)\s*<Icon name="[^"]*" className="[^"]*" \/>\s*/g;
    if (optionWithIconPattern.test(content)) {
        content = content.replace(optionWithIconPattern, '$1');
        modified = true;
    }
    optionWithIconPattern.lastIndex = 0;

    // Ensure Icon import exists
    const hasIconImport = content.includes("from '@/Components/Icon'") || content.includes('from "@/Components/Icon"');
    if (!hasIconImport && content.includes('<Icon ')) {
        const importMatch = content.match(/^import .+ from ['"].+['"];?\s*$/m);
        if (importMatch) {
            const insertPos = importMatch.index + importMatch[0].length;
            content = content.slice(0, insertPos) + "\nimport Icon from '@/Components/Icon';" + content.slice(insertPos);
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✓ ${relPath}`);
    }
    return modified;
}

const files = getFiles(PAGES_DIR);
let count = 0;
for (const file of files) {
    if (processFile(file)) count++;
}
console.log(`\n✓ Done! Updated ${count} files.`);
