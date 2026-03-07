
UPDATE public.custom_positions 
SET permissions = array_append(permissions, 'shared-cart')
WHERE NOT ('shared-cart' = ANY(permissions));
