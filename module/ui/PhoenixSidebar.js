import {manageListElement} from "../roll-tab.js";

export class PhoenixSidebar extends Sidebar {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "sidebar",
            template: "templates/sidebar/sidebar.html",
            popOut: false,
            width: 350,
            tabs: [{navSelector: ".tabs", contentSelector: "#sidebar", initial: "chat"}]
        });
    }


    getData(options={}) {
        const isGM = game.user.isGM;

        // Configure tabs
        const tabs = {
            sidebarRoll: {
                tooltip: game.i18n.localize("Phoenix.Roll"),
                icon: "fas fa-dice-d20"
            },
            chat: {
                tooltip: ChatMessage.metadata.labelPlural,
                icon: CONFIG.ChatMessage.sidebarIcon,
                notification: "<i id=\"chat-notification\" class=\"notification-pip fas fa-exclamation-circle\"></i>"
            },
            combat: {
                tooltip: Combat.metadata.labelPlural,
                icon: CONFIG.Combat.sidebarIcon
            },
            scenes: {
                tooltip: Scene.metadata.labelPlural,
                icon: CONFIG.Scene.sidebarIcon
            },
            actors: {
                tooltip: Actor.metadata.labelPlural,
                icon: CONFIG.Actor.sidebarIcon
            },
            items: {
                tooltip: Item.metadata.labelPlural,
                icon: CONFIG.Item.sidebarIcon
            },
            journal: {
                tooltip: "SIDEBAR.TabJournal",
                icon: CONFIG.JournalEntry.sidebarIcon
            },
            tables: {
                tooltip: RollTable.metadata.labelPlural,
                icon: CONFIG.RollTable.sidebarIcon
            },
            cards: {
                tooltip: Cards.metadata.labelPlural,
                icon: CONFIG.Cards.sidebarIcon
            },
            playlists: {
                tooltip: Playlist.metadata.labelPlural,
                icon: CONFIG.Playlist.sidebarIcon
            },
            compendium: {
                tooltip: "SIDEBAR.TabCompendium",
                icon: "fas fa-atlas"
            },
            settings: {
                tooltip: "SIDEBAR.TabSettings",
                icon: "fas fa-cogs"
            }
        };
        if ( !isGM ) delete tabs.scenes;

        // Display core or system update notification?
        if ( isGM && (game.data.coreUpdate.hasUpdate || game.data.systemUpdate.hasUpdate) ) {
            tabs.settings.notification = `<i class="notification-pip fas fa-exclamation-circle"></i>`;
        }

        return {tabs};
    }

    async _render(force, options) {

        // Render the Sidebar container only once
        if ( !this.rendered ) await super._render(force, options);

        // Render sidebar Applications
        const renders = [];

        this.tabs.sidebarRoll = new SidebarRoll()

        for ( let [name, app] of Object.entries(this.tabs) ) {
            renders.push(app._render(true).catch(err => {
                Hooks.onError("Sidebar#_render", err, {
                    msg: `Failed to render Sidebar tab ${name}`,
                    log: "error",
                    name
                });
            }));
        }

        Promise.all(renders).then(() => this.activateTab(this.activeTab));
    }


}

