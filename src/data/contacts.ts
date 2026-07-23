import type { ContactCardData } from "@/types";
import { ASSOCIATION_EMAIL } from "@/data/platforms";

export const refereeContact: ContactCardData = {
  role: "裁判事务负责人",
  name: "待协会确认",
  responsibilities: [
    "招募",
    "培训",
    "比赛报名",
    "选派",
    "临时改派",
    "规则咨询",
  ],
  email: ASSOCIATION_EMAIL,
};
