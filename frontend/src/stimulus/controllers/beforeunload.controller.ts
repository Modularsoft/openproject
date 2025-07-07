import { ApplicationController } from 'stimulus-use';
import { TurboBeforeVisitEvent } from '@hotwired/turbo';

export function setPageWasEdited() {
  const application = window.Stimulus;
  const controller = application.getControllerForElementAndIdentifier(document.body, 'beforeunload') as BeforeunloadController;
  if (controller) {
    controller.pageWasEdited = true;
  }
}

export function setPageWasSubmitted() {
  const application = window.Stimulus;
  const controller = application.getControllerForElementAndIdentifier(document.body, 'beforeunload') as BeforeunloadController;
  if (controller) {
    controller.pageWasEdited = true;
  }
}

export class BeforeunloadController extends ApplicationController {
  /** Globally setable variable whether the page was edited */
  public pageWasEdited = false;

  /** Globally setable variable whether the page form is submitted.
   * Necessary to avoid a data loss warning on beforeunload */
  public pageIsSubmitted = false;

  private boundBeforeUnloadHandler = this.beforeunloadHandler.bind(this);

  private submitHandler = () => {
    this.pageIsSubmitted = true;
  };

  private turboHandler = () => {
    this.pageWasEdited = false;
    this.pageIsSubmitted = false;
  };

  connect() {
    super.connect();

    window.addEventListener('beforeunload', this.boundBeforeUnloadHandler);
    document.addEventListener('turbo:before-visit', this.boundBeforeUnloadHandler);
    document.addEventListener('turbo:submit-end', this.turboHandler);
    document.addEventListener('submit', this.submitHandler);
  }

  disconnect() {
    window.removeEventListener('beforeunload', this.boundBeforeUnloadHandler);
    document.removeEventListener('turbo:before-visit', this.boundBeforeUnloadHandler);
    document.removeEventListener('turbo:submit-end', this.turboHandler);
    document.removeEventListener('submit', this.submitHandler);
  }

  private beforeunloadHandler(evt:BeforeUnloadEvent|TurboBeforeVisitEvent) {
    const { pageWasEdited, pageIsSubmitted } = this;

    if (!pageWasEdited || pageIsSubmitted) {
      return;
    }

    // eslint-disable-next-line no-alert
    if (window.confirm(I18n.t('js.work_packages.confirm_edit_cancel'))) {
      return;
    }

    // Cancel the event
    evt.preventDefault();

    // Chrome requires returnValue to be set
    if (evt.type === 'beforeunload') {
      evt.returnValue = '';
    }
  }
}
