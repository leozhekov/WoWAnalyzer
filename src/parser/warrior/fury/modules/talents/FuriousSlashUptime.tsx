import React from 'react';
import Analyzer, { Options } from 'parser/core/Analyzer';
import { When, ThresholdStyle } from 'parser/core/ParseResults';
import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';
import { formatDuration, formatPercentage, formatNumber } from 'common/format';
import Statistic from 'interface/statistics/Statistic';
import STATISTIC_CATEGORY from 'interface/others/STATISTIC_CATEGORY';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import StatTracker from 'parser/shared/modules/StatTracker';
import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';

import FuriousSlashTimesByStacks from './FuriousSlashTimesByStacks';

class FuriousSlashUptime extends Analyzer {
	static dependencies = {
    statTracker: StatTracker,
    furiousSlashTimesByStacks: FuriousSlashTimesByStacks,
  };
  protected furiousSlashTimesByStacks!: FuriousSlashTimesByStacks;

	constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(SPELLS.FURIOUS_SLASH_TALENT.id);
    }

  get furiousSlashTimesByStack(){
	  return this.furiousSlashTimesByStacks.furiousSlashTimesByStacks;
  }

  get numberTimesDropped(){
    return this.furiousSlashTimesByStack[0].length-1;
  }

  get uptime(){
    const stacks = Object.values(this.furiousSlashTimesByStack).map((e) => e.reduce((a, b) => a + b, 0));
    stacks.shift();
    let value: number = 0;
    stacks.forEach(function(i){
      value += i;
    });
	  return value;
	  //find the highest stack count possible, and return the uptime at that amount of stacks
  }

  get uptimeSuggestionThresholds(){
	  return{
		  actual: this.numberTimesDropped,
		  isGreaterThan:{
			  minor: 0,
			  average: 1,
			  major: 2,
		  },
		  style: ThresholdStyle.NUMBER,
	  };
  }

  suggestions(when: When){
		  when(this.uptimeSuggestionThresholds)
		  .addSuggestion((suggest, actual, recommended) => suggest(<>You dropped <SpellLink id={SPELLS.FURIOUS_SLASH_TALENT.id} /> multiply times throughout the fight. This can be improved.</>)
		  .icon(SPELLS.FURIOUS_SLASH_TALENT.icon)
		  .actual(i18n._(t('warrior.fury.suggestions.furiousSlash.uptime')`${formatNumber(actual)} times Furious Slash dropped`))
		  .recommended(`${formatNumber(recommended)} is recommended`));
  }

  statistic() {
	  return (
      <Statistic
        category={STATISTIC_CATEGORY.TALENTS}
        size="flexible"
        dropdown={(
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>Stacks</th>
                <th>Time (s)</th>
                <th>Time (%)</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(this.furiousSlashTimesByStack).map((e, i) => (
                <tr key={i}>
                  <th>{i}</th>
                  <td>{formatDuration(e.reduce((a, b) => a + b, 0) / 1000)}</td>
                  <td>{formatPercentage(e.reduce((a, b) => a + b, 0) / this.owner.fightDuration)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      >
        <BoringSpellValueText spell={SPELLS.FURIOUS_SLASH_TALENT}>
          <>
            {formatPercentage(this.uptime / this.owner.fightDuration)}% stack uptime
          </>
        </BoringSpellValueText>
      </Statistic>
		);
  }
}

export default FuriousSlashUptime;
