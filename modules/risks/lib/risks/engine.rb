# Prevent load-order problems in case openproject-plugins is listed after a plugin in the Gemfile
# or not at all
require "open_project/plugins"

module Risks
  class Engine < ::Rails::Engine
    engine_name :risks

    include OpenProject::Plugins::ActsAsOpEngine

    initializer "risks.menu" do
      ::Redmine::MenuManager.map(:project_menu) do |menu|
        menu.push(:risks,
                  { controller: "/risks/risks", action: "index" },
                  caption: :"risks.label",
                  if: ->(project) {
                    OpenProject::FeatureDecisions.risk_management_active? &&
                      User.current.allowed_in_project?(:view_work_packages, project)
                  },
                  after: :work_packages,
                  icon: :alert)
      end
    end

    initializer "risks.permissions" do
      Rails.application.reloader.to_prepare do
        OpenProject::AccessControl.map do |ac_map|
          ac_map.project_module(
            :risks,
            if: ->(*) { OpenProject::FeatureDecisions.risk_management_active? }
          )
        end

        OpenProject::AccessControl
          .permission(:view_work_packages)
          .controller_actions << "risks/risks/index"
      end
    end
  end
end
