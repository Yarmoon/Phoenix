

export class PhoenixActorPanel extends ActorSheet {

    constructor(actor) {
        super(actor);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject (super.defaultOptions, {
            id: "actor-panel",
            template: "systems/phoenix/templates/ui/actor-panel.html",
            popOut: false,
            closeOnSubmit: false,
            submitOnChange: true,
            submitOnClose: true,
            resizable:false
        })
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}