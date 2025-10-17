import { describe, it, expect } from "vitest";
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  passwordResetSchema,
  updatePasswordSchema,
  isValidEmail,
  isValidPassword,
  doPasswordsMatch,
  type LoginInput,
  type RegisterInput,
  type PasswordResetInput,
  type UpdatePasswordInput,
} from "../../src/lib/validation/auth.validation";

describe("emailSchema", () => {
  describe("valid emails", () => {
    it("should accept standard email format", () => {
      const result = emailSchema.safeParse("user@example.com");
      expect(result.success).toBe(true);
    });

    it("should accept email with subdomain", () => {
      const result = emailSchema.safeParse("user@mail.example.com");
      expect(result.success).toBe(true);
    });

    it("should accept email with plus sign", () => {
      const result = emailSchema.safeParse("user+tag@example.com");
      expect(result.success).toBe(true);
    });

    it("should accept email with dots in local part", () => {
      const result = emailSchema.safeParse("first.last@example.com");
      expect(result.success).toBe(true);
    });

    it("should accept email with numbers", () => {
      const result = emailSchema.safeParse("user123@example456.com");
      expect(result.success).toBe(true);
    });

    it("should accept email with hyphen in domain", () => {
      const result = emailSchema.safeParse("user@my-domain.com");
      expect(result.success).toBe(true);
    });
  });

  describe("invalid emails", () => {
    it("should reject empty string", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Adres e-mail jest wymagany");
      }
    });

    it("should reject email without @", () => {
      const result = emailSchema.safeParse("userexample.com");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Wprowadź poprawny adres e-mail");
      }
    });

    it("should reject email without domain", () => {
      const result = emailSchema.safeParse("user@");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Wprowadź poprawny adres e-mail");
      }
    });

    it("should reject email without local part", () => {
      const result = emailSchema.safeParse("@example.com");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Wprowadź poprawny adres e-mail");
      }
    });

    it("should reject email with spaces", () => {
      const result = emailSchema.safeParse("user @example.com");
      expect(result.success).toBe(false);
    });

    it("should reject email with multiple @ signs", () => {
      const result = emailSchema.safeParse("user@@example.com");
      expect(result.success).toBe(false);
    });

    it("should reject plain text", () => {
      const result = emailSchema.safeParse("not an email");
      expect(result.success).toBe(false);
    });
  });
});

describe("passwordSchema", () => {
  describe("valid passwords", () => {
    it("should accept password with minimum length (6 characters)", () => {
      const result = passwordSchema.safeParse("123456");
      expect(result.success).toBe(true);
    });

    it("should accept password with maximum length (72 characters)", () => {
      const password = "a".repeat(72);
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    });

    it("should accept password with letters and numbers", () => {
      const result = passwordSchema.safeParse("Pass123");
      expect(result.success).toBe(true);
    });

    it("should accept password with special characters", () => {
      const result = passwordSchema.safeParse("P@ssw0rd!");
      expect(result.success).toBe(true);
    });

    it("should accept password with spaces", () => {
      const result = passwordSchema.safeParse("my pass word");
      expect(result.success).toBe(true);
    });

    it("should accept password with unicode characters", () => {
      const result = passwordSchema.safeParse("hasło123");
      expect(result.success).toBe(true);
    });
  });

  describe("invalid passwords", () => {
    it("should reject empty string", () => {
      const result = passwordSchema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło musi mieć co najmniej 6 znaków");
      }
    });

    it("should reject password shorter than 6 characters", () => {
      const result = passwordSchema.safeParse("12345");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło musi mieć co najmniej 6 znaków");
      }
    });

    it("should reject password with exactly 5 characters", () => {
      const result = passwordSchema.safeParse("abcde");
      expect(result.success).toBe(false);
    });

    it("should reject password longer than 72 characters", () => {
      const password = "a".repeat(73);
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Hasło nie może być dłuższe niż 72 znaki");
      }
    });

    it("should reject password with exactly 73 characters", () => {
      const password = "a".repeat(73);
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle exactly 6 characters (minimum boundary)", () => {
      const result = passwordSchema.safeParse("123456");
      expect(result.success).toBe(true);
    });

    it("should handle exactly 72 characters (maximum boundary)", () => {
      const password = "a".repeat(72);
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    });

    it("should handle whitespace-only password of valid length", () => {
      const result = passwordSchema.safeParse("      ");
      expect(result.success).toBe(true);
    });
  });
});

