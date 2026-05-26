import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale, normalizeLocale } from "@/i18n/routing";

type ApiMessageKey =
  | "errors.unauthorized"
  | "errors.forbidden"
  | "auth.tooManyLoginAttempts"
  | "auth.invalidLoginPayload"
  | "auth.invalidCredentials"
  | "auth.accountTemporarilyLocked"
  | "auth.emailVerificationRequired"
  | "auth.loginSuccessful"
  | "auth.loginFailed"
  | "auth.tooManyRegistrationAttempts"
  | "auth.invalidRegistrationPayload"
  | "auth.emailAlreadyRegistered"
  | "auth.registrationSuccessful"
  | "auth.registrationFailed"
  | "auth.localeUpdated"
  | "auth.invalidLocalePayload";

const messages: Record<AppLocale, Record<ApiMessageKey, string>> = {
  uk: {
    "errors.unauthorized": "Неавторизовано",
    "errors.forbidden": "Заборонено",
    "auth.tooManyLoginAttempts": "Забагато спроб входу. Спробуйте пізніше.",
    "auth.invalidLoginPayload": "Некоректні дані для входу",
    "auth.invalidCredentials": "Невірний email або пароль",
    "auth.accountTemporarilyLocked": "Акаунт тимчасово заблоковано через невдалі спроби входу",
    "auth.emailVerificationRequired": "Потрібно підтвердити email перед входом",
    "auth.loginSuccessful": "Вхід успішний",
    "auth.loginFailed": "Помилка входу",
    "auth.tooManyRegistrationAttempts": "Забагато спроб реєстрації. Спробуйте пізніше.",
    "auth.invalidRegistrationPayload": "Некоректні дані реєстрації",
    "auth.emailAlreadyRegistered": "Email вже зареєстрований",
    "auth.registrationSuccessful": "Реєстрація успішна. Підтвердіть email перед входом.",
    "auth.registrationFailed": "Помилка реєстрації",
    "auth.localeUpdated": "Мову оновлено",
    "auth.invalidLocalePayload": "Некоректний параметр мови",
  },
  en: {
    "errors.unauthorized": "Unauthorized",
    "errors.forbidden": "Forbidden",
    "auth.tooManyLoginAttempts": "Too many login attempts. Please retry later.",
    "auth.invalidLoginPayload": "Invalid login payload",
    "auth.invalidCredentials": "Invalid email or password",
    "auth.accountTemporarilyLocked": "Account is temporarily locked due to failed login attempts",
    "auth.emailVerificationRequired": "Email verification required before sign in",
    "auth.loginSuccessful": "Login successful",
    "auth.loginFailed": "Login failed",
    "auth.tooManyRegistrationAttempts": "Too many registration attempts. Please retry later.",
    "auth.invalidRegistrationPayload": "Invalid registration payload",
    "auth.emailAlreadyRegistered": "Email is already registered",
    "auth.registrationSuccessful": "Registration successful. Verify your email before signing in.",
    "auth.registrationFailed": "Registration failed",
    "auth.localeUpdated": "Locale updated",
    "auth.invalidLocalePayload": "Invalid locale payload",
  },
  es: {
    "errors.unauthorized": "No autorizado",
    "errors.forbidden": "Prohibido",
    "auth.tooManyLoginAttempts": "Demasiados intentos de inicio de sesión. Inténtalo más tarde.",
    "auth.invalidLoginPayload": "Datos de inicio de sesión inválidos",
    "auth.invalidCredentials": "Correo o contraseña inválidos",
    "auth.accountTemporarilyLocked": "La cuenta está bloqueada temporalmente por intentos fallidos",
    "auth.emailVerificationRequired": "Debes verificar tu correo antes de iniciar sesión",
    "auth.loginSuccessful": "Inicio de sesión correcto",
    "auth.loginFailed": "Error al iniciar sesión",
    "auth.tooManyRegistrationAttempts": "Demasiados intentos de registro. Inténtalo más tarde.",
    "auth.invalidRegistrationPayload": "Datos de registro inválidos",
    "auth.emailAlreadyRegistered": "El correo ya está registrado",
    "auth.registrationSuccessful": "Registro completado. Verifica tu correo antes de iniciar sesión.",
    "auth.registrationFailed": "Error de registro",
    "auth.localeUpdated": "Idioma actualizado",
    "auth.invalidLocalePayload": "Idioma inválido",
  },
  tr: {
    "errors.unauthorized": "Yetkisiz",
    "errors.forbidden": "Yasak",
    "auth.tooManyLoginAttempts": "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.",
    "auth.invalidLoginPayload": "Geçersiz giriş verisi",
    "auth.invalidCredentials": "E-posta veya parola hatalı",
    "auth.accountTemporarilyLocked": "Hesap başarısız giriş denemeleri nedeniyle geçici olarak kilitlendi",
    "auth.emailVerificationRequired": "Girişten önce e-posta doğrulaması gerekli",
    "auth.loginSuccessful": "Giriş başarılı",
    "auth.loginFailed": "Giriş başarısız",
    "auth.tooManyRegistrationAttempts": "Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.",
    "auth.invalidRegistrationPayload": "Geçersiz kayıt verisi",
    "auth.emailAlreadyRegistered": "E-posta zaten kayıtlı",
    "auth.registrationSuccessful": "Kayıt başarılı. Girişten önce e-postanızı doğrulayın.",
    "auth.registrationFailed": "Kayıt başarısız",
    "auth.localeUpdated": "Dil güncellendi",
    "auth.invalidLocalePayload": "Geçersiz dil verisi",
  },
  ru: {
    "errors.unauthorized": "Не авторизовано",
    "errors.forbidden": "Запрещено",
    "auth.tooManyLoginAttempts": "Слишком много попыток входа. Повторите позже.",
    "auth.invalidLoginPayload": "Некорректные данные входа",
    "auth.invalidCredentials": "Неверный email или пароль",
    "auth.accountTemporarilyLocked": "Аккаунт временно заблокирован из-за неудачных попыток входа",
    "auth.emailVerificationRequired": "Перед входом требуется подтверждение email",
    "auth.loginSuccessful": "Вход выполнен",
    "auth.loginFailed": "Ошибка входа",
    "auth.tooManyRegistrationAttempts": "Слишком много попыток регистрации. Повторите позже.",
    "auth.invalidRegistrationPayload": "Некорректные данные регистрации",
    "auth.emailAlreadyRegistered": "Email уже зарегистрирован",
    "auth.registrationSuccessful": "Регистрация успешна. Подтвердите email перед входом.",
    "auth.registrationFailed": "Ошибка регистрации",
    "auth.localeUpdated": "Язык обновлен",
    "auth.invalidLocalePayload": "Некорректный язык",
  },
};

export function resolveLocaleFromRequest(req: NextRequest): AppLocale {
  const fromHeader = req.headers.get("x-next-intl-locale");
  if (fromHeader && (SUPPORTED_LOCALES as readonly string[]).includes(fromHeader)) {
    return fromHeader as AppLocale;
  }
  const fromCookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (fromCookie && (SUPPORTED_LOCALES as readonly string[]).includes(fromCookie)) {
    return fromCookie as AppLocale;
  }
  const fromAccept = req.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? null;
  return normalizeLocale(fromAccept ?? DEFAULT_LOCALE);
}

export function apiMessage(req: NextRequest, key: ApiMessageKey): string {
  const locale = resolveLocaleFromRequest(req);
  return messages[locale][key];
}
