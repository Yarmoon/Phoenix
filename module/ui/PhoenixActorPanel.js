export class PhoenixActorPanel extends ActorSheet {

    constructor(actor) {
        super(actor);

        this.rollModifiers = {}

        this.customMod = 0

        this.effectsCollapsed = true;

        this.rollDice = {
            d4: 0,
            d6: 0,
            d8: 0,
            d10: 0,
            d12: 0,
            d20: 0,
            d100: 0
        }

        this.vantage = ""

        this.renderPopovers = []

        Hooks.on("renderActorSheet", (app, html, data) => {
            if (app.appId === this.appId) {
                if (Object.values(this.rollModifiers).length === 0 && this.customMod === 0) $(html).find('.roll-modifiers-list').remove()

                for (const effect of this.object.appliedEffects) {
                    let effectItem = $(html).find(`[data-effect-id="${effect.id}"]`)
                    effectItem.find("img").addClass("img-border")
                }

                for (const rollMod of Object.keys(this.rollModifiers)) {
                    let rollModField
                    if (this.rollModifiers[rollMod].type === "skill")
                        rollModField = $(html).find(`[data-item-id="${this.rollModifiers[rollMod].reference}"]`)
                    else
                        rollModField = $(html).find(`[data-key="${this.rollModifiers[rollMod].reference}"]`)
                    rollModField.addClass("mod-active")
                }

                this._updateDice()
            }


            for (const popover of this.renderPopovers) {
                $(popover).show()
            }
            this.renderPopovers = []
        })
    }

    render(force = false, options = {}) {
        this._recalculateRollModifiers()

        return super.render(force, options);
    }

    getData(options = {}) {
        let context = foundry.utils.mergeObject(super.getData(options), this.prepareSkills(this.object), this.rollModifiers)
        context = foundry.utils.mergeObject(context, {rollmods: this.rollModifiers})
        context = foundry.utils.mergeObject(context, {rollModsSum: this._calculateRollModifiersSum()})
        context = foundry.utils.mergeObject(context, {customMod: this.customMod})
        return context;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "actor-panel",
            template: "systems/phoenix/templates/ui/actor-panel.html",
            popOut: false,
            closeOnSubmit: false,
            submitOnChange: true,
            submitOnClose: true,
            resizable: false
        })
    }

    prepareSkills(context) {
        const skills = Array.from(Array(7), () => []);
        let dict = {
            strength: 0,
            dexterity: 1,
            constitution: 2,
            intelligence: 3,
            wisdom: 4,
            charisma: 5,
            misc: 6
        }
        let specialSkills = Array(0)

        for (let i of context.items) {
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
            }
        }

        for (let i of skills[6]) {
            let foundParent = false
            for (let k = 0; k < 6; k++) {
                for (let j = 0; j < skills[k].length; j++) {
                    if (skills[k][j].skill.name === i.skill.system.parentSkill) {
                        skills[k][j].secondaries.push(i.skill)
                        foundParent = true
                        break
                    }
                }
                if (foundParent) {
                    break
                }
            }
            if (!foundParent) {
                specialSkills.push(i)
            }
        }
        skills[6] = specialSkills


        context.skills = skills;
        return context
    }

    activateListeners(html) {
        super.activateListeners(html);

        this.counters = {}

        this._popoverListeners([".max-health-evasion-popover", ".stats"], this.counters)
        this._popoverListeners([".skills-popover", ".attrs"], this.counters)
        this._popoverListeners([".roll-modifiers-list", ".roll-modifiers-sum"], this.counters)

        html.find('.skill-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".skill");
            const skill = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
            skill.sheet.render(true);
        });

        html.find('.skill-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".skill");
            this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
            li.slideUp(200, () => this.render(false));
        });

        html.find('.skill-create').click(ev => {

            let creatableItems = ['skill'];
            let selectList = "";

            creatableItems.forEach(type => selectList += "<option value='" + type + "'>" + type + "</option>")

            //Select the stat of the roll.
            let t = new Dialog({
                title: game.i18n.localize("Phoenix.SkillCreation"),
                content: `<h2> ${game.i18n.localize("Phoenix.SkillName")} </h2> <input type='text' name='itemName' id='itemName' style='margin-bottom: 10px;'> <br/>`,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `${game.i18n.localize("Phoenix.Create")}`,
                        callback: (html) => this._onItemCreate(ev, 'skill', html.find('[id="itemName"]')[0].value)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: `${game.i18n.localize("Phoenix.Cancel")}`,
                        callback: () => {
                        }
                    }
                },
                default: "roll",
                close: () => {
                }
            });
            t.render(true);
        });

        html.find('.effect-create').click(ev => {

            let effectData = {
                name: "Новый Эффект",
                icon: this.object.img,
                changes: [
                    {
                        key: "", // The property to modify
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD, // Mode of modification (ADD, MULTIPLY, etc.)
                        value: 2, // The value to add
                        priority: 20
                    }
                ],
                duration: {
                    turns: 5, // Duration in turns
                },
                origin: `Actor.${this.object.id}` // Identifying the origin of the effect
            };

            this.object.createEmbeddedDocuments("ActiveEffect", [effectData])

            let effect = this.object.effects.find(e => e.name === "New Effect");

            const effectConfig = new ActiveEffectConfig(effect, {})

            effectConfig.render(true)
        })

        html.find('.effect-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".effect");
            const effect = this.actor.getEmbeddedDocument("ActiveEffect", li.data("effectId"));

            const config = new ActiveEffectConfig(effect, {})

            config.render(true)
        })

        html.find('.effect-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".effect");
            const effect = this.actor.getEmbeddedDocument("ActiveEffect", li.data("effectId"));

            effect.delete()
        })

        if (this.effectsCollapsed) html.find('.effects-panel').removeClass('expand-effects-forward');
        else html.find('.effects-panel').addClass('expand-effects-forward');

        html.find('.expand-effects-button').click(ev => {
            this.effectsCollapsed = !this.effectsCollapsed

            if (this.effectsCollapsed) html.find('.effects-panel').removeClass('expand-effects-forward');
            else html.find('.effects-panel').addClass('expand-effects-forward');
        });

        html.find('.item-name').click(ev => {
            const li = $(ev.currentTarget).parents('.skill');
            const skill = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
            let isSecondary = li.hasClass('secondary-skill')
            let id = skill.id

            if (this.rollModifiers[id] !== undefined) {
                delete this.rollModifiers[id]
            } else {
                this.rollModifiers[id] = {
                    value: skill.system.value * (1 + isSecondary),
                    name: skill.name,
                    type: "skill",
                    reference: id
                }
            }

            this.renderPopovers.push(".skills-popover")

            this.render(false, {renderPopovers: [".skills-popover"]})
        })

        html.find('.attr-name').click(ev => {
            const name = $(ev.currentTarget)
            const li = $(ev.currentTarget).parents(".attr");
            let id = name.text()

            if (this.rollModifiers[id] !== undefined) {
                delete this.rollModifiers[id]
            } else {
                this.rollModifiers[id] = {
                    value: li.find("input").val(),
                    name: name.text(),
                    type: "stat",
                    reference: li.data("key")
                }
            }

            this.renderPopovers.push(".skills-popover")

            this.render(false, {})
        })

        html.find(`.stat-label`).click(ev => {
            const name = $(ev.currentTarget)
            const li = $(ev.currentTarget).parents(".stat");
            let type = li.data("key")
            if (type !== "victories" && type !== "exhaustion") return


            let id = name.text().trim()

            if (this.rollModifiers[id] !== undefined) {
                delete this.rollModifiers[id]
            } else {
                this.rollModifiers[id] = {
                    value: li.find("input").val() * (1 - 2 *(type === "exhaustion")),
                    name: name.text(),
                    type: "stat",
                    reference: type
                }
            }


            this.render(false, {})
        })

        html.find('.effect-item').click(ev => {
            const li = $(ev.currentTarget).parents(".effect");
            const effect = this.actor.getEmbeddedDocument("ActiveEffect", li.data("effectId"));

            this.actor.updateEmbeddedDocuments("ActiveEffect", [{_id: effect.id, disabled: !effect.disabled}])
        })

        html.find('.custom-modifier-button').click(ev => {
            const li = $(ev.currentTarget)
            this.customMod += parseInt(li.data("key"), 10) * (1 + ev.shiftKey * 4)

            this.render()
        })

        html.find('.dice-wrapper').click(ev => {
            const li = $(ev.currentTarget)
            const die = li.data("key")
            this.rollDice[die]+=1

            this.render()
        })

        html.find('.dice-wrapper').on('contextmenu', ev => {
            const li = $(ev.currentTarget)
            const die = li.data("key")
            if (this.rollDice[die] > 0)
            this.rollDice[die]-=1

            this.render()
        })
    }

    _updateDice() {
        $.each(this.rollDice, function(key, value) {
            // Find elements with the matching data-key and update them
            $('[data-key="' + key + '"]').each(function() {
                if (value >= 1) $(this).addClass("mod-active")
                if (value <=1) return

                let displayElement = $('<div class="dice-counter">' + value + '</div>');

                // Append the display element to the body or a container, not as a child of the current element
                $(this).parents("#actor-panel").append(displayElement);

                // Position the display element over the current element
                let offset = $(this).position();

                displayElement.css({
                    position: 'absolute',
                    left: offset.left + $(this).width()/2 + 'px',
                    top: offset.top + $(this).height() + 'px',
                    transform: "translate(-30%, 0) scale(" + ($(this).width()/120 + 0.5) + ")"
                });
            });
        });
    }

    _recalculateRollModifiers() {
        if (this.customMod !== 0) this.rollModifiers.customMod = {
            name: "Ситуативный",
            value: this.customMod,
            type: "custom"
        }
        else delete this.rollModifiers.customMod

        for (const rollMod of Object.values(this.rollModifiers)) {
            if (rollMod.type === "stat") {
                rollMod.value = this._getValueFromPath(this.object.system, rollMod.reference)
            }

            if (rollMod.type === "skill") {
                const skill = this.object.items.get(rollMod.reference)
                rollMod.value = skill.system.value * (1 + this._skillIsSecondary(skill))
            }
        }
    }

    _calculateRollModifiersSum() {
        if (!this.rollModifiers) return 0
        let sum = 0
        for (const rollMod of Object.values(this.rollModifiers)) {
            sum+=rollMod.value
        }
        return sum
    }

    _skillIsSecondary (skill) {
        const parent = skill.system.parentSkill
        return !(parent === "strength" || parent === "dexterity" || parent === "constitution" ||
            parent === "intelligence" || parent === "wisdom" || parent === "charisma");

    }

    _getValueFromPath(obj, path) {
        return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
    }

    _popoverListeners(triggers, counters) {
        let popover = triggers[0]
        for (let i of triggers) {
            counters[popover] = 0
            $(document).on('mouseenter', i, function () {
                $(popover).show()
                counters[popover] += 1
            })
            $(document).on('mouseleave', i, function () {
                counters[popover] -= 1
                if (counters[popover] === 0) {
                    $(popover).hide()
                }
            })
        }
    }

    _onItemCreate(event, type, name = "New Item") {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        //const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }
}