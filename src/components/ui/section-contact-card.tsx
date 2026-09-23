import type { PublicSectionContact } from "@/types";

export function SectionContactCard({
  contact,
  note,
}: {
  contact: Pick<PublicSectionContact, "label"> & Partial<Omit<PublicSectionContact, "label">>;
  note?: string;
}) {
  return (
    <aside className="section-contact-card" aria-label={contact.label}>
      <div className="section-contact-heading">
        <span>CONTACT</span>
        <h2>{contact.label}</h2>
      </div>
      <div className="section-contact-person">
        <strong>{contact.name || "负责人待公布"}</strong>
        {contact.role ? <span>{contact.role}</span> : null}
      </div>
      {note ? <p>{note}</p> : null}
      <dl>
        {contact.qq ? <div>
          <dt>咨询 QQ</dt>
          <dd>{contact.qq}</dd>
        </div> : null}
        {contact.email ? <div>
          <dt>联系邮箱</dt>
          <dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd>
        </div> : null}
      </dl>
    </aside>
  );
}
