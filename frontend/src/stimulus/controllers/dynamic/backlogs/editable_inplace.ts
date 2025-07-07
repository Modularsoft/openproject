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

import $ from 'jquery';
import { Model } from './model';

type Constructor = new (...args:any[]) => {};

export function EditableInplace<TBase extends Constructor>(Base:TBase) {
  return class extends Base {
    protected $:JQuery;

    displayEditor(editor:JQuery):void {
      this.$.addClass('editing');
      editor.find('.editor').bind('keydown', this.handleKeydown);
    }

    getEditor():JQuery {
      // Create the model editor container if it does not yet exist
      let editor = this.$.children('.editors');

      if (editor.length === 0) {
        editor = $("<div class='editors'></div>").appendTo(this.$);
      } else if (!editor.hasClass('permanent')) {
        editor.first().html('');
      }
      return editor;
    }

    // For detecting Enter and ESC
    handleKeydown(this:HTMLElement, e:JQuery.KeyDownEvent):boolean | void {
      const j = $(this).parents('.model').first();
      const that = j.data('this') as Model;

      // 13 is the key code of Enter, 27 of ESC.
      if (e.which === 13) {
        that.saveEdits();
      } else if (e.which === 27) {
        that.cancelEdit();
      } else {
        return true;
      }
    }
  };
}
