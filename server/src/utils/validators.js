/**
 * Stricter email validation
 * Checks: no consecutive dots, valid local part, TLD 2-63 chars
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const str = email.trim().toLowerCase();
    if (str.length > 254) return false;
    // RFC-compliant-ish regex: local@domain.tld
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/;
    if (!re.test(str)) return false;
    // No consecutive dots in local part
    const [local] = str.split('@');
    if (local.includes('..')) return false;
    return true;
};

/**
 * Check if email is a role-based address
 */
export const isRoleBasedEmail = (email) => {
    const rolePrefixes = [
        'info', 'hello', 'contact', 'press', 'support', 'editorial',
        'admin', 'advertising', 'sales', 'help', 'team', 'office',
        'hr', 'jobs', 'careers', 'billing', 'abuse', 'postmaster',
        'webmaster', 'noreply', 'no-reply',
    ];
    const prefix = email.split('@')[0].toLowerCase();
    return rolePrefixes.includes(prefix);
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (email) => {
    return String(email).toLowerCase().trim();
};
