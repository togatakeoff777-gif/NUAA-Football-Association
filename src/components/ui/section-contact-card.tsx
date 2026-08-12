import type { PublicSectionContact } from "@/types";

export function SectionContactCard({
  contact,
  note,
}: {
  contact: PublicSectionContact;
  note?: string;
}) {
  return (
    <aside className="section-contact-card" aria-label={contact.label}>
      <div className="section-contact-heading">
        <span>CONTACT</span>
        <h2>{contact.label}</h2>
      </div>
      <div className="section-contact-person">
        <strong>{contact.name}</strong>
        <span>{contact.role}</span>
      </div>
      {note ? <p>{note}</p> : null}
      <dl>
        <div>
          <dt>咨询 QQ</dt>
          <dd>{contact.qq}</dd>
        </div>
        <div>
          <dt>联系邮箱</dt>
          <dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd>
        </div>
      </dl>
    </aside>
  );
}
