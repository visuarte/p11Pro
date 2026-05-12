// components/Settings/LanguageSelector.tsx
import React, { useState } from 'react';
import fs from 'fs';
import path from 'path';

const LANG_DIR = path.resolve(__dirname, '../../../../languages');

export const LanguageSelector: React.FC<{
  current: string;
  onChange: (lang: string) => void;
}> = ({ current, onChange }) => {
  // Listar idiomas leyendo los archivos de la carpeta languages
  const [languages] = useState(() =>
    fs.readdirSync(LANG_DIR)
      .filter(f => !f.startsWith('.') && !f.endsWith('README') && !f.endsWith('LICENSE'))
  );

  return (
    <div>
      <label htmlFor="language-select">Idioma:</label>
      <select
        id="language-select"
        value={current}
        onChange={e => onChange(e.target.value)}
      >
        {languages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
    </div>
  );
};

