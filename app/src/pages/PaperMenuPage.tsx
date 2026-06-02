import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  Eye,
  Download,
  Layout,
  Sparkles,
  Lock,
  UtensilsCrossed,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuContext } from '@/contexts/MenuContext';
import type { Menu, Section, Dish } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type TemplateId = 'elegant' | 'minimal' | 'rustic' | 'premium';

interface CanvasElement {
  id: string;
  type: 'heading' | 'dish' | 'subheading' | 'decorator' | 'logo';
  x: number;
  y: number;
  width: number;
  content: string;
  subContent?: string; // for dish description / price
  fontSize?: number;
  fontStyle?: string;
}

interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  isPremium?: boolean;
  bgColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  borderStyle?: string;
}

/* ------------------------------------------------------------------ */
/*  Template definitions                                               */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Template definitions — European fine-dining aesthetic               */
/* ------------------------------------------------------------------ */
const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  elegant: {
    id: 'elegant',
    name: 'Elegant Classic',
    description: 'Timeless French-Italian bistro style',
    bgColor: '#fdfbf7',
    textColor: '#2c2416',
    accentColor: '#8b7355',
    headingFont: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    bodyFont: "'Lato', 'Crimson Text', Georgia, serif",
  },
  minimal: {
    id: 'minimal',
    name: 'Modern Minimal',
    description: 'Clean Scandinavian-inspired design',
    bgColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#333333',
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', 'Helvetica Neue', sans-serif",
  },
  rustic: {
    id: 'rustic',
    name: 'Rustic Charm',
    description: 'Warm Tuscan trattoria warmth',
    bgColor: '#f9f5ed',
    textColor: '#3d3020',
    accentColor: '#a67c52',
    headingFont: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Lato', 'Crimson Text', Georgia, serif",
  },
  premium: {
    id: 'premium',
    name: 'Premium Dark',
    description: 'Luxurious dark theme with gold accents',
    isPremium: true,
    bgColor: '#1a1814',
    textColor: '#f0ebe0',
    accentColor: '#c9a96e',
    headingFont: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    bodyFont: "'Lato', sans-serif",
  },
};

const TEMPLATE_ORDER: TemplateId[] = ['elegant', 'minimal', 'rustic', 'premium'];

