import { supabase } from '../../supabase-config.js';

export async function fetchAllUsers() {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error fetching users:", e);
        return [];
    }
}

export async function updateUserRole(userId, newRole) {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error updating role:", e);
        return false;
    }
}
