import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Store,
  ImagePlus,
  Gift,
  Plus,
  HelpCircle,
  PercentCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Sparkles,
  CalendarDays,
  Leaf,
  Star,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useMenuContext } from '@/contexts/MenuContext';
import type { Promotion } from '@/types';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
];

export default function RestaurantPage() {
  const { completeStep } = useChecklist();
  const { menus, updateMenu, updateMenuAndSave } = useMenuContext();

  /* Use the first menu as target for restaurant info */
  const menuId = menus[0]?.id || '1';
  const existingInfo = menus[0]?.restaurantInfo;

  // Restaurant details state — initialize from saved data
  const [restaurantName, setRestaurantName] = useState(existingInfo?.name ?? 'My Restaurant');
  const [address, setAddress] = useState(existingInfo?.address ?? '');
  const [phone, setPhone] = useState(existingInfo?.phone ?? '');
  const [currency, setCurrency] = useState(existingInfo?.currency ?? '');

  // Cover image state
  const [selectedImageIndex, setSelectedImageIndex] = useState(
    existingInfo?.coverImage ? (COVER_IMAGES.indexOf(existingInfo.coverImage) >= 0 ? COVER_IMAGES.indexOf(existingInfo.coverImage) : 1) : 1
  );

  // Custom uploaded cover image (base64 data URL)
  const [customCoverImage, setCustomCoverImage] = useState<string | null>(
    existingInfo?.coverImage && !COVER_IMAGES.includes(existingInfo.coverImage) ? existingInfo.coverImage : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Online links state
  const [instagram, setInstagram] = useState(existingInfo?.socialLinks?.instagram ?? '');
  const [facebook, setFacebook] = useState(existingInfo?.socialLinks?.facebook ?? '');
  const [whatsapp, setWhatsapp] = useState(existingInfo?.socialLinks?.whatsapp ?? '');
  const [tiktok, setTiktok] = useState(existingInfo?.socialLinks?.tiktok ?? '');
  const [website, setWebsite] = useState(existingInfo?.socialLinks?.website ?? '');

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>(
    existingInfo?.promotions ?? []
  );
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Save success toast
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const showSaved = (label: string) => {
    setSavedToast(label);
    setTimeout(() => setSavedToast(null), 2200);
  };

  const resizeCoverImage = useCallback((file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        const maxWidth = 1400;
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image processing is not available.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }), []);

  /* Sync local state when menus data changes from elsewhere */
  useEffect(() => {
    const info = menus.find((m) => m.id === menuId)?.restaurantInfo;
    if (info) {
      if (info.name !== undefined && info.name !== restaurantName) setRestaurantName(info.name);
      if (info.address !== undefined && info.address !== address) setAddress(info.address);
      if (info.phone !== undefined && info.phone !== phone) setPhone(info.phone);
      if (info.currency !== undefined && info.currency !== currency) setCurrency(info.currency);
      if (info.coverImage !== undefined) {
        if (COVER_IMAGES.includes(info.coverImage)) {
          const nextIndex = COVER_IMAGES.indexOf(info.coverImage);
          if (nextIndex !== selectedImageIndex) setSelectedImageIndex(nextIndex);
          if (customCoverImage) setCustomCoverImage(null);
        } else if (info.coverImage !== customCoverImage) {
          setCustomCoverImage(info.coverImage);
          if (selectedImageIndex !== -1) setSelectedImageIndex(-1);
        }
      }
      if (info.socialLinks?.instagram !== undefined && info.socialLinks.instagram !== instagram) setInstagram(info.socialLinks.instagram);
      if (info.socialLinks?.facebook !== undefined && info.socialLinks.facebook !== facebook) setFacebook(info.socialLinks.facebook);
      if (info.socialLinks?.whatsapp !== undefined && info.socialLinks.whatsapp !== whatsapp) setWhatsapp(info.socialLinks.whatsapp);
      if (info.socialLinks?.tiktok !== undefined && info.socialLinks.tiktok !== tiktok) setTiktok(info.socialLinks.tiktok);
      if (info.socialLinks?.website !== undefined && info.socialLinks.website !== website) setWebsite(info.socialLinks.website);
      if (info.promotions !== undefined) setPromotions(info.promotions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus]);

  /* ---- Save handlers ---- */

  const handleSaveDetails = () => {
    updateMenu(menuId, (menu) => ({
      ...menu,
      restaurantInfo: {
        ...(menu.restaurantInfo || {}),
        name: restaurantName,
        address: address || undefined,
        phone: phone || undefined,
        currency: currency || undefined,
        onlineLinks: menu.restaurantInfo?.onlineLinks ?? [],
        languages: menu.restaurantInfo?.languages ?? ['en'],
        promotions: menu.restaurantInfo?.promotions ?? [],
      },
    }));
    completeStep('business-name');
    showSaved('Restaurant details');
  };

  const handleCustomImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Maximum size is 10MB.');
      return;
    }

    resizeCoverImage(file).then((dataUrl) => {
      setCustomCoverImage(dataUrl);
      setSelectedImageIndex(-1); // Deselect default images
    }).catch(() => {
      alert('Failed to process image. Please try another file.');
    });

    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [resizeCoverImage]);

  const handleSaveCoverImage = async () => {
    const coverSrc = customCoverImage || COVER_IMAGES[selectedImageIndex];
    await updateMenuAndSave(menuId, (menu) => ({
      ...menu,
      restaurantInfo: {
        ...(menu.restaurantInfo || {}),
        coverImage: coverSrc,
        name: menu.restaurantInfo?.name || restaurantName,
        onlineLinks: menu.restaurantInfo?.onlineLinks ?? [],
        languages: menu.restaurantInfo?.languages ?? [],
        promotions: menu.restaurantInfo?.promotions ?? [],
      },
    }));
    completeStep('cover-image');
    showSaved('Cover image');
  };

  const handleSaveOnlineLinks = () => {
    updateMenu(menuId, (menu) => ({
      ...menu,
      restaurantInfo: {
        ...(menu.restaurantInfo || {}),
        socialLinks: {
          instagram: instagram || undefined,
          facebook: facebook || undefined,
          whatsapp: whatsapp || undefined,
          tiktok: tiktok || undefined,
          website: website || undefined,
        },
        onlineLinks: menu.restaurantInfo?.onlineLinks ?? [],
        languages: menu.restaurantInfo?.languages ?? [],
        promotions: menu.restaurantInfo?.promotions ?? [],
      },
    }));
    showSaved('Online links');
  };

  const handleSavePromotions = () => {
    updateMenu(menuId, (menu) => ({
      ...menu,
      restaurantInfo: {
        ...(menu.restaurantInfo || {}),
        onlineLinks: menu.restaurantInfo?.onlineLinks ?? [],
        languages: menu.restaurantInfo?.languages ?? [],
        promotions: promotions,
      },
    }));
    showSaved('Promotions');
  };

  /* ---- Promotion CRUD ---- */

  const createPromotion = () => {
    const newPromo: Promotion = {
      id: `promo-${Date.now()}`,
      title: '',
      description: '',
      type: 'special',
      bgColor: '#FFD400',
      textColor: '#ffffff',
      isActive: true,
      emoji: '✨',
    };
    setEditingPromotion(newPromo);
    setIsPromoModalOpen(true);
  };

  const editPromotion = (promo: Promotion) => {
    setEditingPromotion({ ...promo });
    setIsPromoModalOpen(true);
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePromotionActive = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const savePromotion = () => {
    if (!editingPromotion) return;
    setPromotions((prev) => {
      const exists = prev.find((p) => p.id === editingPromotion.id);
      if (exists) {
        return prev.map((p) => (p.id === editingPromotion.id ? editingPromotion : p));
      }
      return [...prev, editingPromotion];
    });
    setIsPromoModalOpen(false);
    setEditingPromotion(null);
  };

  const movePromotion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= promotions.length) return;
    setPromotions((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Restaurant</h1>
        <Button variant="outline" size="sm" className="text-sm">
          View menu
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6 h-auto w-full justify-start gap-1 rounded-xl bg-gray-100 p-1">
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 gap-2 rounded-lg border-transparent px-3 py-2.5 text-sm font-medium text-gray-500 transition-all"
          >
            <Store className="h-4 w-4" />
            Restaurant details
          </TabsTrigger>
          <TabsTrigger
            value="promotions"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 gap-2 rounded-lg border-transparent px-3 py-2.5 text-sm font-medium text-gray-500 transition-all"
          >
            <Gift className="h-4 w-4" />
            Promotions
          </TabsTrigger>
        </TabsList>

        {/* ======== Tab 1: Restaurant details ======== */}
        <TabsContent value="details">
          <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Restaurant details</h2>
              <p className="mt-1 text-sm text-gray-500">Enter your restaurant information.</p>
            </div>

            <div className="mx-auto max-w-md space-y-5">
              {/* Restaurant name */}
              <div className="space-y-1.5">
                <Label htmlFor="rname" className="text-sm font-medium text-gray-700">
                  Restaurant name
                </Label>
                <Input
                  id="rname"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder=""
                  className="h-11"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Via Roma 12"
                  className="h-11"
                />
              </div>

              {/* Phone number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 555 123 456"
                  className="h-11"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save */}
              <Button onClick={handleSaveDetails} className="w-full bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold h-12 text-base">
                Save
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Menu cover image</h2>
              <p className="mt-1 text-sm text-gray-500">
                Customize your menu, upload an image of your restaurant or select a default image.
              </p>
            </div>

            <div className="mx-auto mb-8 max-w-[300px]">
              <div className="overflow-hidden rounded-3xl shadow-xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={customCoverImage || COVER_IMAGES[selectedImageIndex]}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="bg-white px-6 py-4 text-center">
                  <p className="text-lg font-bold text-gray-900">{restaurantName || 'My Restaurant'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
                className="hidden"
                onChange={handleCustomImageUpload}
              />
              {customCoverImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-[#F2B900] ring-2 ring-[#FFD400]/40 transition-all"
                  title="Change image"
                >
                  <img src={customCoverImage} alt="Uploaded" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-medium text-white">Change</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50"
                  title="Upload your own image"
                >
                  <Plus className="h-6 w-6" />
                </button>
              )}
              {COVER_IMAGES.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedImageIndex(i); setCustomCoverImage(null); }}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    !customCoverImage && selectedImageIndex === i
                      ? 'border-[#F2B900] ring-2 ring-[#FFD400]/40'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={handleSaveCoverImage} className="min-w-[240px] bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold h-12 text-base">
                Save cover image
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Online links</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add links to your social media to reach a wider audience.
              </p>
            </div>

            <div className="mx-auto max-w-md space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="insta" className="text-sm font-medium text-gray-700">
                  Instagram
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">@</span>
                  <Input
                    id="insta"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@menukits"
                    className="h-11 pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fb" className="text-sm font-medium text-gray-700">
                  Facebook
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">@</span>
                  <Input
                    id="fb"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="@menukits"
                    className="h-11 pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  WhatsApp
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                </label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder=""
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tt" className="text-sm font-medium text-gray-700">
                  TikTok
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">@</span>
                  <Input
                    id="tt"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@menukits"
                    className="h-11 pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="web" className="text-sm font-medium text-gray-700">
                  Website
                </Label>
                <Input
                  id="web"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder=""
                  className="h-11"
                />
              </div>

              <Button onClick={handleSaveOnlineLinks} className="w-full bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold h-12 text-base">
                Save online links
              </Button>
            </div>
          </div>
          </div>
        </TabsContent>

        {/* ======== Tab 2: Promotions ======== */}
        <TabsContent value="promotions">
          <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Promotions</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Show specials, events, and seasonal highlights above your menus.
                  </p>
                </div>
                <Button
                  onClick={createPromotion}
                  className="gap-2 bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold"
                >
                  <Plus className="h-4 w-4" />
                  Add Promotion
                </Button>
              </div>

              {/* Empty state */}
              {promotions.length === 0 && (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff8d8]">
                    <Gift className="h-7 w-7 text-[#b98900]" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    No promotions yet
                  </h3>
                  <p className="mx-auto mb-6 max-w-xs text-sm leading-relaxed text-gray-500">
                    Create your first promotion banner to highlight specials, events, or seasonal dishes above your menu.
                  </p>
                  <Button
                    onClick={createPromotion}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Promotion
                  </Button>
                </div>
              )}

              {/* Promotion list */}
              {promotions.length > 0 && (
                <div className="space-y-4">
                  {promotions.map((promo, index) => (
                    <PromotionCard
                      key={promo.id}
                      promo={promo}
                      index={index}
                      total={promotions.length}
                      onEdit={() => editPromotion(promo)}
                      onDelete={() => deletePromotion(promo.id)}
                      onToggleActive={() => togglePromotionActive(promo.id)}
                      onMove={movePromotion}
                    />
                  ))}
                </div>
              )}

              {/* Save button */}
              {promotions.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleSavePromotions}
                    className="min-w-[240px] bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold h-12 text-base"
                  >
                    Save Promotions
                  </Button>
                </div>
              )}
            </div>

            {/* Preview card - how it looks in menu */}
            {promotions.some((p) => p.isActive) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-gray-900">Preview</h3>
                <p className="mb-4 text-sm text-gray-500">
                  This is how your promotions will appear above the menu for your customers.
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="divide-y divide-gray-100">
                    {promotions.filter((p) => p.isActive).map((promo) => (
                      <div
                        key={`preview-${promo.id}`}
                        className="flex items-center gap-3 px-5 py-4"
                        style={{ backgroundColor: promo.bgColor }}
                      >
                        {promo.emoji && (
                          <span className="text-2xl">{promo.emoji}</span>
                        )}
                        <div className="flex-1">
                          <p
                            className="font-semibold"
                            style={{ color: promo.textColor }}
                          >
                            {promo.title || 'Untitled Promotion'}
                          </p>
                          {promo.description && (
                            <p
                              className="mt-0.5 text-sm opacity-90"
                              style={{ color: promo.textColor }}
                            >
                              {promo.description}
                            </p>
                          )}
                        </div>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            color: promo.textColor,
                            backgroundColor: `${promo.textColor}20`,
                          }}
                        >
                          {promo.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Save success toast */}
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 rounded-full bg-gray-900 px-5 py-3 shadow-lg shadow-black/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-white whitespace-nowrap">
              {savedToast} saved successfully
            </span>
          </div>
        </div>
      )}

      {/* Promotion Edit Modal */}
      {isPromoModalOpen && editingPromotion && (
        <PromoModal
          promo={editingPromotion}
          isNew={!promotions.find((p) => p.id === editingPromotion.id)}
          onChange={setEditingPromotion}
          onSave={savePromotion}
          onClose={() => {
            setIsPromoModalOpen(false);
            setEditingPromotion(null);
          }}
        />
      )}
    </div>
  );
}

