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
  ZoomOut,
  X} from 'lucide-react';
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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
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
    if (sceneManagerRef.current) {
      if (typeof sceneManagerRef.current.setFabricFinish === 'function') {
        sceneManagerRef.current.setFabricFinish(finish);
      } else if (sceneManagerRef.current.designManager) {
        sceneManagerRef.current.designManager.setFabricFinish(finish);
      }
      showFeedback(`Fabric finish applied: ${finish.replace('_', ' ').toUpperCase()}`);
    }
  };

  // Camera views
  const handleCameraChange = (cam) => {
    setCurrentCamera(cam);
    const side = (cam === 'left' || cam === 'left_sleeve' || cam === 'lsleeve')
      ? 'left_sleeve'
      : (cam === 'right' || cam === 'right_sleeve' || cam === 'rsleeve')
      ? 'right_sleeve'
      : (cam === 'back' ? 'back' : 'front');
    setActiveSide(side);

    // If turntable or rotate_walk was active, pause rotation so view remains focused on chosen angle
    if (animationMode === 'turntable' || animationMode === 'rotate_walk') {
      setAnimationMode('none');
      if (sceneManagerRef.current) {
        sceneManagerRef.current.setAnimationMode('none');
      }
    }

    // In 2D mode, if clicking left/right sleeve, auto-switch to 3D mode
    if (viewMode === '2d' && (cam === 'left' || cam === 'right' || cam === 'left_sleeve' || cam === 'right_sleeve')) {
      setViewMode('3d');
      sceneManagerRef.current?.setViewMode?.('3d');
    }

    if (sceneManagerRef.current) {
      if (typeof sceneManagerRef.current.setCameraPreset === 'function') {
        sceneManagerRef.current.setCameraPreset(cam, isZoomed);
      } else if (typeof sceneManagerRef.current.setCameraView === 'function') {
        sceneManagerRef.current.setCameraView(cam, isZoomed);
      }
    }
  };

  // Motion modes
  const handleAnimationToggle = (mode) => {
    const next = animationMode === mode ? 'none' : mode;
    setAnimationMode(next);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAnimationMode(next);
    }
    showFeedback(next === 'none' ? 'Motion paused' : `${mode.replace('_', ' ').toUpperCase()} motion activated`);
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

  const renderControls = (isMobile = false) => (
  <>
    {/* Studio Navigation Tabs */}
    <div className="grid grid-cols-4 p-2 border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-center shrink-0">
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
    <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isMobile ? 'pb-10' : ''}`}>
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
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 text-xs cursor-pointer hover:border-brand-500 transition" onClick={() => { handleCameraChange(l.side); setPositionGuideOpen(true); sceneManagerRef.current?.designManager?.setActiveLayer(l.id); }}
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
                { id: 'rotate_walk', name: 'Rotate & Runway Walk', desc: 'Simultaneous 360° continuous turntable spin during catwalk runway walk' },
                { id: 'turntable', name: '360° Turntable Rotation', desc: 'Smooth continuous spin of the oversized blank' },
                { id: 'walking', name: 'Runway Walk Stride', desc: 'Streetwear catwalk stride animation' },
                { id: 'waves', name: 'Fabric Wind Waves', desc: 'Realistic micro-cloth wave dynamics' },
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
  </>
);

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
      <header className={`h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between border-b shrink-0 z-20 ${
        theme === 'dark' ? 'bg-[#14171d]/90 border-gray-800 backdrop-blur-md' : 'bg-white/90 border-gray-200 backdrop-blur-md'
      }`}>
        {/* Brand & Studio Title */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-md shadow-brand-500/20 shrink-0">
            VT
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-gray-900 dark:text-white truncate">
                VIRTUALTHREADS
              </h1>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase bg-brand-500/15 text-brand-500 border border-brand-500/30 shrink-0">
                Oversized
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden sm:block truncate">
              Drop-shoulder streetwear cut • 240+ GSM Heavyweight Cotton • 3D & 2D Flat Mockup
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* View Mode Toggle (3D vs 2D) */}
          <div className="flex items-center p-0.5 rounded-lg bg-gray-200/80 dark:bg-gray-800 text-[11px] sm:text-xs font-bold">
            <button
              onClick={() => {
                setViewMode('3d');
                sceneManagerRef.current?.setViewMode?.('3d');
              }}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md transition-all ${
                viewMode === '3d'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => {
                setViewMode('2d');
                sceneManagerRef.current?.setViewMode?.('2d');
              }}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md transition-all ${
                viewMode === '2d'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              2D
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
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
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/25 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Export</span>
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
                onSideChange={(side) => handleCameraChange(side)}
                onSwitchTo3D={() => {
                  setViewMode('3d');
                  sceneManagerRef.current?.setViewMode?.('3d');
                }}
                onOpenExport={() => {
                  setExportType('image');
                  setExportOpen(true);
                }}
                theme={theme}
                onToggleTheme={toggleTheme}
                designManager={sceneManagerRef.current?.designManager}
              />
            </div>
          )}

          {/* Floating Viewport View Angle Bar */}
          <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex items-center gap-0.5 sm:gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-gray-200/80 dark:border-gray-800">
            {[
              { id: 'front', label: 'Front' },
              { id: 'back', label: 'Back' },
              { id: 'left', label: 'LSLEEVE' },
              { id: 'right', label: 'RSLEEVE' }
            ].map(({ id, label }) => {
              const isActive = currentCamera === id;
              return (
                <button
                  key={id}
                  onClick={() => handleCameraChange(id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase transition ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Floating Motion Controls (3D only) - Hidden on mobile if bottom sheet is open */}
          {viewMode === '3d' && !mobileSheetOpen && (
            <div className="absolute bottom-16 sm:bottom-4 left-2.5 sm:left-4 z-20 flex items-center gap-1 sm:gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl shadow-lg border border-gray-200/80 dark:border-gray-800 max-w-[calc(100vw-20px)] overflow-x-auto scrollbar-none">
              <button
                onClick={() => handleAnimationToggle('turntable')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  animationMode === 'turntable'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="360° Continuous Turntable Spin"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Turntable</span>
              </button>

              <button
                onClick={() => handleAnimationToggle('walking')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  animationMode === 'walking'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Runway Walk Stride Animation"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Runway Walk</span>
              </button>

              <button
                onClick={() => handleAnimationToggle('rotate_walk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  animationMode === 'rotate_walk'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Simultaneous 360° Rotation and Runway Walk"
              >
                <RotateCw className={`w-3.5 h-3.5 ${animationMode === 'rotate_walk' ? 'animate-spin' : ''}`} style={animationMode === 'rotate_walk' ? { animationDuration: '4s' } : undefined} />
                <span className="hidden sm:inline">Rotate & Walk</span>
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
            </div>
          )}

          {/* Floating Position Guide Quick Trigger */}
          <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20">
            <button
              onClick={() => setPositionGuideOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold shadow-lg transition-all ${
                positionGuideOpen
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 hover:border-brand-500'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{positionGuideOpen ? 'Hide Position Guide' : 'Open Position Guide'}</span>
              <span className="sm:hidden text-[10px]">{positionGuideOpen ? 'Hide' : 'Guide'}</span>
            </button>
          </div>

          {/* Feedback Toast Notification */}
          {feedback && (
            <div className="absolute bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-gray-700 flex items-center gap-2 animate-fadeIn whitespace-nowrap pointer-events-none">
              <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
        </div>

                {/* Desktop Right Studio Controls Drawer (Hidden on Mobile) */}
        <aside className={`hidden md:flex md:w-80 lg:w-96 border-l flex-col shrink-0 z-20 ${
          theme === 'dark' ? 'bg-[#14171d] border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {renderControls(false)}
        </aside>
      </div>

      {/* Mobile Slide-up Bottom Sheet (md:hidden) */}
      {mobileSheetOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30 animate-fadeIn"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl border-t shadow-2xl flex flex-col max-h-[82vh] transition-transform animate-slideUp ${
            theme === 'dark' ? 'bg-[#14171d] border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-3.5 rounded-full bg-brand-500" />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {activeTab.toUpperCase()} STUDIO
                </span>
              </div>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderControls(true)}
          </div>
        </>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (md:hidden) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-xl px-2 py-1 flex items-center justify-around transition-all ${
        theme === 'dark' ? 'bg-[#14171d]/95 border-gray-800 text-gray-400' : 'bg-white/95 border-gray-200 text-gray-500'
      }`}>
        <button
          onClick={() => {
            setActiveTab('design');
            setMobileSheetOpen(true);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            mobileSheetOpen && activeTab === 'design'
              ? 'text-brand-500 font-extrabold'
              : 'hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span className="text-[10px] font-bold">Design</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('color');
            setMobileSheetOpen(true);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            mobileSheetOpen && activeTab === 'color'
              ? 'text-brand-500 font-extrabold'
              : 'hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-bold">Color</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('motion');
            setMobileSheetOpen(true);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            mobileSheetOpen && activeTab === 'motion'
              ? 'text-brand-500 font-extrabold'
              : 'hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <RotateCw className={`w-4 h-4 ${animationMode === 'turntable' || animationMode === 'rotate_walk' ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-bold">Motion</span>
        </button>

        <button
          onClick={() => setPositionGuideOpen((prev) => !prev)}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            positionGuideOpen
              ? 'text-brand-500 font-extrabold'
              : 'hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[10px] font-bold">Guide</span>
        </button>

        <button
          onClick={() => {
            setExportType('image');
            setExportOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-brand-500 font-bold transition hover:opacity-80"
        >
          <Download className="w-4 h-4" />
          <span className="text-[10px]">Export</span>
        </button>
      </nav>

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
          defaultTab={exportType}
        />
      )}
    </div>
  );
}
