'use client';

import type { JSX } from 'react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandName } from '../components/BrandName';
import { useAuth } from '../contexts/AuthContext';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';

function cogPath(
  cx: number,
  cy: number,
  pr: number,
  teeth: number,
  addendum: number,
  dedendum: number,
): string {
  const toothAngle = (Math.PI * 2) / teeth;
  const outerR = pr + addendum;
  const innerR = pr - dedendum;
  const rootR = innerR - dedendum * 0.3;
  const tw = 0.38;
  let d = '';

  for (let i = 0; i < teeth; i += 1) {
    const baseAngle = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    const a1 = baseAngle + toothAngle * (0.5 - tw);
    const a2 = baseAngle + toothAngle * (0.5 - tw * 0.5);
    const a4 = baseAngle + toothAngle * (0.5 + tw * 0.5);
    const a5 = baseAngle + toothAngle * (0.5 + tw);
    const a6 = baseAngle + toothAngle;
    const a0 = baseAngle;

    const p = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const f = (n: number): string => n.toFixed(2);

    const [x0, y0] = p(rootR, a0);
    const [x1, y1] = p(innerR, a1);
    const [x2, y2] = p(outerR, a2);
    const [x4, y4] = p(outerR, a4);
    const [x5, y5] = p(innerR, a5);
    const [x6, y6] = p(rootR, a6);

    if (i === 0) d += `M${f(x0)},${f(y0)}`;
    d += ` L${f(x1)},${f(y1)} L${f(x2)},${f(y2)}`;
    d += ` A${f(outerR)},${f(outerR)} 0 0,1 ${f(x4)},${f(y4)}`;
    d += ` L${f(x5)},${f(y5)} L${f(x6)},${f(y6)}`;
    d += ` A${f(rootR)},${f(rootR)} 0 0,1 ${f(x6)},${f(y6)}`;
  }

  return d + ' Z';
}

function LoginCogs(): JSX.Element {
  const largeRef = useRef<SVGGElement | null>(null);
  const smallRef = useRef<SVGGElement | null>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const ratio = 42 / 72;
    let raf: number;

    const tick = () => {
      angleRef.current += 0.25;
      const largeAngle = -(angleRef.current * ratio);

      if (largeRef.current) largeRef.current.style.transform = `rotate(${largeAngle}deg)`;
      if (smallRef.current) smallRef.current.style.transform = `rotate(${angleRef.current}deg)`;

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const lgD = cogPath(158, 148, 72, 12, 14, 10);
  const smD = cogPath(74, 226, 42, 8, 10, 7);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: '-40px',
        transform: 'translateY(-50%)',
        opacity: 0.18,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg width={280} height={320} viewBox="0 0 280 320">
        <g ref={largeRef} style={{ transformOrigin: '158px 148px' }}>
          <path
            d={lgD}
            fill="#2A2520"
            stroke="rgba(224,92,26,0.8)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx={158} cy={148} r={50} fill="none" stroke="rgba(224,92,26,0.25)" strokeWidth="0.8" />
          <line x1={158} y1={96} x2={158} y2={200} stroke="rgba(224,92,26,0.2)" strokeWidth="1.5" strokeLinecap="round" />
          <line
            x1={158}
            y1={96}
            x2={158}
            y2={200}
            stroke="rgba(224,92,26,0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform="rotate(60 158 148)"
          />
          <line
            x1={158}
            y1={96}
            x2={158}
            y2={200}
            stroke="rgba(224,92,26,0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform="rotate(120 158 148)"
          />
          <circle cx={158} cy={148} r={14} fill="#1A1714" stroke="rgba(224,92,26,0.5)" strokeWidth="1.5" />
          <circle cx={158} cy={148} r={5.5} fill="rgba(224,92,26,0.6)" />
        </g>

        <g ref={smallRef} style={{ transformOrigin: '74px 226px' }}>
          <path
            d={smD}
            fill="#252118"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx={74} cy={226} r={27} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
          <line x1={74} y1={200} x2={74} y2={252} stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round" />
          <line
            x1={74}
            y1={200}
            x2={74}
            y2={252}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.2"
            strokeLinecap="round"
            transform="rotate(90 74 226)"
          />
          <circle cx={74} cy={226} r={8} fill="#1A1714" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
          <circle cx={74} cy={226} r={3} fill="rgba(255,255,255,0.3)" />
        </g>
      </svg>
    </div>
  );
}

