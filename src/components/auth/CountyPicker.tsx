import React, { useMemo } from 'react';
import { KENYAN_COUNTIES } from '../../constants/kenyaCounties';
import { AuthSelect } from './AuthSelect';

type Props = {
  value: string;
  onChange: (county: string) => void;
  placeholder?: string;
};

export function CountyPicker({ value, onChange, placeholder = 'Search county…' }: Props) {
  const options = useMemo(
    () => KENYAN_COUNTIES.map((c) => ({ id: c, label: c })),
    [],
  );

  return (
    <AuthSelect
      value={value || null}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      title="Select county"
      icon="location-outline"
      emptyText="No county matches that search"
    />
  );
}
