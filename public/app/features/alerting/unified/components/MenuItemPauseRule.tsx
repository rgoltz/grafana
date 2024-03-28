import React from 'react';

import { Menu } from '@grafana/ui';
import { alertRuleApi } from 'app/features/alerting/unified/api/alertRuleApi';
import { isGrafanaRulerRule, isGrafanaRulerRulePaused } from 'app/features/alerting/unified/utils/rules';
import { CombinedRule } from 'app/types/unified-alerting';

const { useUpdateRuleMutation } = alertRuleApi;

interface Props {
  rule: CombinedRule;
  /**
   * Method invoked after the request to change the paused state has completed
   */
  onPauseChange?: () => {};
}

/**
 * Menu item to display correct text for pausing/resuming an alert,
 * and triggering API call to do so
 */
const MenuItemPauseRule = ({ rule, onPauseChange }: Props) => {
  const { group } = rule;
  const [updateRule] = useUpdateRuleMutation();
  const isPaused = isGrafanaRulerRule(rule.rulerRule) && isGrafanaRulerRulePaused(rule.rulerRule);
  const icon = isPaused ? 'play' : 'pause';
  const title = isPaused ? 'Resume alert evaluation' : 'Pause alert evaluation';

  /**
   * Triggers API call to update the current rule to the new `is_paused` state
   */
  const setRulePause = async (newIsPaused: boolean) => {
    if (!isGrafanaRulerRule(rule.rulerRule)) {
      return;
    }
    const ruleUid = rule.rulerRule.grafana_alert.uid;

    // Parse the rules into correct format for API
    const modifiedRules = group.rules.map((groupRule) => {
      if (isGrafanaRulerRule(groupRule.rulerRule) && groupRule.rulerRule.grafana_alert.uid === ruleUid) {
        return {
          ...groupRule.rulerRule,
          grafana_alert: {
            ...groupRule.rulerRule.grafana_alert,
            is_paused: newIsPaused,
          },
        };
      }

      return groupRule.rulerRule!;
    });

    const payload = {
      interval: group.interval!,
      name: group.name,
      rules: modifiedRules,
    };

    await updateRule({
      nameSpaceUID: rule.namespace.uid || rule.rulerRule.grafana_alert.namespace_uid,
      payload,
    }).unwrap();

    onPauseChange?.();
  };

  return (
    <Menu.Item
      label={title}
      icon={icon}
      onClick={() => {
        setRulePause(!isPaused);
      }}
    />
  );
};

export default MenuItemPauseRule;