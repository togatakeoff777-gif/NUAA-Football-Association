import Link from "next/link";
import {
  formatLabels,
  refereeAssignmentPublications,
  refereeRoleDefinitions,
  refereeRoleTemplateNotes,
  rolePublicationLabels,
} from "@/data/referees";
import type {
  RefereeAssignmentPublication,
  RoleAssignment,
} from "@/types";

function getOrderedRoles(publication: RefereeAssignmentPublication) {
  return refereeRoleDefinitions
    .filter((definition) => definition.format === publication.format)
    .sort((a, b) => a.order - b.order)
    .map((definition) => {
      const assignment = publication.roles.find(
        (item) => item.roleKey === definition.key,
      );

      const safeAssignment: RoleAssignment = assignment ?? {
        roleKey: definition.key,
        enabled: false,
        status: "not-set",
      };

      return { definition, assignment: safeAssignment };
    });
}

export function AssignmentPublication() {
  return (
    <main className="detail-page" id="main-content">
      <section className="detail-hero">
        <div className="detail-shell detail-hero-grid">
          <div className="detail-hero-copy">
            <p className="detail-eyebrow">REFEREE APPOINTMENTS</p>
            <h1 className="detail-title">裁判员选派公示</h1>
            <p className="detail-lede">
              以稳定岗位键值、规范中文术语和按场次配置的启用状态展示选派信息。
            </p>
            <div className="detail-actions">
              <Link
                className="detail-button detail-button-secondary"
                href="/referees"
              >
                返回裁判与规则
              </Link>
              <Link className="detail-button" href="/referees/open-matches">
                查看开放场次
              </Link>
            </div>
          </div>
          <div className="detail-hero-panel">
            <span className="detail-badge">演示公示</span>
            <strong>所有岗位固定显示，启用情况按场次配置</strong>
            <p>
              未启用岗位显示“本场未设置”；已启用但尚无人员显示“待选派”。演示姓名不代表真实人员。
            </p>
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="publication-title">
        <div className="detail-shell">
          <div className="detail-section-head">
            <div>
              <p className="detail-kicker">选派状态 / ASSIGNMENT STATUS</p>
              <h2 className="detail-section-title" id="publication-title">
                场次岗位配置原型
              </h2>
            </div>
            <div className="detail-status-legend" aria-label="选派状态说明">
              {Object.entries(rolePublicationLabels).map(([status, label]) => (
                <span className={`detail-status detail-status-${status}`} key={status}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-stack">
            {refereeAssignmentPublications.map((publication) => (
              <article className="detail-card detail-publication" key={publication.id}>
                <div className="detail-card-head">
                  <div>
                    <span className="detail-badge">演示数据</span>
                    <h3 className="detail-card-title">{publication.competition}</h3>
                  </div>
                  <span className="detail-format-badge">
                    {formatLabels[publication.format]}
                  </span>
                </div>

                <dl className="detail-meta-grid">
                  <div className="detail-meta-item">
                    <dt>日期</dt>
                    <dd>{publication.date}</dd>
                  </div>
                  <div className="detail-meta-item">
                    <dt>场地</dt>
                    <dd>{publication.venue}</dd>
                  </div>
                  <div className="detail-meta-item">
                    <dt>对阵</dt>
                    <dd>{publication.matchup}</dd>
                  </div>
                </dl>

                <div className="detail-table-wrap">
                  <table className="detail-table">
                    <caption className="detail-table-caption">
                      {formatLabels[publication.format]}裁判岗位选派情况
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">顺序</th>
                        <th scope="col">岗位</th>
                        <th scope="col">状态</th>
                        <th scope="col">选派人员</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getOrderedRoles(publication).map(
                        ({ definition, assignment }) => (
                          <tr key={`${publication.id}-${definition.key}`}>
                            <td>{definition.order}</td>
                            <th scope="row">{definition.label}</th>
                            <td>
                              <span
                                className={`detail-status detail-status-${assignment.status}`}
                              >
                                {rolePublicationLabels[assignment.status]}
                              </span>
                            </td>
                            <td>
                              {assignment.enabled && assignment.assignee
                                ? assignment.assignee
                                : "—"}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <ul className="detail-note-list">
                  {refereeRoleTemplateNotes[publication.format].map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
