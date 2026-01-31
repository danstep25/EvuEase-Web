import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  hasPermission(): boolean {
    try {
      const userInfo = sessionStorage.getItem('userInfo');
      if (!userInfo) return false;
      
      const { role } = JSON.parse(userInfo);
      if (role === 'staff') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}




