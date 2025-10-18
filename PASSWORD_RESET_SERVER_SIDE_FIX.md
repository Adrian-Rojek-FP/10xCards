# Password Reset - Server-Side PKCE Fix 🎯

## Problem Zidentyfikowany

Error z konsoli:
```
invalid request: both auth code and code verifier should be non-empty
```

**Przyczyna:** 
- PKCE flow wymaga **code verifier** (część bezpieczeństwa)
- Client-side nie ma dostępu do code verifier
- Code verifier jest przechowywany tylko po stronie serwera w cookies

## Rozwiązanie Zaimplementowane ✅

### Przenieśliśmy wymianę kodu na stronę SERWEROWĄ

**Dlaczego to działa:**
1. 🔐 **Code verifier** jest w cookies serwera
2. 🔄 Serwer ma dostęp do cookies i może wymienić kod
3. ✅ Sesja jest tworzona poprawnie z pełnym kontekstem PKCE

### Zmiany w Kodzie

#### 1. `src/pages/update-password.astro` (Server-Side)

```typescript
// Wykrywamy kod PKCE w URL
const code = url.searchParams.get("code");

if (code && !authError) {
  // Tworzymy Supabase client z dostępem do cookies
  const supabase = createSupabaseServerClient(
    { cookies: Astro.cookies, headers: Astro.request.headers },
    supabaseUrl,
    supabaseKey
  );

  // Wymieniamy kod na sesję - DZIAŁA bo mamy dostęp do code verifier w cookies
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (data.session) {
    // ✅ Sesja utworzona!
    console.log("PKCE session established successfully");
  }
}
```

**Kluczowe:**
- ✅ Dostęp do `Astro.cookies` (zawiera code verifier)
- ✅ Wymiana kodu **PRZED** renderowaniem strony
- ✅ Sesja zapisana w cookies dla klienta

#### 2. `src/components/auth/UpdatePasswordForm.tsx` (Client-Side)

```typescript
// Uproszczona logika - tylko sprawdzamy czy sesja istnieje
const checkSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    setHasValidSession(true); // ✅ Formularz aktywny
  } else {
    setError("Link wygasł lub jest nieprawidłowy"); // ❌ Pokaż błąd
  }
};
```

**Kluczowe:**
- ✅ NIE próbujemy wymieniać kodu (robi to serwer)
- ✅ Tylko sprawdzamy czy sesja została utworzona
- ✅ Proste i niezawodne

## Jak To Działa - Flow

### 1. Użytkownik Klika Link z Emaila
```
https://10xcards-dq7.pages.dev/update-password?code=xxx
```

### 2. Serwer Otrzymuje Request
```typescript
// update-password.astro (SSR)
const code = url.searchParams.get("code"); // ✅ xxx
const cookies = Astro.cookies; // ✅ Zawiera code_verifier
```

### 3. Serwer Wymienia Kod
```typescript
const { data, error } = await supabase.auth.exchangeCodeForSession(code);
// Supabase:
// 1. Odczytuje code_verifier z cookies ✅
// 2. Weryfikuje kod + verifier
// 3. Tworzy sesję
// 4. Zapisuje tokeny w cookies ✅
```

### 4. Strona Renderuje się z Sesją
```typescript
// UpdatePasswordForm.tsx (Client)
const { session } = await supabase.auth.getSession();
// ✅ Sesja istnieje! (utworzona przez serwer)
// ✅ Pokazuje formularz zmiany hasła
```

### 5. Użytkownik Zmienia Hasło
```typescript
// Wszystko działa normalnie bo ma ważną sesję
await supabase.auth.updateUser({ password: newPassword });
```

## Deployment i Test 🚀

### 1. Deploy
```bash
git add .
git commit -m "fix: Move PKCE code exchange to server-side"
git push
```

Poczekaj 2-3 minuty na build Cloudflare.

### 2. Test (WAŻNE: Nowy Link!)

**MUSISZ poprosić o NOWY link!** Stare linki nie zadziałają.

1. **Otwórz Incognito + F12 (Console)**
2. Idź do: https://10xcards-dq7.pages.dev/password-reset
3. Wprowadź email
4. Poczekaj na email (1-2 min)
5. **Kliknij link z emaila**

### 3. Czego Szukać w Cloudflare Logs

