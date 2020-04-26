import React from 'react';
import Analyzer from 'parser/core/Analyzer';
import SPELLS from 'common/SPELLS';
import Statistic from 'interface/statistics/Statistic';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import BoringSpellValueText
  from 'interface/statistics/components/BoringSpellValueText';
import SpellUsable from '../../../../shared/modules/SpellUsable';
import { ApplyBuffEvent } from '../../../../core/Events';

/**
 * Activating Bestial Wrath grants 2 charges of Barbed Shot.
 *
 * Example log:
 *
 */

const CHARGE_RECHARGE = 2;

class ScentOfBlood extends Analyzer {

  static dependencies = {
    spellUsable: SpellUsable,
  };

  protected spellUsable!: SpellUsable;

  chargesGained = 0;
  chargesWasted = 0;

  constructor(options: any) {
    super(options);
    this.active
      = this.selectedCombatant.hasTalent(SPELLS.SCENT_OF_BLOOD_TALENT.id);
  }

  on_byPlayer_applybuff(event: ApplyBuffEvent) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.BESTIAL_WRATH.id) {
      return;
    }

    this.chargesGained += CHARGE_RECHARGE -
      this.spellUsable.chargesAvailable(SPELLS.BARBED_SHOT.id);
    this.chargesWasted
      += Math.max(this.spellUsable.chargesAvailable(SPELLS.BARBED_SHOT.id) -
      CHARGE_RECHARGE, 0);
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(13)}
        size="flexible"
        category={'TALENTS'}
      >
        <BoringSpellValueText spell={SPELLS.SCENT_OF_BLOOD_TALENT}>
          <>
            {this.chargesGained}/{this.chargesGained + this.chargesWasted}
            <small>charges gained</small>
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default ScentOfBlood;
