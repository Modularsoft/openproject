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

module ::Overviews
  class StatusReportController < ::ApplicationController
    before_action :authorize
    before_action :find_project_by_project_id

    def create
      result = Overviews::HaystackReportRequest.new(user: current_user).call(@project)

      result.each { |content| persist_report(content) }
      result.on_failure { flash[:error] = result.errors }

      # TODO: Where to redirect? What to show? Document edit view? A modal to edit the report?
      redirect_to project_overview_path(@project)
    end

    private

    def persist_report(content)
      Documents::CreateService.new(user: current_user).call(
        project: @project,
        category: DocumentCategory.first, # TODO: Use something meaningful here
        title: "Report erstellt am #{helpers.format_date(Time.zone.now)}",
        description: content
      )
    end
  end
end
