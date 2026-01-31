export class BadgeUtil {
  static getRoleBadgeClass(role: string | null | undefined): string {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower === 'admin') return 'bg-yellow-100 text-yellow-800';
    if (roleLower === 'evaluator') return 'bg-blue-100 text-blue-800';
    if (roleLower === 'registrar') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }

  static getActionBadgeClass(action: string | null | undefined): string {
    const actionUpper = action?.toUpperCase() || '';
    if (actionUpper === 'CREATE') return 'bg-green-100 text-green-800';
    if (actionUpper === 'UPDATE') return 'bg-blue-100 text-blue-800';
    if (actionUpper === 'DELETE') return 'bg-red-100 text-red-800';
    if (actionUpper === 'FINALIZE' || actionUpper === 'GENERATE') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  }

  static getStatusBadgeClass(status: string | number | null | undefined): string {
    if (typeof status === 'number') {
      return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    
    const statusStr = status?.toString().toLowerCase() || '';
    if (statusStr === 'active' || statusStr === '1') return 'bg-green-100 text-green-800';
    if (statusStr === 'inactive' || statusStr === '0') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }
}

