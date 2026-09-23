
import {
  AppWindow,
  Bookmark,
  Home as HomeIcon,
  type LucideIcon,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import {
  getAgidAppSurfaces,
  getAppSurfaceCopy,
  getAppSurfaceStatusLabel,
  getSideMenuPrimaryAppSurfaces,
  isAppSurfaceActive,
  type AppSurfaceDefinition,
} from '../lib/appNavigation';
import { cn } from '../lib/utils';

interface SideMenuProps {
  show: boolean;
  onClose: () => void;
  setSavedTab: (tab: SavedTab) => void;
  setShowSaved: (show: boolean) => void;
  setAoidModeForced: (forced: boolean) => void;
  setShowAddressRegistration: (show: boolean) => void;
  appLanguage: string;
}

type SavedTab = 'agid' | 'aoid';
type MenuActionTone = 'add' | 'agid' | 'aoid';

type MenuActionButtonProps = {
  ariaLabel: string;
  description: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  status?: string;
  title: string;
  tone: MenuActionTone;
};

type AppSurfaceMenuButtonProps = {
  appLanguage: string;
  onSelect: (surface: AppSurfaceDefinition) => void;
  surface: AppSurfaceDefinition;
};

const SURFACE_ICONS: Record<string, LucideIcon> = {
  map: HomeIcon,
};

const MENU_ACTION_STYLES: Record<
  MenuActionTone,
  {
    button: string;
    description: string;
    icon: string;
    label: string;
    status: string;
  }
> = {
  add: {
    button: 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-500',
    description: 'text-emerald-50',
    icon: 'border-white/30 bg-white/15',
    label: '',
    status: '',
  },
  agid: {
    button: 'border-blue-200 bg-blue-50 hover:border-blue-300',
    description: 'text-slate-500',
    icon: 'border-blue-200 bg-blue-100 text-blue-700',
    label: 'text-slate-900',
    status: 'bg-blue-100 text-blue-700',
  },
  aoid: {
    button: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300',
    description: 'text-slate-500',
    icon: 'border-emerald-200 bg-emerald-100 text-emerald-700',
    label: 'text-slate-900',
    status: 'bg-emerald-100 text-emerald-700',
  },
};

function MenuActionButton({
  ariaLabel,
  description,
  icon: Icon,
  label,
  onClick,
  status,
  title,
  tone,
}: MenuActionButtonProps) {
  const styles = MENU_ACTION_STYLES[tone];

  return (
    <motion.button
      whileHover={{ y: -1 }}
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left shadow-sm transition-all',
        styles.button,
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
          styles.icon,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[13px] font-black', styles.label)}>
          {label}
        </span>
        <span className={cn('mt-0.5 block truncate text-[10px] font-semibold', styles.description)}>
          {description}
        </span>
      </span>
      {status && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]',
            styles.status,
          )}
        >
          {status}
        </span>
      )}
    </motion.button>
  );
}

function AppSurfaceMenuButton({
  appLanguage,
  onSelect,
  surface,
}: AppSurfaceMenuButtonProps) {
  const SurfaceIcon = SURFACE_ICONS[surface.icon] ?? AppWindow;
  const copy = getAppSurfaceCopy(surface, appLanguage);
  const active = typeof window !== 'undefined' && isAppSurfaceActive(surface, window.location);
  const disabled = surface.action === 'disabled' || surface.status === 'planned';

  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      disabled={disabled}
      onClick={() => onSelect(surface)}
      title={`${copy.label} - ${copy.description}`}
      aria-label={`${copy.label}. ${copy.description}`}
      className={cn(
        'flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border bg-white px-3 py-2 text-left transition-all',
        active
          ? 'border-blue-200 bg-blue-50 shadow-sm'
          : 'border-slate-200/70 hover:border-slate-300 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-55 hover:border-slate-200/70 hover:bg-white',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
          active
            ? 'border-blue-200 bg-blue-100 text-blue-700'
            : 'border-slate-200 bg-slate-50 text-slate-500',
        )}
      >
        <SurfaceIcon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black text-slate-900">
          {copy.label}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
          {copy.description}
        </span>
      </span>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]',
          surface.status === 'ready' && 'bg-emerald-50 text-emerald-700',
          surface.status === 'partial' && 'bg-amber-50 text-amber-700',
        )}
      >
        {getAppSurfaceStatusLabel(surface.status, appLanguage)}
      </span>
    </motion.button>
  );
}

