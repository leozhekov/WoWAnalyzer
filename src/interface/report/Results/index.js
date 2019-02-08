import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Trans, t } from '@lingui/macro';

import lazyLoadComponent from 'common/lazyLoadComponent';
import retryingPromise from 'common/retryingPromise';
import makeWclUrl from 'common/makeWclUrl';
import { getResultTab } from 'interface/selectors/url/report';
import { hasPremium } from 'interface/selectors/user';
import ErrorBoundary from 'interface/common/ErrorBoundary';
import Warning from 'interface/common/Alert/Warning';
import Ad from 'interface/common/Ad';
import ReadableList from 'interface/common/ReadableList';
import Contributor from 'interface/contributor/Button';
import WipefestLogo from 'interface/images/Wipefest-logo.png';
import { i18n } from 'interface/RootLocalizationProvider';
import Combatants from 'parser/shared/modules/Combatants';
import Checklist from 'parser/shared/modules/features/Checklist/Module';
import CharacterTab from 'parser/shared/modules/features/CharacterTab';
import EncounterPanel from 'parser/shared/modules/features/EncounterPanel';

import ChangelogTab from 'interface/others/ChangelogTab';
import Header from './Header';
import About from './About';
import Overview from './Overview';
import Statistics from './Statistics';
import './Results.scss';
import { findByBossId } from 'raids';
import LoadingBar from 'interface/layout/NavigationBar/LoadingBar';

// Gone for now, reintroduce if we can make it useful
// const DevelopmentTab = lazyLoadComponent(() => retryingPromise(() => import(/* webpackChunkName: 'DevelopmentTab' */ 'interface/others/DevelopmentTab').then(exports => exports.default)));
const TimelineTab = lazyLoadComponent(() => retryingPromise(() => import(/* webpackChunkName: 'TimelineTab' */ './Timeline/Container').then(exports => exports.default)));
const EventsTab = lazyLoadComponent(() => retryingPromise(() => import(/* webpackChunkName: 'EventsTab' */ 'interface/others/EventsTab').then(exports => exports.default)));

const CORE_TABS = {
  OVERVIEW: 'overview',
  STATISTICS: 'statistics',
  TIMELINE: 'timeline',
  CHARACTER: 'character',
  EVENTS: 'events',
  ABOUT: 'about',
};

class Results extends React.PureComponent {
  static propTypes = {
    parser: PropTypes.shape({
    }),
    characterProfile: PropTypes.object,
    selectedTab: PropTypes.string,
    makeTabUrl: PropTypes.func.isRequired,
    fight: PropTypes.shape({
      start_time: PropTypes.number.isRequired,
      end_time: PropTypes.number.isRequired,
      boss: PropTypes.number.isRequired,
    }).isRequired,
    player: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }).isRequired,
    isLoading: PropTypes.bool,
    progress: PropTypes.number,
    premium: PropTypes.bool,
  };
  static childContextTypes = {
    updateResults: PropTypes.func.isRequired,
    parser: PropTypes.object,
  };
  getChildContext() {
    return {
      updateResults: this.forceUpdate.bind(this),
      parser: this.props.parser,
    };
  }
  static contextTypes = {
    config: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      adjustForDowntime: false,
    };
  }

  get warning() {
    const parser = this.props.parser;
    const boss = parser.boss;
    if (boss && boss.fight.resultsWarning) {
      return boss.fight.resultsWarning;
    }
    return null;
  }

  renderContent(selectedTab, results) {
    const { parser } = this.props;

    switch (selectedTab) {
      case CORE_TABS.OVERVIEW: {
        const checklist = parser.getModule(Checklist, false);
        return (
          <Overview
            checklist={checklist && checklist.render()}
            issues={results.issues}
          />
        );
      }
      case CORE_TABS.STATISTICS:
        return (
          <Statistics parser={parser}>{results.statistics}</Statistics>
        );
      case CORE_TABS.TIMELINE:
        return (
          <TimelineTab parser={parser} />
        );
      case CORE_TABS.EVENTS:
        return (
          <div className="container">
            <EventsTab parser={parser} />
          </div>
        );
      case CORE_TABS.CHARACTER: {
        const characterTab = parser.getModule(CharacterTab);
        const encounterPanel = parser.getModule(EncounterPanel);

        return (
          <div className="container">
            {characterTab.render()}
            {encounterPanel.render()}
          </div>
        );
      }
      case CORE_TABS.ABOUT: {
        const config = this.context.config;
        return (
          <div className="container">
            <About config={config} />
            <ChangelogTab />
          </div>
        );
      }
      default:
        return (
          <div className="container">
            {results.tabs.find(tab => tab.url === selectedTab).render()}
          </div>
        );
    }
  }
  render() {
    const { parser, fight, player, characterProfile, makeTabUrl, selectedTab, premium, isLoading, progress } = this.props;
    const config = this.context.config;

    const boss = findByBossId(fight.boss);

    const results = !isLoading && parser.generateResults({
      i18n, // TODO: Remove and use singleton
      adjustForDowntime: this.state.adjustForDowntime,
    });

    const contributorinfo = <ReadableList>{(config.contributors.length !== 0) ? config.contributors.map(contributor => <Contributor key={contributor.nickname} {...contributor} />) : 'CURRENTLY UNMAINTAINED'}</ReadableList>;

    return (
      <div className={`results boss-${fight.boss}`}>
        <Header
          config={config}
          name={player.name}
          characterProfile={characterProfile}
          boss={boss}
          fight={fight}
          tabs={results ? results.tabs : []}
          makeTabUrl={makeTabUrl}
          selectedTab={selectedTab}
        />

        {boss && boss.fight.resultsWarning && (
          <div className="container">
            <Warning style={{ marginBottom: 30 }}>
              {boss.fight.resultsWarning}
            </Warning>
          </div>
        )}

        {isLoading && (
          <div className="container" style={{ marginBottom: 40 }}>
            <LoadingBar progress={progress} />
          </div>
        )}

        {!isLoading && this.renderContent(selectedTab, results)}

        {premium === false && (
          <div className="container text-center" style={{ marginTop: 40 }}>
            <Ad />
          </div>
        )}

        <div className="container">
          <Trans>{config.spec.specName} {config.spec.className} analysis has been provided by {contributorinfo}. They love hearing what you think, so please let them know! <Link to={makeTabUrl('about')}>More info about this spec analysis.</Link></Trans>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  selectedTab: getResultTab(state) || CORE_TABS.OVERVIEW,
  premium: hasPremium(state),
});

export default connect(
  mapStateToProps
)(Results);
