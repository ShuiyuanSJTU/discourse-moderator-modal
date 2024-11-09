import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";

const REMOVE_REASONS = [
  {
    id: "political",
    name: "五(一) 政治敏感",
    announcementContent: "**第五条** 以下内容被界定为“有害信息”：\n\n（一） 政治敏感的；",
    hideReason: false
  },
  {
    id: "disturbance",
    name: "五(二) 扰乱秩序",
    announcementContent: "**第五条** 以下内容被界定为“有害信息”：\n\n（二） 扰乱秩序的；",
    hideReason: false
  },
  {
    id: "discrimination",
    name: "六(六) 歧视",
    announcementContent: "**第六条** 以下内容被界定为“不良信息”：\n\n（六）引起对立，煽动人群歧视、地域歧视等，歧视、攻击特定的身份的；",
    hideReason: false
  },
  {
    id: "personal_attack",
    name: "六(七) 损害他人名誉-不文明语言",
    announcementContent: "**第六条** 以下内容被界定为“不良信息”：\n\n（七）损害他人名誉的内容，主要表现为：\n\n1. 以不文明的语言对他人进行的负面评价；",
    hideReason: false
  },
  {
    id: "nibufuqi",
    name: "六(十一) 上级指导部门认定为不当言论",
    announcementContent: "**第六条** 以下内容被界定为“不良信息”：\n\n（十一）上级指导部门认定为不当言论的。",
    hideReason: false
  },
  {
    id: "spam",
    name: "七(一) 垃圾信息",
    announcementContent: "**第七条** 以下内容被界定为“垃圾信息”：\n\n（一）误导性的、引起事端的、激化矛盾的内容，主要表现为：\n\n1. 使用夸张标题，或内容与标题相关性低的；\n2. 捏造、夸大、扭曲、隐藏细节或整体事实的；\n3. 搭配错误图文、过期信息、虚构情景的；\n4. 曲解原意，偷换概念，断章取义的；\n5. 使用缩写、简称、同源字、谐音字、形近字、通假字等引起歧义的；\n6. 未标注来源的利用深度学习、虚拟现实等生成合成类算法制作的文本、图像、音频、视频、虚拟场景等。",
    hideReason: false
  },
  {
    id: "provocation",
    name: "九(二) 不友善行为",
    announcementContent: "**第九条** 以下行为被界定为“不友善行为”：\n\n（二）激怒特定用户或群体，诱导其回应。",
    hideReason: false
  },
  {
    id: "other",
    name: "十四 其他",
    announcementContent: "**第十四条** 其他违反法律、行政法规，以及违反上海交通大学有关规章制度的内容或行为。",
    hideReason: false
  },
  {
    id: "custom",
    name: "自定义",
    announcementContent: "",
    hideReason: false
  },
  {
    id: "do_not_announce",
    name: "删除但不公示",
    announcementContent: "",
    hideReason: true
  }
];

const REMOVE_ANNOUNCEMENT_TEMPLATE = `!{target}

账号：@!{username}

[quote="system, post:1, topic:264238"]
!{reason}
[/quote]

处理意见：**删除内容**

---

对以上处理有异议的，请按[相关规定](https://shuiyuan.sjtu.edu.cn/faq#h-5)提出复议申请。
`;

export function addCustomReason(reason) {
  REMOVE_REASONS.splice(REMOVE_REASONS.length - 2, 0, reason);
}

export default class RemovePost extends Component {
  @service siteSettings;
  @service modal;

  @tracked reason = REMOVE_REASONS[0];
  @tracked isSaving = false;
  @tracked submitted = false;
  @tracked announcementContent;

  constructor() {
    super(...arguments);
    this.model = this.args.model;
    this.announcementContent = this.announcementContentFromTemplate();
  }

  announcementContentFromTemplate() {
    if (!this.reason) {
      return "";
    }
    const target = `${this.isTopic ? "话题" : "帖子"}编号：${this.targetId}`;
    return REMOVE_ANNOUNCEMENT_TEMPLATE
      .replace("!{target}", target)
      .replace("!{reason}", this.reason.announcementContent)
      .replace("!{username}", this.model.reviewable.target_created_by.username);
  }


  get customPlaceholder() {
    return "place holder";
  }

  get postNumber() {
    const targetUrl = new URL(this.model.reviewable.target_url);
    const pathSegments = targetUrl.pathname.split('/').filter(segment => segment);
    return parseInt(pathSegments[pathSegments.length - 1], 10);
  }

  get topicId() {
    const targetUrl = new URL(this.model.reviewable.target_url);
    const pathSegments = targetUrl.pathname.split('/').filter(segment => segment);
    return parseInt(pathSegments[pathSegments.length - 2], 10);
  }

  get targetId() {
    return this.postNumber === 1 ? `${this.topicId}` : `${this.topicId}/${this.postNumber}`;
  }

  get isTopic() {
    return this.postNumber === 1;
  }

  get reasonOptions() {
    return REMOVE_REASONS;
  }

  get confirmButtonLabel() {
    if(this.reason.id === "do_not_announce") {
      return "discourse_moderation_announcement.confirm_delete_but_not_announce";
    } else {
      return "discourse_moderation_announcement.confirm_delete_and_announce";
    }
  }

  @action
  setReason(reasonId) {
    this.reason = this.reasonOptions.find(option => option.id === reasonId);
    this.announcementContent = this.announcementContentFromTemplate();
  }

  @action
  async confirmDelete() {
    const additionalData = {
      reason_id: this.reason.id,
      announcement_content: this.announcementContent,
      should_announce: !this.reason.hideReason
    };
    await this.model.performConfirmed(this.model.action, additionalData);
    await this.args.closeModal();
  }

}