import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface EthicalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EthicalNoticeModal: React.FC<EthicalNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Responsible AI & Ethics Policy</h2>
            <p className="text-xs text-slate-400">Points 45–48: Responsible Urban Decision-Support</p>
          </div>
        </div>

        <div className="space-y-5 text-sm text-slate-300 leading-relaxed">
          {/* Core Principle */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Focus on Road Infrastructure & Temporal Risk</h4>
                <p className="text-xs text-slate-400">
                  DhakaSafe AI operates exclusively at the road-segment and time-window level. It analyzes lighting, bus stops, road hierarchy, and historical incident patterns.
                  We explicitly reject demographic profiling, ethnic bias, or socioeconomic stereotyping.
                </p>
              </div>
            </div>
          </div>

          {/* Scientific Limitations */}
          <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-300 mb-1">Critical Scientific Limitation: Reported Crime ≠ Actual Crime</h4>
                <p className="text-xs text-slate-300">
                  The model learns from reported incidents (police blotters & verified news reports). Under-reporting is common in Dhaka, and media coverage frequently concentrates around high-traffic commercial hubs.
                  Therefore, a higher risk score reflects greater reported incident density—not an absolute declaration that other unmonitored roads are crime-free.
                </p>
              </div>
            </div>
          </div>

          {/* Non-Stigmatizing Language */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <div className="flex items-start space-x-2.5">
              <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white mb-1">Language Standards: 'Predicted Theft Risk'</h4>
                <p className="text-xs text-slate-400">
                  The system communicates "Predicted street theft risk at this time" rather than labeling communities or individuals as "dangerous."
                  Safety choices are placed in user control through Fastest, Balanced, and Safest alternative trade-offs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-emerald-600/20"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
