"use client";

import { useState } from "react";

type RefereeApplicationDemoProps = {
  matchId: string;
};

export function RefereeApplicationDemo({
  matchId,
}: RefereeApplicationDemoProps) {
  const [isRecorded, setIsRecorded] = useState(false);
  const statusId = `${matchId}-application-status`;

  return (
    <div className="detail-application-demo">
      <button
        className="detail-button"
        type="button"
        aria-describedby={statusId}
        onClick={() => setIsRecorded(true)}
        disabled={isRecorded}
      >
        {isRecorded ? "已记录演示意向" : "报名本场比赛"}
      </button>
      <p className="detail-demo-note" id={statusId} aria-live="polite">
        {isRecorded
          ? "已在当前页面记录演示状态；不会保存，也不会真实提交。"
          : "演示功能，不会真实提交"}
      </p>
    </div>
  );
}
