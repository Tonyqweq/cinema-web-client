/**
 * @param {string[]|undefined|null} allowedRoles 若为空，表示仅需登录即可访问
 */
export function getStoredRoles() {
  try {
    const raw = localStorage.getItem('admin_roles')
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function canAccessAny(allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  const mine = getStoredRoles()
  return allowedRoles.some((r) => mine.includes(r))
}

export function persistSessionPayload(data) {
  if (!data || typeof data !== 'object') return
  if (Array.isArray(data.roles)) {
    localStorage.setItem('admin_roles', JSON.stringify(data.roles))
  } else {
    localStorage.removeItem('admin_roles')
  }
  if (Array.isArray(data.permissions)) {
    localStorage.setItem('admin_permissions', JSON.stringify(data.permissions))
  } else {
    localStorage.removeItem('admin_permissions')
  }
  if (data.user && data.user.username) {
    localStorage.setItem('admin_login_username', data.user.username)
  }
}
