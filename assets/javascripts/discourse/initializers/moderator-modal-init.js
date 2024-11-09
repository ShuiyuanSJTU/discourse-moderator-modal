import { withPluginApi } from "discourse/lib/plugin-api";
import RemovePostModal from "../components/modal/remove-post";

export default {
  name: "moderation-announcement",
  initialize() {
    withPluginApi("0.8", api => {
      api.registerReviewableActionModal("delete_and_agree", RemovePostModal);
    });
  }
};