export const SideMenu: React.FC<SideMenuProps> = ({
  show,
  onClose,
  setSavedTab,
  setShowSaved,
  setAoidModeForced,
  setShowAddressRegistration,
  appLanguage,
}) => {
  const primaryAppSurfaces = React.useMemo(
    () => getSideMenuPrimaryAppSurfaces(getAgidAppSurfaces()),
    [],
  );
  const isJapanese = appLanguage.startsWith('ja');

  const openSavedLocations = (tab: SavedTab) => {
    setSavedTab(tab);
    setShowSaved(true);
    onClose();
  };

  const openAddressRegistration = () => {
    setAoidModeForced(false);
    setShowAddressRegistration(true);
    onClose();
  };

  const handleAppSurfaceClick = (surface: AppSurfaceDefinition) => {
    if (surface.action === 'disabled' || surface.status === 'planned') return;

    if (surface.action === 'open-address-registration') {
      openAddressRegistration();
      return;
    }

    if (surface.action === 'navigate' && surface.route) {
      window.location.href = surface.route;
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] pointer-events-auto"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 1 }}
            className="fixed top-0 left-0 bottom-0 w-80 max-w-[88vw] md:w-[22rem] bg-white/95 backdrop-blur-xl shadow-2xl z-[101] pointer-events-auto flex flex-col border-r border-white/20 md:rounded-r-[1.5rem]"
            role="dialog"
            aria-modal="true"
            aria-label={isJapanese ? 'AGID統合ナビゲーション' : 'AGID integrated navigation'}
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
            }}
          >
            <div className="px-3 py-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/agid-logo.png"
                  alt="AGID"
                  className="h-8 w-auto max-w-[88px] object-contain"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Open Address Grid</p>
                  <p className="truncate text-sm font-black text-slate-900">AGID</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={isJapanese ? 'メニューを閉じる' : 'Close menu'}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-900 active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
              <section className="space-y-3">
                <div className="space-y-1.5">
                  <h3 className="truncate px-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {isJapanese ? 'メニュー' : 'Menu'}
                  </h3>
                  <div className="space-y-1.5">
                    <MenuActionButton
                      tone="add"
                      icon={Plus}
                      onClick={openAddressRegistration}
                      title={isJapanese ? '住所を追加する' : 'Add an address'}
                      ariaLabel={isJapanese
                        ? '追加する。住所を登録または修正します。'
                        : 'Add. Register or correct an address.'}
                      label={isJapanese ? '追加する' : 'Add'}
                      description={isJapanese
                        ? '住所を登録・修正'
                        : 'Register or correct an address'}
                    />
                    {primaryAppSurfaces.map(surface => (
                      <AppSurfaceMenuButton
                        key={surface.id}
                        surface={surface}
                        appLanguage={appLanguage}
                        onSelect={handleAppSurfaceClick}
                      />
                    ))}
                    <MenuActionButton
                      tone="agid"
                      icon={Bookmark}
                      onClick={() => openSavedLocations('agid')}
                      title={isJapanese ? '保存したAGIDを管理' : 'Manage saved AGIDs'}
                      ariaLabel={isJapanese
                        ? 'AGID。保存した公開ロケーションIDを管理します。'
                        : 'AGID. Manage saved public location IDs.'}
                      label="AGID"
                      description={isJapanese
                        ? '保存した公開ロケーションID'
                        : 'Saved public location IDs'}
                      status={isJapanese ? '利用可' : 'Ready'}
                    />
                    <MenuActionButton
                      tone="aoid"
                      icon={ShieldCheck}
                      onClick={() => openSavedLocations('aoid')}
                      title={isJapanese ? 'AOIDを管理' : 'Manage AOIDs'}
                      ariaLabel={isJapanese
                        ? 'AOID。非公開のAddress Owner IDを管理・登録します。'
                        : 'AOID. Manage and register private Address Owner IDs.'}
                      label="AOID"
                      description={isJapanese
                        ? '非公開のAddress Owner ID'
                        : 'Private Address Owner IDs'}
                      status={isJapanese ? '利用可' : 'Ready'}
                    />
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
