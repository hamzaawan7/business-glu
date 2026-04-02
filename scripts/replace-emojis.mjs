/**
 * Script to replace all emoji characters with Icon component calls across TSX files.
 * Run with: node scripts/replace-emojis.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, '..', 'resources', 'js', 'Pages');

// Map of emoji → { iconName, displayText (optional) }
const EMOJI_MAP = {
    '📢': { icon: 'megaphone' },
    '📰': { icon: 'newspaper' },
    '🎉': { icon: 'party-popper' },
    '📊': { icon: 'chart-bar' },
    '📌': { icon: 'pin' },
    '⚡': { icon: 'bolt' },
    '💬': { icon: 'chat-bubble' },
    '👍': { icon: 'hand-thumb-up' },
    '👎': { icon: 'hand-thumb-down' },
    '👁': { icon: 'eye' },
    '👁️': { icon: 'eye' },
    '🎯': { icon: 'target' },
    '📎': { icon: 'paperclip' },
    '🖼️': { icon: 'photo' },
    '📷': { icon: 'camera' },
    '📄': { icon: 'document' },
    '💾': { icon: 'save' },
    '✨': { icon: 'sparkles' },
    '🚀': { icon: 'rocket' },
    '📅': { icon: 'calendar' },
    '⚙️': { icon: 'cog' },
    '👥': { icon: 'user-group' },
    '🌍': { icon: 'globe' },
    '🏢': { icon: 'building' },
    '👤': { icon: 'user' },
    '📱': { icon: 'phone' },
    '✅': { icon: 'check-circle' },
    '⚠️': { icon: 'exclamation-triangle' },
    '🟢': { icon: 'dot-green' },
    '📝': { icon: 'pencil' },
    '⏰': { icon: 'clock' },
    '🏠': { icon: 'home' },
    '❤️': { icon: 'heart' },
    '😂': { icon: 'face-smile' },
    '😀': { icon: 'face-smile' },
    '😮': { icon: 'face-surprised' },
    '😢': { icon: 'face-frown' },
    '🔥': { icon: 'fire' },
    '📭': { icon: 'inbox' },
    '🔰': { icon: 'shield-check' },
    '📋': { icon: 'clipboard-list' },
    '🎓': { icon: 'academic-cap' },
    '💼': { icon: 'briefcase' },
    '📚': { icon: 'book-open' },
    '🏆': { icon: 'trophy' },
    '📦': { icon: 'archive-box' },
    '🔔': { icon: 'bell' },
    '🗂️': { icon: 'folder-stack' },
    '📞': { icon: 'phone-call' },
    '🔍': { icon: 'magnifying-glass' },
    '❌': { icon: 'x-circle' },
    '💡': { icon: 'light-bulb' },
    '🔒': { icon: 'lock-closed' },
    '🔗': { icon: 'link' },
    '📑': { icon: 'document-text' },
    '🤝': { icon: 'handshake' },
    '💰': { icon: 'currency-dollar' },
    '🛡️': { icon: 'shield-check' },
    '⭐': { icon: 'star' },
    '📖': { icon: 'book-open' },
    '❓': { icon: 'question-mark-circle' },
    '🔧': { icon: 'wrench' },
    '🗑️': { icon: 'trash' },
    '✏️': { icon: 'pencil-square' },
    '📂': { icon: 'folder-open' },
    '📸': { icon: 'camera' },
    '🎬': { icon: 'video-camera' },
    '🗳️': { icon: 'clipboard-list' },
    '📃': { icon: 'document-text' },
    '📁': { icon: 'folder-open' },
    '☕': { icon: 'coffee-cup' },
    '🤔': { icon: 'question-mark' },
    '👏': { icon: 'hand-raised' },
    '💪': { icon: 'fire' },
    '📧': { icon: 'paperclip' },
    '🕐': { icon: 'clock' },
    '🕒': { icon: 'clock' },
    '⏸': { icon: 'pause' },
};

// Files to process
function getFiles(dir) {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results.push(...getFiles(fullPath));
        } else if (item.name.endsWith('.tsx')) {
            results.push(fullPath);
        }
    }
    return results;
}

function hasEmoji(content) {
    for (const emoji of Object.keys(EMOJI_MAP)) {
        if (content.includes(emoji)) return true;
    }
    return false;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!hasEmoji(content)) return false;

    const relPath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`\nProcessing: ${relPath}`);

    // Check if Icon import already exists
    const hasIconImport = content.includes("from '@/Components/Icon'") || content.includes('from "@/Components/Icon"');

    let modified = false;

    // Strategy: Replace emojis in different contexts differently
    // 1. In string literals (Record maps, arrays, objects) → icon name string
    // 2. In JSX text → <Icon /> component
    // 3. In JSX attributes → icon name

    // --- PASS 1: Replace emoji in Record<string, string> type icon maps ---
    // Pattern: icon: '📢' or '📢': ... or : '📢 Text'
    // These become references to icon names for later JSX rendering

    // Handle typeIcons maps like: { announcement: '📢', news: '📰' }
    // Replace the emoji value with the icon name
    for (const [emoji, { icon: iconName }] of Object.entries(EMOJI_MAP)) {
        // In record maps where the emoji IS the value: `announcement: '📢'`
        const recordPattern = new RegExp(`(:\\s*)'${escapeRegex(emoji)}'`, 'g');
        if (recordPattern.test(content)) {
            content = content.replace(recordPattern, `$1'${iconName}'`);
            modified = true;
        }

        // In typeLabels maps: `announcement: '📢 Announcement'` → just 'Announcement'
        const labelPattern = new RegExp(`'${escapeRegex(emoji)}\\s+([^']+)'`, 'g');
        if (labelPattern.test(content)) {
            content = content.replace(labelPattern, "'$1'");
            modified = true;
        }

        // In arrays: ['📢', '📰'] → ['megaphone', 'newspaper']
        const arrayPattern = new RegExp(`'${escapeRegex(emoji)}'`, 'g');
        if (arrayPattern.test(content)) {
            content = content.replace(arrayPattern, `'${iconName}'`);
            modified = true;
        }

        // In option tags: <option value="announcement">📢 Announcement</option>
        // → <option value="announcement">Announcement</option>
        const optionPattern = new RegExp(`>${escapeRegex(emoji)}\\s+`, 'g');
        if (optionPattern.test(content)) {
            content = content.replace(optionPattern, '>');
            modified = true;
        }

        // Standalone emoji in JSX: <span>📢</span> or <span className="...">📢</span>
        // → <span><Icon name="megaphone" className="w-4 h-4 inline-block" /></span>
        const jsxStandalonePattern = new RegExp(`>${escapeRegex(emoji)}<`, 'g');
        if (jsxStandalonePattern.test(content)) {
            content = content.replace(jsxStandalonePattern, `><Icon name="${iconName}" className="w-4 h-4 inline-block" /><`);
            modified = true;
        }

        // Emoji at start of JSX text followed by text: >📢 Updates<
        // → ><Icon name="megaphone" className="w-4 h-4 inline-block mr-1" /> Updates<
        const jsxTextStartPattern = new RegExp(`>${escapeRegex(emoji)}\\s+([^<]+)<`, 'g');
        if (jsxTextStartPattern.test(content)) {
            content = content.replace(jsxTextStartPattern, `><Icon name="${iconName}" className="w-4 h-4 inline-block mr-1" />$1<`);
            modified = true;
        }

        // Emoji in JSX expressions: {typeIcons[type] || '📢'}
        // Already handled by the string replacement above

        // Emoji in template literal or plain text in JSX
        const jsxInlinePattern = new RegExp(`\\{\\s*'${escapeRegex(emoji)}'\\s*\\}`, 'g');
        if (jsxInlinePattern.test(content)) {
            content = content.replace(jsxInlinePattern, `{<Icon name="${iconName}" className="w-4 h-4 inline-block" />}`);
            modified = true;
        }

        // Bare emoji in JSX (between whitespace): \n                                📢\n
        const bareJsxPattern = new RegExp(`(\\s+)${escapeRegex(emoji)}(\\s*)$`, 'gm');
        if (bareJsxPattern.test(content)) {
            content = content.replace(bareJsxPattern, `$1<Icon name="${iconName}" className="w-4 h-4 inline-block" />$2`);
            modified = true;
        }

        // In JSX text mixed: "📢 {count}" → "<Icon .../> {count}"
        const mixedJsxPattern = new RegExp(`${escapeRegex(emoji)}\\s+(\\{)`, 'g');
        if (mixedJsxPattern.test(content)) {
            content = content.replace(mixedJsxPattern, `<Icon name="${iconName}" className="w-3.5 h-3.5 inline-block mr-0.5" /> $1`);
            modified = true;
        }

        // Remaining standalone emojis (very greedy, last resort)
        if (content.includes(emoji)) {
            content = content.replaceAll(emoji, `<Icon name="${iconName}" className="w-4 h-4 inline-block" />`);
            modified = true;
        }
    }

    if (modified) {
        // Add Icon import if needed
        if (!hasIconImport && content.includes('<Icon ')) {
            // Find the first import line
            const importMatch = content.match(/^import .+ from ['"].+['"];?\s*$/m);
            if (importMatch) {
                const insertPos = importMatch.index + importMatch[0].length;
                content = content.slice(0, insertPos) + "\nimport Icon from '@/Components/Icon';" + content.slice(insertPos);
            }
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✓ Updated`);
        return true;
    }

    return false;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run
const files = getFiles(PAGES_DIR);
let count = 0;
for (const file of files) {
    if (processFile(file)) count++;
}
console.log(`\n✓ Done! Updated ${count} files.`);
