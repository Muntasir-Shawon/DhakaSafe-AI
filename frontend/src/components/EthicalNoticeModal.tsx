import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { ScrollText, CircleCheck, CircleAlert, Info } from 'lucide-react';

interface EthicalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const notes = [
  {
    Icon: CircleCheck,
    tone: 'text-safe',
    title: 'What this system looks at',
    body: 'Road segments and time windows only: street lighting, nearby bus stops, road hierarchy, police coverage and historical incident patterns. It does not profile, score or categorise people, communities or ethnic groups.',
  },
  {
    Icon: CircleAlert,
    tone: 'text-caution',
    title: 'Reported crime is not actual crime',
    body: 'The model learns from reported incidents — police blotters and verified news reports. Many thefts go unreported, and coverage often concentrates on busy commercial hubs. A higher score means a higher density of reported incidents, not a guarantee that a quieter road is free of risk.',
  },
  {
    Icon: Info,
    tone: 'text-info',
    title: 'How the language is kept neutral',
    body: 'You will see "predicted theft risk", never a judgement about a place or the people who live there. Choosing between the fastest, balanced and safest route always stays in your hands.',
  },
] as const;

export const EthicalNoticeModal: React.FC<EthicalNoticeModalProps> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="About this data"
    description="What DhakaSafe measures, and what it cannot tell you."
    icon={<ScrollText className="h-4 w-4" aria-hidden="true" />}
    className="max-w-2xl"
    footer={
      <Button variant="primary" onClick={onClose}>
        Got it
      </Button>
    }
  >
    <div className="space-y-4">
      {notes.map(({ Icon, tone, title, body }) => (
        <section key={title} className="flex gap-3">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-body font-medium text-ink">{title}</h3>
            <p className="text-meta leading-relaxed text-ink-2">{body}</p>
          </div>
        </section>
      ))}
    </div>
  </Modal>
);
