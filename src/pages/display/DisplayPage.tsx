import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { HeaderSection } from '../../components/display/HeaderSection';
import { ClockSection } from '../../components/display/ClockSection';
import { MainContentSection } from '../../components/display/MainContentSection';
import { PrayerScheduleCards } from '../../components/display/PrayerScheduleCards';
import { RunningTextFooter } from '../../components/display/RunningTextFooter';
import { AdzanOverlay } from '../../components/display/Overlays/AdzanOverlay';
import { IqamahOverlay } from '../../components/display/Overlays/IqamahOverlay';
import { SyuruqOverlay } from '../../components/display/Overlays/SyuruqOverlay';
import { FridayModeOverlay } from '../../components/display/Overlays/FridayModeOverlay';
import { MurottalPlayer } from '../../components/display/MurottalPlayer';
import { DzikirPlayer } from '../../components/display/DzikirPlayer';

export const DisplayPage: React.FC = () => {
  const { simulator, setSimulatorMode, theme, profile, syuruqSetting, getAdjustedSchedule, layoutMode } = useApp();

  // Automatic trigger check for Syuruq time
  useEffect(() => {
    const checkTimer = setInterval(() => {
      const now = new Date();
      const currentFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const seconds = now.getSeconds();

      const adjustedSchedule = getAdjustedSchedule();

      // Check if current time matches Syuruq at :00 seconds
      if (
        syuruqSetting?.isEnabled &&
        seconds === 0 &&
        currentFormatted === adjustedSchedule.syuruq &&
        simulator.currentMode === 'normal'
      ) {
        setSimulatorMode('syuruq');
      }
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [syuruqSetting, getAdjustedSchedule, simulator.currentMode, setSimulatorMode]);

  const bgOpacity = layoutMode === 'hero' ? 'opacity-30' : 'opacity-15';

  const bgClass = theme.bgColor && !theme.bgColor.startsWith('#') ? theme.bgColor : '';
  const textClass = theme.textColor && !theme.textColor.startsWith('#') ? theme.textColor : '';

  const customStyle: React.CSSProperties = {};
  if (theme.bgColor && theme.bgColor.startsWith('#')) {
    customStyle.backgroundColor = theme.bgColor;
  }
  if (theme.textColor && theme.textColor.startsWith('#')) {
    customStyle.color = theme.textColor;
  }

  return (
    <div style={customStyle} className={`h-screen max-h-screen w-screen overflow-hidden flex flex-col justify-between relative select-none ${bgClass} ${textClass}`}>
      {/* Background Image Overlay with subtle opacity */}
      {profile.backgroundPath && (
        <div className={`absolute inset-0 z-0 ${bgOpacity} pointer-events-none transition-opacity duration-500`}>
          <img
            src={profile.backgroundPath}
            alt="Mosque Background"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Top Header */}
      <HeaderSection />

      {/* Main Body Grid with Dynamic Layout Modes */}
      <main className="flex-1 p-2 md:p-4 lg:p-5 flex flex-col gap-2 md:gap-3 lg:gap-4 max-w-[1920px] w-full mx-auto relative z-10 justify-between overflow-hidden">
        {/* 1. HERO LAYOUT FOCUS */}
        {layoutMode === 'hero' && (
          <>
            <MainContentSection />
            <ClockSection />
            <PrayerScheduleCards />
          </>
        )}

        {/* 2. MEDIA & STREAMING FOCUS */}
        {layoutMode === 'media_focus' && (
          <>
            <MainContentSection />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-3 lg:gap-4 items-center shrink-0">
              <div className="lg:col-span-5">
                <ClockSection />
              </div>
              <div className="lg:col-span-7">
                <PrayerScheduleCards />
              </div>
            </div>
          </>
        )}

        {/* 3. MINIMALIST CLEAN */}
        {layoutMode === 'minimal' && (
          <>
            <ClockSection />
            <PrayerScheduleCards />
            <MainContentSection />
          </>
        )}

        {/* 4. DEFAULT BALANCED LAYOUT */}
        {(layoutMode === 'default' || !['hero', 'media_focus', 'minimal'].includes(layoutMode)) && (
          <>
            <ClockSection />
            <MainContentSection />
            <PrayerScheduleCards />
          </>
        )}
      </main>

      {/* Bottom Running Text Marquee */}
      <RunningTextFooter />

      {/* Murottal Pre-Adzan Background Audio Player */}
      <MurottalPlayer />

      {/* Dzikir Pagi & Petang Background Audio Player */}
      <DzikirPlayer />

      {/* Conditional Display Priority Overlays */}
      {simulator.currentMode === 'adzan' && <AdzanOverlay />}
      {simulator.currentMode === 'iqamah' && <IqamahOverlay />}
      {simulator.currentMode === 'syuruq' && <SyuruqOverlay />}
      {simulator.currentMode === 'friday_khutbah' && <FridayModeOverlay />}
    </div>
  );
};
