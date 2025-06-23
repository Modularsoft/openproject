import { ControllerConstructor } from '@hotwired/stimulus/dist/types/core/controller';
import { ApplicationController } from 'stimulus-use';
import { AttributeObserver } from '@hotwired/stimulus';
import { debugLog } from 'core-app/shared/helpers/debug_output';

export class OpApplicationController extends ApplicationController {
  private loaded = new Set<string>();

  private controllerObserver:AttributeObserver;

  connect() {
    super.connect();
    this.controllerObserver = new AttributeObserver(
      this.element,
      'data-controller',
      {
        elementMatchedAttribute: (element:HTMLElement, _) => this.controllerAttributeFound(element),
      },
    );

    this.controllerObserver.start();
  }

  disconnect() {
    this.controllerObserver.stop();
  }

  controllerAttributeFound(target:HTMLElement) {
    const controllers = (target.dataset.controller as string).split(' ');
    const registered = this.application.router.modules.map((module) => module.definition.identifier);

    controllers.forEach((controller) => {
      const path = this.derivePath(controller);
      if (!registered.includes(controller) && !this.loaded.has(controller)) {
        debugLog(`Loading controller ${controller}`);
        this.loaded.add(controller);
        void import(/* webpackChunkName: "[request]" */`./dynamic/${path}.controller.ts`)
          .then((imported:{ default:ControllerConstructor }) => this.application.register(controller, imported.default))
          .catch((err:unknown) => {
            console.error('Failed to load dynamic controller chunk %O: %O', controller, err);
          });
      }
    });
  }

  /**
   * Derive dynamic path from controller name.
   *
   * Stimulus conventions allow subdirectories to be used by double dashes.
   * We convert these to slashes for the dynamic import.
   *
   * https://stimulus.hotwired.dev/handbook/installing#controller-filenames-map-to-identifiers
   * @param controller
   * @private
   */
  private derivePath(controller:string):string {
    return controller.replace(/--/g, '/');
  }
}
