import { useState } from "react";
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
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("Upload PNG or JPG");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);

  const canSubmit =
    name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    phone.trim().length >= 7 &&
    region;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setAvatarDataUrl("");
      setSelectedFileName("Upload PNG or JPG");
      return;
    }

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarDataUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      avatarDataUrl,
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
            <div className="login-subtitle">Cloud editor, compiler, and preview lab</div>
            <div className="login-info">
              Sign in to keep your workspace, open instant previews for HTML, CSS, and SQL,
              and continue from any device.
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-top">
            <div className="login-card-title">Sign in</div>
            <div className="login-card-muted">
              Add your details to continue into your workspace.
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Profile photo</span>
              <div className="dp-row">
                <div className="dp-preview" aria-hidden="true">
                  {avatarDataUrl ? (
                    <img src={avatarDataUrl} alt="" />
                  ) : (
                    <div className="dp-placeholder">VL</div>
                  )}
                </div>

                <div className="file-picker-wrap">
                  <input
                    id="voidlab-avatar-upload"
                    className="file-input-hidden"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label className="file-picker" htmlFor="voidlab-avatar-upload">
                    <span className="file-picker-button">Choose Photo</span>
                    <span className="file-picker-name">{selectedFileName}</span>
                  </label>
                </div>
              </div>
            </label>

            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPhone(event.target.value)}
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
                onChange={(event) => setRegion(event.target.value)}
              >
                {REGIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button className="login-btn" type="submit" disabled={!canSubmit}>
              Continue to VoidLAB Beta
            </button>

            <div className="login-footnote">
              Beta build. Preview workflows and mobile layouts are now included.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
