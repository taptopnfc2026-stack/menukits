import { useRef, useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, CheckCircle2, QrCode, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useMenuContext } from '@/contexts/MenuContext';
import { useAuth } from '@/contexts/AuthContext';

// Generate restaurant slug URL (custom URL for each business)
function getRestaurantSlugUrl(): string {
  return `${window.location.origin}/hub`;
}

// Generate menu preview link
function getMenuPreviewUrl(menuId: string): string {
  return `${window.location.origin}/r/${menuId}`;
}

// 下载尺寸选项
const SIZE_OPTIONS = [
  { label: 'Small', size: 128, desc: '256 x 256 px' },
  { label: 'Medium', size: 256, desc: '512 x 512 px' },
  { label: 'Large', size: 384, desc: '768 x 768 px' },
];

export default function QRCodePage() {
  const { completeStep = () => {} } = useChecklist();
  completeStep('qr-code');
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState<number | null>(null);
  const [isHubSelected, setIsHubSelected] = useState(true);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const qrSvgRef = useRef<SVGSVGElement>(null);
  const { menus, saveToCloud } = useMenuContext();
  const [isSyncing, setIsSyncing] = useState(true);

  // Force cloud sync on mount — ensures all local menus are saved to DB
  // and timestamp IDs are replaced with server UUIDs
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        await saveToCloud();
      } catch {
        /* non-fatal */
      }
      if (!cancelled) setIsSyncing(false);
    }
    sync();
    return () => { cancelled = true; };
  }, []);

  // Default to first menu if available (not generic hub)
  useEffect(() => {
    if (!isSyncing && menus.length > 0 && selectedMenuIndex === null && isHubSelected) {
      setSelectedMenuIndex(0);
      setIsHubSelected(false);
    }
  }, [menus, isSyncing]);

  // Load restaurant slug on mount
  useEffect(() => {
    async function loadSlug() {
      try {
        const res = await fetch('/api/restaurants');
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0 && rows[0].slug) {
            setRestaurantSlug(rows[0].slug);
          }
        }
      } catch {
        /* ignore */
      }
    }
    loadSlug();
  }, []);

  const selectedMenu = selectedMenuIndex !== null ? menus[selectedMenuIndex] : null;
  const menuUrl = useMemo(() => selectedMenu ? getMenuPreviewUrl(selectedMenu.id) : '', [selectedMenu]);
  // Custom URL: /hub/la-petite-cafe (or fallback to /hub)
  const hubUrl = useMemo(
    () => restaurantSlug
      ? `${window.location.origin}/hub/${restaurantSlug}`
      : getRestaurantSlugUrl(),
    [restaurantSlug]
  );
  const activeUrl = isHubSelected ? hubUrl : menuUrl;
  const activeTitle = isHubSelected
    ? (restaurantSlug ? restaurantSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Menu Hub')
    : (selectedMenu?.title || '');

  // 点击外部关闭尺寸选择器
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

  const handleSelectMenu = (idx: number) => {
    setSelectedMenuIndex(idx);
    setIsHubSelected(false);
  };

  const handleSelectHub = () => {
    setIsHubSelected(true);
    setSelectedMenuIndex(null);
  };

  // 点击外部关闭下拉
  const handleCopy = () => {
    if (!activeUrl) return;
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    if (activeUrl) window.open(activeUrl, '_blank');
  };

  // 将 QR 码导出为 PNG 并触发下载
  const handleDownload = (qrSize: number) => {
    setShowSizePicker(false);
    const svgEl = qrSvgRef.current;
    if (!svgEl) return;

    const canvas = document.createElement('canvas');
    canvas.width = qrSize;
    canvas.height = qrSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 将 SVG 序列化为 data URL
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // 白底
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, qrSize, qrSize);
      // 绘制 QR（留 5% 内边距）
      const pad = Math.round(qrSize * 0.05);
      ctx.drawImage(img, pad, pad, qrSize - pad * 2, qrSize - pad * 2);

      // 触发下载
      const link = document.createElement('a');
      link.download = `qrcode-${activeTitle.toLowerCase().replace(/\s+/g, '-')}-${qrSize}x${qrSize}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-xl font-semibold text-gray-900">QR Code</h1>

      {isSyncing ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#5544e4] mb-4" />
          <p className="text-sm font-medium text-gray-700">Syncing menus to cloud...</p>
          <p className="mt-1 text-xs text-gray-400">Ensuring your QR codes link to the correct menu</p>
        </div>
      ) : (

      {/* Row 1: Select menu | Scan + Download — side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Left: Menu selector */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Select a menu</h2>
            {menus.length > 0 && (
              <button
                onClick={() => window.open('/hub', '_blank')}
                className="flex items-center gap-1 text-xs font-medium text-[#5544e4] hover:text-[#4433cc] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Preview hub
              </button>
            )}
          </div>
          {menus.length === 0 ? (
            <p className="text-sm text-gray-400">No menus available. Create or upload a menu first.</p>
          ) : (
            <div className="space-y-2">
              {/* Menu Hub button */}
              <button
                onClick={handleSelectHub}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  isHubSelected
                    ? 'border-[#5544e4]/30 bg-[#5544e4]/5'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${isHubSelected ? 'text-[#5544e4]' : 'text-gray-700'}`}>
                    Menu Hub
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    All menus &middot; Preview hub
                  </p>
                </div>
                {isHubSelected && <QrCode className="ml-3 h-4 w-4 shrink-0 text-[#5544e4]" />}
              </button>

              {/* Individual menu buttons */}
              {menus.map((menu, idx) => (
                <button
                  key={menu.id}
                  onClick={() => handleSelectMenu(idx)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    !isHubSelected && selectedMenuIndex === idx
                      ? 'border-[#5544e4]/30 bg-[#5544e4]/5'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${!isHubSelected && selectedMenuIndex === idx ? 'text-[#5544e4]' : 'text-gray-700'}`}>
                      {menu.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {menu.sections.length} sections &middot;{' '}
                      {menu.sections.reduce((sum, s) => sum + s.dishes.length, 0)} dishes
                    </p>
                  </div>
                  {!isHubSelected && selectedMenuIndex === idx && <QrCode className="ml-3 h-4 w-4 shrink-0 text-[#5544e4]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: QR preview + Download button */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col items-center">
          <h2 className="mb-6 self-start text-base font-semibold text-gray-900">Scan to see your menu</h2>

          {/* QR Code */}
          {activeUrl ? (
            <>
              <div className="mb-6 rounded-2xl bg-white p-4 shadow-inner border border-gray-100">
                <QRCodeSVG
                  ref={qrSvgRef as React.RefObject<SVGSVGElement>}
                  value={activeUrl}
                  size={180}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#111827"
                />
              </div>
              <div className="mb-5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#5544e4]/10 px-3 py-1 text-xs font-medium text-[#5544e4]">
                  <QrCode className="mr-1 h-3 w-3" />{activeTitle}
                </span>
              </div>
            </>
          ) : (
            <div className="mb-6 flex h-[196px] w-[196px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
              No menus yet
            </div>
          )}

          {/* URL */}
          <p className="mb-3 text-sm text-center text-gray-600">
            Scan the QR code to see {isHubSelected ? 'your menu hub' : 'the menu'} or click on the following link:
          </p>
          <div className="relative w-full max-w-sm mb-6">
            <Input
              readOnly
              value={activeUrl || 'Create a menu first to generate QR code'}
              className={`pr-24 h-10 text-sm font-mono ${activeUrl ? 'bg-gray-50' : 'bg-gray-100 text-gray-400'}`}
            />
            {activeUrl && (
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

          {/* Download QR code — full-width dark button */}
          <div ref={pickerRef} className="relative w-full mt-auto pt-4">
            <Button
              disabled={!activeUrl}
              onClick={() => setShowSizePicker(!showSizePicker)}
              className="w-full gap-2 bg-[#5544e4] hover:bg-[#4433cc] text-white shadow-md disabled:opacity-40 h-11 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Download QR code
              <ChevronDown className="h-4 w-4 ml-auto transition-transform" style={{ rotate: showSizePicker ? '180deg' : undefined }} />
            </Button>

            {showSizePicker && activeUrl && (
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
      </div>

      {/* Row 2: PDF promo — full width */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-purple-50/30 p-6 shadow-sm relative overflow-hidden">
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
      )}
    </div>
  );
}
