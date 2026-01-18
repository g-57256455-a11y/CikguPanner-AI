
import React, { useState, useRef, useEffect } from 'react';
import { AppView, WeeklyPlanItem, SavedRPH } from './types.ts';
import { analyzeRPT } from './services/geminiService.ts';
import { extractTextFromFile } from './utils/fileHelpers.ts';
import { Button } from './components/Button.tsx';
import { WeekCard } from './components/WeekCard.tsx';
import { DailyRPHModal } from './components/DailyRPHModal.tsx';
import { CalendarView } from './components/CalendarView.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.INPUT_RPT);
  const [rptText, setRptText] = useState<string>('');
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyPlanItem | null>(null);
  const [selectedSavedRPH, setSelectedSavedRPH] = useState<SavedRPH | null>(null);
  
  const [savedRPHs, setSavedRPHs] = useState<SavedRPH[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cikguplanner_saved_rphs');
    if (stored) {
      try {
        setSavedRPHs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved RPHs", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cikguplanner_saved_rphs', JSON.stringify(savedRPHs));
  }, [savedRPHs]);

  const handleAnalyze = async () => {
    if (!rptText.trim()) {
      alert("Sila masukkan teks RPT atau muat naik fail terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    try {
      const plans = await analyzeRPT(rptText);
      setWeeklyPlans(plans);
      if (plans.length > 0) {
        setView(AppView.WEEKLY_VIEW);
      } else {
        alert("Tiada data dapat dianalisa. Pastikan RPT anda mempunyai format yang boleh dibaca.");
      }
    } catch (error) {
      alert("Gagal menganalisa RPT. Sila pastikan API Key ditetapkan atau cuba teks yang lebih pendek.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessingFile(true);
    try {
      const text = await extractTextFromFile(file);
      setRptText(text);
    } catch (error: any) {
      alert(error.message || "Gagal memproses fail.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenGenerateModal = (item: WeeklyPlanItem) => {
    setSelectedWeek(item);
    setSelectedSavedRPH(null);
    setIsModalOpen(true);
  };

  const handleOpenSavedRPH = (rph: SavedRPH) => {
    setSelectedSavedRPH(rph);
    setSelectedWeek(null);
    setIsModalOpen(true);
  };

  const handleSaveRPH = (rphData: Omit<SavedRPH, 'id' | 'timestamp'>) => {
    const newRPH: SavedRPH = {
      ...rphData,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    setSavedRPHs(prev => [newRPH, ...prev]);
    alert("RPH berjaya disimpan ke Kalendar!");
    setIsModalOpen(false);
  };

  const handleDeleteRPH = (id: string) => {
    setSavedRPHs(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.INPUT_RPT)}>
              <div className="bg-indigo-600 rounded-lg p-1.5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">CikguPlanner <span className="text-indigo-600">AI</span></span>
            </div>
            
            {view !== AppView.INPUT_RPT && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setView(AppView.WEEKLY_VIEW)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === AppView.WEEKLY_VIEW 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Jadual Mingguan
                </button>
                <button 
                  onClick={() => setView(AppView.CALENDAR_VIEW)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === AppView.CALENDAR_VIEW 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Kalendar RPH
                </button>
              </div>
            )}
            
            {view === AppView.WEEKLY_VIEW && (
              <div className="hidden md:flex items-center">
                <Button variant="outline" onClick={() => setView(AppView.INPUT_RPT)} className="text-sm">
                  Muat Naik RPT Baru
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === AppView.INPUT_RPT && (
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Pengurusan RPT & RPH Pintar</h1>
              <p className="text-lg text-slate-600">
                Muat naik fail Rancangan Pengajaran Tahunan (RPT) anda (PDF, Word, atau Teks), dan biarkan AI menyusun jadual mingguan serta menjana RPH harian anda.
              </p>
            </div>

            {savedRPHs.length > 0 && (
              <div className="mb-8 text-center">
                 <Button onClick={() => setView(AppView.CALENDAR_VIEW)} variant="secondary" className="mx-auto">
                    Lihat {savedRPHs.length} RPH Disimpan
                 </Button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-1 border border-slate-100">
              <div 
                className="p-8 m-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.docx,.txt" 
                  onChange={handleFileUpload}
                />
                
                {isProcessingFile ? (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-indigo-800 font-medium">Sedang membaca fail...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-indigo-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-slate-800 font-bold text-lg">Klik untuk muat naik atau tarik fail ke sini</p>
                    <p className="text-slate-500 mt-1">Sokongan: PDF, Word (.docx), Notepad (.txt)</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 px-6 py-2">
                 <div className="h-px bg-slate-200 flex-grow"></div>
                 <span className="text-slate-400 text-sm font-medium">ATAU EDIT TEKS DI BAWAH</span>
                 <div className="h-px bg-slate-200 flex-grow"></div>
              </div>

              <div className="p-6 pt-2">
                 <textarea 
                   className="w-full h-64 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono text-sm text-slate-700 shadow-inner"
                   placeholder="Teks RPT akan muncul di sini selepas muat naik fail..."
                   value={rptText}
                   onChange={(e) => setRptText(e.target.value)}
                 ></textarea>
              </div>
              <div className="px-6 pb-6 pt-2">
                <Button 
                  onClick={handleAnalyze} 
                  isLoading={isLoading} 
                  disabled={isProcessingFile}
                  className="w-full py-4 text-lg shadow-lg hover:shadow-indigo-500/25"
                >
                  {isLoading ? 'Sedang Menganalisa...' : 'Analisa RPT & Jana Jadual'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {view === AppView.WEEKLY_VIEW && (
          <div className="animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
               <div>
                 <h2 className="text-2xl font-bold text-slate-800">Jadual Mingguan</h2>
                 <p className="text-slate-500">Pilih minggu untuk menjana RPH harian.</p>
               </div>
               <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                 <span>{weeklyPlans.length} Minggu Dijumpai</span>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {weeklyPlans.map((item, index) => (
                 <WeekCard 
                   key={index} 
                   item={item} 
                   onGenerateRPH={handleOpenGenerateModal} 
                 />
               ))}
             </div>
          </div>
        )}

        {view === AppView.CALENDAR_VIEW && (
          <CalendarView 
            savedRPHs={savedRPHs}
            onOpenRPH={handleOpenSavedRPH}
            onDeleteRPH={handleDeleteRPH}
            onBack={() => setView(weeklyPlans.length > 0 ? AppView.WEEKLY_VIEW : AppView.INPUT_RPT)}
          />
        )}
      </main>

      <DailyRPHModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weekItem={selectedWeek}
        initialData={selectedSavedRPH}
        rptContent={rptText}
        onSave={handleSaveRPH}
      />
    </div>
  );
};

export default App;
