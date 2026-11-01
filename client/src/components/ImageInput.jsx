import { useState } from 'react';
import api, { errMsg } from '../lib/api.js';
import Img from './Img.jsx';

/** Manage a list of image URLs: upload files to the server or paste a URL. */
export default function ImageInput({ value = [], onChange, multiple = true }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addUrls = (urls) => onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));

  const upload = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setBusy(true);
    setError('');
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    try {
      const { data } = await api.post('/upload', form);
      addUrls(data.urls);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="image-input">
      {value.length > 0 && (
        <div className="image-input__list">
          {value.map((src, i) => (
            <div key={src + i} className="image-input__item">
              <Img src={src} alt="" />
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove image">✕</button>
              {i === 0 && multiple && <span>Cover</span>}
            </div>
          ))}
        </div>
      )}
      <div className="inline-form">
        <label className="pill pill--ghost file-btn">
          {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/*" multiple={multiple} onChange={upload} hidden />
        </label>
        <input className="input" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button
          type="button"
          className="pill pill--ghost"
          onClick={() => {
            if (url.trim()) addUrls([url.trim()]);
            setUrl('');
          }}
        >
          Add
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
