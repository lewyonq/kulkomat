-- Function to increment stamp_count and create a coupon when the count reaches 10
create or replace function public.handle_new_stamp()
returns trigger as $$
declare
  active_stamps_count integer;
  new_coupon_id bigint;
  stamps_to_redeem_ids bigint[];
begin
  -- Count active stamps for the user
  select count(*)
  into active_stamps_count
  from public.stamps
  where user_id = new.user_id and status = 'active';

  -- If there are 10 or more active stamps, create a coupon and redeem them
  if active_stamps_count >= 10 then
    -- Get the IDs of the 10 oldest active stamps
    select array_agg(id)
    into stamps_to_redeem_ids
    from (
      select id
      from public.stamps
      where user_id = new.user_id and status = 'active'
      order by created_at
      limit 10
    ) as stamps_to_redeem;

    -- Create a new coupon
    insert into public.coupons (user_id, type, value, status, expires_at)
    values (new.user_id, 'free_scoop', null, 'active', now() + interval '30 days')
    returning id into new_coupon_id;

    -- Redeem the 10 stamps
    update public.stamps
    set status = 'redeemed', redeemed_for_coupon_id = new_coupon_id
    where id = any(stamps_to_redeem_ids);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function after a new stamp is inserted
drop trigger if exists on_stamp_created on public.stamps;
create trigger on_stamp_created
  after insert on public.stamps
  for each row execute procedure public.handle_new_stamp();