describe("loginSchema", () => {
  describe("valid login data", () => {
    it("should accept valid email and password", () => {
      const data: LoginInput = {
        email: "user@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept minimum valid credentials", () => {
      const data = {
        email: "a@b.co",
        password: "123456",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid login data", () => {
    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
        password: "password123",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid password", () => {
      const data = {
        email: "user@example.com",
        password: "short",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing email", () => {
      const data = {
        password: "password123",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const data = {
        email: "user@example.com",
      };
      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty object", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("registerSchema", () => {
  describe("valid registration data", () => {
    it("should accept valid email and matching passwords", () => {
      const data: RegisterInput = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept minimum valid registration", () => {
      const data = {
        email: "a@b.co",
        password: "123456",
        confirmPassword: "123456",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept passwords with special characters", () => {
      const data = {
        email: "user@example.com",
        password: "P@ssw0rd!",
        confirmPassword: "P@ssw0rd!",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid registration data", () => {
    it("should reject when passwords do not match", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password456",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.message).toBe("Hasła nie są identyczne");
      }
    });

    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
        password: "password123",
        confirmPassword: "password123",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid password", () => {
      const data = {
        email: "user@example.com",
        password: "short",
        confirmPassword: "short",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty confirmPassword", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing confirmPassword", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject when password is valid but confirmPassword is empty", () => {
      const data = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("should reject matching passwords that are both empty", () => {
      const data = {
        email: "user@example.com",
        password: "",
        confirmPassword: "",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject matching passwords that are too short", () => {
      const data = {
        email: "user@example.com",
        password: "12345",
        confirmPassword: "12345",
      };
      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe("passwordResetSchema", () => {
  describe("valid password reset data", () => {
    it("should accept valid email", () => {
      const data: PasswordResetInput = {
        email: "user@example.com",
      };
      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept email with subdomain", () => {
      const data = {
        email: "user@mail.example.com",
      };
      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid password reset data", () => {
    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
      };
      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const data = {
        email: "",
      };
      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing email", () => {
      const result = passwordResetSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("updatePasswordSchema", () => {
  describe("valid password update data", () => {
    it("should accept matching valid passwords", () => {
      const data: UpdatePasswordInput = {
        password: "newpassword123",
        confirmPassword: "newpassword123",
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept minimum length passwords", () => {
      const data = {
        password: "123456",
        confirmPassword: "123456",
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept complex passwords", () => {
      const data = {
        password: "C0mpl3x!P@ssw0rd",
        confirmPassword: "C0mpl3x!P@ssw0rd",
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid password update data", () => {
    it("should reject when passwords do not match", () => {
      const data = {
        password: "password123",
        confirmPassword: "password456",
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.message).toBe("Hasła nie są identyczne");
      }
    });

    it("should reject invalid password", () => {
      const data = {
        password: "short",
        confirmPassword: "short",
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty confirmPassword", () => {
      const data = {
        password: "password123",
        confirmPassword: "",
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing confirmPassword", () => {
      const data = {
        password: "password123",
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject when password is too long", () => {
      const longPassword = "a".repeat(73);
      const data = {
        password: longPassword,
        confirmPassword: longPassword,
      };
      const result = updatePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe("isValidEmail", () => {
  describe("valid emails", () => {
    it("should return true for valid email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    it("should return true for email with subdomain", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
    });

    it("should return true for email with plus sign", () => {
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("should return true for email with dots", () => {
      expect(isValidEmail("first.last@example.com")).toBe(true);
    });
  });

  describe("invalid emails", () => {
    it("should return false for empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("should return false for email without @", () => {
      expect(isValidEmail("userexample.com")).toBe(false);
    });

    it("should return false for email without domain", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    it("should return false for plain text", () => {
      expect(isValidEmail("not an email")).toBe(false);
    });

    it("should return false for email with spaces", () => {
      expect(isValidEmail("user @example.com")).toBe(false);
    });
  });
});

describe("isValidPassword", () => {
  describe("valid passwords", () => {
    it("should return true for valid password", () => {
      expect(isValidPassword("password123")).toBe(true);
    });

    it("should return true for minimum length password", () => {
      expect(isValidPassword("123456")).toBe(true);
    });

    it("should return true for maximum length password", () => {
      const password = "a".repeat(72);
      expect(isValidPassword(password)).toBe(true);
    });

    it("should return true for password with special characters", () => {
      expect(isValidPassword("P@ssw0rd!")).toBe(true);
    });
  });

  describe("invalid passwords", () => {
    it("should return false for empty string", () => {
      expect(isValidPassword("")).toBe(false);
    });

    it("should return false for password shorter than 6 characters", () => {
      expect(isValidPassword("12345")).toBe(false);
    });

    it("should return false for password longer than 72 characters", () => {
      const password = "a".repeat(73);
      expect(isValidPassword(password)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return true for exactly 6 characters", () => {
      expect(isValidPassword("123456")).toBe(true);
    });

    it("should return true for exactly 72 characters", () => {
      const password = "a".repeat(72);
      expect(isValidPassword(password)).toBe(true);
    });

    it("should return false for exactly 5 characters", () => {
      expect(isValidPassword("12345")).toBe(false);
    });

    it("should return false for exactly 73 characters", () => {
      const password = "a".repeat(73);
      expect(isValidPassword(password)).toBe(false);
    });
  });
});

describe("doPasswordsMatch", () => {
  describe("matching passwords", () => {
    it("should return true when passwords match", () => {
      expect(doPasswordsMatch("password123", "password123")).toBe(true);
    });

    it("should return true when both passwords are identical complex strings", () => {
      expect(doPasswordsMatch("C0mpl3x!P@ssw0rd", "C0mpl3x!P@ssw0rd")).toBe(true);
    });

    it("should return true when both passwords have special characters", () => {
      expect(doPasswordsMatch("p@ss word!", "p@ss word!")).toBe(true);
    });
  });

  describe("non-matching passwords", () => {
    it("should return false when passwords do not match", () => {
      expect(doPasswordsMatch("password123", "password456")).toBe(false);
    });

    it("should return false when passwords differ by case", () => {
      expect(doPasswordsMatch("Password", "password")).toBe(false);
    });

    it("should return false when passwords differ by whitespace", () => {
      expect(doPasswordsMatch("password", "password ")).toBe(false);
    });

    it("should return false when one password is empty", () => {
      expect(doPasswordsMatch("password123", "")).toBe(false);
    });

    it("should return false when both passwords are empty", () => {
      expect(doPasswordsMatch("", "")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return false for empty strings", () => {
      expect(doPasswordsMatch("", "")).toBe(false);
    });

    it("should return true for matching single character passwords", () => {
      expect(doPasswordsMatch("a", "a")).toBe(true);
    });

    it("should return true for matching whitespace-only passwords", () => {
      expect(doPasswordsMatch("   ", "   ")).toBe(true);
    });

    it("should return false when first is empty and second is not", () => {
      expect(doPasswordsMatch("", "password")).toBe(false);
    });

    it("should return false when second is empty and first is not", () => {
      expect(doPasswordsMatch("password", "")).toBe(false);
    });
  });
});

describe("Type exports", () => {
  it("should properly type LoginInput", () => {
    const loginData: LoginInput = {
      email: "user@example.com",
      password: "password123",
    };
    expect(loginData.email).toBeDefined();
    expect(loginData.password).toBeDefined();
  });

  it("should properly type RegisterInput", () => {
    const registerData: RegisterInput = {
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    };
    expect(registerData.email).toBeDefined();
    expect(registerData.password).toBeDefined();
    expect(registerData.confirmPassword).toBeDefined();
  });

  it("should properly type PasswordResetInput", () => {
    const resetData: PasswordResetInput = {
      email: "user@example.com",
    };
    expect(resetData.email).toBeDefined();
  });

  it("should properly type UpdatePasswordInput", () => {
    const updateData: UpdatePasswordInput = {
      password: "newpassword123",
      confirmPassword: "newpassword123",
    };
    expect(updateData.password).toBeDefined();
    expect(updateData.confirmPassword).toBeDefined();
  });
});
