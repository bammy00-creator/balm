do $$
declare
  clinic_a uuid;
  clinic_b uuid;
  branch_a1 uuid;
  branch_a2 uuid;
  branch_b1 uuid;
begin
  insert into clinics (name, slug, phone, email, state, lga, address, plan, monthly_response_limit, status)
  values ('Green Cross Family Clinic', 'green-cross-family-clinic', '+2348031234567', 'info@greencrossclinic.ng', 'Lagos', 'Ikeja', '14 Adeniyi Jones Avenue, Ikeja', 'free', 50, 'active')
  returning id into clinic_a;

  insert into clinics (name, slug, phone, email, state, lga, address, plan, monthly_response_limit, status)
  values ('Radiant Health Clinic', 'radiant-health-clinic', '08056781234', 'contact@radianthealth.ng', 'Oyo', 'Ibadan North', '22 Bodija Road, Ibadan', 'free', 50, 'active')
  returning id into clinic_b;

  insert into branches (clinic_id, name, address, is_default) values
    (clinic_a, 'Ikeja Branch', '14 Adeniyi Jones Avenue, Ikeja', true)
    returning id into branch_a1;
  insert into branches (clinic_id, name, address, is_default) values
    (clinic_a, 'Lekki Branch', '5 Admiralty Way, Lekki Phase 1', false)
    returning id into branch_a2;
  insert into branches (clinic_id, name, address, is_default) values
    (clinic_b, 'Bodija Branch', '22 Bodija Road, Ibadan', true)
    returning id into branch_b1;

  insert into providers (clinic_id, branch_id, full_name, role, is_active) values
    (clinic_a, branch_a1, 'Dr. Ngozi Eze', 'Doctor', true),
    (clinic_a, branch_a1, 'Nurse Femi Adigun', 'Nurse', true),
    (clinic_a, branch_a1, 'Chidinma Okafor', 'Front desk', true),
    (clinic_a, branch_a2, 'Dr. Tunde Bakare', 'Doctor', true),
    (clinic_a, branch_a2, 'Nurse Grace Umeh', 'Nurse', true),
    (clinic_b, branch_b1, 'Dr. Amina Suleiman', 'Doctor', true),
    (clinic_b, branch_b1, 'Nurse Bisi Owolabi', 'Nurse', true),
    (clinic_b, branch_b1, 'Kelechi Nwosu', 'Front desk', true);

  insert into feedback_links (clinic_id, branch_id, channel, label, is_active) values
    (clinic_a, branch_a1, 'qr', 'Ikeja waiting room poster', true),
    (clinic_a, branch_a2, 'qr', 'Lekki waiting room poster', true),
    (clinic_b, branch_b1, 'qr', 'Bodija front desk QR', true);
end $$;
