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
  IMPEDIMENT
***************************************/

interface SaveDirective {
  url:string;
  data:string;
}

interface ImpedimentInstance {
  $:JQuery;
  el:HTMLElement;

  initialize(el:HTMLElement):void;
  saveDirectives():SaveDirective;
  getID?():string | number;
  isNew?():boolean;
  handleClick?:(e:JQuery.MouseUpEvent) => void;
}

(window as any).RB.Impediment = (function ($:JQueryStatic) {
  return (window as any).RB.Object.create((window as any).RB.Task, {

    initialize(this:ImpedimentInstance, el:HTMLElement):void {
      let j:JQuery; // This ensures that we use a local 'j' variable, not a global one.

      this.$ = j = $(el);
      this.el = el;

      j.addClass('impediment'); // If node is based on #task_template, it doesn't have the impediment class yet

      // Associate this object with the element for later retrieval
      j.data('this', this);

      j.on('mouseup', '.editable', this.handleClick as any);
    },

    // Override saveDirectives of RB.Task
    saveDirectives(this:ImpedimentInstance):SaveDirective {
      let j:JQuery;
      let prev:JQuery;
      let statusID:string;
      let data:string;
      let url:string;

      j = this.$;
      prev = this.$.prev();
      statusID = j.parent('td').first().attr('id')!.split('_')[1];

      data = `${j.find('.editor').serialize()
                 }&is_impediment=true`
                 + `&version_id=${(window as any).RB.constants.sprint_id
                 }&status_id=${statusID
                 }&prev=${prev.length === 1 ? prev.data('this').getID() : ''
                 }${this.isNew!() ? '' : `&id=${j.children('.id').text()}`}`;

      if (this.isNew!()) {
        url = (window as any).RB.urlFor('create_impediment', { sprint_id: (window as any).RB.constants.sprint_id });
      } else {
        url = (window as any).RB.urlFor('update_impediment', { id: this.getID!(), sprint_id: (window as any).RB.constants.sprint_id });
        data += '&_method=put';
      }

      return {
        url,
        data,
      };
    },
  } as ImpedimentInstance);
}(jQuery));
