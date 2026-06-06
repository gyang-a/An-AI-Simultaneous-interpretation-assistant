import { useState } from 'react';
import './AuthPage.less';

function AuthPage({ onAuthenticated }) {
  const [authMode, setAuthMode] = useState('login');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isLogin = authMode === 'login';

  const handleSubmit = (event) => {
    event.preventDefault();
    onAuthenticated({
      name: isLogin ? 'AI User' : 'New User',
      signedInAt: new Date().toISOString()
    });
  };

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="auth-title">
        <div className="auth-story">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <strong>AI Interpreter</strong>
          </div>

          <div className="auth-copy">
            <span className="auth-pill">AI 同声传译助手</span>
            <h1 id="auth-title">
              沟通无界，
              <br />
              世界<span>为你</span>倾听。
            </h1>
            <p>基于 AI 实时语音识别与翻译，让跨语言沟通更自然、更高效。</p>
          </div>

          <div className="auth-orbit" aria-hidden="true">
            <span className="bubble bubble-one">Hello</span>
            <span className="bubble bubble-two">你好</span>
            <span className="bubble bubble-three">Hola</span>
            <div className="orb">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="world-map" />
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>AI</span>
              <div>
                <strong>实时同声传译</strong>
                <small>毫秒级响应，流畅自然的翻译体验</small>
              </div>
            </div>
            <div className="auth-feature">
              <span>100</span>
              <div>
                <strong>多语言支持</strong>
                <small>面向会议、网课和跨国沟通场景</small>
              </div>
            </div>
            <div className="auth-feature">
              <span>AI</span>
              <div>
                <strong>智能上下文优化</strong>
                <small>为后续字幕修正和记录检索预留能力</small>
              </div>
            </div>
          </div>

          <p className="auth-security">你的数据安全，由登录鉴权与后端存储共同守护</p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="账号操作">
            <button
              className={isLogin ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={isLogin}
              onClick={() => setAuthMode('login')}
            >
              登录
            </button>
            <button
              className={!isLogin ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={!isLogin}
              onClick={() => setAuthMode('register')}
            >
              注册
            </button>
          </div>

          <div className="auth-card-copy">
            <h2>{isLogin ? '欢迎回来' : '创建账号'}</h2>
            <p>{isLogin ? '登录你的账号，继续高效沟通' : '注册后即可同步保存翻译记录'}</p>
          </div>

          {!isLogin && (
            <label className="auth-field">
              <span>用户昵称</span>
              <input type="text" placeholder="请输入昵称" autoComplete="name" />
            </label>
          )}

          <label className="auth-field">
            <span>账号</span>
            <input type="text" placeholder="邮箱或手机号" autoComplete="username" />
          </label>

          <label className="auth-field password-field">
            <span>密码</span>
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="密码"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
              onClick={() => setIsPasswordVisible((value) => !value)}
            >
              {isPasswordVisible ? '隐藏' : '显示'}
            </button>
          </label>

          <div className="auth-options">
            <label>
              <input type="checkbox" defaultChecked />
              <span>记住我</span>
            </label>
            {isLogin && <button type="button">忘记密码?</button>}
          </div>

          <button className="auth-submit" type="submit">
            {isLogin ? '登录' : '注册'}
          </button>

          <div className="auth-divider">
            <span>{isLogin ? '或使用以下方式登录' : '注册后可绑定第三方账号'}</span>
          </div>

          <div className="auth-social-list" aria-label="第三方登录方式">
            <button type="button" aria-label="Google 登录">G</button>
            <button type="button" aria-label="Apple 登录">A</button>
            <button type="button" aria-label="Microsoft 登录">M</button>
          </div>

          <p className="auth-switch">
            {isLogin ? '还没有账号?' : '已有账号?'}
            <button
              type="button"
              onClick={() => setAuthMode(isLogin ? 'register' : 'login')}
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}

export default AuthPage;
