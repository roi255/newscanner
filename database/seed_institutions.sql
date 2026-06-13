-- ============================================================================
--  ExamPass — institution seed (generated from src/data/institutions.ts TENANTS)
--  PostgreSQL. Load AFTER schema.sql. Idempotent (ON CONFLICT upsert on code).
--  Only stemmuco + makumira are 'active' (keys provisioned); the rest are
--  'provisional' with no credential row until a key is generated.
-- ============================================================================

INSERT INTO institution
  (code, name, short_name, org_abbr, location, accent, base_url, db_name, status, name_confirmed)
VALUES
  ('stemmuco','Stella Maris Mtwara University College','STE','STEMMUCO','Mtwara, Tanzania','#1f6f4a','https://stemmuco.osim.cloud','osim_stemmuco','active',true),
  ('makumira','Tumaini University Makumira','TUMA','TUMA','Usa River, Arusha','#2456b8','https://osim.makumira.ac.tz','osim_makumira','active',true),
  ('ajuco','Archbishop James University College','AJUCO','AJUCO','Songea, Ruvuma','#b8432a','https://ajuco.osim.cloud','osim_ajuco','provisional',true),
  ('amucta','Archbishop Mihayo University College of Tabora','AMU','AMUCTA','Tabora, Tanzania','#6d28d9','https://amucta.osim.cloud','osim_amucta','provisional',true),
  ('bugando','Catholic University of Health and Allied Sciences (Bugando)','CUHAS','BUGANDO','Mwanza, Tanzania','#0e7490','https://bugando.osim.cloud','osim_bugando','provisional',true),
  ('carumuco','Cardinal Rugambwa Memorial University College','CRMU','CARUMUCO','Bukoba, Kagera','#be123c','https://carumuco.osim.cloud','osim_carumuco','provisional',true),
  ('chatocohest','chatocohest','CHATO','CHATOCOHEST','Chato, Geita','#15803d','https://chatocohest.osim.cloud','osim_chatocohest','provisional',false),
  ('dartu','dartu','DART','DARTU','Tanzania','#c2410c','https://dartu.osim.cloud','osim_dartu','provisional',false),
  ('fhti','fhti','FHTI','FHTI','Tanzania','#7c3aed','https://fhti.osim.cloud','osim_fhti','provisional',false),
  ('hkmu','Hubert Kairuki Memorial University','HKMU','HKMU','Dar es Salaam','#b91c1c','https://hkmu.osim.cloud','osim_hkmu','provisional',true),
  ('kiahs','kiahs','KIAHS','KIAHS','Tanzania','#0f766e','https://kiahs.osim.cloud','osim_kiahs','provisional',false),
  ('kiut','Kampala International University in Tanzania','KIUT','KIUT','Dar es Salaam','#1d4ed8','https://kiut.osim.cloud','osim_kiut','provisional',true),
  ('ksp','ksp','KSP','KSP','Tanzania','#a16207','https://ksp.osim.cloud','osim_ksp','provisional',false),
  ('lihas','lihas','LIHAS','LIHAS','Tanzania','#0891b2','https://lihas.osim.cloud','osim_lihas','provisional',false),
  ('mti','mti','MTI','MTI','Tanzania','#9333ea','https://mti.osim.cloud','osim_mti','provisional',false),
  ('rhti','rhti','RHTI','RHTI','Tanzania','#ea580c','https://rhti.osim.cloud','osim_rhti','provisional',false),
  ('saut','St. Augustine University of Tanzania','SAUT','SAUT','Mwanza, Tanzania','#1e40af','https://saut.osim.cloud','osim_saut','provisional',true),
  ('smmuco','smmuco','SMMU','SMMUCO','Tanzania','#047857','https://smmuco.osim.cloud','osim_smmuco','provisional',false),
  ('socaite','socaite','SOCA','SOCAITE','Tanzania','#7e22ce','https://socaite.osim.cloud','osim_socaite','provisional',false),
  ('stc','stc','STC','STC','Tanzania','#b45309','https://stc.osim.cloud','osim_stc','provisional',false),
  ('sumait','Abdulrahman Al-Sumait University','SUM','SUMAIT','Chukwani, Zanzibar','#065f46','https://sumait.osim.cloud','osim_sumait','provisional',true),
  ('tudarco','Tumaini University Dar es Salaam College','TUDA','TUDARCO','Dar es Salaam','#1e3a8a','https://tudarco.osim.cloud','osim_tudarco','provisional',true),
  ('uoa','University of Arusha','UOA','UOA','Arusha, Tanzania','#c026d3','https://uoa.osim.cloud','osim_uoa','provisional',true),
  ('wiarc','wiarc','WIARC','WIARC','Tanzania','#0369a1','https://wiarc.osim.cloud','osim_wiarc','provisional',false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, short_name = EXCLUDED.short_name, org_abbr = EXCLUDED.org_abbr,
  location = EXCLUDED.location, accent = EXCLUDED.accent, base_url = EXCLUDED.base_url,
  db_name = EXCLUDED.db_name, status = EXCLUDED.status, name_confirmed = EXCLUDED.name_confirmed;
