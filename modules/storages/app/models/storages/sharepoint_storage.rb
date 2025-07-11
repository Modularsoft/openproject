# frozen_string_literal: true

#-- copyright
#++

module Storages
  class SharepointStorage < Storage
    def self.short_provider_name = :sharepoint
    def audience = nil

    def authenticate_via_idp? = false

    def authenticate_via_storage? = true
  end
end
