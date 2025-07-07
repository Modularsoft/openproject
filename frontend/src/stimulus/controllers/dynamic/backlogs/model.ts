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

import { ajax, Dialog, SaveDirectives } from './common';

/***************************************
  MODEL
  Common methods for sprint, work_package,
  story, task, and impediment
***************************************/
export class Model {
  protected $:JQuery;
  protected el:HTMLElement;
  setSelection:any;
  isSelected:any;

  constructor(el:HTMLElement) {
    this.$ = $(el);
    this.el = el;
  }

  afterCreate(data:any, textStatus:string, xhr:JQuery.jqXHR):void {
    // Do nothing. Child objects may optionally override this
  }

  afterSave(data:any, textStatus:string, xhr:JQuery.jqXHR):void {
    let isNew:boolean;
    let result:Model;

    isNew = this.isNew();
    result = new Model(data);

    this.unmarkSaving();
    this.refresh(result);

    if (isNew) {
      this.$.attr('id', result.$.attr('id') || '');
      this.afterCreate(data, textStatus, xhr);
    } else {
      this.afterUpdate(data, textStatus, xhr);
    }
  }

  afterUpdate(data:any, textStatus:string, xhr:JQuery.jqXHR):void {
    // Do nothing. Child objects may optionally override this
  }

  beforeSave():void {
    // Do nothing. Child objects may or may not override this method
  }

  cancelEdit():void {
    this.endEdit();
    if (this.isNew()) {
      this.$.hide('blind');
    }
  }

  close():void {
    this.$.addClass('closed');
  }

  copyFromDialog():void {
    let editors:JQuery;

    if (this.$.find('.editors').length === 0) {
      editors = $("<div class='editors'></div>").appendTo(this.$);
    } else {
      editors = this.$.find('.editors').first();
    }
    editors.html('');
    editors.append($(`#${this.getType().toLowerCase()}_editor`).children('.editor'));
    this.saveEdits();
  }

  displayEditor(editor:JQuery):void {
    const self = this;
    const baseClasses = 'ui-button ui-widget ui-state-default ui-corner-all';

    editor.dialog({
      buttons: [
        {
          text: 'OK',
          class: 'button -primary',
          click():void {
            self.copyFromDialog();
            $(this).dialog('close');
          },
        },
        {
          text: 'Cancel',
          class: 'button',
          click():void {
            self.cancelEdit();
            $(this).dialog('close');
          },
        },
      ],
      close(e, ui):void {
        if (e.which === 1 || e.which === 27) {
          self.cancelEdit();
        }
      },
      dialogClass: `${this.getType().toLowerCase()}_editor_dialog`,
      modal: true,
      position: { my: 'center', at: 'center', of: window },
      resizable: false,
      title: this.isNew() ? this.newDialogTitle() : this.editDialogTitle(),
    });
    editor.find('.editor').first().focus();
    $('.button').removeClass(baseClasses);
    $('.ui-icon-closethick').prop('title', 'close');
  }

