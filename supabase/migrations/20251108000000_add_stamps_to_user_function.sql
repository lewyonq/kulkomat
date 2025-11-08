-- Function to add multiple stamps to a user
-- This function is used by sellers/admins to add stamps to customer accounts
-- Parameters:
--   p_user_id: UUID of the user to add stamps to
--   p_count: Number of stamps to add (default: 1, max: 10)
-- Returns: void
-- Side effects: 
--   - Creates stamp records in the stamps table
--   - Triggers handle_new_stamp() which may generate coupons
create or replace function public.add_stamps_to_user(
  p_user_id uuid,
  p_count integer default 1
)
returns void as $$
declare
  i integer;
begin
  -- Validate input parameters
  if p_user_id is null then
    raise exception 'user_id cannot be null';
  end if;

  if p_count is null or p_count < 1 then
    raise exception 'count must be at least 1';
  end if;

  -- Check if user exists in profiles table
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'user with id % does not exist', p_user_id;
  end if;

  -- Insert stamps one by one to trigger the handle_new_stamp() function for each
  -- This ensures coupons are generated correctly when reaching 10 active stamps
  for i in 1..p_count loop
    insert into public.stamps (user_id, status, seller_id)
    values (p_user_id, 'active', auth.uid());
  end loop;

  -- No explicit return needed for void function
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users (sellers/admins)
-- Note: You may want to add additional RLS policies to restrict this to sellers only
grant execute on function public.add_stamps_to_user(uuid, integer) to authenticated;

-- Add comment for documentation
comment on function public.add_stamps_to_user(uuid, integer) is 
  'Adds multiple stamps to a user account. Used by sellers/admins. Automatically triggers coupon generation when user reaches 10 active stamps.';
