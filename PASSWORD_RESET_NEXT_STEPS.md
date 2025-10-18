# Password Reset - Następne Kroki 📋

## Co Zrobiliśmy

### 1. Poprawki w Kodzie ✅
- ✅ Usunięto przedwczesne sprawdzanie sesji po stronie serwera
- ✅ Dodano nasłuchiwanie na zdarzenia `PASSWORD_RECOVERY` z Supabase
- ✅ Wydłużono czas oczekiwania na wymianę tokenów (100ms → 500ms)
- ✅ Dodano stan ładowania podczas weryfikacji
- ✅ Dodano szczegółowe logowanie debugowe

### 2. Debug Logging 🔍
Dodaliśmy logi które pokażą:
- URL hash (gdzie powinny być tokeny)
- URL search params (gdzie mogą być błędy)
- Zdarzenia auth (PASSWORD_RECOVERY, SIGNED_IN, itp.)
- Status sesji po sprawdzeniu

## Co Musisz Zrobić Teraz

### Krok 1: Deploy 🚀

```bash
git add .
git commit -m "debug: Add comprehensive password reset debugging"
git push
```

Poczekaj ~2-3 minuty na build i deployment przez Cloudflare.

### Krok 2: Test z Debugowaniem 🧪

**BARDZO WAŻNE:** Musisz poprosić o NOWY link resetowania po wdrożeniu!

1. **Otwórz Incognito/Prywatne okno przeglądarki**
2. **Naciśnij F12** (otwórz Developer Tools → zakładka Console)
3. Idź do: https://10xcards-dq7.pages.dev/password-reset
4. Wprowadź swój email
5. Kliknij "Wyślij link resetujący"
6. Sprawdź email (1-2 minuty)
7. **Zostaw konsolę otwartą i kliknij link z emaila**

### Krok 3: Skopiuj Logi 📝

W konsoli przeglądarki zobaczysz logi zaczynające się od:
```
[Password Reset Debug] ...
[Update Password Page] ...
```

**Skopiuj WSZYSTKIE te logi i prześlij mi je tutaj.**

Będę szukał takich informacji:
- Czy w `URL Hash` są tokeny (`#access_token=...`)?
- Czy w `URL Search` są błędy (`?error=...`)?
- Jakie zdarzenie auth się wywołało (`PASSWORD_RECOVERY`)?
- Czy sesja została znaleziona (`hasSession: true/false`)?

### Krok 4: Dodatkowe Info 📸

Oprócz logów, prześlij też:
1. **Zrzut ekranu** - co widzisz na stronie (błąd czy formularz)?
2. **Pełny URL** - skopiuj z paska adresu przeglądarki
3. **Cloudflare logs** (opcjonalnie) - jeśli umiesz sprawdzić

## Możliwe Scenariusze

### ✅ Scenariusz A: Widzisz tokeny w hash

```
[Password Reset Debug] URL Hash: #access_token=eyJh...&refresh_token=...
[Password Reset Debug] Auth event: PASSWORD_RECOVERY Session: true
```

**To znaczy:** Supabase poprawnie wysyła tokeny, ale coś blokuje wymianę na sesję.

### ❌ Scenariusz B: Brak tokenów, są błędy

```
[Update Password Page] URL params: { error: 'access_denied', errorCode: 'otp_expired' }
```

**To znaczy:** Link jest nieprawidłowy lub wygasł ZANIM dotarł do aplikacji.

### ⚠️ Scenariusz C: Tokeny są, ale brak zdarzenia PASSWORD_RECOVERY

```
[Password Reset Debug] URL Hash: #access_token=...
[Password Reset Debug] Auth event: INITIAL_SESSION Session: false
```

**To znaczy:** Supabase nie rozpoznaje tego jako flow resetowania hasła.

## Częste Problemy i Rozwiązania

### Problem 1: Stary Link
**Objaw:** `error=access_denied` lub `error_code=otp_expired`

**Rozwiązanie:** Linki resetowania są jednorazowe i ważne 1 godzinę. Poproś o NOWY link PO wdrożeniu kodu.

### Problem 2: Złe Redirect URLs w Supabase
**Objaw:** Brak tokenów w URL, przekierowanie do błędu

**Rozwiązanie:** Sprawdź w Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://10xcards-dq7.pages.dev`
- Redirect URLs: `https://10xcards-dq7.pages.dev/**` + `/update-password`

### Problem 3: Szablon Email
**Objaw:** Link w emailu nie zawiera `type=recovery` lub prowadzi do złego URL

**Rozwiązanie:** Sprawdź szablon email w Supabase:
- Authentication → Email Templates → Reset Password
- Link MUSI używać: `{{ .ConfirmationURL }}`

### Problem 4: Environment Variables
**Objaw:** Tokeny są, ale sesja się nie tworzy

**Rozwiązanie:** Sprawdź Cloudflare env variables:
- `SUPABASE_URL` - URL twojego projektu Supabase
- `SUPABASE_KEY` - Anon key (publiczny klucz)

## Alternatywny Test - Lokalnie

Możesz też przetestować lokalnie:

```bash
npm run dev
```

1. Idź do http://localhost:4321/password-reset
2. Poproś o link (zostanie wysłany z production Supabase)
3. Gdy dostaniesz email, ZMIEŃ URL linku:
   - Z: `https://10xcards-dq7.pages.dev/update-password#...`
   - Na: `http://localhost:4321/update-password#...`
4. Kliknij zmieniony link
5. Sprawdź konsolę

To pomoże określić czy problem jest w Cloudflare czy w samej aplikacji.

## Cloudflare Logs (Zaawansowane)

Jeśli masz dostęp, sprawdź logi Cloudflare:

1. Cloudflare Dashboard → Workers & Pages
2. Wybierz projekt: `10xcards-dq7`  
3. Zakładka: **Logs** (Real-time logs)
4. Kliknij link resetowania
5. Szukaj logów z `[Update Password Page]`

## Co Dalej?

Po otrzymaniu logów z Twojego testu, będę mógł:
1. 🔍 Zidentyfikować dokładny problem
2. 🛠️ Naprawić właściwą przyczynę
3. 🧹 Usunąć debug logging
4. ✅ Potwierdzić że wszystko działa

---

## Quick Checklist ☑️

Przed testem upewnij się że:
- [ ] Kod został wdrożony (`git push`)
- [ ] Czekałeś 2-3 minuty na build Cloudflare
- [ ] Używasz NOWEGO linku (nie starego)
- [ ] Konsola przeglądarki jest otwarta (F12)
- [ ] Testujesz w trybie Incognito/Prywatnym

**Teraz wykonaj test i prześlij mi logi!** 🚀

