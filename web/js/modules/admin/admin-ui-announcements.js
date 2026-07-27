import { supabase } from '../../supabase-config.js';

export async function fetchAnnouncements() {
    // For now we will just use mock data or a dedicated table. Let's create an empty array if no table exists yet.
    // If we wanted to, we can create a 'global_announcements' table.
    // To not break the flow, let's keep it as is, or use localStorage for announcements just for now since it's not a core security issue.
    // Actually, let's just make it return empty or fetch from Supabase.
    if (!supabase) return [];
    try {
        const { data, error } = await supabase.from('global_announcements').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.warn("Announcements table might not exist yet, using fallback.");
        return JSON.parse(localStorage.getItem('zalo_global_announcements')) || [];
    }
}

export async function renderAnnouncementsReal() {
    const list = document.getElementById('announcements-list');
    if (!list) return;
    
    const anns = await fetchAnnouncements();
    if (anns.length === 0) {
        list.innerHTML = '<div class="text-center p-4 text-slate-500">لا توجد إعلانات حالياً</div>';
        return;
    }
    
    list.innerHTML = '';
    anns.forEach(a => {
        const div = document.createElement('div');
        div.className = "bg-slate-50 border-r-4 border-indigo-500 p-4 rounded-l-lg mb-3 flex justify-between items-start";
        div.innerHTML = `
            <div>
                <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold mb-2 inline-block">${a.type || 'إداري'}</span>
                <p class="text-slate-700 font-bold">${a.text}</p>
                <span class="text-xs text-slate-400 mt-2 block"><i class="fa-solid fa-clock mr-1"></i> ${new Date(a.created_at || a.date).toLocaleString('ar-DZ')}</span>
            </div>
        `;
        list.appendChild(div);
    });
}
window.renderAnnouncements = renderAnnouncementsReal;
renderAnnouncementsReal();
