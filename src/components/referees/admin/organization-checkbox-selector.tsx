"use client";

import { useId, useMemo, useState } from "react";

export type OrganizationCheckboxOption = {
  id: string;
  label: string;
  description?: string;
};

export function OrganizationCheckboxSelector({
  legend,
  options,
  selectedValues,
  onChange,
  lockedValues = [],
  searchPlaceholder = "搜索学院或书院…",
  emptyText = "没有符合条件的组织单位。",
}: {
  legend: string;
  options: OrganizationCheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  lockedValues?: string[];
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const locked = useMemo(() => new Set(lockedValues), [lockedValues]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    return normalized
      ? options.filter((option) => `${option.label} ${option.description ?? ""}`.toLocaleLowerCase("zh-CN").includes(normalized))
      : options;
  }, [options, query]);

  function toggle(value: string) {
    onChange(selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value]);
  }

  function selectVisible() {
    const next = new Set(selectedValues);
    for (const option of visible) if (!locked.has(option.id)) next.add(option.id);
    onChange([...next]);
  }

  return <fieldset className="admin-organization-selector">
    <legend>{legend}</legend>
    <div className="admin-selection-toolbar">
      <label className="admin-selector-search" htmlFor={`${id}-search`}>
        <span className="sr-only">{searchPlaceholder}</span>
        <input id={`${id}-search`} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} type="search" value={query} />
      </label>
      <button onClick={selectVisible} type="button">全选当前结果</button>
      <button onClick={() => onChange([])} type="button">清空</button>
      <output aria-live="polite">已选择 {selectedValues.length} 个</output>
    </div>
    <div className="admin-checkbox-list admin-unit-picker">
      {visible.length ? visible.map((option) => {
        const isLocked = locked.has(option.id);
        const checked = isLocked || selectedValues.includes(option.id);
        return <label data-existing={isLocked} data-selected={checked} key={option.id}>
          <input checked={checked} disabled={isLocked} onChange={() => toggle(option.id)} type="checkbox" />
          <span>{option.label}</span>
          {isLocked ? <small>已存在</small> : option.description ? <small>{option.description}</small> : null}
        </label>;
      }) : <p className="admin-selector-empty">{emptyText}</p>}
    </div>
  </fieldset>;
}
