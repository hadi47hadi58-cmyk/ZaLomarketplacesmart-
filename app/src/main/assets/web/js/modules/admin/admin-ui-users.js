import { fetchAllUsers, updateUserRole } from './admin-users.js';

export async function renderUsersTableReal() {
    const tbody = document.getElementById('global-users-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل المستخدمين...</td></tr>';
    
    const users = await fetchAllUsers();
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">لا يوجد مستخدمين حالياً</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50";
        
        let roleBadge = '';
        if (u.role === 'admin' || u.role === 'super_admin') roleBadge = '<span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">مدير نظام</span>';
        else if (u.role === 'manager' || u.role === 'staff' || u.role === 'team') roleBadge = '<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">فريق زالو</span>';
        else if (u.role === 'merchant') roleBadge = '<span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">تاجر معتمد</span>';
        else roleBadge = '<span class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">مشتري</span>';
        
        const safeName = u.full_name || u.name || 'مستخدم غير معروف';
        
        tr.innerHTML = `
            <td class="p-3">
                <div class="font-bold text-slate-700">${safeName}</div>
                <div class="text-xs text-slate-500" dir="ltr">${u.id.substring(0, 8)}...</div>
            </td>
            <td class="p-3 text-slate-600">${u.email || '-'}</td>
            <td class="p-3">${roleBadge}</td>
            <td class="p-3 text-slate-500">${u.phone || '-'}</td>
            <td class="p-3 flex gap-2">
                <button onclick="window.editUserRoleReal('${u.id}', '${u.role}')" class="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition" title="تعديل الصلاحيات"><i class="fa-solid fa-shield-halved"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editUserRoleReal = async function(id, currentRole) {
    const newRole = prompt("أدخل الدور الجديد (customer, merchant, manager, admin):", currentRole);
    if (newRole && newRole !== currentRole) {
        const success = await updateUserRole(id, newRole.toLowerCase());
        if (success) {
            if (typeof Swal !== 'undefined') Swal.fire('تم', 'تم تحديث صلاحيات المستخدم بنجاح', 'success');
            else alert("تم التحديث");
            renderUsersTableReal();
        } else {
            if (window.zaloErrorHandler) window.zaloErrorHandler.showError("فشل تحديث الصلاحيات");
        }
    }
}

// Replace legacy function
window.renderUsersTable = renderUsersTableReal;

export function initUsersRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('profiles', () => {
            renderUsersTableReal();
        });
    }
}
renderUsersTableReal();
