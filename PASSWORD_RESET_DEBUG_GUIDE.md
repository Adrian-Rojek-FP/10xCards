# Password Reset - Debug Guide 🔍

## Problem
Link resetowania hasła pokazuje błąd: "Link resetowania hasła jest nieprawidłowy lub wygasł."

## Kroki Debugowania

### Krok 1: Deploy Nowej Wersji z Logowaniem

```bash
git add .
git commit -m "debug: Add password reset debug logging"
git push
```

Poczekaj ~2-3 minuty aż Cloudflare zbuduje i wdroży nową wersję.

### Krok 2: Poproś o Nowy Link Resetowania

**WAŻNE:** Musisz poprosić o NOWY link po wdrożeniu! Stare linki nie będą działać.

1. Idź do: https://10xcards-dq7.pages.dev/password-reset
2. Wprowadź adres email
3. Kliknij "Wyślij link resetujący"
4. Sprawdź swoją skrzynkę email (poczekaj 1-2 minuty)

### Krok 3: Otwórz Konsolę Przeglądarki

**Zanim klikniesz link:**

1. Otwórz przeglądarkę w trybie Incognito/Prywatnym
2. Naciśnij F12 (lub Ctrl+Shift+I) żeby otworzyć Developer Tools
3. Przejdź do zakładki "Console"
4. **Zostaw konsolę otwartą**

### Krok 4: Kliknij Link z Emaila

Kliknij link resetowania hasła z emaila. W konsoli powinieneś zobaczyć coś takiego:

```
[Password Reset Debug] URL Hash: #access_token=...
[Password Reset Debug] URL Search: ?type=recovery
[Password Reset Debug] Auth event: PASSWORD_RECOVERY Session: true
[Password Reset Debug] Session check result: { hasSession: true, error: undefined }
```

### Krok 5: Przeanalizuj Wyniki

#### ✅ Scenariusz 1: Widzisz "URL Hash" z tokenami

```
[Password Reset Debug] URL Hash: #access_token=eyJhb...&refresh_token=...
```

**To znaczy:** Supabase poprawnie generuje link z tokenami.

**Jeśli dalej widzisz błąd:** Problem jest w wymianie tokenów na sesję.

#### ❌ Scenariusz 2: "URL Hash" jest pusty

```
[Password Reset Debug] URL Hash: 
[Password Reset Debug] URL Search: ?error=access_denied
```

**To znaczy:** Supabase nie przekazuje tokenów do aplikacji.

**Możliwe przyczyny:**
1. Redirect URLs w Supabase są źle skonfigurowane
2. Link wygasł lub został już użyty
3. Problem z szablonem email w Supabase

#### ⚠️ Scenariusz 3: Nie widzisz zdarzenia "PASSWORD_RECOVERY"

```
[Password Reset Debug] URL Hash: #access_token=...
[Password Reset Debug] Auth event: INITIAL_SESSION Session: false
```

**To znaczy:** Supabase nie rozpoznaje tego jako flow resetowania hasła.

### Krok 6: Sprawdź Konfigurację Supabase

#### A) Sprawdź Redirect URLs

W Supabase Dashboard → Authentication → URL Configuration:

**Redirect URLs MUSZĄ zawierać:**
```
https://10xcards-dq7.pages.dev/**
https://10xcards-dq7.pages.dev/update-password
```

**Format linku w emailu powinien być:**
```
https://[twoj-projekt].supabase.co/auth/v1/verify?token=xxx&type=recovery&redirect_to=https://10xcards-dq7.pages.dev/update-password
```

#### B) Sprawdź Szablon Email

W Supabase Dashboard → Authentication → Email Templates → Change Email

**Upewnij się, że link używa:**
```html
{{ .ConfirmationURL }}
```

**NIE:**
```html
{{ .SiteURL }}/update-password?token={{ .Token }}
```

### Krok 7: Prześlij Mi Wyniki

Skopiuj WSZYSTKO z konsoli przeglądarki i prześlij mi:

1. Co widzisz w konsoli? (całe logi z [Password Reset Debug])
2. Jak wygląda URL gdy strona się załaduje? (skopiuj z paska adresu)
3. Czy widzisz "Weryfikacja linku resetowania..." czy od razu błąd?

## Możliwe Rozwiązania

### Problem: Brak tokenów w URL Hash

**Rozwiązanie:** Sprawdź szablon email w Supabase.

1. Idź do: Supabase Dashboard → Authentication → Email Templates
2. Wybierz "Reset Password"  
3. Upewnij się, że link to: `<a href="{{ .ConfirmationURL }}">Reset Password</a>`

### Problem: Tokeny są, ale nie ma sesji

**Rozwiązanie:** Może być problem z wymianą tokenów.

Możliwe przyczyny:
1. **CORS**: Supabase blokuje wymianę tokenów
2. **Environment variables**: Nieprawidłowe klucze Supabase w Cloudflare
3. **Cookie settings**: Problem z zapisywaniem sesji w cookies

### Problem: "error=access_denied" w URL

**Rozwiązanie:** Link jest nieprawidłowy.

Możliwe przyczyny:
1. Link wygasł (ponad 1 godzina od wygenerowania)
2. Link został już użyty (jednorazowy)
3. Redirect URL nie jest w allow list Supabase

## Dodatkowe Sprawdzenia

### Sprawdź Email w Supabase Logs

1. Idź do: Supabase Dashboard → Logs → Auth Logs
2. Znajdź log z `resetPasswordForEmail`
3. Sprawdź czy `redirect_to` jest poprawny:
   ```json
   {
     "redirect_to": "https://10xcards-dq7.pages.dev/update-password"
   }
   ```

### Sprawdź Environment Variables w Cloudflare

1. Idź do: Cloudflare Dashboard → Workers & Pages
2. Wybierz swój projekt (10xcards-dq7)
3. Settings → Environment variables
4. Sprawdź czy są ustawione:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon key)

### Test Lokalnie

Możesz też przetestować lokalnie:

```bash
npm run dev
```

Następnie:
1. Idź do: http://localhost:4321/password-reset
2. Poproś o link (zostanie wysłany z production Supabase)
3. **WAŻNE:** Zmień URL w linku z emaila z production na localhost:
   ```
   Było: https://10xcards-dq7.pages.dev/update-password#access_token=...
   Zmień na: http://localhost:4321/update-password#access_token=...
   ```
4. Sprawdź konsolę

## Następne Kroki

Po zebraniu informacji z debugowania, będę wiedział dokładnie gdzie leży problem i jak go naprawić.

Najbardziej prawdopodobne przyczyny (w kolejności):
1. 🔴 **Szablon email używa złego formatu linku**
2. 🟠 **Redirect URLs nie zawierają właściwych wartości**
3. 🟡 **Problem z CORS lub wymianą tokenów**
4. 🟢 **Linki wygasają zbyt szybko (używasz starych linków)**

---

**Teraz wykonaj kroki 1-7 i prześlij mi wyniki z konsoli!** 🕵️