/* ==================== PromotionCard ==================== */

const TYPE_STYLES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  special: { label: 'Special', icon: Sparkles, color: 'bg-amber-50 text-amber-700' },
  event: { label: 'Event', icon: CalendarDays, color: 'bg-blue-50 text-blue-700' },
  seasonal: { label: 'Seasonal', icon: Leaf, color: 'bg-emerald-50 text-emerald-700' },
  custom: { label: 'Custom', icon: Star, color: 'bg-[#fff8d8] text-[#8a6500]' },
};

interface PromoCardProps {
  promo: Promotion;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

function PromotionCard({ promo, index, total, onEdit, onDelete, onToggleActive, onMove }: PromoCardProps) {
  const typeInfo = TYPE_STYLES[promo.type] || TYPE_STYLES.custom;
  const TypeIcon = typeInfo.icon;

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-opacity ${
        promo.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
      }`}
    >
      {/* Banner preview strip */}
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ backgroundColor: promo.bgColor }}
      >
        {promo.emoji && <span className="text-xl">{promo.emoji}</span>}
        <p
          className="flex-1 font-semibold truncate"
          style={{ color: promo.textColor }}
        >
          {promo.title || 'Untitled'}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}
        >
          <TypeIcon className="h-3 w-3" />
          {typeInfo.label}
        </span>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5 bg-gray-50/50">
        <div className="flex items-center gap-0.5">
          {/* Move up */}
          <button
            onClick={() => onMove(index, 'up')}
            disabled={index === 0}
            title="Move up"
            className="rounded p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {/* Move down */}
          <button
            onClick={() => onMove(index, 'down')}
            disabled={index === total - 1}
            title="Move down"
            className="rounded p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <GripVertical className="mx-1 h-4 w-4 text-gray-300" />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleActive}
            title={promo.isActive ? 'Deactivate' : 'Activate'}
            className="rounded p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          >
            {promo.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="rounded p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== PromoModal ==================== */

const BG_COLORS = [
  { value: '#FFD400', name: 'Yellow' },
  { value: '#f5b800', name: 'Gold' },
  { value: '#059669', name: 'Green' },
  { value: '#dc2626', name: 'Red' },
  { value: '#0891b2', name: 'Teal' },
  { value: '#1a1520', name: 'Dark' },
  { value: '#db2777', name: 'Pink' },
  { value: '#ea580c', name: 'Orange' },
];

const TEXT_COLORS = [
  { value: '#ffffff', name: 'White' },
  { value: '#1a1520', name: 'Dark' },
];

const EMOJI_OPTIONS = ['✨', '🎉', '🔥', '⭐', '🌿', '🍷', '🎂', '☕', '🍕', '🥗', '🎁', '💫'];

interface PromoModalProps {
  promo: Promotion;
  isNew: boolean;
  onChange: (promo: Promotion) => void;
  onSave: () => void;
  onClose: () => void;
}

function PromoModal({ promo, isNew, onChange, onSave, onClose }: PromoModalProps) {
  const update = (partial: Partial<Promotion>) => {
    onChange({ ...promo, ...partial });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {promo.title ? 'Edit Promotion' : 'New Promotion'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Live preview */}
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4"
            style={{ backgroundColor: promo.bgColor }}
          >
            {promo.emoji && <span className="text-2xl">{promo.emoji}</span>}
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold truncate"
                style={{ color: promo.textColor }}
              >
                {promo.title || 'Promotion Title Preview'}
              </p>
              {promo.description && (
                <p
                  className="mt-0.5 text-sm truncate opacity-90"
                  style={{ color: promo.textColor }}
                >
                  {promo.description}
                </p>
              )}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={promo.type}
              onValueChange={(v) => update({ type: v as Promotion['type'] })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="special">
                  <span className="mr-2">✨</span>Special
                </SelectItem>
                <SelectItem value="event">
                  <span className="mr-2">📅</span>Event
                </SelectItem>
                <SelectItem value="seasonal">
                  <span className="mr-2">🌿</span>Seasonal
                </SelectItem>
                <SelectItem value="custom">
                  <span className="mr-2">⭐</span>Custom
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="promo-title">Title *</Label>
            <Input
              id="promo-title"
              value={promo.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Happy Hour 5-7 PM"
              className="h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="promo-desc">Description</Label>
            <Input
              id="promo-desc"
              value={promo.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="e.g. Enjoy 50% off all cocktails during happy hour!"
              className="h-11"
            />
          </div>

          {/* Emoji picker */}
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => update({ emoji: undefined })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors ${
                  !promo.emoji
                    ? 'border-[#F2B900] bg-[#fff8d8] ring-1 ring-[#FFD400]/40'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                —
              </button>
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => update({ emoji })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-colors ${
                    promo.emoji === emoji
                      ? 'border-[#F2B900] bg-[#fff8d8] ring-1 ring-[#FFD400]/40'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-1.5">
            <Label>Background Color</Label>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => update({ bgColor: c.value })}
                  title={c.name}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    promo.bgColor === c.value
                      ? 'scale-110 border-gray-900 shadow-md'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-1.5">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => update({ textColor: c.value })}
                  title={c.name}
                  className={`flex h-8 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-medium transition-all ${
                    promo.textColor === c.value
                      ? 'border-gray-900 scale-105 shadow-md'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: c.value,
                    color: c.value === '#ffffff' ? '#1a1520' : '#ffffff',
                  }}
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-current"
                    style={{ backgroundColor: c.value }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="ghost" onClick={onClose} className="h-11">
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!promo.title.trim()}
            className="h-11 bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold min-w-[100px]"
          >
            {isNew ? 'Create' : 'Update'}
          </Button>
        </div>
      </div>
    </div>
  );
}
