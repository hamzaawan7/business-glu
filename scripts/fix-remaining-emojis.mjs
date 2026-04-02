/**
 * Final pass: Replace ALL remaining emoji characters with Icon components or text equivalents.
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

// Map of emoji → replacement strategy
// For string literal contexts (icon maps, data objects): just replace with icon name string
// For JSX render contexts: replace with <Icon> component
const EMOJI_TO_ICON = {
    '✕': { iconName: 'x-mark', text: null },
    '✗': { iconName: 'x-mark', text: null },
    '📍': { iconName: 'map-pin', text: null },
    '🔄': { iconName: 'arrow-path', text: null },
    '🔁': { iconName: 'arrow-path', text: null },
    '✉️': { iconName: 'envelope', text: null },
    '✉': { iconName: 'envelope', text: null },
    '☰': { iconName: 'bars-3', text: null },
    '✓': { iconName: 'check', text: null },
    '🔜': { iconName: 'forward', text: null },
    '📩': { iconName: 'inbox-arrow-down', text: null },
    '☐': { iconName: 'check-square', text: null },
    '☑️': { iconName: 'check-square', text: null },
    '☑': { iconName: 'check-square', text: null },
    '★': { iconName: 'star', text: null },
    '📈': { iconName: 'arrow-trending-up', text: null },
    '⏱': { iconName: 'stopwatch', text: null },
    '🪪': { iconName: 'id-card', text: null },
    '👔': { iconName: 'necktie', text: null },
    '🌟': { iconName: 'sparkles', text: null },
    '⬆️': { iconName: 'arrow-up', text: null },
    '⬆': { iconName: 'arrow-up', text: null },
    '⏳': { iconName: 'hourglass', text: null },
    '🔘': { iconName: 'radio-button', text: null },
    '✍️': { iconName: 'pen-tool', text: null },
    '✍': { iconName: 'pen-tool', text: null },
    '🎫': { iconName: 'ticket', text: null },
    '#️⃣': { iconName: 'hashtag', text: null },
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    const relPath = path.relative(path.join(__dirname, '..'), filePath);
    const changes = [];

    // Process line by line for better context awareness
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const [emoji, { iconName }] of Object.entries(EMOJI_TO_ICON)) {
            if (!line.includes(emoji)) continue;

            // Context 1: Inside a string literal for an icon/data property: icon: 'emoji'
            // Replace emoji with icon name string
            const iconPropPattern = new RegExp(`icon:\\s*'[^']*${escapeRegex(emoji)}[^']*'`, 'g');
            if (iconPropPattern.test(lines[i])) {
                lines[i] = lines[i].replace(new RegExp(`(icon:\\s*')([^']*?)${escapeRegex(emoji)}\\uFE0F?([^']*')`, 'g'), `$1${iconName}$3`);
                changes.push(`  L${i+1}: icon prop → '${iconName}'`);
                continue;
            }

            // Context 2: emoji directly in JSX as content like: >✕</button> or >📍 text<
            // Replace with <Icon> component inline
            // But first check special cases:

            // 2a: standalone emoji in JSX text like: >✕< or >✓ Text< or emoji at start of text content
            // Pattern: emoji followed by optional space and text, inside JSX element
            const standaloneEmojiTextPattern = new RegExp(`>${escapeRegex(emoji)}\\uFE0F?\\s*([^<]*)(</)`, 'g');
            if (standaloneEmojiTextPattern.test(lines[i])) {
                const replacement = iconName === 'check' || iconName === 'x-mark'
                    ? `><Icon name="${iconName}" className="w-3 h-3 inline-block" />${'$1'}$2`
                    : `><Icon name="${iconName}" className="w-4 h-4 inline-block" />${' $1'}$2`;
                lines[i] = lines[i].replace(new RegExp(`>${escapeRegex(emoji)}\\uFE0F?\\s*([^<]*)(</)`, 'g'), (match, text, closing) => {
                    const trimmedText = text.trim();
                    if (trimmedText) {
                        return `><Icon name="${iconName}" className="w-3.5 h-3.5 inline-block" /> ${trimmedText}${closing}`;
                    }
                    return `><Icon name="${iconName}" className="w-3 h-3 inline-block" />${closing}`;
                });
                changes.push(`  L${i+1}: JSX text → <Icon name="${iconName}" />`);
                continue;
            }

            // 2b: emoji in JSX expression like: {emoji} or emoji inside template literal
            const jsxExprPattern = new RegExp(`\\{['"]${escapeRegex(emoji)}\\uFE0F?['"]\\}`, 'g');
            if (jsxExprPattern.test(lines[i])) {
                lines[i] = lines[i].replace(jsxExprPattern, `<Icon name="${iconName}" className="w-4 h-4 inline-block" />`);
                changes.push(`  L${i+1}: JSX expr → <Icon />`);
                continue;
            }

            // 2c: emoji inside a string in JSX like: '{emoji} text' — used in template strings, option labels
            // For <option> tags just remove the emoji
            if (lines[i].includes('<option') || lines[i].includes('label:')) {
                lines[i] = lines[i].replace(new RegExp(escapeRegex(emoji) + '\\uFE0F?\\s*', 'g'), '');
                changes.push(`  L${i+1}: removed emoji from option/label`);
                continue;
            }

            // 2d: emoji in ternary or conditional: 'emoji' or "emoji"
            const quotedEmojiPattern = new RegExp(`'${escapeRegex(emoji)}\\uFE0F?'`, 'g');
            if (quotedEmojiPattern.test(lines[i])) {
                lines[i] = lines[i].replace(quotedEmojiPattern, `'${iconName}'`);
                changes.push(`  L${i+1}: quoted emoji → '${iconName}'`);
                continue;
            }

            // 2e: emoji in JSX text not caught above — catch-all
            if (lines[i].includes(emoji)) {
                // For inline emojis in JSX text, replace with <Icon> inline
                lines[i] = lines[i].replace(new RegExp(escapeRegex(emoji) + '\\uFE0F?', 'g'), `<Icon name="${iconName}" className="w-3.5 h-3.5 inline-block" /> `);
                changes.push(`  L${i+1}: catch-all → <Icon />`);
            }
        }
    }

    content = lines.join('\n');

    // Clean up stray variation selectors (️) left behind after emoji removal
    content = content.replace(/\uFE0F/g, '');

    // Clean up doubled Icon imports
    // Ensure Icon import exists if <Icon is used
    const hasIconTag = content.includes('<Icon ');
    const hasIconImport = content.includes("from '@/Components/Icon'") || content.includes('from "@/Components/Icon"');
    if (hasIconTag && !hasIconImport) {
        // Add import after first import line
        const firstImportEnd = content.indexOf(";\n", content.indexOf('import '));
        if (firstImportEnd > -1) {
            content = content.slice(0, firstImportEnd + 2) + "import Icon from '@/Components/Icon';\n" + content.slice(firstImportEnd + 2);
            changes.push('  Added Icon import');
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ ${relPath}`);
        changes.forEach(c => console.log(c));
        return true;
    }
    return false;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const files = getFiles(PAGES_DIR);
let count = 0;
for (const file of files) {
    if (processFile(file)) count++;
}
console.log(`\n✓ Done! Updated ${count} files.`);
