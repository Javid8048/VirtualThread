import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Wind,
  Play,
  Share2,
  Download,
  Video,
  UploadCloud,
  Type,
  Sun,
  Moon,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  Trash2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { SceneManager } from './three/SceneManager';
import { PositionGuide } from './components/PositionGuide';
import { ExportPanel } from './components/ExportPanel';
import { StaticGarmentView } from './components/StaticGarmentView';
import { getAssetUrl } from './utils/assets';

const COLOR_SWATCHES = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Navy Blue', hex: '#1c355e' },
  { name: 'Washed Black', hex: '#24272e' },
  { name: 'Heather Grey', hex: '#7a7d85' },
  { name: 'Vintage Cream', hex: '#f0ede6' },
  { name: 'Heritage Green', hex: '#002D18' },
  { name: 'Court Green', hex: '#06532A' },
  { name: 'Tennis Red', hex: '#D30018' },
  { name: 'Sunshine Yellow', hex: '#FCD757' },
  { name: 'Sky Blue', hex: '#8DC3DE' }
];

export default function OversizedApp() {
  const containerRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const fileInputRef = useRef(null);
  const uploadSideRef = useRef('front');

  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | '2d'
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const [currentCamera, setCurrentCamera] = useState('front');
  const [isZoomed, setIsZoomed] = useState(false);

  // Garment Customization
  const [garmentColor, setGarmentColor] = useState('#ffffff');
  const [fabricFinish, setFabricFinish] = useState('combed_cotton'); // 'combed_cotton' | 'heavy_terry' | 'mineral_wash'
  const [animationMode, setAnimationMode] = useState('none'); // 'none' | 'turntable' | 'waves' | 'walking'
  const [cameraAnimationMode, setCameraAnimationMode] = useState('none');
  const [activeTab, setActiveTab] = useState('design'); // 'design' | 'color' | 'motion' | 'export'

  // Modals & Panels
  const [positionGuideOpen, setPositionGuideOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportType, setExportType] = useState('image');
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vt_theme') || 'dark';
    }
    return 'dark';
  });

  const [layers, setLayers] = useState([]);
  const [feedback, setFeedback] = useState('');

  if (typeof window !== 'undefined') {
    window.__IS_LOADED__ = isLoaded;
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vt_theme', next);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  // Initialize SceneManager specifically configured for Oversized T-Shirt blank
  useEffect(() => {
    if (!containerRef.current) return;

    const sm = new SceneManager(
      containerRef.current,
      () => {
        setIsLoaded(true);
        if (typeof window !== 'undefined') {
          window.__IS_LOADED__ = true;
        }
        sm.setGarmentType('oversized_tee');
        sm.setGarmentColor(garmentColor, true);
      },
      'oversized_tee'
    );

    sceneManagerRef.current = sm;
    if (typeof window !== 'undefined') {
      window.__SCENE_MANAGER__ = sm;
    }

    // Listen to designManager layer updates
    if (sm.designManager) {
      sm.designManager.subscribe((state) => {
        setLayers([...state.layers]);
      });
    }

    return () => {
      sm.dispose();
      sceneManagerRef.current = null;
      if (typeof window !== 'undefined') {
        window.__SCENE_MANAGER__ = null;
        window.__IS_LOADED__ = false;
      }
    };
  }, []);

  // Sync garment color
  const handleColorChange = (hex) => {
    setGarmentColor(hex);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setGarmentColor(hex);
    }
  };

  // Sync fabric finish
  const handleFinishChange = (finish) => {
    setFabricFinish(finish);
    if (sceneManagerRef.current?.designManager) {
      sceneManagerRef.current.designManager.setFabricFinish(finish);
      showFeedback(`Fabric finish applied: ${finish.replace('_', ' ').toUpperCase()}`);
    }
  };

  // Camera views
  const handleCameraChange = (cam) => {
    setCurrentCamera(cam);
    const side = (cam === 'left' || cam === 'left_sleeve')
      ? 'left_sleeve'
      : (cam === 'right' || cam === 'right_sleeve')
      ? 'right_sleeve'
      : (cam === 'back' ? 'back' : 'front');
    setActiveSide(side);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraView(cam);
    }
  };

  // Motion modes
  const handleAnimationToggle = (mode) => {
    const next = animationMode === mode ? 'none' : mode;
    setAnimationMode(next);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAnimationMode(next);
    }
    showFeedback(next === 'none' ? 'Motion paused' : `${mode.toUpperCase()} motion activated`);
  };

  // Quick file upload
  const triggerUpload = (side = 'front') => {
    uploadSideRef.current = side;
    fileInputRef.current?.click();
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !sceneManagerRef.current?.designManager) return;

    if (file.size > 15 * 1024 * 1024) {
      showFeedback('File too large (Max 15MB)');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const side = uploadSideRef.current;
        const centerX = side === 'back' ? 1528 : (side === 'left_sleeve' ? 480 : (side === 'right_sleeve' ? 1528 : 480));
        const centerY = (side === 'left_sleeve' || side === 'right_sleeve') ? 1840 : 960;

        sceneManagerRef.current.designManager.addLayer({
          type: 'image',
          side: side,
          image: img,
          x: centerX,
          y: centerY,
          scale: 1.0,
          rotation: 0,
          printType: 'screen'
        });

        handleCameraChange(side);
        setPositionGuideOpen(true);
        showFeedback('Artwork uploaded • Position guide opened for exact alignment');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddQuickText = (side = 'front') => {
    if (!sceneManagerRef.current?.designManager) return;
    const centerX = side === 'back' ? 1528 : (side === 'left_sleeve' ? 480 : (side === 'right_sleeve' ? 1528 : 480));
    const centerY = (side === 'left_sleeve' || side === 'right_sleeve') ? 1840 : 960;

    sceneManagerRef.current.designManager.addLayer({
      type: 'text',
      side: side,
      text: 'OVERSIZED TEE',
      textColor: garmentColor === '#ffffff' ? '#000000' : '#ffffff',
      fontSize: 14,
      fontFamily: 'Roboto',
      x: centerX,
      y: centerY,
      scale: 1.0,
      rotation: 0,
      printType: 'screen'
    });
    handleCameraChange(side);
    setPositionGuideOpen(true);
    showFeedback('Text layer added');
  };

  const handleDeleteLayer = (id) => {
    if (sceneManagerRef.current?.designManager) {
      sceneManagerRef.current.designManager.removeLayer(id);
      showFeedback('Layer deleted');
    }
  };

  const handleShareDesign = () => {
    const url = new URL(window.location.href);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url.toString());
      showFeedback('Studio link copied to clipboard!');
    } else {
      prompt('Copy this link to share:', url.toString());
    }
  };

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col font-sans select-none ${
      theme === 'dark' ? 'bg-[#0f1115] text-gray-100' : 'bg-[#f4f5f7] text-gray-900'
    }`}>
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* Top Header Navigation */}
      <header className={`h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b shrink-0 z-20 ${
        theme === 'dark' ? 'bg-[#14171d]/90 border-gray-800 backdrop-blur-md' : 'bg-white/90 border-gray-200 backdrop-blur-md'
      }`}>
        {/* Brand & Studio Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-md shadow-brand-500/20">
            VT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-gray-900 dark:text-white">
                VIRTUALTHREADS
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-brand-500/15 text-brand-500 border border-brand-500/30">
                Oversized T-Shirt Studio
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden sm:block">
              Drop-shoulder streetwear cut • 240+ GSM Heavyweight Cotton • 3D & 2D Flat Mockup
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle (3D vs 2D) */}
          <div className="flex items-center p-0.5 rounded-lg bg-gray-200/80 dark:bg-gray-800 text-xs font-bold">
            <button
              onClick={() => {
                setViewMode('3d');
                sceneManagerRef.current?.setViewMode?.('3d');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === '3d'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              3D Mockup
            </button>
            <button
              onClick={() => {
                setViewMode('2d');
                sceneManagerRef.current?.setViewMode?.('2d');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === '2d'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              2D Flat
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Share */}
          <button
            onClick={handleShareDesign}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Export CTA */}
          <button
            onClick={() => {
              setExportType('image');
              setExportOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/25 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Mockup</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Interactive Viewport */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* 3D WebGL Canvas Container */}
          <div
            ref={containerRef}
            className={`w-full h-full relative cursor-grab active:cursor-grabbing transition-opacity duration-300 ${
              viewMode === '3d' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0 absolute inset-0'
            }`}
          />

          {/* 2D Flat View Overlay */}
          {viewMode === '2d' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <StaticGarmentView
                garmentType="oversized_tee"
                garmentColor={garmentColor}
                activeSide={activeSide}
                designManager={sceneManagerRef.current?.designManager}
              />
            </div>
          )}

          {/* Floating Viewport View Angle Bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-gray-200/80 dark:border-gray-800">
            {['front', 'back', 'left', 'right'].map((cam) => {
              const isActive = currentCamera === cam;
              return (
                <button
                  key={cam}
                  onClick={() => handleCameraChange(cam)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {cam === 'left' ? 'L Sleeve' : cam === 'right' ? 'R Sleeve' : cam}
                </button>
              );
            })}
          </div>

          {/* Floating Motion Controls (3D only) */}
          {viewMode === '3d' && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-gray-200/80 dark:border-gray-800">
              <button
                onClick={() => handleAnimationToggle('turntable')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  animationMode === 'turntable'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="360┬░ Continuous Turntable Spin"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Turntable</span>
              </button>

              <button
                onClick={() => handleAnimationToggle('waves')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  animationMode === 'waves'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Fabric Wind Simulation Waves"
              >
                <Wind className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fabric Waves</span>
              </button>

              <button
                onClick={() => handleAnimationToggle('walking')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  animationMode === 'walking'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Runway Stride Walk Animation"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Runway Walk</span>
              </button>
            </div>
          )}

          {/* Floating Position Guide Quick Trigger */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setPositionGuideOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-lg transition-all ${
                positionGuideOpen
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 hover:border-brand-500'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{positionGuideOpen ? 'Hide Position Guide' : 'Open Position Guide'}</span>
            </button>
          </div>

          {/* Feedback Toast Notification */}
          {feedback && (
            <div className="absolute bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-gray-700 flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Right Studio Controls Drawer */}
        <aside className={`w-80 sm:w-96 border-l flex flex-col shrink-0 z-20 ${
          theme === 'dark' ? 'bg-[#14171d] border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {/* Studio Navigation Tabs */}
          <div className="grid grid-cols-4 p-2 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-center">
            {[
              { id: 'design', label: 'Design' },
              { id: 'color', label: 'Color' },
              { id: 'motion', label: 'Motion' },
              { id: 'export', label: 'Export' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* TAB 1: DESIGN & GRAPHICS STUDIO */}
            {activeTab === 'design' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-750">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Selected Blank</span>
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                    OVERSIZED T-SHIRT (HEAVYWEIGHT)
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    Streetwear drop-shoulder cut, wider boxy torso, relaxed elongated sleeves.
                  </p>
                </div>

                {/* Primary Upload CTAs */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Add Artwork & Decals
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => triggerUpload('front')}
                      className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 bg-gray-50/50 dark:bg-gray-850/50 flex flex-col items-center justify-center gap-1.5 transition text-center group"
                    >
                      <UploadCloud className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Front Graphic</span>
                      <span className="text-[10px] text-gray-400">PNG / JPG / WebP</span>
                    </button>

                    <button
                      onClick={() => triggerUpload('back')}
                      className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 bg-gray-50/50 dark:bg-gray-850/50 flex flex-col items-center justify-center gap-1.5 transition text-center group"
                    >
                      <UploadCloud className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Back Graphic</span>
                      <span className="text-[10px] text-gray-400">PNG / JPG / WebP</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleAddQuickText('front')}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-750 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 transition"
                    >
                      <Type className="w-4 h-4 text-brand-500" />
                      <span>Add Text (Front)</span>
                    </button>
                    <button
                      onClick={() => handleAddQuickText('back')}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-750 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 transition"
                    >
                      <Type className="w-4 h-4 text-brand-500" />
                      <span>Add Text (Back)</span>
                    </button>
                  </div>
                </div>

                {/* Open Position Guide Button */}
                <button
                  onClick={() => setPositionGuideOpen(true)}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black flex items-center justify-between shadow-md hover:opacity-90 transition"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-500" />
                    <span>Launch 2048x2048 Position Guide</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Live Layers List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <span>Applied Layers ({layers.length})</span>
                    {layers.length > 0 && (
                      <span className="text-[10px] font-normal text-gray-400">Double click design to resize</span>
                    )}
                  </div>

                  {layers.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                      No artwork layers placed yet. Upload an image or add text above.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {layers.map((l, idx) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-[10px] font-mono font-bold text-gray-400">#{idx + 1}</span>
                            <span className="font-bold truncate text-gray-900 dark:text-gray-100">
                              {l.type === 'text' ? `Text: "${l.text}"` : (l.type === 'shape' ? `Shape: ${l.shapeType}` : 'Image Decal')}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-gray-200 dark:bg-gray-750 text-gray-600 dark:text-gray-300">
                              {l.side}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteLayer(l.id)}
                            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                            title="Delete Layer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: FABRIC COLOR & FINISH */}
            {activeTab === 'color' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2.5">
                    Garment Fabric Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_SWATCHES.map((swatch) => {
                      const isSelected = garmentColor.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.name}
                          onClick={() => handleColorChange(swatch.hex)}
                          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition ${
                            isSelected
                              ? 'border-brand-500 bg-brand-500/10'
                              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                          }`}
                          title={swatch.name}
                        >
                          <div
                            className="w-8 h-8 rounded-full border border-black/10 shadow-inner"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span className="text-[9px] font-bold truncate max-w-full text-gray-600 dark:text-gray-400">
                            {swatch.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Hex Color Picker */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Custom Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={garmentColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={garmentColor.toUpperCase()}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-20 px-2 py-1 rounded-md text-xs font-mono font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center uppercase"
                    />
                  </div>
                </div>

                {/* Fabric Tactile Finish */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2.5">
                    Fabric Texture & Finish
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'combed_cotton', name: 'Combed Cotton Jersey', desc: 'Smooth matte 240 GSM organic cotton' },
                      { id: 'heavy_terry', name: 'Heavy French Terry', desc: 'Tactile dense looped yarn texture' },
                      { id: 'mineral_wash', name: 'Mineral Sunfade Wash', desc: 'Authentic vintage distressed fade' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleFinishChange(f.id)}
                        className={`w-full p-3 rounded-xl text-left border transition flex items-center justify-between ${
                          fabricFinish === f.id
                            ? 'border-brand-500 bg-brand-500/10 text-gray-900 dark:text-white'
                            : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{f.name}</div>
                          <div className="text-[10px] text-gray-400">{f.desc}</div>
                        </div>
                        {fabricFinish === f.id && <CheckCircle className="w-4 h-4 text-brand-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MOTION & CAMERA ANIMATION */}
            {activeTab === 'motion' && (
              <div className="space-y-4">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                  3D Animation Modes
                </label>
                {[
                  { id: 'turntable', name: '360┬░ Turntable Rotation', desc: 'Smooth continuous spin of the oversized blank' },
                  { id: 'waves', name: 'Fabric Wind Waves', desc: 'Realistic micro-cloth wave dynamics' },
                  { id: 'walking', name: 'Runway Walk Stride', desc: 'Streetwear catwalk stride animation' },
                  { id: 'none', name: 'Static Studio View', desc: 'Fixed resting position for precision design' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleAnimationToggle(m.id)}
                    className={`w-full p-3.5 rounded-xl text-left border transition flex items-center justify-between ${
                      animationMode === m.id
                        ? 'border-brand-500 bg-brand-500/10 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{m.name}</div>
                      <div className="text-[10px] text-gray-400">{m.desc}</div>
                    </div>
                    {animationMode === m.id && <CheckCircle className="w-4 h-4 text-brand-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* TAB 4: HIGH-RES EXPORT STUDIO */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                  Mockup Output Presets
                </label>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-500 font-bold">
                      PNG
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-gray-900 dark:text-white">4K Snapshot Mockup</div>
                      <div className="text-[10px] text-gray-400">Transparent or solid background with sharp decals</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setExportType('image');
                      setExportOpen(true);
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white transition shadow-sm"
                  >
                    Open Image Export Panel
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-500 font-bold">
                      MP4
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-gray-900 dark:text-white">60fps Smooth Video Mockup</div>
                      <div className="text-[10px] text-gray-400">Turntable rotation clip ready for Instagram & TikTok</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setExportType('video');
                      setExportOpen(true);
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
                  >
                    Open Video Export Panel
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Standalone Position Guide Modal Overlay */}
      {positionGuideOpen && (
        <PositionGuide
          isOpen={positionGuideOpen}
          onClose={() => setPositionGuideOpen(false)}
          designManager={sceneManagerRef.current?.designManager}
          garmentColor={garmentColor}
          currentGarmentType="oversized_tee"
          selectedSide={activeSide}
          onSideChange={(side) => setActiveSide(side)}
          onCameraChange={(cam) => handleCameraChange(cam)}
        />
      )}

      {/* Standalone Export Panel Overlay */}
      {exportOpen && (
        <ExportPanel
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          sceneManager={sceneManagerRef.current}
          garmentType="oversized_tee"
          initialTab={exportType}
        />
      )}
    </div>
  );
}
