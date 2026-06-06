import { useState } from 'react';
import {
  loginAuthUser,
  registerAuthUser
} from '../../services/authApi';
import './AuthPage.less';

const INITIAL_FORM = {
  name: '',
  account: '',
  password: ''
};

function getAuthErrorMessage(error) {
  if (error.status === 409) {
    return '这个账号已经注册过，请直接登录。';
  }

  if (error.status === 401) {
    return '账号或密码不正确，请检查后重试。';
  }

  if (error.status === 503) {
    return '数据库暂未配置或未连接，请确认 MongoDB 已启动并检查 .env。';
  }

  return error.message || '认证请求失败，请稍后重试。';
}

function AuthPage({ onAuthenticated }) {
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isLogin = authMode === 'login';

  const updateFormField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  };

  const switchAuthMode = (nextMode) => {
    setAuthMode(nextMode);
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const session = isLogin
        ? await loginAuthUser({
            account: form.account,
            password: form.password
          })
        : await registerAuthUser({
            name: form.name,
            account: form.account,
            password: form.password
          });

      onAuthenticated(session);
    } catch (error) {
      // 后端错误在这里转成用户能理解的中文提示，避免页面直接暴露技术细节。
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
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
            <p>基于 AI 实时语音识别与翻译，让跨语言沟通更自然、更高效</p>
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

          <p className="auth-security">依托大模型深度理解能力，为您提供更懂语境的精准翻译</p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="账号操作">
            <button
              className={isLogin ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={isLogin}
              onClick={() => switchAuthMode('login')}
            >
              登录
            </button>
            <button
              className={!isLogin ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={!isLogin}
              onClick={() => switchAuthMode('register')}
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
              <input
                type="text"
                placeholder="请输入昵称"
                autoComplete="name"
                value={form.name}
                onChange={(event) => updateFormField('name', event.target.value)}
              />
            </label>
          )}

          <label className="auth-field">
            <span>账号</span>
            <input
              type="text"
              placeholder="邮箱或手机号"
              autoComplete="username"
              value={form.account}
              onChange={(event) => updateFormField('account', event.target.value)}
              required
            />
          </label>

          <label className="auth-field password-field">
            <span>密码</span>
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="密码"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={(event) => updateFormField('password', event.target.value)}
              required
            />
            <button
              type="button"
              aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
              onClick={() => setIsPasswordVisible((value) => !value)}
            >
              {isPasswordVisible ? '隐藏' : '显示'}
            </button>
          </label>

          {errorMessage && (
            <div className="auth-error" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="auth-options">
            <label>
              <input type="checkbox" defaultChecked />
              <span>记住我</span>
            </label>
            {isLogin && <button type="button">忘记密码?</button>}
          </div>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isLogin ? '登录中...' : '注册中...') : (isLogin ? '登录' : '注册')}
          </button>

          <p className="auth-switch">
            {isLogin ? '还没有账号?' : '已有账号?'}
            <button
              type="button"
              onClick={() => switchAuthMode(isLogin ? 'register' : 'login')}
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
