-- Function to increment stamp_count and create a coupon when the count reaches 10
create or replace function public.increment_stamp_count() 
returns trigger as $$
declare
  new_stamp_count smallint;
  new_coupon_id bigint;
begin
  -- Increment stamp_count and return the new value
  update public.profiles
  set stamp_count = stamp_count + 1
  where id = new.user_id
  returning stamp_count into new_stamp_count;

  -- If stamp_count reaches 10, reset it and create a coupon
  if new_stamp_count >= 10 then
    update public.profiles
    set stamp_count = new_stamp_count - 10
    where id = new.user_id;

    insert into public.coupons (user_id, type, value, status, expires_at)
    values (new.user_id, 'free_scoop', null, 'active', now() + interval '30 days')
    returning id into new_coupon_id;

    update public.stamps
    set status = 'redeemed', redeemed_for_coupon_id = new_coupon_id
    where id in (
      select id
      from public.stamps
      where user_id = new.user_id and status = 'active'
      order by created_at
      limit 10
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function after a new stamp is inserted
drop trigger if exists on_stamp_created on public.stamps;
create trigger on_stamp_created
  after insert on public.stamps
  for each row execute procedure public.increment_stamp_count();
