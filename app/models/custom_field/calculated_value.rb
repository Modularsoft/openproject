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

# Methods for custom fields with a format of "calculated value".
# Should be included in the CustomField model.
module CustomField::CalculatedValue
  extend ActiveSupport::Concern

  # Mathematical operators that are allowed in the formula.
  OPERATORS = %w[+ - * / ( )].freeze

  # Field formats that can be used within a formula.
  FIELD_FORMATS_FOR_FORMULA = %w[int float calculated_value].freeze

  included do
    validate :validate_formula

    def validate_formula
      return unless field_format_calculated_value?

      if formula_string.blank?
        errors.add(:formula, :blank)
        return
      end

      unless formula_contains_only_allowed_characters?
        errors.add(:formula, :invalid_characters)
        return
      end

      unless valid_formula_syntax?
        errors.add(:formula, :invalid)
        return
      end

      # WP-64348: check for valid (i.e., visible & enabled) custom field references (see #cf_ids_used_in_formula)

      # TODO: consider differentiating between a formula that contains missing variables, invalid
      #       syntax, or mathematical errors.
      true # return anything to appease RuboCop for now
    end

    def formula=(value)
      if value.is_a?(String)
        super({ formula: value, referenced_custom_fields: cf_ids_used_in_formula(value) })
      else
        super
      end
    end

    # Returns the formula as a string. Will return an empty string if the formula is not set.
    def formula_string
      formula ? formula.fetch("formula", "") : ""
    end

    def usable_custom_field_references_for_formula
      scope = type == "ProjectCustomField" ? ProjectCustomField : CustomField

      scope
        .where(field_format: FIELD_FORMATS_FOR_FORMULA)
        # Disallow the current custom field to avoid circular references
        .where.not(id: id)
        .visible
    end

    private

    def calculator
      @calculator ||= Dentaku::Calculator.new(case_sensitive: true)
    end

    def valid_formula_syntax?
      # Accept both cf_123 and {{cf_123}} in the formula string
      f = formula_string.gsub(/\{\{(cf_\d+)}}/, '\1')

      # Attempt to parse the formula. If no error is returned, the formula is syntactically valid.
      calculator.ast(f)
      true
    rescue Dentaku::ParseError, Dentaku::TokenizerError
      false
    end

    def formula_contains_only_allowed_characters?
      # List of allowed characters in a formula. This only performs a very basic validation.
      # The allowed characters are:
      # Our mathematical operators, whitespace, digits and decimal points
      # Additionally, the formula may contain references to custom fields in the form of `cf_123` or `{{cf_123}}`
      # where 123 is the ID of the custom field.
      # Once this basic validation passes, the formula will be parsed and validated by Dentaku, which builds an AST
      # and ensures that the formula is really valid. A welcome side effect of the basic validation done here is that
      # it prevents built-in functions from being used in the formula, which we do not want to allow.
      allowed_chars = OPERATORS + [" "]
      allowed_tokens = /\A(cf_\d+|\{\{cf_\d+}}|\d+\.?\d*|\.\d+)\z/

      formula_string.split(Regexp.union(allowed_chars)).reject(&:empty?).all? do |token|
        token.match?(allowed_tokens)
      end
    end

    # Returns a list of custom field IDs used in the formula.
    # For a formula like `2 + cf_12 + cf_4` or `2 + {{cf_12}} + {{cf_4}}` it returns `[12, 4]`.
    def cf_ids_used_in_formula(formula_str)
      # Match both cf_123 and {{cf_123}}
      formula_str.scan(/\b(?:cf_(\d+)|\{\{cf_(\d+)}})\b/).flatten.compact.map(&:to_i)
    end
  end
end
