/**
 * ZaLo Smart - Supabase Realtime Sync
 * Enables live UI updates when data changes in the database.
 */
import { supabase } from './supabase-config.js';

export class ZaLoRealtime {
    constructor() {
        this.subscriptions = [];
        this.listeners = {};
    }

    /**
     * Subscribe to changes on a specific table
     */
    subscribeToTable(tableName, callback) {
        if (!supabase) return;

        console.log(`[ZaLo Realtime] Subscribing to ${tableName}...`);
        const channel = supabase
            .channel(`public:${tableName}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                (payload) => {
                    console.log(`[ZaLo Realtime] Change received on ${tableName}:`, payload);
                    if (callback) callback(payload);
                    this.notifyListeners(tableName, payload);
                }
            )
            .subscribe();

        this.subscriptions.push(channel);
        return channel;
    }

    /**
     * Register a generic listener for a table
     */
    on(tableName, callback) {
        if (!this.listeners[tableName]) {
            this.listeners[tableName] = [];
        }
        this.listeners[tableName].push(callback);
    }

    notifyListeners(tableName, payload) {
        if (this.listeners[tableName]) {
            this.listeners[tableName].forEach(cb => cb(payload));
        }
    }

    unsubscribeAll() {
        this.subscriptions.forEach(channel => {
            supabase.removeChannel(channel);
        });
        this.subscriptions = [];
    }
}

window.zaloRealtime = new ZaLoRealtime();
export default window.zaloRealtime;
