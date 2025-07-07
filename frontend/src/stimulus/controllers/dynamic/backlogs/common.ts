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

interface RBObject {
  create(...args:any[]):any;
}

interface RBFactory {
  initialize(objType:any, el:HTMLElement | JQuery):any;
}

interface RBDialog {
  msg(msg:string):void;
}

interface RBUserPreferences {
  get(key:string):string | undefined;
  set(key:string, value:string):void;
}

interface RBAjax {
  (options:JQuery.AjaxSettings):void;
}

interface RBNamespace {
  Object:RBObject;
  Factory:RBFactory;
  Dialog:RBDialog;
  UserPreferences:RBUserPreferences;
  ajax:RBAjax;
  i18n?:any;
  constants?:any;
  urlFor?:any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalWindow = window as any;

if (globalWindow.RB === null || globalWindow.RB === undefined) {
  globalWindow.RB = {} as RBNamespace;
}

(function ($:JQueryStatic):void {
  let object:RBObject;
  let Factory:RBFactory;
  let Dialog:RBDialog;
  let UserPreferences:RBUserPreferences;
  let ajax:RBAjax;

  object = {
    // Douglas Crockford's technique for object extension
    // http://javascript.crockford.com/prototypal.html
    create(...args:any[]):any {
      let obj:any;
      let i:number;
      let methods:any;
      let methodName:string;

      function F():void {
        // Empty constructor
      }

      (F as any).prototype = args[0];
      obj = new (F as any)();

      // Add all the other arguments as mixins that
      // 'write over' any existing methods
      for (i = 1; i < args.length; i += 1) {
        methods = args[i];
        if (typeof methods === 'object') {
          for (methodName in methods) {
            if (methods.hasOwnProperty(methodName)) {
              obj[methodName] = methods[methodName];
            }
          }
        }
      }
      return obj;
    },
  };

  // Object factory for chiliproject_backlogs
  Factory = object.create({
    initialize(objType:any, el:HTMLElement | JQuery):any {
      const obj = object.create(objType);
      obj.initialize(el);
      return obj;
    },
  });

  // Utilities
  Dialog = object.create({
    msg(msg:string):void {
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
    },
  });

  ajax = (function ():RBAjax {
    let ajaxQueue:JQuery.AjaxSettings[];
    let ajaxOngoing:boolean;
    let processAjaxQueue:() => void;

    ajaxQueue = [];
    ajaxOngoing = false;

    processAjaxQueue = function ():void {
      const options = ajaxQueue.shift();

      if (options !== null && options !== undefined) {
        ajaxOngoing = true;
        $.ajax(options);
      }
    };

    // Process outstanding entries in the ajax queue whenever an ajax request
    // finishes.
    $(document).ajaxComplete((event:JQuery.TriggeredEvent, xhr:JQuery.jqXHR, settings:JQuery.AjaxSettings):void => {
      ajaxOngoing = false;
      processAjaxQueue();
    });

    return function (options:JQuery.AjaxSettings):void {
      ajaxQueue.push(options);
      if (!ajaxOngoing) {
        processAjaxQueue();
      }
    };
  }());

  // Abstract the user preference from the rest of the RB objects
  // so that we can change the underlying implementation as needed
  UserPreferences = object.create({
    get(key:string):string | undefined {
      return ($ as any).cookie(key);
    },

    set(key:string, value:string):void {
      ($ as any).cookie(key, value, { expires: 365 * 10 });
    },
  });

  globalWindow.RB.Object = object;
  globalWindow.RB.Factory = Factory;
  globalWindow.RB.Dialog = Dialog;
  globalWindow.RB.UserPreferences = UserPreferences;
  globalWindow.RB.ajax = ajax;
}(jQuery));
