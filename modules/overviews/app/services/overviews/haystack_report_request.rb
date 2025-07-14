# frozen_string_literal: true

# -- copyright
# OpenProject is an open source project management software.
# Copyright (C) the OpenProject GmbH
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See COPYRIGHT and LICENSE files for more details.
# ++

class Overviews::HaystackReportRequest
  MAGIC_APPLICATION_NAME = "OpenProject Experimental AI"

  def initialize(user:)
    @user = user
  end

  def call(project)
    response = OpenProject.httpx.post(
      URI.join(base_url, "/generate-project-status-report"),
      json: {
        project: { id: project.id, type: project.type },
        user_token:
      }
    )

    if response.status == 200
      json = JSON.parse(response.body)
      ServiceResult.success(result: json.dig("report", "content"))
    else
      ServiceResult.failure(errors: "Unexpected response from Haystack (HTTP #{response.status})")
    end
  end

  private

  def base_url
    OpenProject::Configuration.haystack_base_url || raise("Missing configuration for OPENPROJECT_HAYSTACK_BASE_URL")
  end

  def user_token
    oauth_application.access_tokens.create!(scopes: "api_v3", expires_in: 5.minutes, resource_owner_id: @user.id).plaintext_token
  end

  def oauth_application
    find_oauth_application || create_oauth_application
  end

  def find_oauth_application
    # POST-HACKATHON: Application should probably be associated via an "integration" relation and found by that
    @oauth_application ||= Doorkeeper::Application.find_by(name: MAGIC_APPLICATION_NAME)
  end

  def create_oauth_application
    ::OAuth::Applications::CreateService
      .new(user: User.system)
      .call(
        name: MAGIC_APPLICATION_NAME,
        redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
        scopes: "api_v3",
        confidential: true,
        owner: User.system
      ).result
  end
end
