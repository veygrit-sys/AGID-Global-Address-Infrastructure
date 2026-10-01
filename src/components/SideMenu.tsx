
import {
  AppWindow,
  Bookmark,
  ChevronDown,
  ExternalLink,
  Github,
  Home as HomeIcon,
  type LucideIcon,
  MessageCircle,
  Plus,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import {
  getAgidAppSurfaces,
  getAppSurfaceCopy,
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
  openLicenses: () => void;
  appLanguage: string;
}

type SavedTab = 'agid' | 'aoid';
type MenuActionTone = 'add' | 'agid' | 'aoid' | 'oss';

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
    button: 'text-emerald-700 hover:bg-emerald-50',
    description: 'text-slate-500',
    icon: 'text-emerald-600',
    label: 'text-slate-900',
    status: '',
  },
  agid: {
    button: 'hover:bg-slate-50',
    description: 'text-slate-500',
    icon: 'text-blue-700',
    label: 'text-slate-900',
    status: 'bg-blue-100 text-blue-700',
  },
  aoid: {
    button: 'hover:bg-slate-50',
    description: 'text-slate-500',
    icon: 'text-emerald-700',
    label: 'text-slate-900',
    status: 'bg-emerald-100 text-emerald-700',
  },
  oss: {
    button: 'hover:bg-violet-50',
    description: 'text-slate-500',
    icon: 'text-violet-700',
    label: 'text-slate-900',
    status: '',
  },
};

const AGID_REPOSITORY_URL = 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure';

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
        'flex min-h-[52px] w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
        styles.button,
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center',
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
        'flex min-h-[52px] w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
        active
          ? 'bg-blue-50'
          : 'hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-55 hover:bg-transparent',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center',
          active
            ? 'text-blue-700'
            : 'text-slate-500',
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
    </motion.button>
  );
}

function OpenSourceLink({
  description,
  href,
  icon: Icon,
  label,
}: {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <motion.a
      whileHover={{ y: -1 }}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-[52px] w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-violet-50"
      title={`${label} - ${description}`}
      aria-label={`${label}. ${description}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-violet-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black text-slate-900">{label}</span>
        <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
          {description}
        </span>
      </span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
    </motion.a>
  );
}

export const SideMenu: React.FC<SideMenuProps> = ({
  show,
  onClose,
  setSavedTab,
  setShowSaved,
  setAoidModeForced,
  setShowAddressRegistration,
  openLicenses,
  appLanguage,
}) => {
  const isJapanese = appLanguage.startsWith('ja');
  const openSourceSurface = React.useMemo(
    () => getAgidAppSurfaces().find(surface => surface.id === 'open-source-home'),
    [],
  );

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
            className="fixed top-0 left-0 bottom-0 w-72 max-w-[86vw] bg-white/95 backdrop-blur-xl shadow-2xl z-[101] pointer-events-auto flex flex-col"
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
              <section className="space-y-3" aria-labelledby="side-menu-use">
                <div className="space-y-1.5">
                  <h3 id="side-menu-use" className="truncate px-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {isJapanese ? '利用する' : 'Use AGID'}
                  </h3>
                  <div className="space-y-1.5">
                    <MenuActionButton
                      tone="add"
                      icon={Plus}
                      onClick={openAddressRegistration}
                      title={isJapanese ? '住所を保存・訂正する' : 'Save or correct an address'}
                      ariaLabel={isJapanese
                        ? '保存・訂正。住所をこの端末に保存または訂正します。'
                        : 'Save or correct. Keep an address on this device or correct it.'}
                      label={isJapanese ? '保存・訂正' : 'Save or correct'}
                      description={isJapanese
                        ? 'この端末だけで住所を管理'
                        : 'Manage addresses on this device'}
                    />
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
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-2" aria-labelledby="side-menu-open-source">
                <details className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 px-3 py-2 text-left text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-700">
                    <span className="flex h-7 w-8 shrink-0 items-center justify-center">
                      <Github className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span id="side-menu-open-source" className="min-w-0 flex-1 text-[12px] font-black">
                      {isJapanese ? 'オープンソース' : 'Open source'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="mt-1 space-y-1 border-l-2 border-violet-100 pl-1">
                    {openSourceSurface && (
                      <AppSurfaceMenuButton
                        surface={openSourceSurface}
                        appLanguage={appLanguage}
                        onSelect={handleAppSurfaceClick}
                      />
                    )}
                    <OpenSourceLink
                      icon={Github}
                      href={AGID_REPOSITORY_URL}
                      label={isJapanese ? 'ソースコード' : 'Source code'}
                      description={isJapanese ? 'GitHubでコードと履歴を確認' : 'Inspect code and history on GitHub'}
                    />
                    <OpenSourceLink
                      icon={MessageCircle}
                      href={`${AGID_REPOSITORY_URL}/issues`}
                      label={isJapanese ? '改善に参加' : 'Contribute'}
                      description={isJapanese ? '不具合や提案を共有' : 'Share bugs and proposals'}
                    />
                    <MenuActionButton
                      tone="oss"
                      icon={Scale}
                      onClick={() => {
                        openLicenses();
                        onClose();
                      }}
                      title={isJapanese ? 'ライセンスとデータ出典を確認' : 'Review licenses and data sources'}
                      ariaLabel={isJapanese
                        ? 'ライセンス。ソフトウェアとデータの利用条件を確認します。'
                        : 'Licenses. Review software and data usage terms.'}
                      label={isJapanese ? 'ライセンスと出典' : 'Licenses & sources'}
                      description={isJapanese ? 'MIT・データライセンス' : 'MIT and data licenses'}
                    />
                  </div>
                </details>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
