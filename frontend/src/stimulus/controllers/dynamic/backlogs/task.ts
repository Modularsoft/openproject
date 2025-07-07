/*
 * -- copyright
 * OpenProject is an open source project management software.
 * Copyright (C) the OpenProject GmbH
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 3.
 *
 * OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
 * Copyright (C) 2006-2013 Jean-Philippe Lang
 * Copyright (C) 2010-2013 the ChiliProject Team
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * See COPYRIGHT and LICENSE files for more details.
 * ++
 */

/**************************************
  TASK
***************************************/

interface SaveDirectives {
  url:string;
  data:string;
}

interface TaskInstance {
  $:JQuery;
  el:HTMLElement;
  defaultColor:string;

  initialize(el:HTMLElement):void;
  beforeSave():void;
  editorDisplayed(dialog:JQuery):void;
  getType():string;
  markIfClosed():void;
  saveDirectives():SaveDirectives;
  beforeSaveDragResult():void;
  refreshed():void;
  getID?():string | number;
  isNew?():boolean;
  handleClick?:(e:JQuery.MouseUpEvent) => void;
}

(window as any).RB.Task = (function ($:JQueryStatic) {
  return (window as any).RB.Object.create((window as any).RB.WorkPackage, {

    initialize(this:TaskInstance, el:HTMLElement):void {
      this.$ = $(el);
      this.el = el;

      // If node is based on #task_template, it doesn't have the story class yet
      this.$.addClass('task');

      // Associate this object with the element for later retrieval
      this.$.data('this', this);
      this.$.on('mouseup', '.editable', this.handleClick as any);
      this.defaultColor = $('#rb .task').css('background-color');
    },

    beforeSave(this:TaskInstance):void {
      if (this.el && $(this.el).hasClass('dragging')) {
        return;
      }
      const c = this.$.find('select.assigned_to_id').children(':selected').attr('color') || this.defaultColor;
      this.$.css('background-color', c);
      (this.$ as any).colorcontrast();
    },

    editorDisplayed(this:TaskInstance, dialog:JQuery):void {
      dialog.parents('.ui-dialog').css('background-color', this.$.css('background-color'));
      (dialog.parents('.ui-dialog') as any).colorcontrast();
    },

    getType(this:TaskInstance):string {
      return 'Task';
    },

    markIfClosed(this:TaskInstance):void {
      if (this.$.parent('td').first().hasClass('closed')) {
        this.$.addClass('closed');
      } else {
        this.$.removeClass('closed');
      }
    },

    saveDirectives(this:TaskInstance):SaveDirectives {
      let prev:JQuery;
      let cellId:string[];
      let data:string;
      let url:string;

      prev = this.$.prev();
      cellId = this.$.parent('td').first().attr('id')!.split('_');

      data = `${this.$.find('.editor').serialize()
                 }&parent_id=${cellId[0]
                 }&status_id=${cellId[1]
                 }&prev=${prev.length === 1 ? prev.data('this').getID() : ''
                 }${this.isNew!() ? '' : `&id=${this.$.children('.id').text()}`}`;

      if (this.isNew!()) {
        url = (window as any).RB.urlFor('create_task', { sprint_id: (window as any).RB.constants.sprint_id });
      } else {
        url = (window as any).RB.urlFor('update_task', { id: this.getID!(), sprint_id: (window as any).RB.constants.sprint_id });
        data += '&_method=put';
      }

      return {
        url,
        data,
      };
    },

    beforeSaveDragResult(this:TaskInstance):void {
      if (this.$.parent('td').first().hasClass('closed')) {
        // This is only for the purpose of making the Remaining Hours reset
        // instantaneously after dragging to a closed status. The server should
        // still make sure to reset the value.
        this.$.children('.remaining_hours.editor').val('');
        this.$.children('.remaining_hours.editable').text('');
      }
    },

    refreshed(this:TaskInstance):void {
      const remainingHours = this.$.children('.remaining_hours.editable');

      remainingHours.toggleClass('empty', remainingHours.is(':empty'));
    },
  } as TaskInstance);
}(jQuery));