W Cloudflare Real-time Logs powinieneś zobaczyć:
```
[Update Password Page] URL params: { code: 'present', ... }
[Update Password Page] PKCE exchange result: { hasSession: true, error: undefined }
[Update Password Page] PKCE session established successfully
```

### 4. Czego Szukać w Browser Console

Po kliknięciu linku:
```
[Password Reset Debug - Client] URL Search: ?code=xxx
[Password Reset Debug - Client] Session check result: { hasSession: true }
```

**A potem:**
- ✅ Formularz zmiany hasła (2 pola)
- ✅ Brak komunikatu o błędzie
- ✅ Możliwość zmiany hasła

## Przewidywany Rezultat ✅

Po wdrożeniu:
1. ✅ Link z emaila otwiera stronę
2. ✅ Serwer wymienia kod na sesję
3. ✅ Pokazuje się formularz zmiany hasła
4. ✅ Można zmienić hasło
5. ✅ Przekierowanie do logowania
6. ✅ Logowanie nowym hasłem działa

## Wyjaśnienie Techniczne

### Dlaczego Client-Side Nie Działał?

```typescript
// ❌ Client-side nie ma dostępu do code_verifier
const { data, error } = await supabase.auth.exchangeCodeForSession(code);
// Error: "both auth code and code verifier should be non-empty"
// Verifier jest w HTTP-only cookies, niedostępny dla JS
```

### Dlaczego Server-Side Działa?

```typescript
// ✅ Server-side ma pełny dostęp do cookies
const supabase = createSupabaseServerClient(
  { cookies: Astro.cookies, headers: Astro.request.headers }
);
// Cookies zawierają code_verifier
// Supabase może wymienić kod poprawnie
```

### Co to Jest Code Verifier?

PKCE (RFC 7636) używa pary:
1. **Code Verifier** - losowy string (zapisany w cookies)
2. **Code Challenge** - hash verifier (wysłany do Supabase)

Flow:
```
1. App generuje verifier → zapisuje w cookies
2. App tworzy challenge → wysyła do Supabase
3. Supabase weryfikuje → wysyła kod
4. App wymienia kod + verifier → dostaje tokeny
```

**Bez verifier wymiana się nie powiedzie!**

## Różnica: Client vs Server

### ❌ Client-Side (Nie Działa)
```typescript
// Browser JS nie ma dostępu do HTTP-only cookies
const cookies = document.cookie; // ❌ Brak code_verifier
await supabase.auth.exchangeCodeForSession(code); // ❌ Fail
```

### ✅ Server-Side (Działa)
```typescript
// SSR ma pełny dostęp do request cookies
const cookies = Astro.cookies; // ✅ Ma code_verifier
await supabase.auth.exchangeCodeForSession(code); // ✅ Success
```

## Co Jeśli Dalej Nie Działa?

### Scenariusz A: "hasSession: false" w Server Logs

```
[Update Password Page] PKCE exchange result: { hasSession: false }
```

**Przyczyna:** Wymiana kodu nie powiodła się.

**Debug:**
1. Sprawdź czy `error` w logu jest ustawiony
2. Sprawdź Supabase Auth Logs
3. Sprawdź czy cookies są poprawnie przekazywane

### Scenariusz B: "hasSession: false" w Client Logs

```
[Password Reset Debug - Client] Session check result: { hasSession: false }
```

**Przyczyna:** Sesja nie została przekazana do klienta.

**Debug:**
1. Sprawdź czy serwer zwraca cookies `Set-Cookie`
2. Sprawdź czy browser akceptuje cookies (sprawdź DevTools → Application → Cookies)
3. Sprawdź `sameSite` i `secure` settings

### Scenariusz C: Dalej "code verifier" Error

**Przyczyna:** Code verifier nie jest w cookies.

**Rozwiązanie:**
1. Sprawdź czy `createSupabaseServerClient` używa poprawnej konfiguracji cookies
2. Sprawdź czy `cookieOptions` ma `httpOnly: true`
3. Sprawdź czy Supabase generuje verifier poprawnie

## Debug Logs

Zostawiłem debug logi w kodzie:
- `[Update Password Page]` - Server-side logs (Cloudflare)
- `[Password Reset Debug - Client]` - Client-side logs (Browser)

Po potwierdzeniu że działa, mogę je usunąć.

---

**Wdróż i przetestuj - tym razem wymiana kodu dzieje się po stronie serwera z pełnym kontekstem PKCE!** 🎯

