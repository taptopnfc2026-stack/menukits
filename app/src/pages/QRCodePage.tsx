import { useRef, useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, CheckCircle2, QrCode, ChevronDown, ExternalLink, Loader2, AlertCircle, RefreshCw, ChevronLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuContext } from '@/contexts/MenuContext';
import type { Menu } from '@/types';

const SIZE_OPTIONS = [
  { label: 'Small', size: 256, desc: '256 x 256 px' },
  { label: 'Medium', size: 384, desc: '512 x 512 px' },
  { label: 'Large', size: 512, desc: '768 x 768 px' },
];

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';

function EmbeddedMenuPreview({
  menus,
  restaurantName,
  coverImage,
  onOpenHub,
}: {
  menus: Menu[];
  restaurantName: string;
  coverImage: string;
  onOpenHub: () => void;
}) {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const visibleMenus = useMemo(() => menus.filter((menu) => menu.isVisible), [menus]);
  const selectedMenu = selectedMenuId ? visibleMenus.find((menu) => menu.id === selectedMenuId) : null;
  const visibleSections = useMemo(
    () => selectedMenu?.sections.filter((section) => section.dishes.some((dish) => dish.isVisible)) ?? [],
    [selectedMenu]
  );

  useEffect(() => {
    if (!selectedMenu) {
      setActiveSectionId(null);
      return;
    }
    setActiveSectionId((current) => {
      if (current && visibleSections.some((section) => section.id === current)) return current;
      return visibleSections[0]?.id ?? null;
    });
  }, [selectedMenu, visibleSections]);

  useEffect(() => {
    if (selectedMenuId && !visibleMenus.some((menu) => menu.id === selectedMenuId)) {
      setSelectedMenuId(null);
    }
  }, [selectedMenuId, visibleMenus]);

  return (
    <div className="rounded-[28px] border border-[#eee6cf] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#b98900]">Live preview</p>
        <h2 className="mt-1 text-lg font-extrabold text-[#151526]">Guest menu preview</h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          This is the phone view guests see after scanning the QR code.
        </p>
      </div>

      <div
        className="relative mx-auto flex h-[640px] w-full max-w-[345px] flex-col overflow-hidden"
        style={{ background: '#1a1a1a', borderRadius: '42px', padding: '10px' }}
      >
        <div
          className="absolute left-1/2 top-[16px] z-40 h-[30px] w-[116px] -translate-x-1/2 rounded-full bg-black"
          aria-hidden="true"
        />
        <div className="relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[32px] bg-white">
          <div className="absolute right-4 top-12 z-30 flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenHub}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow backdrop-blur-sm transition-colors hover:bg-white hover:text-[#151526]"
              title="Open menu hub"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          {!selectedMenu ? (
            <>
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                <img src={coverImage} alt="Restaurant cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              </div>

              <div className="px-6 pb-5 pt-14">
                <h3 className="text-center text-xl font-bold text-gray-900">{restaurantName}</h3>
                {visibleMenus.length > 0 ? (
                  <div className="mt-5 space-y-2.5">
                    {visibleMenus.map((menu) => (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => setSelectedMenuId(menu.id)}
                        className="flex w-full items-center justify-between rounded-2xl bg-[#151526] px-5 py-3.5 text-left text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#232338] hover:shadow-lg"
                      >
                        <span className="min-w-0 truncate">{menu.title}</span>
                        <svg className="ml-3 h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-12 py-12 text-center">
                    <p className="text-sm text-gray-400">No menus to display</p>
                  </div>
                )}
              </div>

              <div className="mt-auto shrink-0 px-6 py-3 text-center">
                <div className="mx-auto mb-2 h-1 w-32 rounded-full bg-gray-200" />
                <p className="text-[10px] text-gray-400">
                  Powered by <span className="font-semibold text-[#b98900]">menukits.eu</span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 px-5 pb-2 pt-12">
                <button
                  type="button"
                  onClick={() => setSelectedMenuId(null)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 transition-colors hover:text-[#151526]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {selectedMenu.title}
                </button>
              </div>

              {visibleSections.length > 0 ? (
                <>
                  <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-5 py-3">
                    {visibleSections.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSectionId(section.id)}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                          activeSectionId === section.id
                            ? 'bg-[#151526] text-white'
                            : 'border border-gray-300 bg-white text-gray-600 hover:bg-[#fff8d8]'
                        }`}
                      >
                        {section.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 pb-6">
                    {visibleSections.map((section) => {
                      const dishes = section.dishes.filter((dish) => dish.isVisible);
                      return (
                        <div key={section.id} className={activeSectionId !== section.id ? 'hidden' : ''}>
                          <h3 className="mb-3 text-lg font-bold text-gray-900">{section.name}</h3>
                          <div className="space-y-4">
                            {dishes.map((dish) => (
                              <div key={dish.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="truncate font-semibold text-gray-900">{dish.name}</h4>
                                    {dish.isBestSeller && (
                                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                                        <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                                        Best
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-gray-500">{dish.description}</p>
                                  <p className="mt-1 font-bold text-gray-900">{dish.price}</p>
                                </div>
                                {dish.image && (
                                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                    <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center px-8 text-center">
                  <p className="text-sm text-gray-400">No visible dishes in this menu</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QRCodePage() {
  const { completeStep = () => {} } = useChecklist();
  completeStep('qr-code');
  const { token: authToken } = useAuth();
  const { menus } = useMenuContext();
  const [copied, setCopied] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState(0);
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
              if (updated?.slug) {
                setRestaurantSlug(updated.slug);
              } else {
                throw new Error('Restaurant URL was saved but no slug was returned');
              }
            } else {
              const errText = await updateRes.text().catch(() => 'Unknown error');
              throw new Error(`Could not save restaurant URL (${updateRes.status}): ${errText}`);
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
  }, [authToken, reloadKey]);

  // Restaurant hub URL
  const hubUrl = useMemo(
    () => restaurantSlug ? `${window.location.origin}/hub/${restaurantSlug}` : '',
    [restaurantSlug]
  );
  const hubTitle = restaurantSlug
    ? restaurantSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';
  const restaurantInfo = menus.find((menu) => menu.restaurantInfo)?.restaurantInfo;
  const previewRestaurantName = restaurantInfo?.name?.trim() || 'My Restaurant';
  const previewCoverImage = restaurantInfo?.coverImage?.trim() || DEFAULT_COVER_IMAGE;

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#b98900]">Menu hub</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#151526]">QR Code</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Share one restaurant link where guests can browse every visible menu.
          </p>
        </div>
        {hubUrl && (
          <Button
            variant="outline"
            onClick={handlePreview}
            className="w-fit gap-2 rounded-xl border-[#eee6cf] bg-white font-bold text-[#151526] hover:bg-[#fff8d8]"
          >
            <ExternalLink className="h-4 w-4" />
            Open hub
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="rounded-[28px] border border-[#eee6cf] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#151526]">Guest scan card</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Use this QR code on tables, windows, flyers, and receipts.</p>
            </div>
            <Badge className="border border-[#f1d36a] bg-[#fff8d8] px-3 py-1 text-[#8a6500] hover:bg-[#fff8d8]">
              Live link
            </Badge>
          </div>

        {/* QR Code */}
        <div className="mb-6 flex w-full justify-center">
          {hubUrl ? (
            <div className="w-fit rounded-[28px] border border-[#eee6cf] bg-[#fffdf7] p-5 shadow-inner">
                <QRCodeSVG
                  ref={qrSvgRef as React.RefObject<SVGSVGElement>}
                  value={hubUrl}
                  size={220}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#151526"
                />
              </div>
            ) : isLoading ? (
              <div className="flex h-[236px] w-[236px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin text-[#b98900]" />
              </div>
            ) : (
              <div className="flex h-[236px] w-[236px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="max-w-[200px] text-xs leading-relaxed text-red-600">{loadError || 'Unable to load QR code'}</p>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setLoadError('');
                    setRestaurantSlug('');
                    setReloadKey((key) => key + 1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#151526] px-3 py-1.5 text-xs font-bold text-[#FFD400] transition-colors hover:bg-black"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}
          </div>
        {hubUrl && (
          <div className="mb-5 flex items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#151526] px-3 py-1 text-xs font-bold text-[#FFD400]">
              <QrCode className="mr-1 h-3 w-3" />{hubTitle || 'Menu Hub'}
            </span>
          </div>
        )}

        {/* URL */}
        <p className="mb-3 text-center text-sm font-medium text-slate-500">
          Scan the QR code or click on the following link:
        </p>
        <div className="relative mx-auto mb-6 w-full max-w-lg">
          <Input
            readOnly
            value={hubUrl || 'Loading...'}
            className={`h-12 rounded-xl pr-24 text-sm font-mono ${hubUrl ? 'border-[#eee6cf] bg-[#fffdf7]' : 'bg-gray-100 text-gray-400'}`}
          />
          {hubUrl && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <button onClick={handlePreview} className="rounded-md p-1.5 text-gray-400 hover:text-[#151526] hover:bg-[#fff8d8]" title="Open preview in new tab">
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
            className="h-12 w-full gap-2 rounded-xl bg-[#FFD400] text-sm font-extrabold text-[#151526] shadow-lg shadow-[#ffd400]/25 hover:bg-[#F2B900] disabled:opacity-40"
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
                    className="group flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors hover:bg-[#fff8d8]"
                  >
                    <span className="font-semibold text-gray-700 group-hover:text-[#151526]">{opt.label}</span>
                    <span className="text-xs text-gray-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

        <EmbeddedMenuPreview
          menus={menus}
          restaurantName={previewRestaurantName}
          coverImage={previewCoverImage}
          onOpenHub={handlePreview}
        />
      </div>
    </div>
  );
}
