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

/**************************************
  WORK PACKAGE
***************************************/

// Interface for WorkPackage properties and methods
interface WorkPackageInterface {
  $:JQuery;
  el:HTMLElement;

  initialize(el:HTMLElement):void;
  beforeSaveDragResult():void;
  getType():string;
  saveDragResult():void;
  saveEdits():void;
}

(window as any).RB.WorkPackage = (function ($:JQueryStatic) {
  return (window as any).RB.Object.create((window as any).RB.Model, {

    initialize(el:HTMLElement):void {
      this.$ = $(el);
      this.el = el;
    },

    beforeSaveDragResult():void {
      // Do nothing
    },

    getType():string {
      return 'WorkPackage';
    },

    saveDragResult():void {
      (this as WorkPackageInterface).beforeSaveDragResult();
      if (!this.$.hasClass('editing')) {
        (this as WorkPackageInterface).saveEdits();
      }
    },
  });
}(jQuery));
