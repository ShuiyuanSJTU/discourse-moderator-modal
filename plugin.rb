# frozen_string_literal: true

# name: discourse-moderation-announcement
# about: TODO
# meta_topic_id: TODO
# version: dev
# authors: pangbo
# url: TODO
# required_version: 2.7.0

enabled_site_setting :moderation_announcement_enabled

module ::DiscourseModeratorModal
  PLUGIN_NAME = "discourse-moderation-announcement"
end

register_asset "stylesheets/common/remove-post-modal.scss"

# require_relative "lib/my_plugin_module/engine"

after_initialize do
  add_permitted_reviewable_param(:ReviewableFlaggedPost, :reason_id)
  add_permitted_reviewable_param(:ReviewableFlaggedPost, :announcement_content)
  add_permitted_reviewable_param(:ReviewableFlaggedPost, :should_announce)

  module ::DiscourseModeratorModal
    module OverrideReviewableFlaggedPost
      def perform_delete_and_agree(performed_by, args)
        result = super(performed_by, args)
        if args["should_announce"] == "true" &&
             SiteSetting.moderation_announcement_deletion_topic_id != -1
          PostCreator.new(
            performed_by,
            raw: args["announcement_content"],
            topic_id: SiteSetting.moderation_announcement_deletion_topic_id,
          ).create!
        end
        result
      end
    end
  end
  ReviewableFlaggedPost.prepend ::DiscourseModeratorModal::OverrideReviewableFlaggedPost
end
