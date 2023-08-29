// Hook into the sidebar rendering
Hooks.on("renderSidebar", (_app, html) => {
    // Calculate new tab width
    html[0]
        .querySelector("#sidebar-tabs")
        .style.setProperty(
        "--sidebar-tab-width",
        `${Math.floor(
            parseInt(getComputedStyle(html[0]).getPropertyValue("--sidebar-width")) /
            (document.querySelector("#sidebar-tabs").childElementCount + 1)
        )}px`
    );

    // Create Macro tab
    createTab(html);
});

const createTab = async (html) => {
    // Create Roll tab
    const tab = document.createElement("a");
    tab.classList.add("item");
    tab.dataset.tab = "roll";
    tab.dataset.tooltip = "DOCUMENT.Roll";

    // Add a title if tooltips don't exist
    if (!("tooltip" in game)) tab.title = game.i18n.localize("Roll");

    // Add icon for tab
    const icon = document.createElement("i");
    icon.setAttribute("class", CONFIG.Macro.sidebarIcon);
    tab.append(icon);

    // Add Roll tab to sidebar before chat if it's not already there
    if (!document.querySelector("#sidebar-tabs > [data-tab='roll']"))
        document.querySelector("#sidebar-tabs > [data-tab='chat']").before(tab);

    let sidebar = html.find('#sidebar-tabs');
    const template = 'systems/phoenix/templates/actor/actor-sidebar.html';
    const options = {}

    let $content = await renderTemplate(template, options)

    $(sidebar).after($content)
};