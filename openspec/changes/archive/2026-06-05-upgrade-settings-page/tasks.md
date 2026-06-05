## 1. Service & Hook layer

- [x] 1.1 XĂ³a `teacherName` / `teacher_name` khá»i `DEFAULT_SETTINGS`, `fromDB`, `toDB` trong `src/services/settingsService.js`
- [x] 1.2 ThĂªm method `updateTeacherName(name)` vĂ o `useAuth` (`src/hooks/useAuth.jsx`): `supabase.from('teachers').update({ name }).eq('id', user.id)` rá»“i refresh state `teacher`
- [x] 1.3 Export `updateTeacherName` qua context value cá»§a `AuthProvider`

## 2. SettingsPage â€” Section TĂ i khoáº£n cĂ¡ nhĂ¢n

- [x] 2.1 Viáº¿t láº¡i `src/pages/SettingsPage.jsx`: Ä‘á»c `teacher` vĂ  `user` tá»« `useAuth()` thay vĂ¬ láº¥y tĂªn tá»« `settingsService`
- [x] 2.2 Render section "TĂ i khoáº£n cĂ¡ nhĂ¢n" vá»›i tĂªn (fallback email khi rá»—ng) vĂ  email read-only
- [x] 2.3 ThĂªm edit state riĂªng cho section tĂ i khoáº£n: nĂºt "Chá»‰nh sá»­a" â†’ input + LÆ°u/Há»§y
- [x] 2.4 LÆ°u tĂªn qua `updateTeacherName`, validate tĂªn khĂ´ng rá»—ng, toast success/error, trá»Ÿ vá» read-only

## 3. SettingsPage â€” Section Äá»•i máº­t kháº©u

- [x] 3.1 Render section "Äá»•i Máº­t Kháº©u" vá»›i pattern edit button (3 Ă´: hiá»‡n táº¡i, má»›i, xĂ¡c nháº­n)
- [x] 3.2 Validate: máº­t kháº©u má»›i tá»‘i thiá»ƒu 6 kĂ½ tá»±, xĂ¡c nháº­n khá»›p â€” bĂ¡o lá»—i trÆ°á»›c khi gá»i Supabase
- [x] 3.3 XĂ¡c minh máº­t kháº©u cÅ© qua `supabase.auth.signInWithPassword({ email, password: old })`, bĂ¡o "Máº­t kháº©u hiá»‡n táº¡i khĂ´ng Ä‘Ăºng" náº¿u lá»—i
- [x] 3.4 Äá»•i máº­t kháº©u qua `supabase.auth.updateUser({ password: new })`, toast success, reset form vá» read-only

## 4. SettingsPage â€” Section ThĂ´ng tin trung tĂ¢m (admin)

- [x] 4.1 Render section "ThĂ´ng Tin Trung TĂ¢m" chá»‰ khi `teacher.is_admin`
- [x] 4.2 Äá»c `centerName` tá»« `settingsService.get()`, hiá»ƒn thá»‹ read-only + nĂºt "Chá»‰nh sá»­a"
- [x] 4.3 Edit state riĂªng: lÆ°u qua `settingsService.upsert({ centerName })`, toast success, Há»§y khĂ´i phá»¥c giĂ¡ trá»‹ cÅ©

## 5. Kiá»ƒm tra & Ä‘á»“ng bá»™

- [x] 5.1 Build (`npm run build`) khĂ´ng lá»—i; kiá»ƒm tra Navbar hiá»ƒn thá»‹ tĂªn má»›i sau khi Ä‘á»•i
- [x] 5.2 Kiá»ƒm tra giĂ¡o viĂªn thÆ°á»ng KHĂ”NG tháº¥y section trung tĂ¢m; admin tháº¥y Ä‘á»§ 3 section
- [x] 5.3 Cáº­p nháº­t `CLAUDE.md` pháº§n mĂ´ táº£ SettingsPage vĂ  model settings (bá» `teacher_name`)

