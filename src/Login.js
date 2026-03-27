import { useMemo, useState } from "react";
import "./Login.css";

const REGIONS = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Middle East",
  "South Asia",
  "East Asia",
  "Southeast Asia",
  "Oceania",
];

export default function Login({ brandImageSrc, onSubmit }) {
  const [dpFile, setDpFile] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);

  const dpPreviewUrl = useMemo(() => {
    if (!dpFile) return "";
    return URL.createObjectURL(dpFile);
  }, [dpFile]);

  const canSubmit =
    name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    phone.trim().length >= 7 &&
    region;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      dpPreviewUrl,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      region,
    });
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <div className="login-shell">
        <div className="login-left">
          <img
            className="login-hero-image"
            src={brandImageSrc}
            alt="VoidLAB Beta"
            draggable="false"
          />

          <div className="login-copy">
            <div className="login-kicker">Welcome to</div>
            <div className="login-title">
              VoidLAB <span className="login-beta">Beta</span>
            </div>
            <div className="login-subtitle">Cloud editor and compiler</div>
            <div className="login-info">
              Sign in to sync your workspace, keep your code cache, and run
              snippets instantly.
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-top">
            <div className="login-card-title">Sign in</div>
            <div className="login-card-muted">
              Add your details to continue.
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">DP</span>
              <div className="dp-row">
                <div className="dp-preview" aria-hidden="true">
                  {dpPreviewUrl ? (
                    <img src={dpPreviewUrl} alt="" />
                  ) : (
                    <div className="dp-placeholder">+</div>
                  )}
                </div>
                <input
                  className="input file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDpFile(e.target.files?.[0] || null)}
                />
              </div>
            </label>

            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                autoComplete="email"
                inputMode="email"
              />
            </label>

            <label className="field">
              <span className="field-label">Phone</span>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0100"
                autoComplete="tel"
                inputMode="tel"
              />
            </label>

            <label className="field">
              <span className="field-label">Region</span>
              <select
                className="input select"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <button className="login-btn" type="submit" disabled={!canSubmit}>
              Continue to VoidLAB Beta
            </button>

            <div className="login-footnote">
              This is a beta experience — expect rapid improvements.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

