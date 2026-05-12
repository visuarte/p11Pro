// components/Settings/IccProfileSelector.tsx
import React, { useState } from 'react';
import { listIccProfiles, IccProfile } from '../../shared/iccProfileManager';

export const IccProfileSelector: React.FC<{
  selected: string;
  onChange: (profile: string) => void;
  type: 'input' | 'output';
}> = ({ selected, onChange, type }) => {
  const [profiles] = useState<IccProfile[]>(() =>
    listIccProfiles().filter(p => p.type === type)
  );

  return (
    <div>
      <label htmlFor={`icc-profile-select-${type}`}>Perfil ICC ({type}):</label>
      <select
        id={`icc-profile-select-${type}`}
        value={selected}
        onChange={e => onChange(e.target.value)}
      >
        {profiles.map(profile => (
          <option key={profile.name} value={profile.name}>{profile.name}</option>
        ))}
      </select>
    </div>
  );
};

