import React from 'react';
import { X, Sparkles, Check, Shirt } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

export const GARMENT_PRODUCTS = [
  {
    id: 'oversized_tee',
    title: 'OVERSIZED T-SHIRT STUDIO',
    badge: 'STUDIO READY',
    badgeType: 'studio',
    category: 'Tops',
    description: 'Heavyweight streetwear oversized drop-shoulder t-shirt with wider torso, dropped shoulders, and loose drape.',
    features: ['Streetwear Drop-Shoulder', 'Wider Boxy Silhouette', 'Elongated Loose Sleeves', '240+ GSM Heavyweight Cotton'],
    imageBg: 'from-blue-900/30 to-indigo-950/40',
    popular: true
  }
];

export function ProductsCatalogModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-[#14171d] border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-500">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Apparel Catalog</h2>
              <p className="text-[11px] text-gray-400">Current dedicated garment specification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white">OVERSIZED T-SHIRT</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Authentic streetwear drop-shoulder pattern with relaxed wide fit, draped sleeves, and premium heavyweight combed cotton construction.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['Drop Shoulder', 'Boxy Torso', 'Loose Sleeves', '3D Orbit & Walk', '2D Flat Mockup'].map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
