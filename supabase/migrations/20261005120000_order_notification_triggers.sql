-- Automatic in-app notifications for orders (Supabase-only, no Firebase).
-- A failure here must NEVER block creating/updating an order, so every insert
-- is wrapped in an exception handler that only raises a warning.
-- Already applied directly to production on 2026-10-05; this file documents it.

create or replace function public.notify_on_order_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_merchant_id integer;
begin
  begin
    select merchant_id into v_merchant_id from public.stores where id = new.store_id;

    if v_merchant_id is not null then
      insert into public.notifications (user_id, title, message)
      values (v_merchant_id, 'طلب جديد 🛒', 'وصلك طلب جديد رقم #' || new.id || '. راجع لوحة التحكم لتأكيده.');
    end if;

    if new.customer_id is not null then
      insert into public.notifications (user_id, title, message)
      values (new.customer_id, 'تم استلام طلبك 📥', 'طلبك رقم #' || new.id || ' قيد المراجعة من التاجر.');
    end if;
  exception when others then
    raise warning 'notify_on_order_insert failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function public.notify_on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_msg text;
  v_merchant_id integer;
begin
  begin
    if new.status::text = 'CONFIRMED' then
      v_title := 'تم تأكيد طلبك ✅'; v_msg := 'التاجر أكّد طلبك رقم #' || new.id || ' وجارٍ تجهيزه.';
    elsif new.status::text = 'SHIPPING' then
      v_title := 'طلبك في الطريق 🚚'; v_msg := 'طلبك رقم #' || new.id || ' خرج للتوصيل.';
    elsif new.status::text = 'DELIVERED' then
      v_title := 'تم التسليم 🎉'; v_msg := 'تم تسليم طلبك رقم #' || new.id || '. نتمنى أن ينال إعجابك!';
    elsif new.status::text = 'CANCELLED' then
      v_title := 'تم إلغاء الطلب ❌'; v_msg := 'تم إلغاء الطلب رقم #' || new.id || '.';
    elsif new.status::text = 'DISPUTED' then
      v_title := 'نزاع على الطلب ⚠️'; v_msg := 'تم فتح نزاع على الطلب رقم #' || new.id || ' وسيتواصل معك الدعم.';
    end if;

    if v_title is not null and new.customer_id is not null then
      insert into public.notifications (user_id, title, message) values (new.customer_id, v_title, v_msg);
    end if;

    if new.status::text in ('CANCELLED','DISPUTED') then
      select merchant_id into v_merchant_id from public.stores where id = new.store_id;
      if v_merchant_id is not null then
        insert into public.notifications (user_id, title, message) values (v_merchant_id, v_title, v_msg);
      end if;
    end if;
  exception when others then
    raise warning 'notify_on_order_status_change failed: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_notify_order_insert on public.orders;
create trigger trg_notify_order_insert
  after insert on public.orders
  for each row execute function public.notify_on_order_insert();

drop trigger if exists trg_notify_order_status on public.orders;
create trigger trg_notify_order_status
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_on_order_status_change();
