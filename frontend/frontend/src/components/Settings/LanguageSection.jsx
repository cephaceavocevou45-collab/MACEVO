import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  {
    code: 'fr',
    name: 'Français',
    desc: 'Interface complète en français'
  },
  {
    code: 'en',
    name: 'English',
    desc: 'Complete interface in English'
  },
  {
    code: 'zh',
    name: '中文',
    desc: '完整中文界面'
  },
  {
    code: 'ar',
    name: 'العربية',
    desc: 'واجهة كاملة باللغة العربية'
  }
];

export default function LanguageSection() {
  const { t, i18n } = useTranslation();

  // Code de langue actif nettoyé (ex: "fr-FR" -> "fr")
  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'fr';

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    
    // Gérer l'orientation pour l'arabe (RTL)
    if (code === 'ar') {
      document.dir = 'rtl';
    } else {
      document.dir = 'ltr';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold mb-1">{t('settings.language')}</h2>
      <p className="text-gray-500 text-sm mb-6">{t('settings.language_subtitle')}</p>

      <div className="space-y-3">
        {languages.map((lang) => {
          const isSelected = currentLang === lang.code;
          return (
            <div
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <p className="font-medium text-gray-900">{lang.name}</p>
                <p className="text-sm text-gray-500">{lang.desc}</p>
              </div>
              <input
                type="radio"
                name="app-language"
                checked={isSelected}
                onChange={() => handleLanguageChange(lang.code)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}