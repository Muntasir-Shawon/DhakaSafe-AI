import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { ShapFactor } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { RiskMeter } from './ui/RiskMeter';
import { SkeletonBlock, EmptyState } from './ui/StateViews';
import { cx } from '../lib/cx';

interface ShapModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadName: string;
  area: string;
  riskScore: number;
  riskLevel: string;
  /** Confidence returned by the API, or 0 when it is not yet known. */
  confidence: number;
  confidenceKnown: boolean;
  isLoading: boolean;
  factors: ShapFactor[];
}

/**
 * "Why this score?" — the trust-building view. Reached from a route segment
 * or a road on the map. The technical vocabulary (SHAP) stays here, in the one
 * place a person has actively asked for it.
 */
export const ShapModal: React.FC<ShapModalProps> = ({
  isOpen,
  onClose,
  roadName,
  area,
  riskScore,
  riskLevel,
  confidence,
  confidenceKnown,
  isLoading,
  factors,
}) => {
  // A positive direction means the factor pushed risk up.
  const raising = useMemo(
    () => factors.filter((f) => f.direction === 'positive'),
    [factors],
  );
  const lowering = useMemo(
    () => factors.filter((f) => f.direction === 'negative'),
    [factors],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Why this score?"
      description={`${roadName} · ${area}`}
      icon={<Check className="h-4 w-4" aria-hidden="true" />}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-card border border-line bg-surface-2/40 p-4">
          <RiskMeter score={riskScore} />
          <p className="mt-2 text-meta text-ink-3">
            Model level: {riskLevel}
            {confidenceKnown ? ` · data support ${confidence}%` : ''}
          </p>
        </div>

        {isLoading ? (
          <SkeletonBlock />
        ) : factors.length === 0 ? (
          <EmptyState
            title="No standout factors"
            description="Nothing moved this score far from the typical pattern for this road."
          />
        ) : (
          <>
            <FactorGroup
              title="What raised the risk"
              tone="warn"
              factors={raising}
              emptyText="Nothing pushed this score up on its own."
            />
            <FactorGroup
              title="What lowered the risk"
              tone="safe"
              factors={lowering}
              emptyText="No protective factors stood out for this road."
            />

            <div className="border-t border-line pt-4">
              <p className="text-meta leading-relaxed text-ink-3">
                Each factor is a contribution from the model&apos;s explainability layer
                (TreeSHAP). A positive value pushed the score up; a negative value pulled it
                down. These are model attributions, not guarantees about the street.
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

function FactorGroup({
  title,
  tone,
  factors,
  emptyText,
}: {
  title: string;
  tone: 'warn' | 'safe';
  factors: ShapFactor[];
  emptyText: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-meta font-medium text-ink-2">{title}</h3>
      {factors.length === 0 ? (
        <p className="text-meta text-ink-3">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {factors.map((f, i) => (
            <li
              key={`${f.factor}-${i}`}
              className="rounded-control border border-line bg-surface-2/40 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-body font-medium text-ink">{f.factor}</p>
                <span
                  className={cx(
                    'shrink-0 rounded-full border px-2 py-0.5 text-meta font-medium',
                    tone === 'warn'
                      ? 'border-warn/30 bg-warn-wash text-warn'
                      : 'border-safe/30 bg-safe-wash text-safe',
                  )}
                >
                  {f.impact}
                </span>
              </div>
              <p className="mt-1 text-meta leading-relaxed text-ink-2">{f.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
