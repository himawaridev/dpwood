const ROLES = Object.freeze({
    ROOT: "root",
    ADMIN: "admin",
    STAFF: "staff",
    USER: "user",
});
const LEGACY_SELLER_ROLE = "seller";

const ADMIN_ROLES = Object.freeze([ROLES.ROOT, ROLES.ADMIN]);
const MANAGER_ROLES = Object.freeze([...ADMIN_ROLES, ROLES.STAFF]);
const ASSIGNABLE_ROLES = Object.freeze([
    ROLES.ROOT,
    ROLES.ADMIN,
    ROLES.USER,
    ROLES.STAFF,
]);

const hasRole = (user, roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return Boolean(user?.role && allowedRoles.includes(user.role));
};

module.exports = {
    ROLES,
    LEGACY_SELLER_ROLE,
    ADMIN_ROLES,
    MANAGER_ROLES,
    ASSIGNABLE_ROLES,
    hasRole,
};
