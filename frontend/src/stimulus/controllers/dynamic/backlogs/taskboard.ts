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

/***************************************
  TASKBOARD
***************************************/

// Interface for jQuery sortable options
interface SortableOptions {
  placeholder:string;
  start:(event:any, ui:any) => void;
  stop:(event:any, ui:any) => void;
  update:(event:any, ui:any) => void;
  cancel:string;
  connectWith?:string;
}

// Interface for sortable UI object
interface SortableUI {
  item:JQuery;
  sender:any;
}

// Interface for Taskboard properties and methods
interface TaskboardInterface {
  $:JQuery;
  el:HTMLElement;
  colWidthUnit:number;
  defaultColWidth:number;

  initialize(el:HTMLElement):void;
  initializeNewButtons():void;
  initializeSortables():void;
  initializeTasks():void;
  initializeImpediments():void;
  initializeTaskboardMenus():void;
  dragComplete(e:any, ui:SortableUI):void;
  dragStart(e:any, ui:SortableUI):void;
  dragStop(e:any, ui:SortableUI):void;
  handleAddNewImpedimentClick(e:JQuery.TriggeredEvent):void;
  handleAddNewTaskClick(e:JQuery.TriggeredEvent):void;
  loadColWidthPreference():void;
  newImpediment(row:JQuery):void;
  newTask(row:JQuery):void;
  updateColWidths():void;
}

(window as any).RB.Taskboard = (function ($:JQueryStatic) {
  return (window as any).RB.Object.create((window as any).RB.Model, {

    initialize(el:HTMLElement):void {
      const self = this as TaskboardInterface; // So we can bind the event handlers to this object

      this.$ = $(el);
      this.el = el;

      // Associate this object with the element for later retrieval
      this.$.data('this', this);

      // Initialize column widths
      this.colWidthUnit = 107;
      this.defaultColWidth = 1;
      this.loadColWidthPreference();
      this.updateColWidths();

      $('#col_width_input')
        .on('keyup', (evt:JQuery.TriggeredEvent) => {
          if ((evt as any).which === 13) {
            self.updateColWidths();
          }
        });

      this.initializeTasks();
      this.initializeImpediments();

      this.initializeNewButtons();
      this.initializeSortables();

      this.initializeTaskboardMenus();
    },

    initializeNewButtons():void {
      const self = this as TaskboardInterface;
      this.$.find('#tasks .add_new.clickable').click(self.handleAddNewTaskClick);
      this.$.find('#impediments .add_new.clickable').click(self.handleAddNewImpedimentClick);
    },

    initializeSortables():void {
      const self = this as TaskboardInterface;

      const impedimentSortableOptions:SortableOptions = {
        placeholder: 'placeholder',
        start: self.dragStart,
        stop: self.dragStop,
        update: self.dragComplete,
        cancel: '.prevent_edit',
      };

      (this.$.find('#impediments .list')).sortable(impedimentSortableOptions)
        .sortable('option', 'connectWith', '#impediments .list');
      ($('#impediments .list') as any).disableSelection();

      const list = this.$.find('#tasks .list');

      const augmentList = function ():void {
        const taskSortableOptions:SortableOptions = {
          placeholder: 'placeholder',
          start: self.dragStart,
          stop: self.dragStop,
          update: self.dragComplete,
          cancel: '.prevent_edit',
        };

        ($(list.splice(0, 50)) as any).sortable(taskSortableOptions)
          .sortable('option', 'connectWith', '#tasks .list');
        ($('#tasks .list') as any).disableSelection();

        if (list.length > 0) {
          /*globals setTimeout*/
          setTimeout(augmentList, 10);
        }
      };
      augmentList();
    },

    initializeTasks():void {
      this.$.find('.task').each(function (this:HTMLElement, index:number) {
        (window as any).RB.Factory.initialize((window as any).RB.Task, this);
      });
    },

    initializeImpediments():void {
      this.$.find('.impediment').each(function (this:HTMLElement, index:number) {
        (window as any).RB.Factory.initialize((window as any).RB.Impediment, this);
      });
    },

    initializeTaskboardMenus():void {
      const toggleOpen = 'open icon-pulldown-up icon-pulldown';

      $('.backlog .backlog-menu > div.menu-trigger').on('click', function () {
        $(this).toggleClass(toggleOpen);
      });

      $('.backlog .backlog-menu > ul.items li.item').on('click', function () {
        $(this).closest('.backlog-menu').find('div.menu-trigger').toggleClass(toggleOpen);
      });
    },

    dragComplete(e:any, ui:SortableUI):void {
      // Handler is triggered for source and target. Thus the need to check.
      const isDropTarget = (ui.sender === null);

      if (isDropTarget) {
        (ui.item.data('this')).saveDragResult();
      }
    },

    dragStart(e:any, ui:SortableUI):void {
      ui.item.addClass('dragging');
    },

    dragStop(e:any, ui:SortableUI):void {
      ui.item.removeClass('dragging');
    },

    handleAddNewImpedimentClick(e:JQuery.TriggeredEvent):void {
      const row = $(this).parents('tr').first();
      ($('#taskboard').data('this') as TaskboardInterface).newImpediment(row);
    },

    handleAddNewTaskClick(e:JQuery.TriggeredEvent):void {
      const row = $(this).parents('tr').first();
      ($('#taskboard').data('this') as TaskboardInterface).newTask(row);
    },

    loadColWidthPreference():void {
      let w = (window as any).RB.UserPreferences.get('taskboardColWidth');
      if (w === null || w === undefined) {
        w = this.defaultColWidth;
        (window as any).RB.UserPreferences.set('taskboardColWidth', w);
      }
      $('#col_width input').val(w);
    },

    newImpediment(row:JQuery):void {
      let impediment:JQuery; let
o:any;

      impediment = $('#impediment_template').children().first().clone();
      row.find('.list').first().prepend(impediment);

      o = (window as any).RB.Factory.initialize((window as any).RB.Impediment, impediment);
      o.edit();
    },

    newTask(row:JQuery):void {
      let task:JQuery; let
o:any;

      task = $('#task_template').children().first().clone();
      row.find('.list').first().prepend(task);

      o = (window as any).RB.Factory.initialize((window as any).RB.Task, task);
      o.edit();
    },

    updateColWidths():void {
      let w = parseInt($('#col_width_input').val() as string, 10);

      if (isNaN(w) || w <= 0) {
        w = this.defaultColWidth;
      }
      $('#col_width_input').val(w);
      (window as any).RB.UserPreferences.set('taskboardColWidth', w);
      $('.swimlane').width(this.colWidthUnit * w).css('min-width', this.colWidthUnit * w);
    },
  });
}(jQuery));
