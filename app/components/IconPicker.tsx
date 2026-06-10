'use client';

import { useMemo, useRef, useState, type ChangeEvent, type ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X } from 'lucide-react';

type IconPickerProps = {
  value: string;
  onChange: (iconName: string) => void;
  onClose: () => void;
};

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);

  const iconList = useMemo(() => {
    return Object.keys(LucideIcons).filter(
      (key) =>
        key !== 'createLucideIcon' &&
        key !== 'default' &&
        key !== 'Icon' &&
        isNaN(Number(key)) &&
        !key.endsWith('Icon'),
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return iconList;
    return iconList.filter((key) => key.toLowerCase().includes(q));
  }, [iconList, search]);

  const visibleIcons = filtered.slice(0, limit);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setLimit(60);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      setLimit((prev) => Math.min(prev + 60, filtered.length));
    }
  };

  return (
    <div className="icon-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="icon-picker-panel"
        role="dialog"
        aria-labelledby="icon-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="icon-picker-header">
          <h3 id="icon-picker-title" className="icon-picker-title">
            Select Icon
          </h3>
          <button type="button" className="icon-picker-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="icon-picker-search-wrap">
          <Search className="icon-picker-search-icon" size={18} aria-hidden />
          <input
            type="search"
            className="icon-picker-search"
            placeholder="Search icons..."
            value={search}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>
        <div ref={containerRef} onScroll={handleScroll} className="icon-picker-scroll">
          <div className="icon-picker-grid">
            {visibleIcons.map((iconName) => {
              const Icon = (
                LucideIcons as unknown as Record<
                  string,
                  ComponentType<{ size?: number; strokeWidth?: number }>
                >
              )[iconName];
              if (!Icon) return null;
              const isSelected = value === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  className={`icon-picker-tile${isSelected ? ' icon-picker-tile--selected' : ''}`}
                  onClick={() => onChange(iconName)}
                >
                  <Icon size={24} strokeWidth={1.5} />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="icon-picker-empty">No icons found matching &quot;{search}&quot;</p>
            )}
            {visibleIcons.length < filtered.length && (
              <p className="icon-picker-loading">Loading more...</p>
            )}
          </div>
        </div>
        <div className="icon-picker-footer">
          Showing {visibleIcons.length} of {filtered.length} icons
        </div>
      </div>
    </div>
  );
}
