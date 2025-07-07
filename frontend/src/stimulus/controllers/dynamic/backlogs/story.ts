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

import { WorkPackage } from './work_package';
import { EditableInplace } from './editable_inplace';
import { SaveDirectives, RB } from './common';

/**************************************
  STORY
***************************************/
export class Story extends WorkPackage {
  constructor(el:HTMLElement) {
    super(el);

    // Associate this object with the element for later retrieval
    this.$.data('this', this);
    this.$.on('click', '.editable', this.handleClick as any);
  }

  /**
   * Callbacks from model.js
   **/
  beforeSave():void {
    this.refreshStory();
  }

  afterCreate(data:any, textStatus:string, xhr:JQuery.jqXHR):void {
    this.refreshStory();
  }

  afterUpdate(data:any, textStatus:string, xhr:JQuery.jqXHR):void {
    this.refreshStory();
  }

  refreshed():void {
    this.refreshStory();
  }

  editDialogTitle():string {
    return `Story #${this.getID()}`;
  }

  editorDisplayed(editor:JQuery):void {
    // Do nothing
  }

  getPoints():number {
    const points = parseInt(this.$.find('.story_points').first().text(), 10);
    return isNaN(points) ? 0 : points;
  }

  getType():string {
    return 'Story';
  }

  markIfClosed():void {
    // Do nothing
  }

  newDialogTitle():string {
    return 'New Story';
  }

  refreshStory():void {
    this.recalcVelocity();
  }

  recalcVelocity():void {
    this.$.parents('.backlog').first().data('this').refresh();
  }

  saveDirectives():SaveDirectives {
    const prev = this.$.prev();
    const sprintId = this.$.parents('.backlog').data('this').isSprintBacklog()
      ? this.$.parents('.backlog').data('this').getSprint().data('this').getID()
      : '';
    let data = `prev=${prev.length === 1 ? prev.data('this').getID() : ''}&version_id=${sprintId}`;

    if (this.$.find('.editor').length > 0) {
      data += `&${this.$.find('.editor').serialize()}`;
    }

    //TODO: this might be unsave in case the parent of this story is not the
    //      sprint backlog, then we dont have a sprintId an cannot generate a
    //      valid url - one option might be to take RB.constants.sprint_id
    //      hoping it exists
    let url:string;
    if (this.isNew()) {
      url = RB.urlFor('create_story', { sprint_id: sprintId });
    } else {
      url = RB.urlFor('update_story', { id: this.getID(), sprint_id: sprintId });
      data += '&_method=put';
    }

    return {
      url,
      data,
    };
  }

  beforeSaveDragResult():void {
    // Do nothing
  }
}

// export const EditableStory = new EditableInplace(Story);