export const LoginPage = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(email, password, username || undefined);
      } else {
        await login(email, password);
      }
      // Redirect to returnTo URL if provided, otherwise go to notes
      const returnTo = searchParams.get('returnTo');
      // Validate returnTo to prevent redirect loops and ensure it's a valid path
      const redirectPath =
        returnTo && returnTo !== '/login' && returnTo.startsWith('/') ? returnTo : '/notes';
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        paddingTop: '56px',
        background: '#1A1714',
        fontFamily: 'var(--font-display, Barlow, sans-serif)',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <Nav />

      <div
        className="login-body"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <div
          className="brand-panel"
          style={{
            background: '#201D1A',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            className="brand-watermark"
            style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-20px',
              fontFamily: 'Barlow, sans-serif',
              fontSize: '160px',
              fontWeight: 900,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.022)',
              letterSpacing: '-0.04em',
              pointerEvents: 'none',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              zIndex: 0,
            }}
          >
            Sign In
          </div>

          <div className="brand-cogs">
            <LoginCogs />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }} className="brand-title-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                  fontSize: '8px',
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                  color: '#5C574F',
                }}
              >
                Account
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <h2
              className="brand-title"
              style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                fontWeight: 900,
                fontStyle: 'italic',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                color: '#F4F2EE',
                lineHeight: 1.05,
                marginBottom: '16px',
              }}
            >
              Your{' '}
              <span style={{ color: '#E05C1A', fontStyle: 'normal' }}>
                Second<br />
                Brain
              </span>
              <br />
              Awaits.
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: '#A8A39A',
                lineHeight: 1.75,
                maxWidth: '320px',
                margin: 0,
              }}
            >
              Sign in to access your knowledge system, capture notes, search semantically, and let AI surface what matters.
            </p>
          </div>

          <div className="brand-bottom" style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                ['Semantic Search', 'find by meaning, not keywords'],
                ['AI Capture', 'thoughts routed and classified automatically'],
                ['Open Brain', 'your knowledge graph, connected'],
                ['Digest & Review', 'daily AI-powered summaries'],
              ].map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '6px', height: '6px', background: '#E05C1A', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#A8A39A' }}>
                    <strong style={{ color: '#F4F2EE', fontWeight: 600 }}>{title}</strong>
                    {' — '}
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="form-panel"
          style={{
            background: '#1A1714',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '48px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div className="form-box" style={{ width: '100%', maxWidth: '380px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                fontSize: '8px',
                letterSpacing: '0.20em',
                textTransform: 'uppercase',
                color: '#5C574F',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ width: '16px', height: '1px', background: '#E05C1A' }} />
              Sign In
            </div>

            <h1
              style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: '2rem',
                fontWeight: 900,
                fontStyle: 'italic',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                color: '#F4F2EE',
                marginBottom: '6px',
                lineHeight: 1.05,
              }}
            >
              Welcome
              <br />
              Back.
            </h1>

            <p style={{ fontSize: '12px', color: '#A8A39A', marginBottom: '32px', lineHeight: 1.6 }}>
              Use your email and password to access your <BrandName /> tools.
            </p>

            <form onSubmit={handleSubmit}>
              {resetSuccess && (
                <p
                  style={{
                    fontSize: '11px',
                    color: '#A8A39A',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                    padding: '12px 14px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: '#2A2520',
                  }}
                >
                  Password reset successfully. You can now log in with your new password.
                </p>
              )}
              {error && (
                <p
                  style={{
                    fontSize: '11px',
                    color: '#E05C1A',
                    marginBottom: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </p>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                    fontSize: '9px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#5C574F',
                    marginBottom: '7px',
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%',
                    background: '#201D1A',
                    border: '1px solid rgba(255,255,255,0.11)',
                    padding: '11px 14px',
                    fontFamily: 'Barlow, sans-serif',
                    fontSize: '13px',
                    color: '#F4F2EE',
                    outline: 'none',
                    borderRadius: 0,
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#E05C1A';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)';
                  }}
                />
              </div>

              {isRegister && (
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="username"
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                      fontSize: '9px',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#5C574F',
                      marginBottom: '7px',
                    }}
                  >
                    Username (optional)
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#201D1A',
                      border: '1px solid rgba(255,255,255,0.11)',
                      padding: '11px 14px',
                      fontFamily: 'Barlow, sans-serif',
                      fontSize: '13px',
                      color: '#F4F2EE',
                      outline: 'none',
                      borderRadius: 0,
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#E05C1A';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)';
                    }}
                  />
                  <p style={{ fontSize: '11px', color: '#A8A39A', lineHeight: 1.6, margin: '8px 0 0' }}>
                    If not provided, email prefix will be used.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '7px',
                  }}
                >
                  <label
                    htmlFor="password"
                    style={{
                      fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                      fontSize: '9px',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#5C574F',
                    }}
                  >
                    Password
                  </label>

                  {!isRegister && (
                    <a
                      href="/forgot-password"
                      style={{
                        fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                        fontSize: '8px',
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: '#E05C1A',
                        textDecoration: 'none',
                      }}
                    >
                      Forgot password?
                    </a>
                  )}
                </div>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={isRegister ? 6 : undefined}
                  style={{
                    width: '100%',
                    background: '#201D1A',
                    border: '1px solid rgba(255,255,255,0.11)',
                    padding: '11px 14px',
                    fontFamily: 'Barlow, sans-serif',
                    fontSize: '13px',
                    color: '#F4F2EE',
                    outline: 'none',
                    borderRadius: 0,
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#E05C1A';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)';
                  }}
                />

                {isRegister && (
                  <p style={{ fontSize: '11px', color: '#A8A39A', lineHeight: 1.6, margin: '8px 0 0' }}>
                    Password must be at least 6 characters.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: '#E05C1A',
                  color: '#fff',
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '13px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  borderRadius: 0,
                  marginTop: '8px',
                  marginBottom: '10px',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Signing in...' : isRegister ? 'Register' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'transparent',
                  color: '#A8A39A',
                  fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '11px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.11)',
                  textDecoration: 'none',
                  borderRadius: 0,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </form>

            {!isRegister && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 14px',
                  background: '#2A2520',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: '2px solid #E05C1A',
                  borderRadius: 0,
                }}
              >
                <p style={{ fontSize: '11px', color: '#A8A39A', lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: '#F4F2EE' }}>Note:</strong>{' '}
                  Use your email address to login. If you haven't created an account yet, click Register to
                  create one.
                </p>
              </div>
            )}
          </div>

          {/* Version string already shown in the footer */}
        </div>
      </div>

      <Footer />
    </div>
  );
};
