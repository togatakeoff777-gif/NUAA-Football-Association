export type AdminAffiliationOption = {
  id: string;
  name: string;
  label: string;
  type: "COLLEGE" | "SHUYUAN";
};

export function AdminAffiliationOptionGroups({ options }: { options: AdminAffiliationOption[] }) {
  const colleges = options.filter((option) => option.type === "COLLEGE");
  const shuyuan = options.filter((option) => option.type === "SHUYUAN");
  return <>
    {colleges.length ? <optgroup label="学院">{colleges.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</optgroup> : null}
    {shuyuan.length ? <optgroup label="书院">{shuyuan.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</optgroup> : null}
  </>;
}
