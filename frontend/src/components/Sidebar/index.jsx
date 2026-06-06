import { useEffect, useRef, useState } from 'react';
import './Sidebar.less';

const navItems = [
  { id: 'realtime', label: '实时翻译', icon: 'translate' },
  { id: 'history', label: '历史记录', icon: 'history' }
];

const AVATAR_SIZE = 160;
const AVATAR_QUALITY = 0.82;
const MAX_SOURCE_AVATAR_SIZE = 5 * 1024 * 1024;

function getAvatarInitial(user) {
  return String(user?.name || user?.account || 'AI').trim().slice(0, 1).toUpperCase();
}

function SidebarIcon({ name }) {
  const iconProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg'
  };

  if (name === 'history') {
    return (
      <svg {...iconProps} aria-hidden="true">
        <path d="M4 12a8 8 0 1 0 2.34-5.66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 5.5v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 8v4.4l3 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'upload') {
    return (
      <svg {...iconProps} aria-hidden="true">
        <path d="M12 16V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m8 9 4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'logout') {
    return (
      <svg {...iconProps} aria-hidden="true">
        <path d="M10 6H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M14 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M7 7h7a3 3 0 0 1 0 6h-2l-3.5 3.5V13H7a3 3 0 0 1 0-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16.5 10.5h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8.2 10.5h4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 6.5 3 5m17 14-1.5-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('头像读取失败'));
    reader.readAsDataURL(file);
  });
}

async function compressAvatarFile(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件作为头像。');
  }

  if (file.size > MAX_SOURCE_AVATAR_SIZE) {
    throw new Error('头像原图不能超过 5MB。');
  }

  const imageDataUrl = await readFileAsDataUrl(file);
  const image = new Image();

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('头像格式不支持'));
    image.src = imageDataUrl;
  });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('当前浏览器无法处理头像图片。');
  }

  const sideLength = Math.min(image.width, image.height);
  const sourceX = (image.width - sideLength) / 2;
  const sourceY = (image.height - sideLength) / 2;

  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  // 上传前裁成正方形并压缩，减少 MongoDB 中用户资料字段的体积。
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sideLength,
    sideLength,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  );

  return canvas.toDataURL('image/jpeg', AVATAR_QUALITY);
}

function Sidebar({ activeView, user, onSelectView, onAvatarChange, onLogout }) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const closeProfileMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
        setIsLogoutConfirmOpen(false);
      }
    };

    const closeProfileMenuByKey = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsLogoutConfirmOpen(false);
      }
    };

    document.addEventListener('mousedown', closeProfileMenu);
    document.addEventListener('keydown', closeProfileMenuByKey);

    return () => {
      document.removeEventListener('mousedown', closeProfileMenu);
      document.removeEventListener('keydown', closeProfileMenuByKey);
    };
  }, [isProfileMenuOpen]);

  const handleAvatarInputChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const avatarDataUrl = await compressAvatarFile(file);
      await onAvatarChange(avatarDataUrl);
      setIsProfileMenuOpen(false);
      setIsLogoutConfirmOpen(false);
    } catch (error) {
      window.alert(error.message || '头像上传失败，请换一张图片重试。');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutConfirmOpen(false);
  };

  const handleConfirmLogout = () => {
    // 退出会清理本地登录态和后端 RT Cookie，确认后再执行，避免误触头像菜单。
    setIsProfileMenuOpen(false);
    setIsLogoutConfirmOpen(false);
    onLogout();
  };

  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <strong>AI 同声传译助手</strong>
      </div>

      <nav className="nav-list" aria-label="功能导航">
        {navItems.map((item) => (
          <button
            className={item.id === activeView ? 'nav-item active' : 'nav-item'}
            disabled={item.disabled}
            type="button"
            key={item.id}
            onClick={() => onSelectView(item.id)}
          >
            <span className="nav-icon" aria-hidden="true">
              <SidebarIcon name={item.icon} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-profile-menu-wrap" ref={profileMenuRef}>
        {isProfileMenuOpen && (
          <section className="sidebar-profile-menu" aria-label="用户菜单">
            <div className="sidebar-profile-summary">
              <span className="sidebar-avatar menu-avatar" aria-hidden="true">
                {user?.avatarDataUrl ? (
                  <img src={user.avatarDataUrl} alt="" />
                ) : (
                  getAvatarInitial(user)
                )}
              </span>
              <div className="sidebar-profile-copy">
                <strong>{user?.name || 'AI User'}</strong>
                <span>{user?.account}</span>
              </div>
            </div>
            <label className={isUploadingAvatar ? 'profile-menu-item disabled' : 'profile-menu-item'}>
              <SidebarIcon name="upload" />
              {isUploadingAvatar ? '上传中...' : '上传头像'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={isUploadingAvatar}
                onChange={handleAvatarInputChange}
              />
            </label>
            <button className="profile-menu-item danger" type="button" onClick={handleLogoutClick}>
              <SidebarIcon name="logout" />
              退出登录
            </button>
            {isLogoutConfirmOpen && (
              <div className="logout-confirm-panel" role="alertdialog" aria-modal="false" aria-labelledby="logout-confirm-title">
                <strong id="logout-confirm-title">确定退出登录吗？</strong>
                <p>退出后需要重新登录才能继续查看翻译记录。</p>
                <div className="logout-confirm-actions">
                  <button type="button" onClick={handleCancelLogout}>
                    取消
                  </button>
                  <button className="danger" type="button" onClick={handleConfirmLogout}>
                    确定退出
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <button
          className={isProfileMenuOpen ? 'sidebar-avatar-button active' : 'sidebar-avatar-button'}
          type="button"
          aria-label="打开用户菜单"
          aria-expanded={isProfileMenuOpen}
          onClick={() => {
            setIsProfileMenuOpen((isOpen) => !isOpen);
            setIsLogoutConfirmOpen(false);
          }}
        >
          <span className="sidebar-avatar" aria-hidden="true">
            {user?.avatarDataUrl ? (
              <img src={user.avatarDataUrl} alt="" />
            ) : (
              getAvatarInitial(user)
            )}
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
