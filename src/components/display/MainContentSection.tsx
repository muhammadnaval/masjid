import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Table, QrCode, Image as ImageIcon, Video, Youtube, Radio, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { MediaItem } from '../../types';

export const MainContentSection: React.FC = () => {
  const { mediaItems, donation, simulator } = useApp();
  const activeItems = mediaItems.filter(m => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (activeItems.length === 0) return;
    const currentSlide = activeItems[currentIndex];

    // For video items, slide transition is triggered by onEnded event when video finishes playing
    if (currentSlide?.type === 'video') {
      return;
    }

    const duration = (currentSlide?.durationSeconds || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, activeItems]);

  const handleVideoEnded = () => {
    if (activeItems.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    }
  };

  const currentMedia: MediaItem = activeItems[currentIndex] || activeItems[0];

  const [hadithData, setHadithData] = useState<{
    id?: number;
    title: string;
    indo: string;
    grade?: string;
    takhrij?: string;
  } | null>(null);
  const [hadithLoading, setHadithLoading] = useState(false);

  useEffect(() => {
    if (currentMedia?.type === 'hadith') {
      setHadithLoading(true);
      fetch('https://api.myquran.com/v3/hadis/enc/random')
        .then(res => res.json())
        .then(data => {
          if (data.status && data.data && data.data.text) {
            const h = data.data;
            const takhrijStr = h.takhrij ? `${h.takhrij}` : '';
            const gradeStr = h.grade ? ` [${h.grade}]` : '';
            setHadithData({
              id: h.id,
              title: takhrijStr ? `${takhrijStr}${gradeStr}` : (currentMedia.title || 'Hadits Pilihan'),
              indo: h.text.id || 'Sesungguhnya setiap amalan tergantung pada niatnya.',
              grade: h.grade,
              takhrij: h.takhrij,
            });
          } else {
            setHadithData({
              title: 'Diriwayatkan oleh Muslim [Hadis sahih]',
              indo: 'Dari Abdullah bin Mas\'ud -raḍiyallāhu \'anhu-, dari Nabi -ṣallallāhu \'alaihi wa sallam-, beliau bersabda: Maukah kalian aku sampaikan tentang apakah kedustaan? Itulah namimah (yang) banyak menyebarkan pembicaraan di tengah masyarakat.',
            });
          }
        })
        .catch(() => {
          setHadithData({
            title: 'Diriwayatkan oleh Muslim [Hadis sahih]',
            indo: 'Dari Abdullah bin Mas\'ud -raḍiyallāhu \'anhu-, dari Nabi -ṣallallāhu \'alaihi wa sallam-, beliau bersabda: Maukah kalian aku sampaikan tentang apakah kedustaan? Itulah namimah (yang) banyak menyebarkan pembicaraan di tengah masyarakat.',
          });
        })
        .finally(() => setHadithLoading(false));
    }
  }, [currentIndex, currentMedia?.type]);

  const [doaData, setDoaData] = useState<{
    id?: number;
    grup?: string;
    nama: string;
    ar: string;
    tr?: string;
    idn: string;
    tentang?: string;
  } | null>(null);
  const [doaLoading, setDoaLoading] = useState(false);

  useEffect(() => {
    if (currentMedia?.type === 'doa') {
      setDoaLoading(true);
      fetch('https://equran.id/api/doa')
        .then(res => res.json())
        .then(resData => {
          const list = Array.isArray(resData) ? resData : (resData.data || []);
          if (list && list.length > 0) {
            const randomItem = list[Math.floor(Math.random() * list.length)];
            setDoaData({
              id: randomItem.id,
              grup: randomItem.grup,
              nama: randomItem.nama,
              ar: randomItem.ar,
              tr: randomItem.tr,
              idn: randomItem.idn,
              tentang: randomItem.tentang,
            });
          } else {
            setDoaData({
              grup: 'Doa Sebelum dan Sesudah Tidur',
              nama: 'Doa Sebelum Tidur',
              ar: 'بِاسْمِكَ رَبِّيْ وَضَعْتُ جَنْبِيْ، وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِيْ فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِيْنَ',
              tr: 'Bismika robbii wa dho\'tu janbii, wa bika arfa\'uhu...',
              idn: 'Dengan nama Engkau, wahai Tuhanku, aku meletakkan lambungku...',
              tentang: 'HR. Al-Bukhari & Muslim',
            });
          }
        })
        .catch(() => {
          setDoaData({
            grup: 'Doa Memohon Kebaikan',
            nama: 'Doa Memohon Kebaikan Dunia & Akhirat',
            ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
            tr: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina \'adhaban-nar',
            idn: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat dan peliharalah kami dari siksa neraka.',
            tentang: 'QS. Al-Baqarah: 201',
          });
        })
        .finally(() => setDoaLoading(false));
    }
  }, [currentIndex, currentMedia?.type]);

  const parseTextContent = (content?: string) => {
    if (!content) return { subtitle: '', arabic: '', latin: '', translation: '' };
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          subtitle: parsed.subtitle || '',
          arabic: parsed.arabic || '',
          latin: parsed.latin || '',
          translation: parsed.translation || parsed.text || content,
        };
      }
    } catch (e) {
      return {
        subtitle: '',
        arabic: '',
        latin: '',
        translation: content,
      };
    }
    return { subtitle: '', arabic: '', latin: '', translation: content };
  };

  const textData = parseTextContent(currentMedia.content);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % activeItems.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);

  const handleMediaError = () => {
    if (activeItems.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    }
  };

  // If display is not in normal mode (e.g. Adzan, Iqamah), do not play video/audio
  const isModeNormal = simulator.currentMode === 'normal';

  return (
    <div className="relative w-full flex-1 min-h-[200px] lg:min-h-[380px] bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col justify-between p-4 lg:p-6">
      {/* Slide Content rendering by type */}

      {/* 1. Image Slide */}
      {currentMedia.type === 'image' && (
        <div className="absolute inset-0 z-0">
          <img
            src={currentMedia.filePath}
            alt={currentMedia.title}
            onError={handleMediaError}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-semibold mb-2">
              <ImageIcon className="w-3.5 h-3.5" />
              Poster & Informasi
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-white drop-shadow-md">
              {currentMedia.title}
            </h2>
          </div>
        </div>
      )}

      {/* 2. Video Slide */}
      {currentMedia.type === 'video' && isModeNormal && (
        <div className="absolute inset-0 z-0">
          <video
            src={currentMedia.filePath || currentMedia.content}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            onError={handleMediaError}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-300 text-xs font-semibold mb-2">
              <Video className="w-3.5 h-3.5" />
              Video Informasi
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-white drop-shadow-md">
              {currentMedia.title}
            </h2>
          </div>
        </div>
      )}

      {/* 3. YouTube Embed Slide */}
      {currentMedia.type === 'youtube' && isModeNormal && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <iframe
            src={currentMedia.filePath || currentMedia.content}
            title={currentMedia.title}
            className="w-full h-full border-0 pointer-events-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-300 text-xs font-semibold mb-2">
              <Youtube className="w-3.5 h-3.5" />
              YouTube Video
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-white drop-shadow-md">
              {currentMedia.title}
            </h2>
          </div>
        </div>
      )}

      {/* 4. Livestream Embed Slide */}
      {currentMedia.type === 'livestream' && isModeNormal && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <iframe
            src={currentMedia.filePath || currentMedia.content}
            title={currentMedia.title}
            className="w-full h-full border-0 pointer-events-none"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-semibold mb-2 animate-pulse">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Siaran Langsung / Livestream
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-white drop-shadow-md">
                {currentMedia.title}
              </h2>
            </div>
            <span className="px-2.5 py-1 bg-red-600 text-white font-bold text-[10px] uppercase rounded-md tracking-wider animate-pulse">
              LIVE
            </span>
          </div>
        </div>
      )}

      {/* 5. Text Slide */}
      {currentMedia.type === 'text' && (
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold">
              <BookOpen className="w-4 h-4" />
              Mutiara Islam & Pesan Dakwah
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {textData.subtitle || currentMedia.title}
            </span>
          </div>

          <div className="my-auto text-center px-4 py-2">
            {textData.arabic && (
              <p className="text-2xl lg:text-4xl font-arabic leading-relaxed text-amber-200 drop-shadow-md mb-3 dir-rtl">
                {textData.arabic}
              </p>
            )}
            {textData.latin && (
              <p className="text-sm lg:text-base italic text-emerald-300 mb-2">
                {textData.latin}
              </p>
            )}
            <p className="text-sm lg:text-xl text-slate-200 max-w-4xl mx-auto leading-relaxed font-semibold">
              "{textData.translation}"
            </p>
          </div>
        </div>
      )}

      {/* 5b. Hadith Slide (MyQuran API v3) */}
      {currentMedia.type === 'hadith' && (
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
              <BookOpen className="w-4 h-4" />
              Hadits Otomatis (MyQuran API v3)
            </span>
            <span className="text-xs text-amber-400 font-bold">
              {hadithData?.id ? `Hadits #${hadithData.id}` : 'Random Hadits v3'}
            </span>
          </div>

          <div className="my-auto text-center px-4 py-2 space-y-3">
            {hadithLoading ? (
              <div className="text-slate-400 text-sm animate-pulse">Mengambil Hadits dari API MyQuran v3...</div>
            ) : hadithData ? (
              <div className="space-y-4 max-w-4xl mx-auto py-2">
                {hadithData.title && (
                  <h4 className="text-base lg:text-xl font-black text-amber-300 tracking-wide uppercase drop-shadow-md">
                    "{hadithData.title}"
                  </h4>
                )}
                <p className="text-base lg:text-xl text-slate-100 leading-relaxed font-medium bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80 shadow-2xl">
                  "{hadithData.indo}"
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 5c. Doa Slide (equran.id API) */}
      {currentMedia.type === 'doa' && (
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              Doa Harian Otomatis (equran.id API)
            </span>
            <span className="text-xs text-amber-400 font-bold truncate max-w-[280px]">
              {doaData?.grup || doaData?.nama || 'Doa Harian'}
            </span>
          </div>

          <div className="my-auto text-center px-2 py-1 space-y-2 flex-1 flex flex-col justify-center overflow-hidden">
            {doaLoading ? (
              <div className="text-slate-400 text-sm animate-pulse flex flex-col items-center justify-center space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
                <span>Mengambil Doa Harian dari API equran.id...</span>
              </div>
            ) : doaData ? (
              <div className="space-y-2 max-w-4xl mx-auto py-1 flex flex-col justify-center overflow-hidden">
                {doaData.nama && (
                  <h4 className="text-xs md:text-sm lg:text-base font-bold text-amber-300 tracking-wide uppercase drop-shadow-md shrink-0">
                    {doaData.nama}
                  </h4>
                )}
                {doaData.ar && (
                  <p className="text-lg md:text-xl lg:text-3xl font-arabic leading-snug text-emerald-200 drop-shadow-md dir-rtl px-2 shrink-0">
                    {doaData.ar}
                  </p>
                )}
                {doaData.tr && (
                  <p className="text-[11px] md:text-xs lg:text-sm italic text-amber-200/90 font-medium shrink-0">
                    {doaData.tr}
                  </p>
                )}
                {doaData.idn && (
                  <p className="text-xs md:text-sm lg:text-base text-slate-100 leading-snug font-medium bg-slate-950/70 p-2.5 md:p-3 lg:p-4 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden line-clamp-3 md:line-clamp-4">
                    "{doaData.idn}"
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 6. Table Slide */}
      {currentMedia.type === 'table' && (
        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
              <Table className="w-4 h-4" />
              Tabel Informasi
            </span>
            <h3 className="text-lg font-bold text-white">{currentMedia.title}</h3>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs lg:text-sm">
              <thead className="bg-slate-800/80 text-emerald-300 font-semibold sticky top-0">
                <tr>
                  {currentMedia.tableData?.headers.map((h, i) => (
                    <th key={i} className="p-3 border-b border-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {currentMedia.tableData?.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 font-medium">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Donation Slide */}
      {currentMedia.type === 'donation' && (
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 h-full my-auto">
          <div className="flex-1 text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold mb-3">
              <QrCode className="w-4 h-4" />
              Infaq & Sedekah Digital
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">
              {donation.title}
            </h2>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {donation.description}
            </p>

            <div className="bg-slate-800/70 border border-amber-500/30 p-4 rounded-2xl flex flex-col gap-1 text-xs lg:text-sm">
              <span className="text-slate-400">Transfer Rekening:</span>
              <span className="text-base font-bold text-amber-300">{donation.bankName}</span>
              <span className="text-xl font-black font-mono text-white tracking-wider">{donation.accountNumber}</span>
              <span className="text-slate-300 font-medium">a.n. {donation.accountName}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-3xl shadow-2xl border-4 border-amber-400">
            <img
              src={donation.qrCodePath}
              alt="QR Code Donasi"
              className="w-36 h-36 lg:w-44 lg:h-44 object-contain"
            />
            <span className="text-[11px] font-black text-slate-900 mt-2 uppercase tracking-wider">Scan QRIS Untuk Donasi</span>
          </div>
        </div>
      )}

      {/* Control Overlay & Slide Indicator */}
      <div className="relative z-20 flex items-center justify-between pt-2 border-t border-slate-800/60 mt-auto">
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {activeItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
