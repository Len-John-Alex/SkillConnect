'use strict';

/**
 * Factory: returns middleware that checks req.user.role against allowed roles.
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} allowedRoles  e.g. 'student', 'company', 'admin'
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions.' });
    }

    next();
  };
}

module.exports = { authorize };
