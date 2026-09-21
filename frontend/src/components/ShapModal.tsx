import React from 'react';
import { X, Sparkles, TrendingUp, TrendingDown, HelpCircle, ShieldCheck } from 'lucide-react';
import { ShapFactor } from '../types';

interface ShapModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadName: string;
  area: string;
  riskScore: number;
  riskLevel: string;
  confidence: number;
  factors: ShapFactor[];
}

export const ShapModal: React.FC<ShapModalProps> = ({
  isOpen,
  onClose,
  roadName,
  area,
  riskScore,
  riskLevel,
  confidence,
  factors
}) => {
  if (!isOpen) return null;

  const getRiskBadge = () => {
    if (riskScore >= 80) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (riskScore >= 60) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (riskScore >= 35) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white">Explainable AI (SHAP)</h3>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                Factor Breakdown
              </span>
            </div>
            <p className="text-xs text-slate-400">Why did AI assign this risk score?</p>
          </div>
        </div>

        {/* Road Overview Box */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700 mb-5 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white text-sm sm:text-base">{roadName}</h4>
            <p className="text-xs text-slate-400">{area} Corridor</p>
          </div>
          <div className="text-right flex items-center space-x-3">
            <div className={`px-3 py-1.5 rounded-xl border font-bold text-sm ${getRiskBadge()}`}>
              Risk {riskScore}/100
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Data Confidence</div>
              <div className="text-xs font-semibold text-emerald-400">{confidence}% support</div>
            </div>
          </div>
        </div>

        {/* Factors List */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Attribution Factors (SHAP Values)
          </h5>

          {factors && factors.length > 0 ? (
            factors.map((item, idx) => {
              const isPos = item.direction === 'positive';
              return (
                <div
                  key={idx}
                  className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {isPos ? (
                        <TrendingUp className="h-4 w-4 text-orange-400 shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-medium text-xs sm:text-sm text-slate-200">
                        {item.factor}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isPos
                          ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 pl-6">{item.detail}</p>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400">Standard baseline factors contributed equally.</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Calibrated with TreeSHAP Explainer</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
