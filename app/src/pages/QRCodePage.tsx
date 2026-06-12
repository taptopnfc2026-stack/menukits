import { useRef, useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, CheckCircle2, QrCode, ChevronDown, ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useAuth } from '@/contexts/AuthContext';

const SIZE_OPTIONS = [
  { label: 'Small', size: 256, desc: '256 x 256 px' },
  { label: 'Medium', size: 384, desc: '512 x 512 px' },
  { label: 'Large', size: 512, desc: '768 x 768 px' },
];

export default function QRCodePage() {
  const { completeStep = () => {} } = useChecklist();
  completeStep('qr-code');
  const { token: authToken } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<SVGSVGElement>(null);

  // Load restaurant slug on mount
  useEffect(() => {
    async function loadOrCreateSlug() {
      if (!authToken) {
        setIsLoading(false);
        setLoadError('Not authenticated. Please log in again.');
        return;
      }
      setIsLoading(true);
      setLoadError('');
      try {
        const res = await fetch('/api/restaurants', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => 'Unknown error');
          throw new Error(`API error (${res.status}): ${errText}`);
        }
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const rest = rows[0];
          if (!rest.slug || rest.slug.trim() === '') {
            // Auto-generate slug for legacy records
            const generatedSlug = (rest.name || 'my-restaurant')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              + '-' + Date.now().toString(36);

            const updateRes = await fetch('/api/restaurants', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({ id: rest.id, slug: generatedSlug }),
            });
            if (updateRes.ok) {
              const updated = await updateRes.json();
              if (updated?.slug) setRestaurantSlug(updated.slug);
              else setRestaurantSlug(generatedSlug);
            } else {
              // Even if update fails, use the generated slug for display
              console.warn('[QR] Slug update failed, using local slug');
              setRestaurantSlug(generatedSlug);
            }
          } else {
            setRestaurantSlug(rest.slug);
          }
        } else {
          // No restaurant yet — create one
          const createRes = await fetch('/api/restaurants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ name: 'My Restaurant' }),
          });
          if (createRes.ok) {
            const created = await createRes.json();
            if (created?.slug) setRestaurantSlug(created.slug);
            else setLoadError('Restaurant created but no slug returned');
          } else {
            const errText = await createRes.text().catch(() => 'Unknown error');
            throw new Error(`Create failed (${createRes.status}): ${errText}`);
          }
        }
      } catch (e) {
        console.error('[QR] Restaurant load/create error:', e);
        setLoadError(e instanceof Error ? e.message : 'Failed to load restaurant data');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrCreateSlug();
  }, [authToken]);

  // Restaurant hub URL
  const hubUrl = useMemo(
    () => restaurantSlug ? `${window.location.origin}/hub/${restaurantSlug}` : '',
    [restaurantSlug]
  );
  const hubTitle = restaurantSlug
    ? restaurantSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';

  useEffect(() => {
    if (!showSizePicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowSizePicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSizePicker]);

  const handleCopy = () => {
    if (!hubUrl) return;
    navigator.clipboard.writeText(hubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    if (hubUrl) window.open(hubUrl, '_blank');
  };

  const handleDownload = (qrSize: number) => {
    setShowSizePicker(false);
    const svgEl = qrSvgRef.current;
    if (!svgEl) return;

    const canvas = document.createElement('canvas');
    canvas.width = qrSize;
    canvas.height = qrSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, qrSize, qrSize);
      const pad = Math.round(qrSize * 0.05);
      ctx.drawImage(img, pad, pad, qrSize - pad * 2, qrSize - pad * 2);

      const link = document.createElement('a');
      link.download = `qrcode-${hubTitle.toLowerCase().replace(/\s+/g, '-')}-${qrSize}x${qrSize}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-xl font-semibold text-gray-900">QR Code</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center">
        <h2 className="mb-6 self-start text-base font-semibold text-gray-900">Scan to see your menu hub</h2>

        {/* QR Code */}
        {hubUrl ? (
          <>
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-inner border border-gray-100">
              <QRCodeSVG
                ref={qrSvgRef as React.RefObject<SVGSVGElement>}
                value={hubUrl}
                size={220}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#111827"
              />
            </div>
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#5544e4]/10 px-3 py-1 text-xs font-medium text-[#5544e4]">
                <QrCode className="mr-1 h-3 w-3" />{hubTitle || 'Menu Hub'}
              </span>
            </div>
          </>
        ) : isLoading ? (
          <div className="mb-6 flex h-[236px] w-[236px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#5544e4]" />
          </div>
        ) : (
          <div className="mb-6 flex h-[236px] w-[236px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-xs text-red-600 max-w-[200px] leading-relaxed">{loadError || 'Unable to load QR code'}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                setLoadError('');
                setRestaurantSlug('');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5544e4] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4433cc] transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {/* URL */}
        <p className="mb-3 text-sm text-center text-gray-600">
          Scan the QR code or click on the following link:
        </p>
        <div className="relative w-full max-w-sm mb-6">
          <Input
            readOnly
            value={hubUrl || 'Loading...'}
            className={`pr-24 h-10 text-sm font-mono ${hubUrl ? 'bg-gray-50' : 'bg-gray-100 text-gray-400'}`}
          />
          {hubUrl && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <button onClick={handlePreview} className="rounded-md p-1.5 text-gray-400 hover:text-[#5544e4] hover:bg-gray-100" title="Open preview in new tab">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </button>
              <button onClick={handleCopy} className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Download */}
        <div ref={pickerRef} className="relative w-full mt-auto pt-4">
          <Button
            disabled={!hubUrl}
            onClick={() => setShowSizePicker(!showSizePicker)}
            className="w-full gap-2 bg-[#5544e4] hover:bg-[#4433cc] text-white shadow-md disabled:opacity-40 h-11 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Download QR code
            <ChevronDown className="h-4 w-4 ml-auto transition-transform" style={{ rotate: showSizePicker ? '180deg' : undefined }} />
          </Button>

          {showSizePicker && hubUrl && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Select size</p>
              <div className="space-y-1">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleDownload(opt.size)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm hover:bg-gray-50 transition-colors group"
                  >
                    <span className="font-semibold text-gray-700 group-hover:text-[#5544e4]">{opt.label}</span>
                    <span className="text-xs text-gray-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF promo */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-purple-50/30 p-6 shadow-sm relative overflow-hidden">
        <Badge variant="secondary" className="absolute top-4 right-4 border-purple-200 bg-purple-50 text-purple-700">
          Premium
        </Badge>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 shrink-0">
            <Download className="h-5 w-5 text-[#5544e4]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Menu PDF downloads are a Premium feature</h3>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">
              Download your menu as a PDF and keep print-ready files for tables, windows, or takeaway handouts.
            </p>
          </div>
        </div>
        <Button size="sm" className="mt-2 bg-[#5544e4] hover:bg-[#4433cc]">
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
}
