import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { ttsService } from '../services/tts';
import { t } from '../config/localizations';
import { theme } from '../config/theme';

interface OnboardingPage {
  imagePath: string;
  titleKey: string;
  subtitleKey: string;
  ttsKey: string;
  isLast?: boolean;
}

const pages: OnboardingPage[] = [
  { imagePath: '/images/Detects1-.png', titleKey: 'onboarding_detect_title', subtitleKey: 'onboarding_detect_subtitle', ttsKey: 'onboarding_detect_tts' },
  { imagePath: '/images/PointCam.png', titleKey: 'onboarding_how_title', subtitleKey: 'onboarding_how_subtitle', ttsKey: 'onboarding_how_tts' },
  { imagePath: '/images/Feedback.png', titleKey: 'onboarding_feedback_title', subtitleKey: 'onboarding_feedback_subtitle', ttsKey: 'onboarding_feedback_tts' },
  { imagePath: '/images/No_images.png', titleKey: 'onboarding_privacy_title', subtitleKey: 'onboarding_privacy_subtitle', ttsKey: 'onboarding_privacy_tts', isLast: true },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, isDark } = useSettings();
  const lang = settings.language;
  const [currentPage, setCurrentPage] = useState(0);
  const colors = isDark ? theme.dark : theme.light;
  const page = pages[currentPage];

  function speakPage(index: number) {
    const p = pages[index];
    setTimeout(() => ttsService.speak(t(p.ttsKey, lang), lang), 300);
  }

  function nextPage() {
    if (currentPage < pages.length - 1) {
      const next = currentPage + 1;
      setCurrentPage(next);
      speakPage(next);
    }
  }

  function completeOnboarding() {
    updateSettings({ onboardingComplete: true });
    navigate('/home', { replace: true });
  }

  // Speak first page on mount
  useEffect(() => { speakPage(0); }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 pt-safe">
        <div className="flex items-center gap-3">
          <img src="/images/apk-icon.png" alt="EYES" className="w-10 h-10 rounded-xl" />
          <span className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>EYES</span>
        </div>
        <button
          onClick={completeOnboarding}
          className="px-4 py-3 text-lg font-medium min-w-[56px] min-h-[56px]"
          style={{ color: colors.textSecondary }}
        >
          {t('skip', lang)}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div
          className="w-[220px] h-[220px] rounded-3xl flex items-center justify-center p-6"
          style={{ backgroundColor: isDark ? colors.surface : `${theme.accent}1A` }}
        >
          <img src={page.imagePath} alt="" className="max-w-full max-h-full object-contain" />
        </div>
        <h2
          className="mt-10 text-[26px] font-semibold text-center leading-tight"
          style={{ color: colors.textPrimary }}
        >
          {t(page.titleKey, lang)}
        </h2>
        <p
          className="mt-3 text-lg font-medium text-center"
          style={{ color: colors.textSecondary }}
        >
          {t(page.subtitleKey, lang)}
        </p>

        {page.isLast && (
          <button
            onClick={completeOnboarding}
            className="mt-12 w-full max-w-sm h-14 rounded-2xl text-lg font-bold text-white"
            style={{ backgroundColor: theme.accent }}
          >
            {t('get_started', lang)}
          </button>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="pb-12 px-6">
        {/* Dots */}
        <div className="flex justify-center gap-3 mb-8">
          {pages.map((_, i) => (
            <div
              key={i}
              className="h-[10px] rounded-full transition-all duration-200"
              style={{
                width: i === currentPage ? 24 : 10,
                backgroundColor: i === currentPage ? theme.accent : colors.inactive,
              }}
            />
          ))}
        </div>

        {/* Next button */}
        {!page.isLast && (
          <button
            onClick={nextPage}
            className="w-full h-14 rounded-2xl text-lg font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.accent }}
          >
            {t('next', lang)}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
