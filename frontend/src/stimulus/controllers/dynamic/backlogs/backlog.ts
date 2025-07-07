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

import { Burndown } from './burndown';
import { Sprint } from './sprint';
import { Story } from './story';

/******************************************
  BACKLOG
  A backlog is a visual representation of
  a sprint and its stories. It is not a
  sprint. Imagine it this way: A sprint is
  a start and end date, and a set of
  objectives. A backlog is something you
  would draw up on the board or a spread-
  sheet (or in Redmine Backlogs!) to
  visualize the sprint.
******************************************/
export class Backlog {
  $:JQuery;
  el:HTMLElement;
  burndown?:Burndown;

  constructor(el:HTMLElement) {
    this.$ = $(el);
    this.el = el;

    // Associate this object with the element for later retrieval
    this.$.data('this', this);

    // Make the list sortable
    this.getList().sortable({
      connectWith: '.stories',
      dropOnEmpty: true,
      start: this.dragStart,
      stop: this.dragStop,
      update: this.dragComplete,
      receive: this.dragChanged,
      remove: this.dragChanged,
      containment: $('#backlogs_container'),
      cancel: 'input, textarea, button, select, option, .prevent_drag',
      scroll: true,
      helper(event, ui):HTMLElement {
        const $clone = $(ui).clone();
        $clone.css('position', 'absolute');
        return $clone.get(0) as unknown as HTMLElement;
      },
    });

    // Observe menu items
    this.$.find('.add_new_story').click(this.handleNewStoryClick);

    if (this.isSprintBacklog()) {
      new Sprint(this.getSprint()[0]);
      this.burndown = new Burndown(this.$.find('.show_burndown_chart')[0]);
      if (this.burndown) {
        this.burndown.setSprintId(this.getSprint().data('this').getID());
      }
    }

    // Initialize each item in the backlog
    this.getStories().each(function (this:HTMLElement, index:number):void {
      // 'this' refers to an element with class="story"
      new Story(this);
    });

    if (this.isSprintBacklog()) {
      this.refresh();
    }
  }

  dragChanged(this:HTMLElement, e:JQueryEventObject, ui:JQueryUI.SortableUIParams):void {
    $(this).parents('.backlog').data('this').refresh();
  }

  dragComplete(_e:JQueryEventObject, ui:JQueryUI.SortableUIParams):void {
    const isDropTarget = ui.sender === null || ui.sender === undefined;

    // jQuery triggers dragComplete of source and target.
    // Thus we have to check here. Otherwise, the story
    // would be saved twice.
    if (isDropTarget) {
      ui.item.data('this').saveDragResult();
    }
  }

  dragStart(_e:JQueryInputEventObject, ui:JQueryUI.SortableUIParams):void {
    ui.item.addClass('dragging');
  }

  dragStop(_e:JQueryInputEventObject, ui:JQueryUI.SortableUIParams):void {
    ui.item.removeClass('dragging');
  }

  getSprint():JQuery {
    return $(this.el).find('.model.sprint').first();
  }

  getStories():JQuery {
    return this.getList().children('.story');
  }

  getList():JQuery {
    return this.$.children('.stories').first();
  }

  handleNewStoryClick(this:HTMLElement, e:JQuery.ClickEvent):void {
    const toggler = $(this).parents('.header').find('.toggler');
    if (toggler.hasClass('closed')) {
      toggler.click();
    }
    e.preventDefault();
    $(this).parents('.backlog').data('this').newStory();
  }

  // return true if backlog has an element with class="sprint"
  isSprintBacklog():boolean {
    return $(this.el).find('.sprint').length === 1;
  }

  newStory():void {
    const story = $('#story_template').children().first().clone();
    this.getList().prepend(story);

    const o = new Story(story[0]);
    o.edit();

    story.find('.editor').first().focus();
  }

  refresh():void {
    this.recalcVelocity();
    this.recalcOddity();
  }

  recalcVelocity():boolean | void {
    if (!this.isSprintBacklog()) {
      return true;
    }

    let total = 0;
    this.getStories().each(function (this:HTMLElement, index:number):void {
      total += $(this).data('this').getPoints();
    });
    this.$.children('.header').children('.velocity').text(total.toString());
  }

  recalcOddity():void {
    this.$.find('.story:even').removeClass('odd').addClass('even');
    this.$.find('.story:odd').removeClass('even').addClass('odd');
  }
}
