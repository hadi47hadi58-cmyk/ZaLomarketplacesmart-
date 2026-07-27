export function setupAdminUI() {
    window.switchTab = function(tabId) {
        const sections = ['home', 'registrations', 'wilayas', 'notifications', 'secret', 'qr', 'settings-global', 'reports-global', 'users-global', 'products-global', 'team'];
        sections.forEach(sec => {
            const el = document.getElementById(`section-${sec}`);
            if (el) {
                if (sec === tabId) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        });
        
        // Update sidebar styling
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/30', 'font-black');
            item.classList.add('text-slate-300', 'hover:bg-slate-800/60', 'font-bold');
        });
        
        const activeItem = document.getElementById(`tab-${tabId}`);
        if (activeItem) {
            activeItem.classList.remove('text-slate-300', 'hover:bg-slate-800/60');
            activeItem.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/30', 'font-black');
        }

        // Trigger specific loads
        if (tabId === 'registrations') {
            if (window.renderPendingList) window.renderPendingList();
            if (window.renderStoresList) window.renderStoresList();
        } else if (tabId === 'users-global') {
            if (window.renderUsersGlobal) window.renderUsersGlobal();
        } else if (tabId === 'products-global') {
            if (window.renderProductsGlobal) window.renderProductsGlobal();
        } else if (tabId === 'settings-global') {
            if (window.loadGlobalSettings) window.loadGlobalSettings();
        } else if (tabId === 'home') {
            if (window.renderHomeStats) window.renderHomeStats();
        } else if (tabId === 'team') {
            if (window.renderTeamTable) window.renderTeamTable();
        }
    };

    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('-translate-x-full');
    };

    window.closeSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth < 1024) {
            sidebar.classList.add('-translate-x-full');
        }
    };
}
