import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient;

  // Supabase Credentials (loaded from environment)
  private readonly supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  private readonly supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  onModuleInit() {
    this.logger.log('Initializing Supabase client with Service Role / API Key...');
    if (!this.supabaseUrl || !this.supabaseKey) {
      this.logger.warn('Supabase URL or KEY is missing from process.env, initializing fallback.');
    }

    try {
      if (this.supabaseUrl && this.supabaseKey) {
        this.supabaseClient = createClient(this.supabaseUrl, this.supabaseKey, {
          auth: {
            persistSession: false, // Recommended for backend services
            autoRefreshToken: false,
          }
        });
        this.logger.log('Supabase client successfully initialized with admin/service-role permissions!');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  /**
   * Returns the initialized Supabase client instance to perform database operations,
   * authentication, storage actions, or function calls with full permissions.
   */
  getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      this.onModuleInit();
    }
    return this.supabaseClient;
  }

  getAdminClient(): SupabaseClient {
    return this.getClient();
  }
}
