import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ExternalLink, Globe, HardDrive, Monitor, X, AlertTriangle } from 'lucide-react';

interface AppData {
  id: string;
  name: string;
  url: string;
  iconUrl?: string; // from favicon or local
  isLocal?: boolean;
}

export default function App() {
  const [apps, setApps] = useState<AppData[]>(() => {
    try {
      const saved = localStorage.getItem('neon_workspace_apps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);

  // Form states
  const [appType, setAppType] = useState<'web' | 'local'>('web');
  const [appName, setAppName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('neon_workspace_apps', JSON.stringify(apps));
  }, [apps]);

  const activeAppData = apps.find(a => a.id === activeApp);

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !appUrl.trim()) {
      setError('Preencha os campos obrigatórios.');
      return;
    }

    let iconUrlStr = '';
    if (appType === 'web') {
      try {
        const urlObj = new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`);
        iconUrlStr = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      } catch (err) {
        iconUrlStr = '';
      }
    }

    const newApp: AppData = {
      id: Date.now().toString(),
      name: appName,
      url: appUrl.startsWith('http') || appUrl.startsWith('data:') ? appUrl : `https://${appUrl}`,
      iconUrl: iconUrlStr,
      isLocal: appType === 'local',
    };

    setApps([...apps, newApp]);
    setActiveApp(newApp.id);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAppName('');
    setAppUrl('');
    setError('');
    setAppType('web');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 4MB for localStorage)
    if (file.size > 4 * 1024 * 1024) {
      setError('O arquivo é muito grande (Máximo 4MB para app local).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAppUrl(event.target?.result as string);
      if (!appName) setAppName(file.name.replace(/\.[^/.]+$/, ""));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeApp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newApps = apps.filter(a => a.id !== id);
    setApps(newApps);
    if (activeApp === id) {
      setActiveApp(newApps[0]?.id || null);
    }
  };

  return (
    <div className="min-h-screen bg-[#121214] text-[#e5e5ea] font-sans flex overflow-hidden selection:bg-[#00f3ff]/20">
      
      {/* Floating Lateral Navbar */}
      <nav 
        className="fixed z-40 transition-all duration-300 bg-[#1c1c1e] border border-[#2c2c2e] no-scrollbar
        left-2 top-2 bottom-2 w-[52px] flex flex-col items-center py-4 overflow-y-auto overflow-x-hidden rounded-[24px]
        sm:left-4 sm:top-4 sm:bottom-4 sm:w-20 sm:py-6"
        onMouseEnter={() => setIsHoveringSidebar(true)}
        onMouseLeave={() => setIsHoveringSidebar(false)}
      >
        <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#2c2c2e] rounded-[16px] sm:rounded-[24px] flex items-center justify-center shrink-0 mb-3 sm:mb-4 cursor-default">
           <Monitor className="w-4 h-4 sm:w-6 sm:h-6 text-[#00f3ff]" />
        </div>

        <div className="flex-1 flex flex-col items-center gap-2 sm:gap-4 w-full h-full">
          {apps.map((app) => (
            <div key={app.id} className="relative group flex justify-center shrink-0 w-full">
              <button
                onClick={() => setActiveApp(app.id)}
                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[20px] flex items-center justify-center transition-all duration-300 relative border ${
                  activeApp === app.id
                    ? 'bg-[#2c2c2e] border-[#00f3ff]/30 text-[#00f3ff]'
                    : 'bg-transparent border-transparent hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-[#e5e5ea]'
                }`}
              >
                {app.isLocal ? (
                  <HardDrive className={`w-4 h-4 sm:w-6 sm:h-6 ${activeApp === app.id ? 'text-[#00f3ff]' : 'text-inherit'}`} />
                ) : (
                  app.iconUrl ? (
                    <img src={app.iconUrl} alt={app.name} className="w-4 h-4 sm:w-6 sm:h-6 object-contain filter drop-shadow rounded-md bg-transparent" />
                  ) : (
                    <Globe className={`w-4 h-4 sm:w-6 sm:h-6 ${activeApp === app.id ? 'text-[#00f3ff]' : 'text-inherit'}`} />
                  )
                )}
              </button>

              {/* Tooltip (Desktop Only) */}
              <div className="hidden sm:flex absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                <div className="bg-[#2c2c2e] border border-[#3a3a3c] px-3 py-1.5 rounded-[12px] text-sm text-[#e5e5ea] whitespace-nowrap shadow-lg flex items-center gap-2">
                  <span className="font-medium truncate max-w-[150px]">{app.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-9 h-9 sm:w-12 sm:h-12 bg-transparent rounded-[14px] sm:rounded-[20px] flex items-center justify-center transition-all duration-300 border border-transparent hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-[#00f3ff] shrink-0"
          title="Adicionar App"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </nav>

      {/* Main Workspace Area */}
      <main className="flex-1 ml-[64px] sm:ml-[104px] p-2 sm:p-6 h-[100dvh] flex flex-col">
        {activeAppData ? (
          <div className="flex-1 bg-[#1c1c1e] border border-[#2c2c2e] rounded-[24px] sm:rounded-[36px] overflow-hidden flex flex-col relative">
            {/* App Header */}
            <div className="h-14 bg-[#1c1c1e] border-b border-[#2c2c2e] flex items-center justify-between px-4 sm:px-6 shrink-0">
              <div className="flex items-center gap-3">
                {activeAppData.isLocal ? (
                  <HardDrive className="w-5 h-5 text-[#00f3ff]" />
                ) : (
                  <Globe className="w-5 h-5 text-[#00f3ff]" />
                )}
                <h1 className="font-medium text-[#e5e5ea] tracking-wide">{activeAppData.name}</h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                {!activeAppData.isLocal && (
                  <a 
                    href={activeAppData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 sm:gap-2 text-[#00f3ff] hover:bg-[#00f3ff]/10 transition-colors px-2 sm:px-3 py-1.5 rounded-[12px] bg-transparent border border-transparent"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Guia</span>
                  </a>
                )}
                <button
                  onClick={(e) => removeApp(activeAppData.id, e)}
                  title="Remover este App"
                  className="flex items-center gap-1.5 sm:gap-2 text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors px-2 sm:px-3 py-1.5 rounded-[12px] bg-transparent border border-transparent"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Remover</span>
                </button>
              </div>
            </div>
            
            {/* Warning banner for web apps */}
            {!activeAppData.isLocal && (
              <div className="bg-[#ff9f0a]/10 border-b border-[#ff9f0a]/20 px-4 py-2 flex items-center gap-3 text-xs sm:text-sm text-[#ff9f0a]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>Muitos sites (Google, YouTube, etc.) <strong>bloqueiam ativamente</strong> serem abertos dentro de outros sites por segurança. Para esses, use o botão <strong>Nova Guia</strong>.</p>
              </div>
            )}

            {/* Viewport */}
            <div className="flex-1 relative bg-[#1c1c1e]">
              <div className="w-full h-full bg-white overflow-hidden rounded-b-[24px] sm:rounded-b-[36px]">
                <iframe 
                  src={activeAppData.url}
                  className="w-full h-full border-none"
                  title={activeAppData.name}
                  allow="camera; microphone; display-capture; geolocation"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-80 h-full">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mb-6 text-[#00f3ff]/40 bg-[#2c2c2e]/40 rounded-[32px] flex items-center justify-center relative">
              <Monitor className="w-12 h-12 sm:w-16 sm:h-16 text-[#00f3ff] opacity-80" />
            </div>
            <h2 className="text-xl sm:text-2xl font-light tracking-wide text-center text-[#8e8e93]">Workspace <span className="font-medium text-[#e5e5ea]">Minimalista</span></h2>
            <p className="mt-4 text-[#8e8e93] max-w-sm text-center text-sm">Use o botão <strong className="text-[#e5e5ea] bg-[#2c2c2e] px-2 py-0.5 rounded-[8px] mx-1 border border-[#3a3a3c]">+</strong> na barra lateral para adicionar recursos.</p>
          </div>
        )}
      </main>

      {/* Add App Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#121214]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-[#e5e5ea] flex items-center gap-3 tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-[#00f3ff]"></span>
                  Adicionar App
                </h3>
                <button onClick={closeModal} className="text-[#8e8e93] hover:text-[#e5e5ea] transition-colors p-1 rounded-full hover:bg-[#2c2c2e]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex p-1 bg-[#2c2c2e] rounded-[20px] mb-6">
                <button 
                  onClick={() => { setAppType('web'); setError(''); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-[16px] transition-all ${appType === 'web' ? 'bg-[#3a3a3c] text-[#00f3ff]' : 'text-[#8e8e93] hover:text-[#e5e5ea]'}`}
                >
                  Site / URL
                </button>
                <button 
                  onClick={() => { setAppType('local'); setError(''); }}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-[16px] transition-all ${appType === 'local' ? 'bg-[#3a3a3c] text-[#00f3ff]' : 'text-[#8e8e93] hover:text-[#e5e5ea]'}`}
                >
                  Arquivo Local
                </button>
              </div>

              <form onSubmit={handleAddApp} className="space-y-4 text-[#e5e5ea]">
                {error && (
                  <div className="p-3 bg-[#ff453a]/10 border border-[#ff453a]/20 rounded-[16px] text-[#ff453a] text-sm flex items-start gap-2">
                     <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                     <p>{error}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#8e8e93] mb-1.5 ml-1">Nome do App</label>
                  <input 
                    type="text" 
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full bg-[#121214] border border-[#3a3a3c] rounded-[16px] px-4 py-3 text-[#e5e5ea] placeholder-[#8e8e93] focus:outline-none focus:border-[#00f3ff] transition-all"
                    placeholder="Ex: Notion, Figma, Meu App"
                  />
                </div>
                
                {appType === 'web' ? (
                  <div>
                    <label className="block text-sm font-medium text-[#8e8e93] mb-1.5 ml-1">URL (Endereço)</label>
                    <input 
                      type="text" 
                      value={appUrl}
                      onChange={(e) => setAppUrl(e.target.value)}
                      className="w-full bg-[#121214] border border-[#3a3a3c] rounded-[16px] px-4 py-3 text-[#e5e5ea] placeholder-[#8e8e93] focus:outline-none focus:border-[#00f3ff] transition-all font-mono text-sm"
                      placeholder="https://exemplo.com"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[#8e8e93] mb-1.5 ml-1">Arquivo (HTML, Texto ou Imagem)</label>
                    <div className="relative w-full bg-[#121214] border border-[#3a3a3c] border-dashed rounded-[20px] p-6 text-center hover:border-[#00f3ff] transition-all group cursor-pointer">
                      <input 
                        type="file" 
                        accept=".html,.htm,.txt,image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      <HardDrive className="w-8 h-8 mx-auto mb-3 text-[#8e8e93] group-hover:text-[#00f3ff] transition-colors" />
                      <p className="text-sm text-[#8e8e93] group-hover:text-[#e5e5ea] transition-colors">
                        Clique ou arraste para selecionar<br/>
                        <span className="text-xs mt-1.5 block font-medium opacity-60">(Máx: 4MB para localStorage)</span>
                      </p>
                      {appUrl && appUrl.startsWith('data:') && (
                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00f3ff]/10 text-[#00f3ff] text-xs font-medium rounded-[12px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]"></div>
                          Arquivo carregado
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="flex-1 py-3 px-4 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#e5e5ea] font-medium rounded-[20px] transition-colors border-none focus:outline-none"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 px-4 bg-[#0a84ff] hover:bg-[#00f3ff] text-[#ffffff] hover:text-[#121214] font-medium rounded-[20px] transition-colors focus:outline-none"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
