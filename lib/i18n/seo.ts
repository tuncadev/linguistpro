import type { Metadata } from "next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale, normalizeLocale } from "@/i18n/routing";
import { localizePath } from "@/i18n/locale-path";

const SITE_NAME = "LinguistPro";

type PageKey =
  | "home"
  | "about"
  | "courses"
  | "login"
  | "register"
  | "privacy"
  | "refundPolicy"
  | "support"
  | "terms"
  | "unauthorized";

type LocalizedSeoText = {
  title: string;
  description: string;
};

const SEO_TEXT: Record<AppLocale, Record<PageKey, LocalizedSeoText>> = {
  uk: {
    home: { title: "Онлайн вивчення мов", description: "Вивчайте мови з досвідченими викладачами та структурованими курсами." },
    about: { title: "Про платформу", description: "Дізнайтесь про місію та підхід команди LinguistPro." },
    courses: { title: "Каталог курсів", description: "Перегляньте мовні курси за рівнем, викладачем і напрямом." },
    login: { title: "Вхід", description: "Увійдіть до кабінету студента, викладача або адміністратора." },
    register: { title: "Реєстрація", description: "Створіть обліковий запис і почніть навчання на LinguistPro." },
    privacy: { title: "Політика конфіденційності", description: "Як LinguistPro обробляє та захищає дані користувачів." },
    refundPolicy: { title: "Політика повернення коштів", description: "Умови повернення та розгляду запитів на компенсацію." },
    support: { title: "Підтримка", description: "Канали підтримки та порядок ескалації інцидентів." },
    terms: { title: "Умови використання", description: "Правила використання платформи та відповідальність користувачів." },
    unauthorized: { title: "Доступ заборонено", description: "У вас немає прав для доступу до цієї сторінки." },
  },
  en: {
    home: { title: "Online Language Learning", description: "Learn languages with expert tutors and structured course paths." },
    about: { title: "About LinguistPro", description: "Learn more about LinguistPro mission and learning approach." },
    courses: { title: "Course Catalog", description: "Browse language courses by level, tutor, and learning objective." },
    login: { title: "Login", description: "Sign in to your student, tutor, or admin account." },
    register: { title: "Register", description: "Create your LinguistPro account and start learning." },
    privacy: { title: "Privacy Policy", description: "How LinguistPro handles and secures user data." },
    refundPolicy: { title: "Refund Policy", description: "Rules for refund requests and dispute handling." },
    support: { title: "Support", description: "Support channels and incident escalation contacts." },
    terms: { title: "Terms of Service", description: "Platform usage terms and user responsibilities." },
    unauthorized: { title: "Unauthorized", description: "You do not have permission to access this page." },
  },
  es: {
    home: { title: "Aprendizaje de idiomas en línea", description: "Aprende idiomas con tutores expertos y cursos estructurados." },
    about: { title: "Sobre LinguistPro", description: "Conoce la misión y el enfoque educativo de LinguistPro." },
    courses: { title: "Catálogo de cursos", description: "Explora cursos por nivel, tutor y objetivos de aprendizaje." },
    login: { title: "Iniciar sesión", description: "Accede a tu cuenta de estudiante, tutor o administrador." },
    register: { title: "Registro", description: "Crea tu cuenta de LinguistPro y comienza a estudiar." },
    privacy: { title: "Política de privacidad", description: "Cómo LinguistPro procesa y protege los datos de usuarios." },
    refundPolicy: { title: "Política de reembolso", description: "Condiciones para solicitudes de reembolso y disputas." },
    support: { title: "Soporte", description: "Canales de soporte y contactos para escalación de incidentes." },
    terms: { title: "Términos del servicio", description: "Normas de uso de la plataforma y responsabilidades del usuario." },
    unauthorized: { title: "Sin autorización", description: "No tienes permisos para acceder a esta página." },
  },
  tr: {
    home: { title: "Online Dil Eğitimi", description: "Uzman eğitmenler ve yapılandırılmış kurslarla dil öğrenin." },
    about: { title: "LinguistPro Hakkında", description: "LinguistPro vizyonu ve öğrenme yaklaşımı hakkında bilgi alın." },
    courses: { title: "Kurs Kataloğu", description: "Seviye, eğitmen ve hedefe göre dil kurslarını keşfedin." },
    login: { title: "Giriş", description: "Öğrenci, eğitmen veya yönetici hesabınıza giriş yapın." },
    register: { title: "Kayıt Ol", description: "LinguistPro hesabınızı oluşturup öğrenmeye başlayın." },
    privacy: { title: "Gizlilik Politikası", description: "LinguistPro kullanıcı verilerini nasıl işler ve korur." },
    refundPolicy: { title: "İade Politikası", description: "İade talepleri ve itiraz süreçleri için kurallar." },
    support: { title: "Destek", description: "Destek kanalları ve olay eskalasyon iletişim bilgileri." },
    terms: { title: "Hizmet Şartları", description: "Platform kullanım şartları ve kullanıcı sorumlulukları." },
    unauthorized: { title: "Yetkisiz", description: "Bu sayfaya erişim izniniz bulunmuyor." },
  },
  ru: {
    home: { title: "Онлайн изучение языков", description: "Изучайте языки с опытными преподавателями и структурированными курсами." },
    about: { title: "О LinguistPro", description: "Узнайте о миссии и образовательном подходе LinguistPro." },
    courses: { title: "Каталог курсов", description: "Подберите языковые курсы по уровню, преподавателю и целям." },
    login: { title: "Вход", description: "Войдите в аккаунт студента, преподавателя или администратора." },
    register: { title: "Регистрация", description: "Создайте аккаунт в LinguistPro и начните обучение." },
    privacy: { title: "Политика конфиденциальности", description: "Как LinguistPro обрабатывает и защищает данные пользователей." },
    refundPolicy: { title: "Политика возврата", description: "Условия возврата средств и порядок обработки споров." },
    support: { title: "Поддержка", description: "Каналы поддержки и контакты для эскалации инцидентов." },
    terms: { title: "Условия использования", description: "Правила использования платформы и ответственность пользователей." },
    unauthorized: { title: "Доступ запрещен", description: "У вас нет прав для доступа к этой странице." },
  },
};

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    return "http://localhost:3000";
  }
  return raw.replace(/\/+$/, "");
}

export function buildPageMetadata(page: PageKey, localeInput: string, internalPathname: string): Metadata {
  const locale = normalizeLocale(localeInput);
  const seo = SEO_TEXT[locale]?.[page] ?? SEO_TEXT[DEFAULT_LOCALE][page];
  const baseUrl = getBaseUrl();
  const canonicalPath = localizePath(internalPathname, locale);
  const canonical = `${baseUrl}${canonicalPath}`;
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((candidate) => [
      candidate,
      `${baseUrl}${localizePath(internalPathname, candidate)}`,
    ])
  );

  return {
    title: `${seo.title} | ${SITE_NAME}`,
    description: seo.description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: `${seo.title} | ${SITE_NAME}`,
      description: seo.description,
      url: canonical,
      locale,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}
