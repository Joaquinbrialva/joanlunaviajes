'use client';

import { useRouter } from 'next/navigation';
import { Button, Modal } from '@heroui/react';
import { Mail, ArrowRight } from 'lucide-react';

export default function NewsletterOfferModal({ isOpen, onClose, offer }) {
  const router = useRouter();

  function goToComposer() {
    onClose();
    router.push(`/admin/newsletter/nuevo?offerSlug=${offer?.slug || ''}`);
  }

  function goToOffers() {
    onClose();
    router.push('/admin/ofertas');
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) goToOffers(); }}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className='w-full max-w-[440px] p-0 overflow-hidden'>

            {/* Accent strip */}
            <div style={{ height: 3, background: '#ff7e2d', flexShrink: 0 }} />

            <div style={{ padding: '28px 28px 24px' }}>

              {/* Icon */}
              <div
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(255,126,45,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Mail size={22} style={{ color: '#ff7e2d' }} />
              </div>

              <h2
                style={{
                  fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px',
                  color: 'var(--foreground)', margin: '0 0 8px',
                  fontFamily: 'var(--font-jakarta, sans-serif)',
                }}
              >
                ¿Anunciar por newsletter?
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                La oferta <strong style={{ color: 'var(--foreground)' }}>{offer?.title}</strong> fue guardada.
                ¿Querés crear un newsletter para anunciarla a tus suscriptores?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button
                  onClick={goToComposer}
                  style={{
                    width: '100%', height: 42,
                    background: '#ff7e2d', color: '#fff',
                    fontSize: 13.5, fontWeight: 700, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Mail size={15} />
                  Sí, crear newsletter
                  <ArrowRight size={14} />
                </Button>
                <button
                  onClick={goToOffers}
                  style={{
                    width: '100%', height: 38,
                    background: 'transparent', color: 'var(--muted)',
                    fontSize: 13, fontWeight: 500, borderRadius: 12,
                    border: '1px solid var(--border)', cursor: 'pointer',
                  }}
                >
                  No, ir a ofertas
                </button>
              </div>
            </div>

          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