  edit():JQuery {
    const editor = this.getEditor();
    const self = this;
    let maxTabIndex = 0;

    $('.stories .editors .editor').each(function (this:HTMLElement, index:number):void {
      let value:number;

      value = parseInt($(this).attr('tabindex') || '0', 10);

      if (maxTabIndex < value) {
        maxTabIndex = value;
      }
    });

    if (!editor.hasClass('permanent')) {
      this.$.find('.editable').each(function (this:HTMLElement, index:number):void {
        const field = $(this);
        const fieldId = field.attr('field_id') || '';
        const fieldName = field.attr('fieldname') || '';
        const fieldLabel = field.attr('fieldlabel') || '';
        const fieldOrder = parseInt(field.attr('fieldorder') || '0', 10);
        const fieldEditable = field.attr('fieldeditable') || 'true';
        const fieldType = field.attr('fieldtype') || 'input';
        let typeId:string;
        let statusId:string;
        let input:JQuery;

        if (fieldType === 'select') {
          // Special handling for status_id => they are dependent of type_id
          if (fieldName === 'status_id') {
            typeId = $.trim(self.$.find('.type_id .v').html() || '');
            // when creating stories we need to query the select directly
            if (typeId === '') {
              typeId = ($('#type_id_options').val() as string) || '';
            }
            statusId = $.trim(self.$.find('.status_id .v').html() || '');
            input = self.findFactory(typeId, statusId, fieldName);
          } else if (fieldName === 'type_id') {
            input = $(`#${fieldName}_options`).clone(true);
            // if the type changes the status dropdown has to be modified
            input.change(function (this:HTMLElement):void {
              typeId = ($(this).val() as string) || '';
              statusId = $.trim(self.$.find('.status_id .v').html() || '');
              let newInput = self.findFactory(typeId, statusId, 'status_id');
              newInput = self.prepareInputFromFactory(newInput, fieldId, 'status_id', fieldOrder, maxTabIndex);
              self.replaceStatusForNewType(
                input,
                newInput,
                ($(this).parent().find('.status_id').val() as string) || '',
                editor,
              );
            });
          } else {
            input = $(`#${fieldName}_options`).clone(true);
          }
        } else {
          input = $(document.createElement(fieldType));
        }

        input = self.prepareInputFromFactory(input, fieldId, fieldName, fieldOrder, maxTabIndex, fieldEditable);

        // Copy the value in the field to the input element
        input.val(fieldType === 'select' ? field.children('.v').first().text() : field.text());

        // Record in the model's root element which input field had the last focus. We will
        // use this information inside RB.Model.refresh() to determine where to return the
        // focus after the element has been refreshed with info from the server.
        input.focus(function (this:HTMLElement):void {
          self.$.data('focus', $(this).attr('name') || '');
        });

        input.blur(() => {
          self.$.data('focus', '');
        });

        $('<label />')
          .attr({
            for: input.attr('id'),
          })
          .text(fieldLabel)
          .appendTo(editor);
        input.appendTo(editor);
      });
    }

    this.displayEditor(editor);
    this.editorDisplayed(editor);
    return editor;
  }

  findFactory(typeId:string, statusId:string, fieldName:string):JQuery {
    // Find a factory
    let newInput = $(`#${fieldName}_options_${typeId}_${statusId}`);
    if (newInput.length === 0) {
      // when no list found, only offer the default status
      // no list = combination is not valid / user has no rights -> workflow
      newInput = $(`#status_id_options_default_${statusId}`);
    }
    newInput = newInput.clone(true);
    return newInput;
  }

  prepareInputFromFactory(
    input:JQuery,
    fieldId:string,
    fieldName:string,
    fieldOrder:number,
    maxTabIndex:number,
    fieldEditable:string = 'true',
  ):JQuery {
    input.attr('id', `${fieldName}_${fieldId}`);
    input.attr('name', fieldName);
    input.attr('tabindex', (fieldOrder + maxTabIndex).toString());
    if (fieldEditable !== 'true') {
      input.attr('disabled', 'disabled');
    }
    input.addClass(fieldName);
    input.addClass('editor');
    input.removeClass('template');
    input.removeClass('helper');
    return input;
  }

  replaceStatusForNewType(input:JQuery, newInput:JQuery, statusId:string, editor:JQuery):void {
    const self = this;
    // Append an empty field and select it in case the old status is not available
    newInput.val(statusId); // try to set the status
    if (newInput.val() !== statusId) {
      newInput.append(new Option('', ''));
      newInput.val('');
    }
    newInput.focus(function (this:HTMLElement):void {
      self.$.data('focus', $(this).attr('name') || '');
    });

    newInput.blur(() => {
      self.$.data('focus', '');
    });
    // Find the old status dropdown and replace it with the new one
    input.parent().find('.status_id').replaceWith(newInput);
  }

  // Override this method to change the dialog title
  editDialogTitle():string {
    return `Edit ${this.getType()}`;
  }

  editorDisplayed(editor:JQuery):void {
    // Do nothing. Child objects may override this.
  }

  endEdit():void {
    this.$.removeClass('editing');
  }

  error(xhr:JQuery.jqXHR, textStatus:string, error:string):void {
    this.markError();
    Dialog.msg($(xhr.responseText).find('.errors').html());
    this.processError(xhr, textStatus, error);
  }

  getEditor():JQuery {
    let editorId:string;
    let editor:JQuery;
    // Create the model editor if it does not yet exist
    editorId = `${this.getType().toLowerCase()}_editor`;

    editor = $(`#${editorId}`).html('');

    if (editor.length === 0) {
      editor = $(`<div id='${editorId}'></div>`).appendTo('body');
    }
    return editor;
  }

  getID():string {
    return this.$.children('.id').children('.v').text();
  }

