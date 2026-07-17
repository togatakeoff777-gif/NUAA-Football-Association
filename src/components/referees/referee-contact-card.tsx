import { refereeContact } from "@/data/contacts";

export function RefereeContactCard() {
  return (
    <aside
      className="detail-contact-card"
      id="referee-contact"
      aria-labelledby="referee-contact-title"
    >
      <p className="detail-kicker">联系卡 / CONTACT</p>
      <h2 className="detail-section-title" id="referee-contact-title">
        {refereeContact.role}：{refereeContact.name}
      </h2>
      <p className="detail-card-copy">负责事项</p>
      <ul className="detail-tag-list" aria-label="裁判负责人负责事项">
        {refereeContact.responsibilities.map((responsibility) => (
          <li className="detail-tag" key={responsibility}>
            {responsibility}
          </li>
        ))}
      </ul>
      <a className="detail-link" href={`mailto:${refereeContact.email}`}>
        联系邮箱：{refereeContact.email}
      </a>
      <p className="detail-note">不公开未经同意的私人手机号码。</p>
    </aside>
  );
}
