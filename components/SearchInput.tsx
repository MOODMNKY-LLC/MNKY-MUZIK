'use client';

import qs from 'query-string';

import useDebounce from '@/hooks/useDebounce';

import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { Input } from './Input';

interface SearchInputProps {
  initialQuery?: string;
}

export const SearchInput = ({ initialQuery = '' }: SearchInputProps) => {
  const router = useRouter();
  const [value, setValue] = useState<string>(initialQuery);
  const debouncedValue = useDebounce<string>(value, 500);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const query = {
      title: debouncedValue,
    };

    const url = qs.stringifyUrl({
      url: '/search',
      query: query,
    });
    router.push(url);
  }, [debouncedValue, router]);

  return (
    <Input
      placeholder="Search by artist, song, or album"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};
