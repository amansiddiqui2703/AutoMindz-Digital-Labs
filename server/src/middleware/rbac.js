/**
 * Role-Based Access Control (RBAC) Middleware
 */
const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Forbidden: ${req.user.role} role does not have access to this resource` 
            });
        }

        next();
    };
};

export default authorize;
