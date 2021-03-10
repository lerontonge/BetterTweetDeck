import {css} from '@emotion/css';
import React, {Fragment} from 'react';

import {BTDTweetActionsPosition} from '../../../features/changeTweetActions';
import {getTransString, Trans} from '../../trans';
import {BooleanSettingsRow} from '../components/booleanSettingRow';
import {CheckboxSelectSettingsRow} from '../components/checkboxSelectSettingsRow';
import {BTDRadioSelectSettingsRow} from '../components/radioSelectSettingsRow';
import {SettingsButton} from '../components/settingsButton';
import {SettingsRow, SettingsRowTitle} from '../components/settingsRow';
import {SettingsSeparator} from '../components/settingsSeparator';
import {SettingsTextInput} from '../components/settingsTextInput';
import {formatDateTime, SettingsMenuRenderer} from '../settingsComponents';

export const renderTweetActionsSettings: SettingsMenuRenderer = (
  settings,
  makeOnSettingsChange,
  _setEditorHasErrors
) => {
  return (
    <Fragment>
      <BTDRadioSelectSettingsRow
        settingsKey="showTweetActionsOnHover"
        initialValue={settings.showTweetActionsOnHover}
        onChange={makeOnSettingsChange('showTweetActionsOnHover')}
        fields={[
          {label: getTransString('settings_actions_visibility_always'), value: false},
          {label: getTransString('settings_actions_visibility_on_hover'), value: true},
        ]}>
        <Trans id="settings_actions_visibility" />
      </BTDRadioSelectSettingsRow>
      <BTDRadioSelectSettingsRow
        settingsKey="tweetActionsPosition"
        initialValue={settings.tweetActionsPosition}
        onChange={makeOnSettingsChange('tweetActionsPosition')}
        fields={[
          {
            label: getTransString('settings_actions_position_left'),
            value: BTDTweetActionsPosition.LEFT,
          },
          {
            label: getTransString('settings_actions_position_right'),
            value: BTDTweetActionsPosition.RIGHT,
          },
        ]}>
        <Trans id="settings_position_of_actions" />
      </BTDRadioSelectSettingsRow>
      <CheckboxSelectSettingsRow
        onChange={(key, value) => {
          makeOnSettingsChange('tweetActions')({
            ...settings.tweetActions,
            [key]: value,
          });
        }}
        fields={[
          {
            initialValue: settings.tweetActions.addBlockAction,
            key: 'addBlockAction',
            label: getTransString('settings_action_block_author'),
          },
          {
            initialValue: settings.tweetActions.addMuteAction,
            key: 'addMuteAction',
            label: getTransString('settings_action_mute_author'),
          },
          {
            initialValue: settings.tweetActions.addCopyMediaLinksAction,
            key: 'addCopyMediaLinksAction',
            label: getTransString('settings_action_copy_media_links'),
          },
          {
            initialValue: settings.tweetActions.addDownloadMediaLinksAction,
            key: 'addDownloadMediaLinksAction',
            label: getTransString('settings_action_download_media'),
          },
        ]}>
        <Trans id="settings_additional_actions" />
      </CheckboxSelectSettingsRow>
      <SettingsRow
        disabled={!settings.tweetActions.addDownloadMediaLinksAction}
        className={css`
          grid-template-columns: 150px 1fr;

          input {
            width: 80%;
          }
        `}>
        <SettingsRowTitle>
          <Trans id="settings_downloaded_filename_format" />
        </SettingsRowTitle>
        <SettingsTextInput
          value={settings.downloadFilenameFormat}
          onChange={makeOnSettingsChange('downloadFilenameFormat')}></SettingsTextInput>
      </SettingsRow>
      <SettingsRow
        disabled={!settings.tweetActions.addDownloadMediaLinksAction}
        className={css`
          align-items: flex-start;
        `}>
        <SettingsRowTitle>
          <Trans id="settings_filename_format_tokens" />
        </SettingsRowTitle>
        <div
          className={css`
            display: inline-block;
            margin-left: -10px;

            > button {
              margin-bottom: 10px;
              margin-left: 10px;
            }
          `}>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{postedUser}}'
              );
            }}>
            <Trans id="settings_token_username_without" />
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{tweetId}}'
              );
            }}>
            <Trans id="settings_token_tweet_id" />
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{fileName}}'
              );
            }}>
            <Trans id="settings_token_filename" />
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{fileExtension}}'
              );
            }}>
            <Trans id="settings_token_file_extension" />
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{year}}'
              );
            }}>
            <Trans id="settings_token_year" /> ({formatDateTime('yyyy')})
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{day}}'
              );
            }}>
            <Trans id="settings_token_day" /> ({formatDateTime('dd')})
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{month}}'
              );
            }}>
            <Trans id="settings_token_month" /> ({formatDateTime('MM')})
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{minutes}}'
              );
            }}>
            <Trans id="settings_token_minutes" />
          </SettingsButton>
          <SettingsButton
            onClick={() => {
              makeOnSettingsChange('downloadFilenameFormat')(
                settings.downloadFilenameFormat + '{{seconds}}'
              );
            }}>
            <Trans id="settings_token_seconds" />
          </SettingsButton>
        </div>
      </SettingsRow>
      <CheckboxSelectSettingsRow
        onChange={(key, value) => {
          makeOnSettingsChange('tweetMenuItems')({
            ...settings.tweetMenuItems,
            [key]: value,
          });
        }}
        fields={[
          {
            initialValue: settings.tweetMenuItems.addMuteHashtagsMenuItems,
            key: 'addMuteHashtagsMenuItems',
            label: getTransString('settings_menu_item_mute_hashtags'),
          },
          {
            initialValue: settings.tweetMenuItems.addMuteSourceMenuItem,
            key: 'addMuteSourceMenuItem',
            label: getTransString('settings_menu_item_mute_source'),
          },
          {
            initialValue: settings.tweetMenuItems.addRedraftMenuItem,
            key: 'addRedraftMenuItem',
            label: getTransString('settings_menu_item_redraft'),
          },
        ]}>
        <Trans id="settings_additional_tweet_menu_items" />
      </CheckboxSelectSettingsRow>
      <SettingsSeparator></SettingsSeparator>
      <BooleanSettingsRow
        settingsKey="replaceHeartsByStars"
        initialValue={settings.replaceHeartsByStars}
        onChange={makeOnSettingsChange('replaceHeartsByStars')}>
        <Trans id="settings_replace_hearts_by_stars" />
      </BooleanSettingsRow>
    </Fragment>
  );
};
