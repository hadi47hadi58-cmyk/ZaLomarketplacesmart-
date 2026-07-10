import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto, LoginDto } from './auth.controller';
import { AuditService } from '../audit/audit.service';
import { PasswordHasher } from '../security/password-hasher';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private auditService: AuditService,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Registers a new user both in Supabase Auth and public.users table.
   * 
   * RLS Interaction Strategy:
   * - Supabase Auth creates the user in auth.users and returns a unique UUID (supabase_uid).
   * - This UUID is linked via the 'supabase_uid' column in the public.users table.
   * - Under RLS policies, users are granted privileges to SELECT and UPDATE their own rows 
   *   only if their auth.uid() matches their supabase_uid (auth.uid() = supabase_uid).
   */
  async signUp(dto: RegisterDto) {
    const supabase = this.supabaseService.getClient();

    // 1. Ensure user is unique in our database to prevent collisions
    const { data: exists, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', dto.email.toLowerCase())
      .maybeSingle();

    if (checkError) {
      throw new ConflictException('خطأ في الاتصال بقاعدة البيانات أثناء التحقق من الحساب');
    }

    if (exists) {
      throw new ConflictException('البريد الإلكتروني المدخل مستعمل مسبقاً بالمنصة');
    }

    // 2. Register the user in Supabase Auth (auth.users schema)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dto.email.toLowerCase(),
      password: dto.password,
      options: {
        data: {
          name: dto.name,
          role: dto.role,
        }
      }
    });

    if (authError || !authData?.user) {
      throw new ConflictException(
        authError?.message || 'تعذر تسجيل الحساب في نظام الهوية الموحد لـ Supabase'
      );
    }

    const supabaseUid = authData.user.id;

    // 3. Hash password for local fallback verification and legacy support
    const hashedPassword = await PasswordHasher.hash(dto.password);

    // 4. Create public user profile linked to the Supabase Auth UUID (supabase_uid)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: dto.name,
        email: dto.email.toLowerCase(),
        password_hash: hashedPassword,
        role: dto.role,
        status: 'ACTIVE',
        wilaya: dto.wilaya,
        commune: dto.commune,
        phone: dto.phone || null,
        loyalty_points: 0,
        supabase_uid: supabaseUid,
      })
      .select()
      .single();

    if (insertError || !newUser) {
      // Rollback auth user if profile insertion failed to maintain transactional consistency
      await supabase.auth.admin.deleteUser(supabaseUid).catch(() => {});
      throw new ConflictException('تعذر إنشاء الملف الشخصي المطابق للمستخدم، يرجى إعادة المحاولة');
    }

    // Write a trace in the audit logs
    this.auditService.log(
      newUser.name,
      'USER_SIGNUP',
      `تم تسجيل حساب مستخدم جديد بنجاح بدور: ${newUser.role} في ولاية: ${newUser.wilaya}`
    );

    // If session is already issued (e.g. automatically on signUp), store it in active sessions
    let token = authData.session?.access_token || null;
    if (authData.session) {
      await supabase.from('sessions').insert({
        user_id: supabaseUid,
        token: token,
      });
    }

    return {
      message: 'تم تسجيل الحساب بنجاح، أهلاً بك في فضاء ZaLo الذكي ✨',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        wilaya: newUser.wilaya,
        commune: newUser.commune,
        supabase_uid: supabaseUid,
      },
      accessToken: token,
      access_token: token,
    };
  }

  /**
   * Alias for register() to maintain full backward compatibility with any REST controllers
   */
  async register(dto: RegisterDto) {
    return this.signUp(dto);
  }

  /**
   * Authenticates a user against Supabase Auth, retrieves their public profile,
   * and tracks their active connection session.
   * 
   * RLS Interaction Strategy:
   * - authenticates via Supabase, which issues an access token tied to the user's UUID.
   * - Creates a session record inside the public.sessions table.
   * - Under RLS policies, users can SELECT and DELETE their own sessions based on auth.uid() = user_id.
   */
  async signIn(dto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    // 1. Authenticate with Supabase Auth Provider
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: dto.email.toLowerCase(),
      password: dto.password,
    });

    if (authError || !authData?.user || !authData?.session) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة، يرجى إعادة المحاولة');
    }

    const supabaseUid = authData.user.id;
    const token = authData.session.access_token;

    // 2. Fetch corresponding public user profile
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_uid', supabaseUid)
      .maybeSingle();

    if (fetchError || !user) {
      throw new UnauthorizedException('لم يتم العثور على ملف تعريف مطابق لهذا الحساب بالمنصة');
    }

    // 3. Track active session in the public.sessions table
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: supabaseUid,
        token: token,
      });

    if (sessionError) {
      throw new ConflictException('فشل في تسجيل جلسة الاتصال الآمنة بقاعدة البيانات');
    }

    // Log the successful authentication trace
    this.auditService.log(
      user.name,
      'USER_LOGIN',
      `تسجيل دخول حساب مستقر من رتبة: ${user.role} تحت عنوان: ${user.wilaya}`
    );

    return {
      message: 'أهلاً بعودتك الميمونة لـ ZaLo Smart! 🌟',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        wilaya: user.wilaya,
        commune: user.commune,
        loyaltyPoints: user.loyalty_points,
        supabase_uid: supabaseUid,
      },
      accessToken: token,
      access_token: token,
    };
  }

  /**
   * Alias for login() to maintain full backward compatibility with any REST controllers
   */
  async login(dto: LoginDto) {
    return this.signIn(dto);
  }

  /**
   * Logs a user out by removing their session from the sessions table and signing them out of Supabase Auth.
   */
  async logout(token: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Resolve user ID from token
    const { data: { user } } = await supabase.auth.getUser(token);

    // 2. Remove token from sessions table (making it completely invalid)
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('token', token);

    if (error) {
      throw new ConflictException('فشل في تسجيل الخروج وإلغاء جلسة العمل');
    }

    // 3. Sign out of Supabase identity provider
    if (user) {
      await supabase.auth.signOut();
    }

    return {
      message: 'تم تسجيل الخروج بنجاح، رافقتك السلامة ✨'
    };
  }

  /**
   * Retrieves a user by their PostgreSQL SERIAL id.
   */
  async findUserById(id: number) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      passwordHash: data.password_hash,
      loyaltyPoints: data.loyalty_points,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
