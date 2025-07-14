# frozen_string_literal: true

#-- copyright
#++

module Storages
  class SharepointStorage < Storage
    store_attribute :provider_fields, :tenant_id, :string

    def self.short_provider_name = :sharepoint
    def audience = nil

    def authenticate_via_idp? = false

    def authenticate_via_storage? = true

    def available_project_folder_modes
      if automatic_management_enabled?
        ProjectStorage.project_folder_modes.keys
      else
        %w[inactive manual]
      end
    end

    # To implement
    # oauth_configuration
    # configuration_checks
    # automatic_management_new_record?
    # provider_fields_defaults
  end
end
