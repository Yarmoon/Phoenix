

export class PhoenixActorPanel extends ActorSheet {

    constructor(actor) {
        super(actor);
    }

    getData(options = {}) {
        let context = foundry.utils.mergeObject(super.getData(options), this.prepareSkills(this.object))
        return context;
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
        return context
    }

    activateListeners(html) {
        super.activateListeners(html);


        this.counters = {}
        console.log(this.counters)
        this._popoverListeners([".max-health-evasion-popover", ".stats"], this.counters)
        this._popoverListeners([".skills-popover", ".attrs"], this.counters)

        html.find('.skill-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".skill");
            const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.skill-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".skill");
            this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
            li.slideUp(200, () => this.render(false));
        });
    }

    _popoverListeners (triggers, counters) {
        let popover = triggers[0]
        for (let i of triggers) {
            counters[popover] = 0
            $(document).on('mouseenter', i, function () {
                $(popover).show()
                counters[popover]+=1
            })
            $(document).on('mouseleave', i, function () {
                counters[popover]-=1
                if (counters[popover] === 0) {
                    $(popover).hide()
                }
            })
        }
    }
}