/**
 * Replace merge tags like {{name}}, {{company}} etc. with contact data
 */
export const replaceMergeTags = (text, contact) => {
    if (!text || !contact) return text;

    let result = text;

    // Standard fields
    result = result.replace(/\{\{name\}\}/gi, contact.name || '');
    result = result.replace(/\{\{email\}\}/gi, contact.email || '');
    result = result.replace(/\{\{company\}\}/gi, contact.company || '');
    result = result.replace(/\{\{first_name\}\}/gi, (contact.name || '').split(' ')[0] || '');
    result = result.replace(/\{\{last_name\}\}/gi, (contact.name || '').split(' ').slice(1).join(' ') || '');

    // Custom fields
    if (contact.customFields) {
        const fields = contact.customFields instanceof Map
            ? Object.fromEntries(contact.customFields)
            : contact.customFields;

        for (const [key, value] of Object.entries(fields)) {
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'gi');
            result = result.replace(regex, value || '');
        }
    }

    // Clean up any remaining unresolved tags
    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
};

/**
 * Extract all merge tags from a text
 */
export const extractMergeTags = (text) => {
    if (!text) return [];
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
};
