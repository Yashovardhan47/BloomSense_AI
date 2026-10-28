export const LANGUAGES = [
  ["en", "en-IN", "English"], ["hi", "hi-IN", "हिन्दी"], ["te", "te-IN", "తెలుగు"],
  ["ta", "ta-IN", "தமிழ்"], ["kn", "kn-IN", "ಕನ್ನಡ"], ["ml", "ml-IN", "മലയാളം"],
  ["mr", "mr-IN", "मराठी"], ["gu", "gu-IN", "ગુજરાતી"], ["bn", "bn-IN", "বাংলা"],
  ["pa", "pa-IN", "ਪੰਜਾਬੀ"], ["ur", "ur-PK", "اردو"], ["ne", "ne-NP", "नेपाली"],
  ["si", "si-LK", "සිංහල"], ["ar", "ar-SA", "العربية"], ["fa", "fa-IR", "فارسی"],
  ["he", "he-IL", "עברית"], ["fr", "fr-FR", "Français"], ["es", "es-ES", "Español"],
  ["de", "de-DE", "Deutsch"], ["it", "it-IT", "Italiano"], ["pt", "pt-BR", "Português"],
  ["nl", "nl-NL", "Nederlands"], ["ru", "ru-RU", "Русский"], ["uk", "uk-UA", "Українська"],
  ["pl", "pl-PL", "Polski"], ["cs", "cs-CZ", "Čeština"], ["ro", "ro-RO", "Română"],
  ["hu", "hu-HU", "Magyar"], ["el", "el-GR", "Ελληνικά"], ["tr", "tr-TR", "Türkçe"],
  ["sv", "sv-SE", "Svenska"], ["no", "nb-NO", "Norsk"], ["da", "da-DK", "Dansk"],
  ["fi", "fi-FI", "Suomi"], ["is", "is-IS", "Íslenska"], ["ga", "ga-IE", "Gaeilge"],
  ["cy", "cy-GB", "Cymraeg"], ["zh-CN", "zh-CN", "简体中文"], ["zh-TW", "zh-TW", "繁體中文"],
  ["ja", "ja-JP", "日本語"], ["ko", "ko-KR", "한국어"], ["vi", "vi-VN", "Tiếng Việt"],
  ["th", "th-TH", "ไทย"], ["id", "id-ID", "Bahasa Indonesia"], ["ms", "ms-MY", "Bahasa Melayu"],
  ["fil", "fil-PH", "Filipino"], ["my", "my-MM", "မြန်မာ"], ["km", "km-KH", "ខ្មែរ"],
  ["lo", "lo-LA", "ລາວ"], ["sw", "sw-KE", "Kiswahili"], ["am", "am-ET", "አማርኛ"],
  ["zu", "zu-ZA", "isiZulu"], ["af", "af-ZA", "Afrikaans"],
].map(([code, locale, name]) => ({ code, locale, name }));

export const localeFor = (code) => LANGUAGES.find((item) => item.code === code)?.locale || code;