class SidebarRoll extends SidebarTab {
    constructor(actor) {
        super();
        this.actor = actor
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "sidebarRoll",
            template: "systems/phoenix/templates/ui/sidebar-roll.html",
            title: "SidebarRoll"
        });
    }

    getData(options={}) {
        if (!this.actor) return;

        const skills = Array.from(Array(7), () => []);
        var dict = {
            strength: 0,
            dexterity: 1,
            constitution: 2,
            intelligence: 3,
            wisdom: 4,
            charisma: 5,
            misc: 6
        }
        let specialSkills = Array(0)

        const context = this.actor

        for (let i of context.items) {
            // Skills handling
            if (i.type === "skill") {
                if (i.system.parentSkill in dict) {
                    const parentSkillIndex = dict[i.system.parentSkill]
                    skills[parentSkillIndex].push({
                        skill: i,
                        secondaries: []
                    })
                    continue
                }

                skills[6].push({
                    skill: i,
                    secondaries: []
                })
                continue
            }
        }

        for (let i of skills[6]){
            let foundParent = false
            for (let k = 0; k < 6; k++){
                for (let j = 0; j < skills[k].length; j++){
                    if (skills[k][j].skill.name === i.skill.system.parentSkill){
                        skills[k][j].secondaries.push(i.skill)
                        foundParent = true
                        break
                    }
                }
                if (foundParent){break}
            }
            if (!foundParent) {specialSkills.push(i)}
        }
        skills[6] = specialSkills

        context.skills = skills;

        context.roll_result = this.roll_result

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Select dice to roll
        html.find('.dice-icon').click(ev => {
            $('.dice-icon').css('background-color', '').removeClass("active");
            $('.dice-icon svg').css('fill', '');

            $(ev.currentTarget).css('background-color', "var(--apsj-orange-dark)").addClass("active");
            $(ev.currentTarget).find('svg').css('fill', 'white');
        });

        const numberInput = $("#numberInput");
        // Increase/decrease roll modifier
        $("#decrease").click(function() {
            const currentValue = parseInt(numberInput.val());
            numberInput.val(currentValue - 1);
        });

        $("#increase").click(function() {
            const currentValue = parseInt(numberInput.val());
            numberInput.val(currentValue + 1);
        });

        // Toggle advantage/disadvantage buttons
        html.find('.advantage-button').click(ev => {
            $(ev.currentTarget).toggleClass("active")
            if ($(ev.currentTarget).hasClass("active")) {
                html.find('.disadvantage-button').removeClass("active")
            }
        })

        html.find('.disadvantage-button').click(ev => {
            $(ev.currentTarget).toggleClass("active")
            if ($(ev.currentTarget).hasClass("active")) {
                html.find('.advantage-button').removeClass("active")
            }
        })

        // Add/remove XP roll
        html.find('.xp-control').click(ev => {
            $(ev.currentTarget).toggleClass("active")
        })

        html.find('.sidebar-modifier').click(ev => {
            const div = $(ev.currentTarget);
            div.toggleClass("roll-active")

            manageListElement(html,
                div.attr("data-key"),
                div.attr("data-value"),
                div.attr("data-mod-type"),
                div.hasClass("roll-active"))
        });

        // Roll with given modifiers
        html.find('.roll-button').click(async ev =>{
            let sum = 0;

            $(".roll-mod").each(function() {
                var value = parseInt($(this).text());
                if (!isNaN(value)) {
                    sum += value;
                }
            });

            let advantage = ""
            let number = "2"

            if (html.find('.advantage-button').hasClass('active')){
                advantage = "kh"
            } else if (html.find('.disadvantage-button').hasClass('active')){
                advantage = "kl"
            }
            else {
                number = "1"
            }

            let dice = html.find('.dice-icon.active').attr("data-dice")

            if (!dice){
                dice = "d20"
            }

            let roll = new Roll(number + dice + advantage + " + " + sum + "+" + numberInput.val(), this.actor)
            await roll.toMessage({speaker: ChatMessage.getSpeaker({actor: this.actor})})
            console.log(roll.result)
            this.roll_result = roll.total

            if (html.find('.xp-control').hasClass("active")){
                let xproll = new Roll("1d100 + " + this.actor.system.stats.intelligence.value)
                await xproll.toMessage({speaker: ChatMessage.getSpeaker({actor: this.actor})})

                if (xproll.total >= 90) {
                    AudioHelper.play({src: "modules/experience-roll/sounds/xpsound.mp3", volume: 0.3, autoplay: true, loop: false}, true);


                    let data = {
                        content: this.actor.name + " успешно бросил опытник! Результат броска: " + xproll.result,
                        user: game.user,
                        speaker: ChatMessage.getSpeaker({actor: this.actor})
                    }

                    ChatMessage.create(data)
                }


            }

            this.render()
        })

        Hooks.on('controlToken', (object, controlled) => {
            if (controlled) {
                this.actor = game.actors.get(object.document.actorId)
                this.render()
            }
        })

        Hooks.on('actorUpdated', (data) => {
            if (data.actor.uuid === this.actor.uuid) {
                this.render()
            }
        })
    }
}