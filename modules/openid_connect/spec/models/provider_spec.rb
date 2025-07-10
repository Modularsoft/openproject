# frozen_string_literal: true

#-- copyright
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
#++
require "spec_helper"

RSpec.describe OpenIDConnect::Provider do
  let(:provider) do
    create(:oidc_provider, options: {
             "grant_types_supported" => supported_grant_types
           })
  end
  let(:supported_grant_types) { %w[authorization_code implicit] }

  describe "#token_exchange_capable?" do
    subject { provider.token_exchange_capable? }

    it { is_expected.to be_falsey }

    context "when the provider supports the token exchange grant" do
      let(:supported_grant_types) { %w[authorization_code implicit urn:ietf:params:oauth:grant-type:token-exchange] }

      it { is_expected.to be_truthy }
    end

    context "when supported grant types are nil (legacy providers)" do
      let(:supported_grant_types) { nil }

      it { is_expected.to be_falsey }
    end
  end

  describe "#group_matchers" do
    subject { provider.group_matchers }

    let(:provider) { create(:oidc_provider, group_prefixes:, group_regexes:) }

    context "when prefixes and regular expressions were never defined" do
      let(:group_prefixes) { nil }
      let(:group_regexes) { nil }

      it { is_expected.to eq([/(.+)/]) }
    end

    context "when prefixes and regular expressions are empty" do
      let(:group_prefixes) { [] }
      let(:group_regexes) { [] }

      it { is_expected.to eq([/(.+)/]) }
    end

    context "when prefixes were defined" do
      let(:group_prefixes) { ["a_", "b_"] }
      let(:group_regexes) { [] }

      it { is_expected.to eq([/^a_(.+)$/, /^b_(.+)$/]) }

      context "and when prefix contains regular expression special characters" do
        let(:group_prefixes) { ["pre.fix", "(prefix)"] }

        it { is_expected.to eq([/^pre\.fix(.+)$/, /^\(prefix\)(.+)$/]) }
      end
    end

    context "when regular expressions were defined" do
      let(:group_prefixes) { [] }
      let(:group_regexes) { ["[a-z_]+", "^specific_group_name$"] }

      it { is_expected.to eq([/[a-z_]+/, /^specific_group_name$/]) }
    end

    context "when prefixes and regular expressions were defined" do
      let(:group_prefixes) { ["a"] }
      let(:group_regexes) { [/[b]/] }

      it { is_expected.to eq([/^a(.+)$/]) }
    end
  end
end
