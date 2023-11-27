import {PhoenixSidebar} from "./ui/PhoenixSidebar.js";
import { PhoenixActorPanel } from "./ui/PhoenixActorPanel.js";

Hooks.once('init', () => {
})

Hooks.once('ready', () => {
    ui.hotbar.close()


})

let actorPanel

Hooks.on("controlToken", (token, controlled) => {
    if  (!controlled) return

    if (actorPanel) actorPanel.close()

    actorPanel = new PhoenixActorPanel(token.actor)

    actorPanel.render(true)

});

export function manageListElement(html, name, value, type, toggle) {
    let mod_value = value
    if (type === "secondary") {
        mod_value *= 2
    }
    else if (type === "exhaustion") {
        mod_value = -Math.floor(value/5)
    }

    if (toggle) {
        // Add a new element to the list
        var listItem = $('<li class="skillrow"></li>');
        listItem.append('<h4 class="item-name name" style="margin: 0 0 0 0">' + name +'</h4>');
        listItem.append('<h4 class="roll-mod" style="margin: 0 0 0 0; width: 20px; text-align: center">' + mod_value + '</h4>');
        listItem.append('<div class="delete-btn" style="width: 20px; background: var(--apsj-orange-dark); color: var(--color-text-light-highlight); border-radius: 5px; text-align: center">X</div>');

        // Add delete button functionality
        listItem.find('.delete-btn').on('click', function() {
            $(this).parent().remove();

            // Find the first element with the specified classes and data-key attribute
            var element = $('.roll-modifier.roll-active[data-key="' + name + '"]').first();

            // Toggle the 'roll-active' class off
            element.removeClass('roll-active');
        });

        $(html.find('.chosen-skills')).append(listItem);
    } else {
        // Remove the element with the given name
        $(html.find('.chosen-skills')).find('li').each(function() {
            if ($(this).find('.name').text() === name) {
                $(this).remove();
            }
        });

    }
}