/* ------------------------------------------------------------------ */
/*  Draggable element on canvas — European fine-dining style           */
/* ------------------------------------------------------------------ */
function DraggableItem({
  element,
  template,
  isSelected,
  onSelect,
  onUpdate,
  scale,
}: {
  element: CanvasElement;
  template: TemplateConfig;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (el: CanvasElement) => void;
  scale: number;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(element.content);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.inline-edit')) return;
      e.preventDefault();
      e.stopPropagation();
      onSelect();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - element.x * scale,
        y: e.clientY - element.y * scale,
      });
    },
    [element.x, element.y, scale, onSelect]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragOffset.x) / scale;
      const newY = (e.clientY - dragOffset.y) / scale;
      onUpdate({ ...element, x: Math.max(0, newX), y: Math.max(0, newY) });
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragOffset, scale, element, onUpdate]);

  const finishEdit = () => {
    setEditing(false);
    onUpdate({ ...element, content: editText || element.content });
  };

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x * scale,
    top: element.y * scale,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    zIndex: isSelected ? 10 : 1,
  };

  /* ======== HEADING (restaurant name / section title) ======== */
  if (element.type === 'heading') {
    const isRestaurantName = element.id === 'h-restaurant';
    return (
      <div
        style={{
          ...baseStyle,
          fontFamily: template.headingFont,
          color: template.id === 'premium' || template.id === 'minimal'
            ? template.textColor : template.accentColor,
          fontSize: `${(element.fontSize ?? (isRestaurantName ? 42 : 28)) * scale}px`,
          fontWeight: isRestaurantName ? 400 : 600,
          letterSpacing: isRestaurantName ? '0.06em' : '0.03em',
          textTransform: isRestaurantName ? 'uppercase' : 'none',
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onDoubleClick={() => { setEditText(element.content); setEditing(true); }}
      >
        {isSelected && editing ? (
          <input
            className="inline-edit bg-white/90 border border-gray-300 rounded px-2 py-0.5 outline-none"
            style={{ color: template.textColor, fontFamily: template.headingFont }}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={finishEdit}
            onKeyDown={(e) => e.key === 'Enter' && finishEdit()}
            autoFocus
          />
        ) : (
          element.content
        )}
        {isSelected && !editing && (
          <GripVertical className="absolute left-[-22px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        )}
      </div>
    );
  }

  /* ======== SUBHEADING (section subtitle like "STARTERS") ======== */
  if (element.type === 'subheading') {
    return (
      <div
        style={{
          ...baseStyle,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          color: template.accentColor,
          fontSize: `${(element.fontSize ?? 11) * scale}px`,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onDoubleClick={() => { setEditText(element.content); setEditing(true); }}
      >
        {isSelected && editing ? (
          <input
            className="inline-edit bg-white/90 border rounded px-1 outline-none"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={finishEdit}
            onKeyDown={(e) => e.key === 'Enter' && finishEdit()}
            autoFocus
            style={{ color: template.accentColor, fontFamily: "'Inter', sans-serif", fontSize: '11px' }}
          />
        ) : (
          element.content
        )}
      </div>
    );
  }

  /* ======== DISH ROW — classic European menu style ======== */
  if (element.type === 'dish') {
    // Extract price from subContent
    const priceMatch = element.subContent?.match(/€[\d,.]+|EUR\s*[\(]?€?[)\s]*[\d,.]+|[\d,.]+\s*€/);
    const priceText = priceMatch?.[0]
      ?.replace(/EUR\s*\(?€?\)?/, '€')
      ?.replace(/^€\s*/, '') || '';
    // Description is everything before | or before price
    let descText = element.subContent || '';
    if (priceMatch) descText = descText.replace(priceMatch[0], '').replace(/[|\s]+$/, '').trim();

    return (
      <div
        style={{
          ...baseStyle,
          width: `${440 * scale}px`,
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {/* Row 1: Name + dotted leader + Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: `${8 * scale}px`,
          }}
        >
          {/* Dish name */}
          <span
            style={{
              fontFamily: template.bodyFont,
              color: template.textColor,
              fontWeight: 500,
              fontSize: `${14 * scale}px`,
              letterSpacing: '0.01em',
              flexShrink: 0,
            }}
          >
            {element.content}
          </span>

          {/* Dotted leader line */}
          <div
            style={{
              flex: 1,
              borderBottom: `1px dotted ${template.accentColor}35`,
              minHeight: `${6 * scale}px`,
              marginBottom: `${2 * scale}px`,
            }}
          />

          {/* Price */}
          <span
            style={{
              fontFamily: template.headingFont,
              color: template.textColor,
              fontWeight: 600,
              fontSize: `${14 * scale}px`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            {priceText ? `€${priceText}` : ''}
          </span>
        </div>

        {/* Row 2: Description (if exists) */}
        {descText && (
          <div
            style={{
              paddingLeft: 0,
              paddingTop: `${3 * scale}px`,
            }}
          >
            <span
              style={{
                fontFamily: template.bodyFont,
                color: template.accentColor,
                opacity: 0.65,
                fontSize: `${12 * scale}px`,
                fontStyle: 'italic',
                lineHeight: 1.4,
                letterSpacing: '0.01em',
              }}
            >
              {descText.length > 90 ? descText.slice(0, 90) + '...' : descText}
            </span>
          </div>
        )}
      </div>
    );
  }

  /* ======== DECORATOR (divider ornament) ======== */
  if (element.type === 'decorator') {
    return (
      <div
        style={{
          ...baseStyle,
          fontFamily: template.headingFont,
          color: template.accentColor,
          fontSize: `${(element.fontSize ?? 13) * scale}px`,
          textAlign: 'center',
          letterSpacing: '0.25em',
          opacity: 0.55,
          width: '100%',
          left: 0,
        }}
      >
        {element.content}
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Template Renderer                                                  */
/* ------------------------------------------------------------------ */
function TemplateRenderer({
  templateId,
  elements,
  restaurantName,
  menuTitle,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  scale,
  containerRef,
}: {
  templateId: TemplateId;
  elements: CanvasElement[];
  restaurantName: string;
  menuTitle: string;
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (el: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  scale: number;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const tpl = TEMPLATES[templateId];
  const pageW = 595;
  const pageH = 842;

  /* Click empty space to deselect */
  const handleClickEmpty = () => onSelectElement(null);

  /* Keyboard delete */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !['INPUT','TEXTAREA'].includes((document.activeElement?.tagName||''))) {
        e.preventDefault();
        onDeleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, onDeleteElement]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto"
      style={{
        width: pageW * scale,
        height: pageH * scale,
        background: tpl.bgColor,
        borderRadius: templateId === 'elegant' || templateId === 'rustic' ? 2 : 0,
        overflow: 'hidden',
        cursor: 'default',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 40px rgba(0,0,0,0.06)',
      }}
      onClick={handleClickEmpty}
    >
      {/* Elegant inner frame border */}
      {(templateId === 'elegant' || templateId === 'rustic') && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: `${16 * scale}px`,
            border: `1px solid ${templateId === 'rustic' ? '#d4c4a8' : '#e0d8c8'}30`,
            borderRadius: 1,
          }}
        />
      )}

      {/* Elegant corner ornaments */}
      {templateId === 'elegant' && (
        <>
          <svg className="absolute pointer-events-none" style={{ top: 22*scale, left: 22*scale }} width={36*scale} height={36*scale} viewBox="0 0 36 36">
            <path d="M3 33 L3 5 Q3 3 5 3 L33 3" fill="none" stroke={tpl.accentColor} strokeWidth="0.8" opacity="0.25"/>
            <circle cx="18" cy="18" r="2" fill="none" stroke={tpl.accentColor} strokeWidth="0.6" opacity="0.2"/>
            <line x1="10" y1="18" x2="26" y2="18" stroke={tpl.accentColor} strokeWidth="0.4" opacity="0.15"/>
            <line x1="18" y1="10" x2="18" y2="26" stroke={tpl.accentColor} strokeWidth="0.4" opacity="0.15"/>
          </svg>
          <svg className="absolute pointer-events-none" style={{ bottom: 22*scale, right: 22*scale }} width={36*scale} height={36*scale} viewBox="0 0 36 36">
            <path d="M33 3 L33 31 Q33 33 31 33 L3 33" fill="none" stroke={tpl.accentColor} strokeWidth="0.8" opacity="0.25"/>
            <circle cx="18" cy="18" r="2" fill="none" stroke={tpl.accentColor} strokeWidth="0.6" opacity="0.2"/>
            <line x1="10" y1="18" x2="26" y2="18" stroke={tpl.accentColor} strokeWidth="0.4" opacity="0.15"/>
            <line x1="18" y1="10" x2="18" y2="26" stroke={tpl.accentColor} strokeWidth="0.4" opacity="0.15"/>
          </svg>
        </>
      )}

      {/* Premium gold frame */}
      {templateId === 'premium' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ border: `1px solid ${tpl.accentColor}20` }}
          />
          <div
            className="absolute pointer-events-none"
            style={{ inset: `${12 * scale}px`, border: `0.5px solid ${tpl.accentColor}10` }}
          />
        </>
      )}

      {/* Render all draggable elements */}
      {elements.map((el) => (
        <DraggableItem
          key={el.id}
          element={el}
          template={tpl}
          isSelected={selectedId === el.id}
          onSelect={() => onSelectElement(el.id)}
          onUpdate={onUpdateElement}
          scale={scale}
        />
      ))}

      {/* Selection indicator — subtle ring */}
      {selectedId && elements.find(e => e.id === selectedId) && (() => {
        const el = elements.find(e => e.id === selectedId)!;
        return (
          <div
            className="absolute pointer-events-none rounded-sm"
            style={{
              left: (el.x - 3) * scale,
              top: (el.y - 3) * scale,
              width: el.type === 'dish' ? (el.width || 440) * scale + 6 * scale : (el.width || 200) * scale + 6 * scale,
              height: el.type === 'dish' ? (el.subContent && el.subContent.split('|')[0].trim() ? 44 : 30) * scale : 36 * scale,
              border: `1.5px solid ${templateId === 'premium' ? '#c9a96e' : '#5544e4'}50`,
              boxShadow: `0 0 0 3px ${templateId === 'premium' ? '#c9a96e' : '#5544e4'}10`,
            }}
          />
        );
      })()}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function PaperMenuPage() {
  const navigate = useNavigate();
  const { menus } = useMenuContext();
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('elegant');
  const [pages, setPages] = useState<CanvasElement[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSidebarSection, setShowSidebarSection] = useState<'items' | 'headings'>('items');
  const [restaurantOverride, setRestaurantOverride] = useState('');
  const [editingHeadingId, setEditingHeadingId] = useState<string | null>(null);
  const [editingHeadingText, setEditingHeadingText] = useState('');
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editingDishText, setEditingDishText] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);

  /* A4 page dimensions */
  const PAGE_W = 595;
  const PAGE_H = 842;
  const PAGE_BOTTOM_LIMIT = 800; // safe bottom margin for content
  const ZOOM_MIN = 0.3;
  const ZOOM_MAX = 1.8;
  const ZOOM_STEP = 0.1;

  // Helper: get current page elements (or empty array)
  const elements = pages[currentPage] || [];
  const totalPages = pages.length;
  // Helper: flatten all page elements for cross-page searches
  const allElements = pages.flat();

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  /* Generate paginated layout when menu or template changes — European style spacing */
  const generateLayout = useCallback(() => {
    const menu = menus.find(m => m.id === selectedMenuId);
    if (!menu) return;

    const allPages: CanvasElement[][] = [];
    let currentPageElements: CanvasElement[] = [];
    let y = 56; // top margin for current page

    /* Helper: flush current page and start a new one */
    const startNewPage = (pageIndex: number) => {
      if (currentPageElements.length > 0) {
        allPages.push(currentPageElements);
      }
      currentPageElements = [];
      y = 56;
      // Restaurant name on new page
      currentPageElements.push({
        id: `h-restaurant-p${pageIndex}`,
        type: 'heading',
        x: 78,
        y,
        width: 440,
        content: restaurantOverride || menu.restaurantInfo?.name || menu.title,
        fontSize: 42,
      });
      y += 62;
      // Decorative divider
      currentPageElements.push({
        id: `dec-top-p${pageIndex}`,
        type: 'decorator',
        x: 200,
        y,
        width: 195,
        content: '\u2726   \u2014   \u2726',
        fontSize: 11,
      });
      y += 40;
    };

    // First page header
    currentPageElements.push({
      id: 'h-restaurant-p0',
      type: 'heading',
      x: 78,
      y,
      width: 440,
      content: restaurantOverride || menu.restaurantInfo?.name || menu.title,
      fontSize: 42,
    });
    y += 62;

    currentPageElements.push({
      id: 'dec-top-p0',
      type: 'decorator',
      x: 200,
      y,
      width: 195,
      content: '\u2726   \u2014   \u2726',
      fontSize: 11,
    });
    y += 40;

    let pageIndex = 0;

    /* Sections & dishes — auto paginate */
    menu.sections.forEach((sec, si) => {
      const visibleDishes = sec.dishes.filter(d => d.isVisible);
      if (!visibleDishes.length) return;

      // Spacing before section (more for first section)
      if (si > 0 || pageIndex > 0) y += 24;

      // Check if section heading fits on current page
      const headingHeight = 32 + 22; // heading + subheading
      if (y + headingHeight > PAGE_BOTTOM_LIMIT && currentPageElements.length > 3) {
        pageIndex++;
        startNewPage(pageIndex);
        y += 16; // small gap after new page header before first section
      }

      // Section heading — centered
      currentPageElements.push({
        id: `s-${sec.id}-${si}-p${pageIndex}`,
        type: 'heading',
        x: 100,
        y,
        width: 396,
        content: sec.name,
        fontSize: 26,
      });
      y += 32;

      // Subtitle in small caps
      currentPageElements.push({
        id: `sub-${sec.id}-${si}-p${pageIndex}`,
        type: 'subheading',
        x: 220,
        y,
        width: 156,
        content: sec.name.toUpperCase(),
        fontSize: 10,
      });
      y += 22;

      // Dishes with proper European spacing — auto page break
      visibleDishes.forEach((dish, di) => {
        const dishHeight = dish.description ? 42 : 34;
        if (y + dishHeight > PAGE_BOTTOM_LIMIT) {
          pageIndex++;
          startNewPage(pageIndex);
          y += 8; // small gap after new page header
        }
        currentPageElements.push({
          id: `d-${dish.id}-${si}-${di}-p${pageIndex}`,
          type: 'dish',
          x: 77,
          y,
          width: 441,
          content: dish.name,
          subContent: dish.description
            ? `${dish.description} | €${dish.price.toFixed(2)}`
            : `€${dish.price.toFixed(2)}`,
          fontSize: 14,
        });
        y += dishHeight;
      });
    });

    // Push the last page
    if (currentPageElements.length > 0) {
      allPages.push(currentPageElements);
    }

    setPages(allPages);
    setCurrentPage(0);
    setSelectedElementId(null);
  }, [selectedMenuId, menus, restaurantOverride]);

  useEffect(() => {
    generateLayout();
  }, [generateLayout, selectedTemplate]);

  /* Handlers — operate on current page */
  const updateElement = useCallback(
    (updated: CanvasElement) =>
      setPages(prev => prev.map((pageEls, idx) =>
        idx === currentPage ? pageEls.map(el => (el.id === updated.id ? updated : el)) : pageEls
      )),
    [currentPage]
  );

  const deleteElement = useCallback((id: string) => {
    setPages(prev => prev.map((pageEls, idx) =>
      idx === currentPage ? pageEls.filter(el => el.id !== id) : pageEls
    ));
    setSelectedElementId(null);
  }, [currentPage]);

  const addDishToCanvas = (section: Section, dish: Dish) => {
    const newId = `d-${dish.id}-manual-${Date.now()}`;
    const lastY = elements.length > 0 ? Math.max(...elements.map(e => e.y)) : 100;
    // Check if it fits on current page, if not add to current anyway but warn via position
    setPages(prev => prev.map((pageEls, idx) =>
      idx === currentPage ? [
        ...pageEls,
        {
          id: newId,
          type: 'dish',
          x: 95,
          y: lastY + 30,
          width: 410,
          content: dish.name,
          subContent: dish.description
            ? `${dish.description.slice(0, 50)} | €${dish.price.toFixed(2)}`
            : `€${dish.price.toFixed(2)}`,
          fontSize: 13,
        },
      ] : pageEls
    ));
  };

  const addCustomHeading = () => {
    const newId = `h-custom-${Date.now()}`;
    const lastY = elements.length > 0 ? Math.max(...elements.map(e => e.y)) : 100;
    setPages(prev => prev.map((pageEls, idx) =>
      idx === currentPage ? [
        ...pageEls,
        {
          id: newId,
          type: 'heading',
          x: 100,
          y: lastY + 40,
          width: 300,
          content: 'New Heading',
          fontSize: 24,
        },
      ] : pageEls
    ));
  };

  /* Print handler — multi-page */
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const tpl = TEMPLATES[selectedTemplate];

    let html = `
<!DOCTYPE html><html><head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<title>Print Menu</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    width: 210mm; height: 297mm; margin: 0 auto ${totalPages > 1 ? '10px' : '0'};
    background:${tpl.bgColor};
    color: ${tpl.textColor};
    position: relative;
    overflow: hidden;
    padding: 22mm 24mm 20mm;
    font-family: ${tpl.bodyFont};
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }
  .heading { font-family: ${tpl.headingFont}; font-weight: ${selectedTemplate === 'elegant' ? '400' : '600'}; letter-spacing: ${selectedTemplate === 'minimal' ? '0.01em' : '0.03em'}; }
  .heading.restaurant { font-size: 36px; text-transform:uppercase; letter-spacing:0.06em; color: ${selectedTemplate === 'premium' || selectedTemplate === 'minimal' ? tpl.textColor : tpl.accentColor}; margin-bottom:8px; }
  .heading.section { font-size: 24px; color: ${selectedTemplate === 'premium' || selectedTemplate === 'minimal' ? tpl.textColor : tpl.accentColor}; margin-top:28px; margin-bottom:4px; }
  .subheading { font-family:'Inter',sans-serif; font-size:10px; letter-spacing:.18em; color:${tpl.accentColor}; opacity:0.65; text-transform:uppercase; text-align:center; margin-bottom:16px; display:block; }

  /* European-style dish row */
  .dish-row { margin-bottom:14px; page-break-inside:avoid; }
  .dish-name-line { display:flex; align-items:baseline; gap:8px; }
  .dish-name { font-weight:500; font-size:14px; font-family:${tpl.bodyFont}; letter-spacing:0.01em; flex-shrink:0; }
  .dish-dots { flex:1; border-bottom:1px dotted ${tpl.accentColor}30; min-height:6px; margin-bottom:2px; }
  .price { font-weight:600; font-size:14px; font-family:${tpl.headingFont}; white-space:nowrap; flex-shrink:0; letter-spacing:0.02em; }
  .dish-desc { font-family:${tpl.bodyFont}; color:${tpl.accentColor}; opacity:0.6; font-size:12px; font-style:italic; line-height:1.45; margin-top:3px; letter-spacing:0.01em; }
  .decorator { text-align:center; color:${tpl.accentColor}; font-family:${tpl.headingFont}; font-size:11px; letter-spacing:.25em; opacity:0.45; margin:10px 0; }

  @media print {
    body { background:white; }
    .page { box-shadow:none !important; margin: 0 auto; }
  }
</style></head><body>`;

    // Render each page
    for (let pi = 0; pi < pages.length; pi++) {
      const pageEls = pages[pi];
      html += `<div class="page">`;
      for (const el of pageEls) {
        if (el.type === 'heading') {
          const isRest = el.id.includes('h-restaurant');
          html += `<div class="heading ${isRest ? 'restaurant' : 'section'}">${el.content}</div>`;
        } else if (el.type === 'subheading') {
          html += `<span class="subheading">${el.content}</span>`;
        } else if (el.type === 'dish') {
          const priceMatch = el.subContent?.match(/€[\d,.]+|EUR\s*[\(]?€?[)\s]*[\d,.]+|[\d,.]+\s*€/);
          const priceText = priceMatch?.[0]?.replace(/EUR\s*\(?€?\)?/, '').replace(/^€\s*/, '') || '';
          let descText = (el.subContent || '').replace(priceMatch ? priceMatch[0] : '', '').replace(/[|\s]+$/, '').trim();
          html += `<div class="dish-row">`;
          html += `<div class="dish-name-line"><span class="dish-name">${el.content}</span><div class="dish-dots"></div><span class="price">${priceText ? '€' + priceText : ''}</span></div>`;
          if (descText) html += `<div class="dish-desc">${descText.length > 100 ? descText.slice(0,100) + '...' : descText}</div>`;
          html += `</div>`;
        } else if (el.type === 'decorator') {
          html += `<div class="decorator">${el.content}</div>`;
        }
      }
      html += `</div>`;
    }

    html += '</body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  /* Auto-select first menu if none selected */
  useEffect(() => {
    if (!selectedMenuId && menus.length > 0) {
      setSelectedMenuId(menus[0].id);
    }
  }, [menus, selectedMenuId]);

  /* Load Google Fonts for beautiful typography */
  useEffect(() => {
    const fontId = 'paper-menu-fonts';
    if (document.getElementById(fontId)) return;
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          {/* Menu selector */}
          <select
            value={selectedMenuId}
            onChange={(e) => setSelectedMenuId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-[#5544e4]/20 focus:border-[#5544e4]"
          >
            <option value="">Select a menu...</option>
            {menus.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>

          {/* Restaurant name override */}
          {selectedMenu && (
            <input
              value={restaurantOverride}
              onChange={(e) => setRestaurantOverride(e.target.value)}
              placeholder={`Restaurant name (${selectedMenu.restaurantInfo?.name || selectedMenu.title})`}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-[#5544e4]/20"
            />
          )}

          <Button variant="ghost" size="sm" onClick={generateLayout} className="text-gray-600">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Regenerate
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Template picker */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplatePicker(!showTemplatePicker)}
              className="border-gray-200 text-sm font-medium"
            >
              <Layout className="h-3.5 w-3.5 mr-1.5" />
              {TEMPLATES[selectedTemplate].name}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>

            {showTemplatePicker && (
              <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                <p className="px-2 pb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Templates</p>
                {TEMPLATE_ORDER.map(tid => {
                  const t = TEMPLATES[tid];
                  return (
                    <button
                      key={tid}
                      onClick={() => { setSelectedTemplate(tid); setShowTemplatePicker(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        tid === selectedTemplate ? 'bg-[#5544e4]/8 ring-1 ring-[#5544e4]/20' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Mini preview swatch */}
                      <div
                        className="w-9 h-9 rounded-md border border-gray-200 shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: t.bgColor }}
                      >
                        <FileText className="h-3.5 w-3.5" style={{ color: t.accentColor }} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                        <div className="text-[11px] text-gray-400">{t.description}</div>
                      </div>
                      {t.isPremium && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
                      {tid === selectedTemplate && <Eye className="h-3.5 w-3.5 text-[#5544e4] shrink-0" />}
                    </button>
                  );
                })}
                <div className="mt-1.5 pt-1.5 border-t border-gray-100 px-2">
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> More templates coming soon
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handlePrint} className="border-gray-200 text-sm">
            <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
          </Button>
        </div>
      </div>

      {/* ===== MAIN CONTENT: sidebar + canvas ===== */}
      {!selectedMenu ? (
        /* Empty state — no menu selected */
        <div className="flex-1 flex items-center justify-center bg-[#fafbfc]">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[#5544e4]/8 flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-[#5544e4]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Design your Paper Menu</h2>
            <p className="text-sm text-gray-500 mb-6">
              Select an existing menu above to import it into our beautiful templates.
              Customize every detail with drag-and-drop editing.
            </p>
            {menus.length === 0 && (
              <Button onClick={() => navigate('/app')}>
                Create a menu first
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* LEFT SIDEBAR — Food Items + Headings */}
          <aside className="w-[280px] shrink-0 border-r bg-white overflow-y-auto flex flex-col">
            {/* Sidebar tabs */}
            <div className="flex border-b shrink-0">
              <button
                onClick={() => setShowSidebarSection('items')}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  showSidebarSection === 'items'
                    ? 'text-[#5544e4] border-b-2 border-[#5544e4]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Food Items
              </button>
              <button
                onClick={() => setShowSidebarSection('headings')}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  showSidebarSection === 'headings'
                    ? 'text-[#5544e4] border-b-2 border-[#5544e4]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Headings
              </button>
            </div>

            {showSidebarSection === 'items' ? (
              /* Food Items list — inline editable */
              <div className="flex-1 p-3 space-y-2">
                <div className="mb-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                    Click to edit, changes sync to preview
                  </p>
                </div>

                {selectedMenu.sections.map(sec => (
                  <div key={sec.id}>
                    {/* Section name — inline editable */}
                    {editingHeadingId === `sec-${sec.id}` ? (
                      <div className="flex items-center gap-1.5 px-1 pt-2 pb-1 bg-[#5544e4]/5 rounded-md ring-1 ring-[#5544e4]/20 -mx-1 px-2">
                        <Pencil className="h-3 w-3 text-emerald-500 shrink-0" />
                        <input
                          autoFocus
                          value={editingHeadingText}
                          onChange={(e) => setEditingHeadingText(e.target.value)}
                          onBlur={() => {
                            // Sync heading + subheading canvas elements across all pages
                            setPages(prev => prev.map(page => page.map(el =>
                              (el.id.startsWith(`s-${sec.id}`) || el.id.startsWith(`sub-${sec.id}`))
                                ? { ...el, content: el.id.startsWith('sub-') ? editingHeadingText.toUpperCase() : editingHeadingText }
                                : el
                            )));
                            setEditingHeadingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') setEditingHeadingId(null);
                          }}
                          className="flex-1 text-xs font-semibold text-gray-900 bg-transparent outline-none min-w-0"
                        />
                      </div>
                    ) : (
                      <div
                        className="group flex items-center gap-1.5 px-1 pt-2 pb-1 cursor-text hover:bg-gray-50 rounded-md -mx-1 px-2"
                        onClick={() => {
                          const targetEl = allElements.find(e => e.id.startsWith(`s-${sec.id}`));
                          setEditingHeadingId(`sec-${sec.id}`);
                          setEditingHeadingText(targetEl?.content || sec.name);
                        }}
                      >
                        <Pencil className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-gray-700 truncate flex-1">{sec.name}</span>
                        <span className="text-[10px] text-gray-400">{sec.dishes.length}</span>
                      </div>
                    )}

                    {/* Dishes — inline editable */}
                    {sec.dishes.filter(d => d.isVisible).map(dish => {
                      const isEditingThis = editingDishId === dish.id;
                      return isEditingThis ? (
                        <div
                          key={dish.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#5544e4]/5 rounded-md ring-1 ring-[#5544e4]/20 mx-0 my-0.5"
                        >
                          <GripVertical className="h-3 w-3 text-gray-300 shrink-0" />
                          <input
                            autoFocus
                            value={editingDishText}
                            onChange={(e) => setEditingDishText(e.target.value)}
                            onBlur={() => {
                              // Find all canvas dish elements matching this dish across all pages
                              setPages(prev => prev.map(page => page.map(el =>
                                el.id.includes(`-${dish.id}-`) ? { ...el, content: editingDishText } : el
                              )));
                              setEditingDishId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                              if (e.key === 'Escape') setEditingDishId(null);
                            }}
                            className="flex-1 text-sm text-gray-900 bg-transparent outline-none min-w-0"
                          />
                        </div>
                      ) : (
                        <div
                          key={dish.id}
                          className="group flex items-center gap-2 px-3 py-2 cursor-text hover:bg-[#5544e4]/4 rounded-md transition-colors"
                          onClick={() => {
                            // Find existing canvas element for this dish (across all pages)
                            const targetEl = allElements.find(el => el.id.includes(`-${dish.id}-`));
                            setEditingDishId(dish.id);
                            setEditingDishText(targetEl?.content || dish.name);
                            // Also select on canvas for visual feedback
                            if (targetEl) setSelectedElementId(targetEl.id);
                          }}
                        >
                          <GripVertical className="h-3 w-3 text-gray-300 group-hover:text-[#5544e4] shrink-0" />
                          <span className="truncate text-sm text-gray-600 flex-1">
                            {allElements.find(el => el.id.includes(`-${dish.id}-`))?.content || dish.name}
                          </span>
                          <span className="text-[10px] text-gray-300 group-hover:text-[#5544e4] opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                        </div>
                      );
                    })}
                  </div>
                ))}

                <button
                  onClick={addCustomHeading}
                  className="mt-4 w-full flex items-center gap-2 px-3 py-2 text-sm text-[#5544e4] border border-dashed border-[#5544e4]/30 rounded-lg hover:bg-[#5544e4]/4 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Custom Item
                </button>
              </div>
            ) : (
              /* Headings list — inline editable */
              <div className="flex-1 p-3 space-y-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                  Edit or delete headings
                </p>

                {/* Restaurant name — inline editable */}
                {editingHeadingId === 'h-restaurant' ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-[#5544e4]/5 rounded-md ring-1 ring-[#5544e4]/20">
                    <Pencil className="h-3 w-3 text-[#5544e4] shrink-0" />
                    <input
                      autoFocus
                      value={editingHeadingText}
                      onChange={(e) => setEditingHeadingText(e.target.value)}
                      onBlur={() => {
                        setRestaurantOverride(editingHeadingText);
                        const newText = editingHeadingText;
                        setPages((prev) =>
                          prev.map((page) =>
                            page.map((el) =>
                              (el.id === 'h-restaurant' || el.id.startsWith('h-restaurant-p'))
                                ? { ...el, content: newText }
                                : el
                            )
                          )
                        );
                        setEditingHeadingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') setEditingHeadingId(null);
                      }}
                      className="flex-1 text-sm text-gray-900 bg-transparent outline-none min-w-0"
                    />
                  </div>
                ) : (
                  <div
                    className="group flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-text"
                    onClick={() => {
                      setEditingHeadingId('h-restaurant');
                      setEditingHeadingText(restaurantOverride || selectedMenu.restaurantInfo?.name || selectedMenu.title || '');
                    }}
                  >
                    <Pencil className="h-3 w-3 text-[#5544e4] shrink-0" />
                    <span className="text-sm text-gray-700 truncate flex-1">{restaurantOverride || selectedMenu.restaurantInfo?.name || selectedMenu.title}</span>
                    <span className="ml-auto text-[10px] text-gray-300 group-hover:text-[#5544e4] opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                  </div>
                )}

                {/* Section headings — inline editable */}
                {selectedMenu.sections.filter(s => s.dishes.some(d => d.isVisible)).map((sec, i) => {
                  const headingElId = `s-${sec.id}-${i}`;
                  const isEditingThis = editingHeadingId === headingElId;
                  return isEditingThis ? (
                    <div key={sec.id} className="flex items-center gap-2 px-2 py-1.5 bg-[#5544e4]/5 rounded-md ring-1 ring-[#5544e4]/20">
                      <Pencil className="h-3 w-3 text-[#5544e4] shrink-0" />
                      <input
                        autoFocus
                        value={editingHeadingText}
                        onChange={(e) => setEditingHeadingText(e.target.value)}
                        onBlur={() => {
                          setPages(prev => prev.map(page => page.map(el =>
                            el.id.startsWith(`s-${sec.id}`) || el.id.startsWith(`sub-${sec.id}`)
                              ? { ...el, content: el.id.startsWith('sub-') ? editingHeadingText.toUpperCase() : editingHeadingText }
                              : el
                          )));
                          setEditingHeadingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setEditingHeadingId(null);
                        }}
                        className="flex-1 text-sm text-gray-900 bg-transparent outline-none min-w-0"
                      />
                    </div>
                  ) : (
                    <div
                      key={sec.id}
                      className="group flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-text"
                      onClick={() => {
                        const targetEl = allElements.find(e => e.id.startsWith(`s-${sec.id}`));
                        if (targetEl) setSelectedElementId(targetEl.id);
                        setEditingHeadingId(headingElId);
                        setEditingHeadingText(targetEl?.content || sec.name);
                      }}
                    >
                      <Pencil className="h-3 w-3 text-[#5544e4] shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">{sec.name}</span>
                      <span className="ml-auto text-[10px] text-gray-300 group-hover:text-[#5544e4] opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                    </div>
                  );
                })}

                {/* Custom headings added by user — also editable */}
                {allElements.filter(e => e.type === 'heading' && e.id.startsWith('h-custom')).map(el => (
                  editingHeadingId === el.id ? (
                    <div key={el.id} className="flex items-center gap-2 px-2 py-1.5 bg-[#5544e4]/5 rounded-md ring-1 ring-[#5544e4]/20">
                      <Pencil className="h-3 w-3 text-[#5544e4] shrink-0" />
                      <input
                        autoFocus
                        value={editingHeadingText}
                        onChange={(e) => setEditingHeadingText(e.target.value)}
                        onBlur={() => {
                          setPages(prev => prev.map(page => page.map(e =>
                            e.id === el.id ? { ...e, content: editingHeadingText } : e
                          )));
                          setEditingHeadingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setEditingHeadingId(null);
                        }}
                        className="flex-1 text-sm text-gray-900 bg-transparent outline-none min-w-0"
                      />
                      <button
                        onClick={() => deleteElement(el.id)}
                        className="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      key={el.id}
                      className="group flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-text"
                      onClick={() => {
                        setEditingHeadingId(el.id);
                        setEditingHeadingText(el.content);
                        setSelectedElementId(el.id);
                      }}
                    >
                      <Pencil className="h-3 w-3 text-[#5544e4] shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">{el.content}</span>
                      <button
                        onClick={(ev) => { ev.stopPropagation(); deleteElement(el.id); }}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )
                ))}

                <div className="pt-2 border-t mt-2">
                  <button
                    onClick={addCustomHeading}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-[#5544e4] transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add heading...
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* RIGHT CANVAS AREA — multi-page with zoom */}
          <main className="flex-1 overflow-auto bg-[#f0f1f3] p-6 md:p-8 flex-col items-center relative">
            <div className="flex flex-wrap justify-center gap-6 pb-20">
              {pages.map((pageEls, pageIndex) => (
                <div key={`page-${pageIndex}`} className="relative">
                  {/* Page label */}
                  {totalPages > 1 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <span className="text-[11px] font-medium text-gray-400 bg-white/80 px-2.5 py-0.5 rounded-full border border-gray-100 shadow-sm">
                        Page {pageIndex + 1} of {totalPages}
                      </span>
                      {pageIndex === currentPage && (
                        <span className="text-[10px] text-[#5544e4] font-semibold bg-[#5544e4]/8 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                  )}
                  <TemplateRenderer
                    templateId={selectedTemplate}
                    elements={pageEls}
                    restaurantName={restaurantOverride || selectedMenu?.restaurantInfo?.name || selectedMenu?.title || ''}
                    menuTitle={selectedMenu?.title || ''}
                    selectedId={pageIndex === currentPage ? selectedElementId : null}
                    onSelectElement={(id) => {
                      setCurrentPage(pageIndex);
                      setSelectedElementId(id);
                    }}
                    onUpdateElement={updateElement}
                    onDeleteElement={deleteElement}
                    scale={scale}
                    containerRef={pageIndex === currentPage ? canvasRef : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Floating toolbar when element selected */}
            {selectedElementId && (
              <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full shadow-lg border px-2 py-1 z-50">
                <span className="text-xs text-gray-500 px-2">
                  {(() => {
                    const el = allElements.find(e => e.id === selectedElementId);
                    return el ? el.type.charAt(0).toUpperCase() + el.type.slice(1) : '';
                  })()} selected
                </span>
                <div className="w-px h-4 bg-gray-200" />
                <button
                  onClick={() => deleteElement(selectedElementId!)}
                  className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <span className="text-[10px] text-gray-400 px-1">Double-click to edit text</span>
              </div>
            )}

            {/* ===== ZOOM CONTROLS + PAGE NAV — fixed bottom-right ===== */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-40">

              {/* Page navigator (when multi-page) */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-md border border-gray-100 px-2.5 py-1.5">
                  <button
                    disabled={currentPage <= 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-gray-600" />
                  </button>

                  <div className="flex items-center gap-1 min-w-[90px] justify-center">
                    {pages.map((_, pi) => (
                      <button
                        key={pi}
                        onClick={() => setCurrentPage(pi)}
                        className={`w-6 h-6 rounded-full text-[10px] font-semibold transition-all ${
                          pi === currentPage
                            ? 'bg-[#5544e4] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={`Go to page ${pi + 1}`}
                      >
                        {pi + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
              )}

              {/* Zoom controls */}
              <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-md border border-gray-100 px-2.5 py-1.5">
                <button
                  disabled={scale <= ZOOM_MIN}
                  onClick={() => setScale(s => Math.max(ZOOM_MIN, +(s - ZOOM_STEP).toFixed(2)))}
                  className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
                </button>

                <div className="min-w-[46px] text-center">
                  <span className="text-xs font-semibold text-gray-700 tabular-nums">{Math.round(scale * 100)}%</span>
                </div>

                <button
                  disabled={scale >= ZOOM_MAX}
                  onClick={() => setScale(s => Math.min(ZOOM_MAX, +(s + ZOOM_STEP).toFixed(2)))}
                  className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>

              <span className="text-[10px] text-gray-400 pr-1">{totalPages} page{totalPages > 1 ? 's' : ''}</span>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
