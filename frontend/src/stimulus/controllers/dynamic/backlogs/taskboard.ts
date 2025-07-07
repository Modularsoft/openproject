//-- copyright
// OpenProject is an open source project management software.
// Copyright (C) the OpenProject GmbH
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See COPYRIGHT and LICENSE files for more details.
//++

import $ from 'jquery';
import { UserPreferences } from './common';
import { Impediment } from './impediment';
import { Model } from './model';
import { Task } from './task';

/***************************************
  TASKBOARD
***************************************/
export class Taskboard extends Model {
  colWidthUnit:number;
  defaultColWidth:number;

  constructor(el:HTMLElement) {
    super(el);

    const self = this; // So we can bind the event handlers to this object

    // Associate this object with the element for later retrieval
    this.$.data('this', this);

    // Initialize column widths
    this.colWidthUnit = 107;
    this.defaultColWidth = 1;
    this.loadColWidthPreference();
    this.updateColWidths();

    $('#col_width_input').on('keyup', (evt:JQuery.TriggeredEvent) => {
      if ((evt as any).which === 13) {
        self.updateColWidths();
      }
    });

    this.initializeTasks();
    this.initializeImpediments();

    this.initializeNewButtons();
    this.initializeSortables();

    this.initializeTaskboardMenus();
  }

  initializeNewButtons():void {
    const self = this;
    this.$.find('#tasks .add_new.clickable').click(self.handleAddNewTaskClick);
    this.$.find('#impediments .add_new.clickable').click(self.handleAddNewImpedimentClick);
  }

  initializeSortables():void {
    const self = this;

    const impedimentSortableOptions:JQueryUI.SortableOptions = {
      placeholder: 'placeholder',
      start: self.dragStart,
      stop: self.dragStop,
      update: self.dragComplete,
      cancel: '.prevent_edit',
    };

    this.$.find('#impediments .list')
      .sortable(impedimentSortableOptions)
      .sortable('option', 'connectWith', '#impediments .list');
    $('#impediments .list').disableSelection();

    const list = this.$.find('#tasks .list');

    const augmentList = function ():void {
      const taskSortableOptions:JQueryUI.SortableOptions = {
        placeholder: 'placeholder',
        start: self.dragStart,
        stop: self.dragStop,
        update: self.dragComplete,
        cancel: '.prevent_edit',
      };

      $(list.slice(0, 50)).sortable(taskSortableOptions).sortable('option', 'connectWith', '#tasks .list');
      $('#tasks .list').disableSelection();

      if (list.length > 0) {
        /*globals setTimeout*/
        setTimeout(augmentList, 10);
      }
    };
    augmentList();
  }

  initializeTasks():void {
    this.$.find('.task').each(function (this:HTMLElement, index:number) {
      new Task(this);
    });
  }

  initializeImpediments():void {
    this.$.find('.impediment').each(function (this:HTMLElement, index:number) {
      new Impediment(this);
    });
  }

  initializeTaskboardMenus():void {
    const toggleOpen = 'open icon-pulldown-up icon-pulldown';

    $('.backlog .backlog-menu > div.menu-trigger').on('click', function () {
      $(this).toggleClass(toggleOpen);
    });

    $('.backlog .backlog-menu > ul.items li.item').on('click', function () {
      $(this).closest('.backlog-menu').find('div.menu-trigger').toggleClass(toggleOpen);
    });
  }

  dragComplete(e:JQueryEventObject, ui:JQueryUI.SortableUIParams):void {
    // Handler is triggered for source and target. Thus the need to check.
    const isDropTarget = ui.sender === null;

    if (isDropTarget) {
      ui.item.data('this').saveDragResult();
    }
  }

  dragStart(e:JQueryEventObject, ui:JQueryUI.SortableUIParams):void {
    ui.item.addClass('dragging');
  }

  dragStop(e:JQueryEventObject, ui:JQueryUI.SortableUIParams):void {
    ui.item.removeClass('dragging');
  }

  handleAddNewImpedimentClick(e:JQuery.TriggeredEvent):void {
    const row = $(this).parents('tr').first();
    ($('#taskboard').data('this') as Taskboard).newImpediment(row);
  }

  handleAddNewTaskClick(e:JQuery.TriggeredEvent):void {
    const row = $(this).parents('tr').first();
    ($('#taskboard').data('this') as Taskboard).newTask(row);
  }

  loadColWidthPreference():void {
    let w = UserPreferences.get('taskboardColWidth');
    if (w === null || w === undefined) {
      w = this.defaultColWidth.toString();
      UserPreferences.set('taskboardColWidth', w.toString());
    }
    $('#col_width input').val(w);
  }

  newImpediment(row:JQuery):void {
    let impediment:JQuery;
    let o:Impediment;

    impediment = $('#impediment_template').children().first().clone();
    row.find('.list').first().prepend(impediment);

    o = new Impediment(impediment[0]);
    o.edit();
  }

  newTask(row:JQuery):void {
    let task:JQuery;
    let o:Task;

    task = $('#task_template').children().first().clone();
    row.find('.list').first().prepend(task);

    o = new Task(task[0]);
    o.edit();
  }

  updateColWidths():void {
    let w = parseInt($('#col_width_input').val() as string, 10);

    if (isNaN(w) || w <= 0) {
      w = this.defaultColWidth;
    }
    $('#col_width_input').val(w);
    UserPreferences.set('taskboardColWidth', w.toString());
    $('.swimlane')
      .width(this.colWidthUnit * w)
      .css('min-width', this.colWidthUnit * w);
  }
}