  getType():string {
    throw new Error('Child objects must override getType()');
  }

  handleClick(this:HTMLElement, e:JQuery.ClickEvent):void {
    const field = $(this);
    const model = field.parents('.model').first().data('this') as Model;
    const j = model.$;

    if (
      !j.hasClass('editing')
      && !j.hasClass('dragging')
      && !j.hasClass('prevent_edit')
      && !$(e.target).hasClass('prevent_edit')
      && (e.target as HTMLElement).closest('.editable')?.getAttribute('fieldeditable') !== 'false'
    ) {
      const editor = model.edit();
      const input = editor.find(`.${$(e.currentTarget).attr('fieldname')}.editor`);

      input.focus();
      input.click();
    }
  }

  handleSelect(this:HTMLElement, e:JQuery.TriggeredEvent):void {
    const j = $(this);
    const self = j.data('this') as Model;
    const target = e.target as HTMLElement;

    if (
      !$(target).hasClass('editable')
      && !$(target).hasClass('checkbox')
      && !j.hasClass('editing')
      && target.tagName !== 'A'
      && !j.hasClass('dragging')
    ) {
      if (self.setSelection && self.isSelected) {
        self.setSelection(!self.isSelected());
      }
    }
  }

  isClosed():boolean {
    return this.$.hasClass('closed');
  }

  isNew():boolean {
    return this.getID() === '';
  }

  markError():void {
    this.$.addClass('error icon icon-bug');
  }

  markIfClosed():void {
    throw new Error('Child objects must override markIfClosed()');
  }

  markSaving():void {
    this.$.addClass('ajax-indicator');
  }

  // Override this method to change the dialog title
  newDialogTitle():string {
    return `New ${this.getType()}`;
  }

  open():void {
    this.$.removeClass('closed');
  }

  processError(x:any, t:string, e:string):void {
    // Override as needed
  }

  refresh(obj:Model):void {
    this.$.html(obj.$.html());

    if (obj.$.length > 1) {
      // execute script tags, that were attached to the sources
      obj.$.filter('script').each(function (this:HTMLElement):void {
        try {
          $.globalEval($(this).html());
        } catch (e) {
          // Ignore script evaluation errors
        }
      });
    }

    if (obj.isClosed()) {
      this.close();
    } else {
      this.open();
    }

    (window as any).OpenProject.getPluginContext().then((pluginContext:any) => {
      pluginContext.bootstrap(this.$[0]);
    });

    this.refreshed();
  }

  refreshed():void {
    // Override as needed
  }

  saveDirectives():SaveDirectives {
    throw new Error('Child object must implement saveDirectives()');
  }

  saveEdits():void {
    const j = this.$;
    const self = this;
    const editors = j.find('.editor');
    let saveDir:SaveDirectives;

    // Copy the values from the fields to the proper html elements
    editors.each(function (this:HTMLElement, index:number):void {
      const editor = $(this).find('input,select,textarea').addBack('input,select,textarea');
      const fieldName = editor.attr('name') || '';
      const type = editor.attr('type');
      if (type && type.match(/select/)) {
        // if the user changes the type and that type does not offer the status
        // of the current story, the status field is set to blank
        // if the user saves this edit we will receive a validation error
        // the following 3 lines will prevent the override of the status id
        // otherwise we would loose the status id of the current ticket
        if (!(editor.val() === '' && fieldName === 'status_id')) {
          j.children(`div.${fieldName}`)
            .children('.v')
            .text((editor.val() as string) || '');
        }

        j.children(`div.${fieldName}`).children('.t').text(editor.children(':selected').text());
      } else {
        j.children(`div.${fieldName}`).text((editor.val() as string) || '');
      }
    });

    // Mark the work_package as closed if so
    self.markIfClosed();

    // Get the save directives.
    saveDir = self.saveDirectives();

    self.beforeSave();

    self.unmarkError();
    self.markSaving();
    ajax({
      type: 'POST',
      url: saveDir.url,
      data: saveDir.data,
      success(d:any, t:string, x:JQuery.jqXHR):void {
        self.afterSave(d, t, x);
      },
      error(x:JQuery.jqXHR, t:string, e:string):void {
        self.error(x, t, e);
      },
    });
    self.endEdit();
  }

  unmarkError():void {
    this.$.removeClass('error icon icon-bug');
  }

  unmarkSaving():void {
    this.$.removeClass('ajax-indicator');
  }
}
