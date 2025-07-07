# frozen_string_literal: true

class CreateGoodJobExecutions < ActiveRecord::Migration[7.0]
  def change
    # Moved to db/migrate/tables/good_job_executions.rb and db/migrate/tables/good_jobs.rb
    # This file is not squashed since good_job would otherwise recreate it when an update is done.
  end
end
