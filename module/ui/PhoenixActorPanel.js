

export class PhoenixActorPanel extends ActorSheet {

    constructor(actor) {
        super(actor);
    }

    getData(options = {}) {
        $(':focus').each(function() {
            $(this).blur();
        });
        return super.getData(options);
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

        let count = 0
        $(document).on('mouseenter', '.max-health-evasion-popover', function () {
            $('.max-health-evasion-popover').show()
            count+=1
        })
        $(document).on('mouseenter', '.stats', function () {
            $('.max-health-evasion-popover').show()
            count+=1
        })
        $(document).on('mouseleave', '.stats', function () {
            count-=1

            if (count === 0) {
                $('.max-health-evasion-popover').hide()
            }
        })
        $(document).on('mouseleave', '.max-health-evasion-popover', function () {
            count-=1

            if (count === 0) {
                $('.max-health-evasion-popover').hide()
            }
        })
    }
}