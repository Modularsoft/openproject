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

import 'core-vendor/jquery.cookie';

export interface RB {
  i18n:{ generating_graph:string; burndown_graph:string };
  constants:{ project_id:string | number; sprint_id:string | number };
  urlFor(routeName:string, options:{}):string;
}

declare global {
  const RB:RB;
}

// Utilities
export class Dialog {
  static msg(msg:string):void {
    let dialog:JQuery;
    const baseClasses = 'ui-button ui-widget ui-state-default ui-corner-all';

    if ($('#msgBox').length === 0) {
      dialog = $('<div id="msgBox"></div>').appendTo('body');
    } else {
      dialog = $('#msgBox');
    }

    dialog.html(msg);
    dialog.dialog({
      title: 'Backlogs Plugin',
      buttons: [
        {
          text: 'OK',
          class: 'button -primary',
          click():void {
            $(this).dialog('close');
          },
        },
      ],
      modal: true,
    });
    $('.button').removeClass(baseClasses);
    $('.ui-icon-closethick').prop('title', 'close');
  }
}

// Abstract the user preference from the rest of the RB objects
// so that we can change the underlying implementation as needed
export class UserPreferences {
  static get(key:string):string | undefined {
    return $.cookie(key);
  }

  static set(key:string, value:string):void {
    $.cookie(key, value, { expires: 365 * 10 });
  }
}

const ajaxQueue:JQuery.AjaxSettings[] = [];
let ajaxOngoing:boolean = false;
const processAjaxQueue = () => {
  const options = ajaxQueue.shift();
  if (options !== null && options !== undefined) {
    ajaxOngoing = true;
    $.ajax(options);
  }
};

// Process outstanding entries in the ajax queue whenever an ajax request finishes.
$(document).ajaxComplete((event:JQuery.TriggeredEvent, xhr:JQuery.jqXHR, settings:JQuery.AjaxSettings):void => {
  ajaxOngoing = false;
  processAjaxQueue();
});

export function ajax(options:JQuery.AjaxSettings):void {
  ajaxQueue.push(options);
  if (!ajaxOngoing) {
    processAjaxQueue();
  }
}
export interface SaveDirectives {
  url:string;
  data:string;
}
