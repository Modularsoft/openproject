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

/***************************************
  SPRINT
***************************************/

interface SaveDirectives {
  url:string;
  data:string;
}

interface SprintInstance {
  $:JQuery;
  el:HTMLElement;

  initialize(el:HTMLElement):void;
  beforeSave():void;
  getType():string;
  markIfClosed():void;
  refreshed():void;
  saveDirectives():SaveDirectives;
  beforeSaveDragResult():void;
  getID?():string | number;
  handleClick?:(e:JQuery.MouseUpEvent) => void;
}

(window as any).RB.Sprint = (function ($:JQueryStatic) {
  return (window as any).RB.Object.create((window as any).RB.Model, (window as any).RB.EditableInplace, {

    initialize(this:SprintInstance, el:HTMLElement):void {
      this.$ = $(el);
      this.el = el;

      // Associate this object with the element for later retrieval
      this.$.data('this', this);
      this.$.on('mouseup', '.editable', this.handleClick as any);
    },

    beforeSave(this:SprintInstance):void {
      // Do nothing
    },

    getType(this:SprintInstance):string {
      return 'Sprint';
    },

    markIfClosed(this:SprintInstance):void {
      // Do nothing
    },

    refreshed(this:SprintInstance):void {
      // Do nothing
    },

    saveDirectives(this:SprintInstance):SaveDirectives {
      const wrapper = this.$;
      const editor = wrapper.find('.editor');
      const data = `${editor.serialize()}&_method=put`;
      const url = (window as any).RB.urlFor('update_sprint', { id: this.getID!() });

      return {
        url,
        data,
      };
    },

    beforeSaveDragResult(this:SprintInstance):void {
      // Do nothing
    },
  } as SprintInstance);
}(jQuery));
