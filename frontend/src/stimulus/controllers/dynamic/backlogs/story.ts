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
  STORY
***************************************/

interface SaveDirectives {
  url:string;
  data:string;
}

interface StoryInstance {
  $:JQuery;
  el:HTMLElement;

  initialize(el:HTMLElement):void;
  beforeSave():void;
  afterCreate(data:any, textStatus:string, xhr:JQuery.jqXHR):void;
  afterUpdate(data:any, textStatus:string, xhr:JQuery.jqXHR):void;
  refreshed():void;
  editDialogTitle():string;
  editorDisplayed(editor:JQuery):void;
  getPoints():number;
  getType():string;
  markIfClosed():void;
  newDialogTitle():string;
  refreshStory():void;
  recalcVelocity():void;
  saveDirectives():SaveDirectives;
  beforeSaveDragResult():void;
  getID?():string | number;
  isNew?():boolean;
  handleClick?:(e:JQuery.ClickEvent) => void;
}

(window as any).RB.Story = (function ($:JQueryStatic) {
  return (window as any).RB.Object.create((window as any).RB.WorkPackage, (window as any).RB.EditableInplace, {
    initialize(this:StoryInstance, el:HTMLElement):void {
      this.$ = $(el);
      this.el = el;

      // Associate this object with the element for later retrieval
      this.$.data('this', this);
      this.$.on('click', '.editable', this.handleClick as any);
    },

    /**
     * Callbacks from model.js
     **/
    beforeSave(this:StoryInstance):void {
      this.refreshStory();
    },

    afterCreate(this:StoryInstance, data:any, textStatus:string, xhr:JQuery.jqXHR):void {
      this.refreshStory();
    },

    afterUpdate(this:StoryInstance, data:any, textStatus:string, xhr:JQuery.jqXHR):void {
      this.refreshStory();
    },

    refreshed(this:StoryInstance):void {
      this.refreshStory();
    },
    /**/

    editDialogTitle(this:StoryInstance):string {
      return `Story #${this.getID!()}`;
    },

    editorDisplayed(this:StoryInstance, editor:JQuery):void {
      // Do nothing
    },

    getPoints(this:StoryInstance):number {
      const points = parseInt(this.$.find('.story_points').first().text(), 10);
      return isNaN(points) ? 0 : points;
    },

    getType(this:StoryInstance):string {
      return 'Story';
    },

    markIfClosed(this:StoryInstance):void {
      // Do nothing
    },

    newDialogTitle(this:StoryInstance):string {
      return 'New Story';
    },

    refreshStory(this:StoryInstance):void {
      this.recalcVelocity();
    },

    recalcVelocity(this:StoryInstance):void {
      this.$.parents('.backlog').first().data('this').refresh();
    },

    saveDirectives(this:StoryInstance):SaveDirectives {
      let url:string;
      let prev:JQuery;
      let sprintId:string;
      let data:string;

      prev = this.$.prev();
      sprintId = this.$.parents('.backlog').data('this').isSprintBacklog()
                   ? this.$.parents('.backlog').data('this').getSprint().data('this')
.getID()
                   : '';

      data = `prev=${
             prev.length === 1 ? prev.data('this').getID() : ''
              }&version_id=${sprintId}`;

      if (this.$.find('.editor').length > 0) {
        data += `&${this.$.find('.editor').serialize()}`;
      }

      //TODO: this might be unsave in case the parent of this story is not the
      //      sprint backlog, then we dont have a sprintId an cannot generate a
      //      valid url - one option might be to take RB.constants.sprint_id
      //      hoping it exists
      if (this.isNew!()) {
        url = (window as any).RB.urlFor('create_story', { sprint_id: sprintId });
      } else {
        url = (window as any).RB.urlFor('update_story', { id: this.getID!(), sprint_id: sprintId });
        data += '&_method=put';
      }

      return {
        url,
        data,
      };
    },

    beforeSaveDragResult(this:StoryInstance):void {
      // Do nothing
    },
  } as StoryInstance);
}(jQuery));
