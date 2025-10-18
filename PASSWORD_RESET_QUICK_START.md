# Password Reset - Quick Start Guide

## 🚀 Setup (Required Before First Use)

### 1. Configure Supabase Dashboard

Go to your Supabase project dashboard:

1. **Authentication → URL Configuration**
   - Add redirect URL: `http://localhost:4321/update-password` (development)
   - Add redirect URL: `https://yourdomain.com/update-password` (production)

2. **Authentication → Email Templates**
   - Review and customize the "Reset Password" email template
   - Default template should work out of the box

### 2. Verify Environment Variables

Check that these are set in your `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

---

## 🧪 Testing the Implementation

### Quick Test Flow

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test Password Reset Request:**
   - Navigate to `http://localhost:4321/login`
   - Click "Zapomniałeś hasła?"
   - Enter a registered email address
   - Click "Wyślij link resetujący"
   - Check for success message

3. **Check Email:**
   - Open your email inbox
   - Find the password reset email from Supabase
   - Click the reset link

4. **Update Password:**
   - You'll land on `/update-password` page
   - Enter new password (min 6 characters)
   - Confirm the password
   - Click "Zmień hasło"
   - You'll be redirected to login

5. **Login with New Password:**
   - Enter your email
   - Enter the new password
   - Click "Zaloguj się"

---

## 📋 API Endpoints

### Request Password Reset
```bash
POST /api/auth/password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Update Password
```bash
POST /api/auth/update-password
Content-Type: application/json

{
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

---

## 🔧 Troubleshooting

### Issue: Not receiving reset email
**Solutions:**
- Check spam folder
- Verify email is registered in Supabase
- Check Supabase logs for email delivery status
- Verify SMTP configuration in Supabase dashboard

### Issue: "Session expired" error on update password
**Solutions:**
- Reset link expires after 1 hour (default)
- Request a new reset link
- Don't open reset link in different browser/device

### Issue: Redirect URL not whitelisted
**Solution:**
- Add the URL to Supabase dashboard → Authentication → URL Configuration

### Issue: Password update fails
**Solutions:**
- Ensure password is at least 6 characters
- Password cannot be the same as old password
- Check if reset link has expired

---

## 🎨 UI Pages

### Password Reset Request
- **URL:** `/password-reset`
- **Access:** Public (no authentication required)
- **Features:** Email validation, error handling, success messages

### Update Password
- **URL:** `/update-password`
- **Access:** Requires valid reset session (from email link)
- **Features:** Password strength validation, show/hide toggles, auto-redirect

---

## ⚡ Quick Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

---

## 📝 Notes

- Reset links expire after 1 hour (configurable in Supabase)
- Success messages are shown even if email doesn't exist (security feature)
- All forms are fully accessible (ARIA compliant)
- Works in all modern browsers

---

## 🔗 Related Documentation

- [Full Implementation Details](./PASSWORD_RESET_IMPLEMENTATION.md)
- [Authentication README](./src/components/auth/README.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

