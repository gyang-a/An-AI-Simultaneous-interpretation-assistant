import { useState } from 'react';
import './Sidebar.less';

const navItems = [
  { id: 'realtime', label: '实时翻译', icon: 'RT' },
  { id: 'history', label: '历史记录', icon: 'HI' }
];

const AVATAR_SIZE = 160;
const AVATAR_QUALITY = 0.82;
const MAX_SOURCE_AVATAR_SIZE = 5 * 1024 * 1024;

function getAvatarInitial(user) {
  return String(user?.name || user?.account || 'AI').trim().slice(0, 1).toUpperCase();
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

  const handleAvatarInputChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const avatarDataUrl = await compressAvatarFile(file);
      await onAvatarChange(avatarDataUrl);
    } catch (error) {
      window.alert(error.message || '头像上传失败，请换一张图片重试。');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
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
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <section className="sidebar-settings" aria-labelledby="sidebar-settings-title">
        <div className="sidebar-settings-title">
          <span className="nav-icon" aria-hidden="true">SET</span>
          <h2 id="sidebar-settings-title">设置</h2>
        </div>
        <div className="sidebar-profile">
          <span className="sidebar-avatar" aria-hidden="true">
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
        <label className={isUploadingAvatar ? 'avatar-upload-button disabled' : 'avatar-upload-button'}>
          {isUploadingAvatar ? '上传中...' : '上传头像'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isUploadingAvatar}
            onChange={handleAvatarInputChange}
          />
        </label>
        <button className="logout-button" type="button" onClick={onLogout}>
          退出登录
        </button>
      </section>
    </aside>
  );
}

export default Sidebar;
