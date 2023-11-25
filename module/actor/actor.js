/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class PhoenixActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this;

    console.log(actorData)
    const data = actorData.system;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.system;

    // let armorBonus = 0;
    // const armors = this.getEmbeddedCollection("Item").filter(e => "armor" === e.type);

    // for (let armor of armors) {
    //   if (armor.data.equipped) {
    //     armorBonus += armor.data.bonus;
    //   }
    // }
    // data.stats.armor.mod = armorBonus;
  }

  prepareEmbeddedDocuments() {
    super.prepareEmbeddedDocuments();

    let parents = this.system.availableParents;

    var dict = {
      strength: 0,
      dexterity: 1,
      constitution: 2,
      intelligence: 3,
      wisdom: 4,
      charisma: 5
    }

    // Iterate through items, allocating to containers
    // let totalWeight = 0;

    let availableParents = {
      "strength": {
        "label": "Strength",
        "dtype": "String"
      },
      "dexterity": {
        "label": "Dexterity",
        "dtype": "String"
      },
      "constitution": {
        "label": "Constitution",
        "dtype": "String"
      },
      "intelligence": {
        "label": "Intelligence",
        "dtype": "String"
      },
      "wisdom": {
        "label": "Wisdom",
        "dtype": "String"
      },
      "charisma": {
        "label": "Charisma",
        "dtype": "String"
      },
      "misc": {
        "label": "Special",
        "dtype": "String"
      }
    }

    for (let i of this.items) {
      if (i.type === "skill") {
        if (i.system.parentSkill in dict) {
          availableParents[i.name] = {
            "label": i.name,
            "dtype": "String"
          }
        }
      }
    }

    for (let i of this.items){
      i.system.availableParents = availableParents
    }
  }


}