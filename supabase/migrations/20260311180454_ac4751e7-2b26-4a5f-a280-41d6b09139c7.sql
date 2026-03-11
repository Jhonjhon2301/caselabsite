UPDATE public.custom_positions 
SET permissions = ARRAY['dashboard','products','stock','orders','financial','coupons','categories','documents','banner','payments','reminders','notes','team','designer','roles','fiscal','customers','b2b','production','bi','dre','audit','blog','reviews','leads','docs','internal_stock','proposals','shared-cart','chat','art-templates','newsletter'],
    updated_at = now()
WHERE name = 'ceo';