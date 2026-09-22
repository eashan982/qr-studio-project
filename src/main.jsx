import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import QRCodeStyling from 'qr-code-styling';
import './styles.css';

const types = {
  url: { name: 'URL', placeholder: 'https://example.com' },
  text: { name: 'Plain Text', placeholder: 'Type your message...' },
  email: { name: 'Email', placeholder: 'hello@example.com' },
  phone: { name: 'Phone', placeholder: '+91 98765 43210' },
  wifi: { name: 'Wi-Fi', placeholder: 'Network name' }
};

const presets = {
  Classic: ['#111827', '#ffffff', 'M', 4],
  Midnight: ['#f8fafc', '#111827', 'M', 3],
  Ocean: ['#075985', '#e0f2fe', 'Q', 3],
  Forest: ['#14532d', '#f0fdf4', 'Q', 3],
  Sunset: ['#9a3412', '#fff7ed', 'H', 3]
};

const patterns = [
  ['square', 'Square'],
  ['dots', 'Dots'],
  ['rounded', 'Rounded'],
  ['extra-rounded', 'Extra Rounded'],
  ['classy', 'Classy'],
  ['classy-rounded', 'Classy Rounded']
];

function validate(t, v, password) {
  if (!v.trim()) return 'Please enter the required information.';

  if (t === 'url') {
    try {
      const u = new URL(v);
      if (!['http:', 'https:'].includes(u.protocol)) throw 0;
    } catch {
      return 'Enter a valid URL starting with http:// or https://.';
    }
  }

  if (t === 'email' && !/^\S+@\S+\.\S+$/.test(v)) {
    return 'Enter a valid email address.';
  }

  if (t === 'phone' && v.replace(/\D/g, '').length < 7) {
    return 'Enter a valid phone number.';
  }

  if (t === 'wifi' && password && password.length < 8) {
    return 'Wi-Fi password should be at least 8 characters.';
  }

  return '';
}

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(x => {
    x /= 255;
    return x <= 0.03928
      ? x / 12.92
      : ((x + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a, b) {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function App() {
  const stageRef = useRef(null);
  const qrRef = useRef(null);

  const [type, setType] = useState('url');
  const [value, setValue] = useState('https://example.com');
  const [subject, setSubject] = useState('');
  const [password, setPassword] = useState('');
  const [security, setSecurity] = useState('WPA');
  const [hidden, setHidden] = useState(false);

  const [fg, setFg] = useState('#111827');
  const [bg, setBg] = useState('#ffffff');

  const [level, setLevel] = useState('M');
  const [margin, setMargin] = useState(4);
  const [size, setSize] = useState(320);

  const [pattern, setPattern] = useState('square');

  const [gradient, setGradient] = useState(false);
  const [gradientColor, setGradientColor] = useState('#8b7cff');
  const [gradientRotation, setGradientRotation] = useState(45);

  const [logo, setLogo] = useState('');
  const [logoName, setLogoName] = useState('');

  const [toast, setToast] = useState('');
  const [recent, setRecent] = useState([]);
  const [preset, setPreset] = useState('Classic');

  const [theme, setTheme] = useState(
    localStorage.getItem('qr-studio-theme') || 'dark'
  );

  const error = useMemo(
    () => validate(type, value, password),
    [type, value, password]
  );

  const payload = useMemo(() => {
    if (type === 'email') {
      return `mailto:${value.trim()}${
        subject ? `?subject=${encodeURIComponent(subject)}` : ''
      }`;
    }

    if (type === 'phone') {
      return `tel:${value.trim().replace(/[^\d+]/g, '')}`;
    }

    if (type === 'wifi') {
      return `WIFI:T:${security};S:${value};P:${password};H:${
        hidden ? 'true' : 'false'
      };;`;
    }

    return value;
  }, [type, value, subject, password, security, hidden]);

  const ratio = contrast(fg, bg);
  const readability =
    ratio >= 4.5 ? 'Excellent' : ratio >= 3 ? 'Good' : 'Low';

  useEffect(() => {
    try {
      setRecent(
        JSON.parse(localStorage.getItem('qr-studio-recent') || '[]')
      );
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('qr-studio-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!stageRef.current) return;

    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        width: size,
        height: size,
        type: 'canvas',
        data: payload,
        margin,
        qrOptions: {
          errorCorrectionLevel: level
        },
        dotsOptions: {
          type: pattern,
          color: fg
        },
        backgroundOptions: {
          color: bg
        }
      });

      qrRef.current.append(stageRef.current);
    }
  }, []);

  useEffect(() => {
    if (!qrRef.current) return;

    if (error) {
      qrRef.current.update({
        data: ' '
      });
      return;
    }

    const rotationRadians = (gradientRotation * Math.PI) / 180;

    const dotsOptions = {
      type: pattern,
      color: fg
    };

    if (gradient) {
      dotsOptions.gradient = {
        type: 'linear',
        rotation: rotationRadians,
        colorStops: [
          { offset: 0, color: fg },
          { offset: 1, color: gradientColor }
        ]
      };
    }

    qrRef.current.update({
      width: size,
      height: size,
      data: payload,
      margin,
      qrOptions: {
        errorCorrectionLevel: level
      },
      dotsOptions,
      backgroundOptions: {
        color: bg
      },
      image: logo || undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.28,
        margin: 6,
        saveAsBlob: true
      }
    });
  }, [
    payload,
    error,
    size,
    margin,
    level,
    fg,
    bg,
    pattern,
    gradient,
    gradientColor,
    gradientRotation,
    logo
  ]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  function changeType(t) {
    setType(t);
    setPreset('');
    setSubject('');
    setPassword('');

    setValue({
      url: 'https://example.com',
      text: 'Hello from QR Studio!',
      email: 'hello@example.com',
      phone: '+91 98765 43210',
      wifi: 'My Wi-Fi'
    }[t]);
  }

  function applyPreset(name) {
    const p = presets[name];

    setFg(p[0]);
    setBg(p[1]);
    setLevel(p[2]);
    setMargin(p[3]);

    setGradient(false);
    setPattern('square');

    setPreset(name);
    setToast(`${name} preset applied`);
  }

  function handleLogo(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast('Please select an image file');
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      setLogo(e.target.result);
      setLogoName(file.name);
      setToast('Logo added');
    };

    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogo('');
    setLogoName('');
    setToast('Logo removed');
  }

  function save() {
    if (error) return;

    const item = {
      id: Date.now(),
      type,
      value,
      subject,
      password: type === 'wifi' ? password : '',
      security,
      hidden,
      fg,
      bg,
      level,
      margin,
      size,
      pattern,
      gradient,
      gradientColor,
      gradientRotation,
      logo,
      logoName,
      at: Date.now()
    };

    const next = [
      item,
      ...recent.filter(x => !(x.type === type && x.value === value))
    ].slice(0, 8);

    setRecent(next);

    try {
      localStorage.setItem('qr-studio-recent', JSON.stringify(next));
    } catch {
      setToast('QR created, but local storage is full');
    }
  }

  async function download(format) {
    if (error || !qrRef.current) return;

    try {
      const blob = await qrRef.current.getRawData(format);

      if (!blob) throw new Error('QR generation failed');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `qr-studio-${type}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

      save();
      setToast(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      console.error(err);
      setToast(`Could not create ${format.toUpperCase()}`);
    }
  }

  async function copyQR() {
    if (error || !qrRef.current) return;

    try {
      const blob = await qrRef.current.getRawData('png');

      if (
        navigator.clipboard &&
        window.ClipboardItem &&
        window.isSecureContext
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);

        setToast('QR image copied');
      } else {
        await navigator.clipboard.writeText(payload);
        setToast('QR data copied instead');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(payload);
        setToast('QR data copied instead');
      } catch {
        setToast('Clipboard permission unavailable');
      }
    }
  }

  function loadRecent(item) {
    setType(item.type);
    setValue(item.value);
    setSubject(item.subject || '');
    setPassword(item.password || '');
    setSecurity(item.security || 'WPA');
    setHidden(!!item.hidden);

    setFg(item.fg || '#111827');
    setBg(item.bg || '#ffffff');
    setLevel(item.level || 'M');
    setMargin(item.margin ?? 4);
    setSize(item.size || 320);

    setPattern(item.pattern || 'square');
    setGradient(!!item.gradient);
    setGradientColor(item.gradientColor || '#8b7cff');
    setGradientRotation(item.gradientRotation ?? 45);

    setLogo(item.logo || '');
    setLogoName(item.logoName || '');

    setPreset('');
    setToast('Recent QR loaded');
  }

  return (
    <div className={`app ${theme === 'light' ? 'light-theme' : ''}`}>
      <header>
        <div className="brand">
          <div className="logo">
            <i />
            <i />
            <i />
            <i />
          </div>

          <div>
            <b>QR Studio</b>
            <small>Create. Customize. Share.</small>
          </div>
        </div>

        <div className="header-actions">
          

          <button
            className="theme-toggle"
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <label>QR CODE GENERATOR</label>

            <h1>
              Turn information into a <em>scannable</em> experience.
            </h1>

            <p>
              Generate beautiful QR codes instantly, customize every
              detail, and download production-ready PNG or SVG files.
            </p>
          </div>

          
        </section>

        <div className="workspace">
          <section className="panel">
            <div className="heading">
              <h2>
                <small>01</small>
                What do you want to encode?
              </h2>

              <button
                onClick={() => {
                  setValue('');
                  setSubject('');
                  setPassword('');
                }}
              >
                Clear
              </button>
            </div>

            <div className="types">
              {Object.entries(types).map(([key, item]) => (
                <button
                  className={type === key ? 'active' : ''}
                  onClick={() => changeType(key)}
                  key={key}
                >
                  <strong className="type-icon">
  {key === 'url' && (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5" />
      <path d="M10 14L19 5" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  )}

  {key === 'text' && (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h9" />
    </svg>
  )}

  {key === 'email' && (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )}

  {key === 'phone' && (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6L17 12l4 1.5v3a2 2 0 0 1-2 2C11.8 18.5 5.5 12.2 5.5 5A2 2 0 0 1 7 3Z" />
    </svg>
  )}

  {key === 'wifi' && (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 8.5C8 4 16 4 21.5 8.5" />
    <path d="M5.5 12C9.2 9.2 14.8 9.2 18.5 12" />
    <path d="M9 15.5C10.8 14.2 13.2 14.2 15 15.5" />
    <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
  </svg>
)}
</strong>

                  {item.name}
                </button>
              ))}
            </div>

            <label className="field-label">
              {type === 'url'
                ? 'Website URL'
                : type === 'text'
                ? 'Text'
                : type === 'email'
                ? 'Email address'
                : type === 'phone'
                ? 'Phone number'
                : 'Network name'}
            </label>

            <input
              className={error ? 'bad' : ''}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={types[type].placeholder}
            />

            {type === 'email' && (
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject (optional)"
              />
            )}

            {type === 'wifi' && (
              <div className="row">
                <select
                  value={security}
                  onChange={e => setSecurity(e.target.value)}
                >
                  <option>WPA</option>
                  <option>WEP</option>
                  <option value="nopass">No password</option>
                </select>

                {security !== 'nopass' && (
                  <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Wi-Fi password"
                  />
                )}
              </div>
            )}

            {type === 'wifi' && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={hidden}
                  onChange={e => setHidden(e.target.checked)}
                />
                Hidden network
              </label>
            )}

            {error && <div className="error">⚠ {error}</div>}

            <hr />

            <h2>
              <small>02</small>
              Make it yours
            </h2>

            <div className="controls">
              <div>
                <label>Foreground</label>

                <div className="color">
                  <input
                    type="color"
                    value={fg}
                    onChange={e => {
                      setFg(e.target.value);
                      setPreset('');
                    }}
                  />

                  <code>{fg}</code>
                </div>
              </div>

              <div>
                <label>Background</label>

                <div className="color">
                  <input
                    type="color"
                    value={bg}
                    onChange={e => {
                      setBg(e.target.value);
                      setPreset('');
                    }}
                  />

                  <code>{bg}</code>
                </div>
              </div>

              <div className="full">
                <label>
                  Size <output>{size}px</output>
                </label>

                <input
                  type="range"
                  min="180"
                  max="600"
                  step="10"
                  value={size}
                  onChange={e => {
                    setSize(+e.target.value);
                    setPreset('');
                  }}
                />
              </div>

              <div>
                <label>Error correction</label>

                <select
                  value={level}
                  onChange={e => {
                    setLevel(e.target.value);
                    setPreset('');
                  }}
                >
                  <option value="L">L — 7%</option>
                  <option value="M">M — 15%</option>
                  <option value="Q">Q — 25%</option>
                  <option value="H">H — 30%</option>
                </select>
              </div>

              <div>
                <label>
                  Margin <output>{margin}</output>
                </label>

                <input
                  type="range"
                  min="0"
                  max="10"
                  value={margin}
                  onChange={e => {
                    setMargin(+e.target.value);
                    setPreset('');
                  }}
                />
              </div>

              <div className="full">
                <label>QR pattern</label>

                <select
                  value={pattern}
                  onChange={e => {
                    setPattern(e.target.value);
                    setPreset('');
                  }}
                >
                  {patterns.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feature-box full">
                <div className="feature-title">
                  <label>Gradient</label>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={gradient}
                      onChange={e => {
                        setGradient(e.target.checked);
                        setPreset('');
                      }}
                    />
                    <span />
                  </label>
                </div>

                {gradient && (
                  <div className="gradient-controls">
                    <div>
                      <label>Second color</label>

                      <div className="color">
                        <input
                          type="color"
                          value={gradientColor}
                          onChange={e =>
                            setGradientColor(e.target.value)
                          }
                        />

                        <code>{gradientColor}</code>
                      </div>
                    </div>

                    <div>
                      <label>
                        Angle <output>{gradientRotation}°</output>
                      </label>

                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradientRotation}
                        onChange={e =>
                          setGradientRotation(+e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="feature-box full">
                <div className="feature-title">
                  <div>
                    <label>Logo</label>
                    <small>Add a logo to the centre of your QR</small>
                  </div>

                  {logo && (
                    <button
                      className="remove-logo"
                      onClick={removeLogo}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <label className="upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogo}
                  />

                  <span>＋ Choose image</span>
                  <small>{logoName || 'PNG, JPG, SVG or WEBP'}</small>
                </label>
              </div>
            </div>

            <div
              className={
                'scan ' +
                (ratio >= 4.5
                  ? 'good'
                  : ratio >= 3
                  ? 'okay'
                  : 'low')
              }
            >
              <b>{ratio >= 3 ? '✓' : '!'}</b>

              <span>
                <strong>{readability} contrast</strong>

                <small>
                  Contrast ratio {ratio.toFixed(1)}:1 ·
                  customization is checked for readability.
                </small>
              </span>
            </div>

            <div className="presets">
              <label>
                Quick presets
                <small>Fine-tune after selecting one</small>
              </label>

              <div>
                {Object.keys(presets).map(name => (
                  <button
                    className={preset === name ? 'selected' : ''}
                    onClick={() => applyPreset(name)}
                    key={name}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="panel preview">
            <div className="heading">
              <h2>
                <small>03</small>
                Live preview
              </h2>

              <button
                onClick={copyQR}
                disabled={!!error}
              >
                Copy QR
              </button>
            </div>

            <div className="stage">
              {error ? (
                <div className="empty">
                  QR preview
                  <br />
                  <small>Enter valid information</small>
                </div>
              ) : (
                <div
                  ref={stageRef}
                  className="qr-render"
                />
              )}

              <span className="live">● LIVE</span>
            </div>

            <div className="meta">
              <div>
                <small>TYPE</small>
                <b>{types[type].name}</b>
              </div>

              <div>
                <small>ERROR</small>
                <b>{level}</b>
              </div>

              <div>
                <small>SIZE</small>
                <b>
                  {size} × {size}
                </b>
              </div>
            </div>

            <div className="download-grid">
              <button
                className="download"
                onClick={() => download('png')}
                disabled={!!error}
              >
                ↓ Download PNG
              </button>

              <button
                className="download secondary"
                onClick={() => download('svg')}
                disabled={!!error}
              >
                ↓ Download SVG
              </button>
            </div>

            <p className="note">
              High-quality PNG or scalable SVG · Matches the live preview
            </p>
          </section>
        </div>

        <section className="recent">
          <div className="heading">
            <h2>
              <small>04</small>
              Recent QR codes
            </h2>

            <span>Saved locally</span>
          </div>

          {recent.length ? (
            <div className="recent-grid">
              {recent.map(item => (
                <button
                  className="recent-card"
                  key={item.id}
                  onClick={() => loadRecent(item)}
                >
                  <div className="recent-icon">QR</div>

                  <span>
                    <b>{types[item.type]?.name || 'QR Code'}</b>
                    <small>{item.value}</small>
                  </span>

                  <em>Reuse →</em>
                </button>
              ))}
            </div>
          ) : (
            <div className="none">
              Your recent QR codes will appear here after you
              create or download one.
            </div>
          )}
        </section>

        <footer>
          <b>QR Studio</b>
          
        </footer>
      </main>

      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);