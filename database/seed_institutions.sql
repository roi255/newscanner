-- ============================================================================
--  ExamPass — institution seed (generated from src/data/institutions.ts TENANTS)
--  PostgreSQL. Load AFTER schema.sql. Idempotent (ON CONFLICT upsert on code).
--  Only stemmuco + makumira are 'active' (keys provisioned); the rest are
--  'provisional' with no credential row until a key is generated.
-- ============================================================================

INSERT INTO institution
  (code, name, short_name, org_abbr, connect_id, location, accent, base_url, db_name, status, name_confirmed)
VALUES
  ('stemmuco','Stella Maris Mtwara University College','STE','STEMMUCO','NEP4Q6','Mtwara, Tanzania','#1f6f4a','https://stemmuco.osim.cloud','osim_stemmuco','active',true),
  ('makumira','Tumaini University Makumira','TUMA','TUMA','VSHVMH','Usa River, Arusha','#8081a4','https://osim.makumira.ac.tz','osim_makumira','active',true),
  ('ajuco','Archbishop James University College','AJUCO','AJUCO','1NP75D','Songea, Ruvuma','#b8432a','https://ajuco.osim.cloud','osim_ajuco','provisional',true),
  ('amucta','Archbishop Mihayo University College of Tabora','AMU','AMUCTA','DDSETS','Tabora, Tanzania','#6d28d9','https://amucta.osim.cloud','osim_amucta','provisional',true),
  ('bugando','Catholic University of Health and Allied Sciences (Bugando)','CUHAS','BUGANDO','1RMGKN','Mwanza, Tanzania','#9d8318','https://bugando.osim.cloud','osim_bugando','provisional',true),
  ('carumuco','Cardinal Rugambwa Memorial University College','CRMU','CARUMUCO','WEKACK','Bukoba, Kagera','#be123c','https://carumuco.osim.cloud','osim_carumuco','provisional',true),
  ('chatocohest','chatocohest','CHATO','CHATOCOHEST','E8BGVG','Chato, Geita','#9d8417','https://chato.campusmaster.cloud','osim_chatocohest','provisional',false),
  ('dartu','dartu','DART','DARTU','C9SW5H','Tanzania','#c2410c','https://dartu.osim.cloud','osim_dartu','provisional',false),
  ('fhti','fhti','FHTI','FHTI','995BC9','Tanzania','#7c3aed','https://fhti.osim.cloud','osim_fhti','provisional',false),
  ('hkmu','Hubert Kairuki Memorial University','HKMU','HKMU','B05W55','Dar es Salaam','#0c9b58','https://osim.ku.ac.tz','osim_hkmu','provisional',true),
  ('kiahs','kiahs','KIAHS','KIAHS','YVZCGX','Tanzania','#0f766e','https://kiahs.osim.cloud','osim_kiahs','provisional',false),
  ('kiut','Kampala International University in Tanzania','KIUT','KIUT','VVVPPA','Dar es Salaam','#329a4a','https://kiut.osim.cloud','osim_kiut','provisional',true),
  ('ksp','ksp','KSP','KSP','HB0HHV','Tanzania','#a16207','https://ksp.osim.cloud','osim_ksp','provisional',false),
  ('lihas','lihas','LIHAS','LIHAS','Z8HM7K','Tanzania','#0891b2','https://lihas.osim.cloud','osim_lihas','provisional',false),
  ('mti','mti','MTI','MTI','3QXG96','Tanzania','#9333ea','https://mti.osim.cloud','osim_mti','provisional',false),
  ('rhti','rhti','RHTI','RHTI','DEXS6H','Tanzania','#b5262d','https://osim.rhti.ac.tz','osim_rhti','provisional',false),
  ('saut','St. Augustine University of Tanzania','SAUT','SAUT','JXT758','Mwanza, Tanzania','#1e40af','https://sautarusha.osim.cloud','osim_saut','provisional',true),
  ('smmuco','smmuco','SMMU','SMMUCO','3Q3M3Q','Tanzania','#9e8359','https://smmuco.osim.cloud','osim_smmuco','provisional',false),
  ('socaite','socaite','SOCA','SOCAITE','DAWF57','Tanzania','#898621','https://socaite.osim.cloud','osim_socaite','provisional',false),
  ('stc','stc','STC','STC','8JGMC9','Tanzania','#3c02d9','https://stc.osim.cloud','osim_stc','provisional',false),
  ('sumait','Abdulrahman Al-Sumait University','SUM','SUMAIT','N5YPVY','Chukwani, Zanzibar','#106c40','https://sumait.osim.cloud','osim_sumait','provisional',true),
  ('tudarco','Tumaini University Dar es Salaam College','TUDA','TUDARCO','7XRPDC','Dar es Salaam','#1e3a8a','https://tudarco.osim.cloud','osim_tudarco','provisional',true),
  ('uoa','University of Arusha','UOA','UOA','NYM6J4','Arusha, Tanzania','#98822c','https://uoa.osim.cloud','osim_uoa','provisional',true),
  ('wiarc','wiarc','WIARC','WIARC','22BQXF','Tanzania','#0369a1','https://wiarc.osim.cloud','osim_wiarc','provisional',false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, short_name = EXCLUDED.short_name, org_abbr = EXCLUDED.org_abbr,
  connect_id = EXCLUDED.connect_id,
  location = EXCLUDED.location, accent = EXCLUDED.accent, base_url = EXCLUDED.base_url,
  db_name = EXCLUDED.db_name, status = EXCLUDED.status, name_confirmed = EXCLUDED.name_confirmed;
