import { refereeContact } from "@/data/contacts";

export function RefereeContactCard() {
  return (
    <aside
      className="detail-contact-card referee-contact-card"
      id="referee-contact"
      aria-labelledby="referee-contact-title"
    >
      <header className="referee-contact-card-head">
        <p className="detail-kicker">REFEREE AFFAIRS / 裁判事务</p>
        <h2 className="detail-section-title" id="referee-contact-title">
          {refereeContact.name}
        </h2>
        <p>{refereeContact.role}</p>
      </header>
      <div className="referee-contact-card-body">
        <section aria-labelledby="referee-contact-scope-title">
          <h3 id="referee-contact-scope-title">负责事项</h3>
          <ul className="detail-tag-list" aria-label="裁判负责人负责事项">
            {refereeContact.responsibilities.map((responsibility) => (
              <li className="detail-tag" key={responsibility}>
                {responsibility}
              </li>
            ))}
          </ul>
        </section>
        <dl className="referee-contact-channels">
          <div>
            <dt>联系邮箱</dt>
            <dd><a href={`mailto:${refereeContact.email}`}>{refereeContact.email}</a></dd>
          </div>
          <div>
            <dt>咨询 QQ</dt>
            <dd>{refereeContact.qq}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
