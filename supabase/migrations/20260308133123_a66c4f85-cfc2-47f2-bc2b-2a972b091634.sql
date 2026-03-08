CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, email, full_name, phone, cpf, birth_date, gender, instagram,
    address_cep, address_street, address_number, address_complement,
    address_neighborhood, address_city, address_state
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'cpf', ''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date,
    NULLIF(NEW.raw_user_meta_data->>'gender', ''),
    NULLIF(NEW.raw_user_meta_data->>'instagram', ''),
    NULLIF(NEW.raw_user_meta_data->>'address_cep', ''),
    NULLIF(NEW.raw_user_meta_data->>'address_street', ''),
    NULLIF(NEW.raw_user_meta_data->>'address_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'address_complement', ''),
    NULLIF(NEW.raw_user_meta_data->>'address_neighborhood', ''),
    NULLIF(NEW.raw_user_meta_data->>'address_city', ''),
    NULLIF(NEW.raw_user_meta_data->>'address_state', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;