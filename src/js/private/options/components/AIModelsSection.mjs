// @flow strict
// $FlowFixMe[object-this-reference]
import {defineComponent, h} from 'vue';
import {Card, Form, FormItem, Input, InputNumber, Select, SelectOption, Table, Button, message, Collapse, CollapsePanel, Tag, Row, Col} from 'ant-design-vue';
import {t} from '../i18n.mjs';
import {confirmDialog} from '../ui.mjs';

const PROVIDER_DEFAULT_URLS = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
};

export default defineComponent({
  name: 'AIModelsSection',
  props: {
    settings: {type: Object, required: true},
  },
  data() {
    return {
      newName: '',
      newProvider: 'openai',
      newUrl: PROVIDER_DEFAULT_URLS.openai,
      newApiKey: '',
      newModel: '',
      newTimeout: 900,
      newMaxTokens: 0,
      loadStatus: '',
      loadStatusType: '',
      modelSuggestions: [],
      activeAdvanced: [],
    };
  },
  computed: {
    columns() {
      return [
        {title: t('optionsTitleAIModelsName', 'Name'), dataIndex: 'name'},
        {title: t('optionsTitleAIModelsProvider', 'Provider'), dataIndex: 'provider', width: 110},
        {title: t('optionsTitleAIModelsModel', 'Model'), dataIndex: 'model'},
        {title: t('optionsTitleAIModelsMaxTokens', 'Max tokens'), dataIndex: 'max_tokens', width: 110},
        {title: '', dataIndex: 'actions', width: 110},
      ];
    },
    models() {
      return Array.isArray(this.settings.ai_models) ? this.settings.ai_models : [];
    },
    statusColor() {
      return this.loadStatusType === 'error' ? 'red' : this.loadStatusType === 'warning' ? 'orange' : 'green';
    },
  },
  methods: {
    onProviderChange(val) {
      const defaultUrl = PROVIDER_DEFAULT_URLS[val];
      if (defaultUrl && (!this.newUrl || Object.values(PROVIDER_DEFAULT_URLS).includes(this.newUrl))) {
        this.newUrl = defaultUrl;
      }
    },
    async loadModels() {
      if (!this.newUrl) {
        this.loadStatus = t('optionsAIModelsLoadMissingURL', 'Enter URL first');
        this.loadStatusType = 'error';
        return;
      }
      this.loadStatus = t('optionsAIModelsLoadLoading', 'Loading...');
      this.loadStatusType = '';
      try {
        const isAnthropic = this.newProvider === 'anthropic';
        const headers = {'Content-Type': 'application/json'};
        if (isAnthropic) {
          headers['anthropic-version'] = '2023-06-01';
          headers['anthropic-dangerous-direct-browser-access'] = 'true';
          if (this.newApiKey) headers['x-api-key'] = this.newApiKey;
        } else if (this.newApiKey) {
          headers['Authorization'] = `Bearer ${this.newApiKey}`;
        }
        const endpoint = isAnthropic ? `${this.newUrl}/v1/models` : `${this.newUrl}/models`;
        const response = await fetch(endpoint, {headers});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        const items = json.data || [];
        this.modelSuggestions = items.map((m) => m.id).filter(Boolean).sort();
        if (this.modelSuggestions.length === 0) {
          this.loadStatus = t('optionsAIModelsLoadEmpty', 'No models found');
          this.loadStatusType = 'warning';
        } else {
          this.loadStatus = t('optionsAIModelsLoadSuccess', `${this.modelSuggestions.length} models loaded`, {
            count: this.modelSuggestions.length,
          });
          this.loadStatusType = 'success';
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.loadStatus = `${t('optionsAIModelsLoadError', 'Error loading models')}: ${errMsg}`;
        this.loadStatusType = 'error';
      }
    },
    addModel() {
      if (!this.newName || !this.newUrl || !this.newModel) {
        message.warning(t('optionsAIModelsAddRequired', 'Name, URL and Model are required'));
        return;
      }
      const models = Array.isArray(this.settings.ai_models) ? [...this.settings.ai_models] : [];
      models.push({
        name: this.newName,
        url: this.newUrl,
        api_key: this.newApiKey,
        model: this.newModel,
        provider: this.newProvider,
        timeout: this.newTimeout || 900,
        max_tokens: this.newMaxTokens || 0,
      });
      this.settings.ai_models = models;
      this.newName = '';
      this.newApiKey = '';
      this.newModel = '';
      this.newTimeout = 900;
      this.newMaxTokens = 0;
    },
    async confirmRemoveModel(idx) {
      try {
        await confirmDialog({
          title: t('optionsTitleAIModelsRemove', 'Remove model?'),
          content: t('optionsTitleAIModelsRemoveConfirm', 'Remove this AI model profile?'),
          okText: t('optionsTitleThemeRemove', 'Remove'),
          cancelText: t('cancel', 'Cancel'),
        });
        const models = Array.isArray(this.settings.ai_models) ? [...this.settings.ai_models] : [];
        models.splice(idx, 1);
        this.settings.ai_models = models;
      } catch (_e) {
        // cancelled
      }
    },
  },
  render() {
    return h(Card, {title: t('optionsTitleAIModels', 'AI Models'), class: 'ot-card'}, {
      default: () => [
        h('p', {class: 'ot-hint'}, t('optionsTitleAIModelsDescription', 'Define AI model profiles to use in AI mode.')),
        h('p', {class: 'ot-warn'}, t('optionsWarningAIModelsKeys', 'Warning: API keys are stored in browser storage.')),
        h('p', {class: 'ot-tip'}, t('optionsTipAIModelsCapabilities', 'Tip: Use a model that supports tool use, vision, and extended thinking.')),
        h(
          Table,
          {
            dataSource: this.models,
            columns: this.columns,
            pagination: false,
            size: 'small',
            rowKey: 'name',
            style: {marginBottom: '16px'},
          },
          {
            bodyCell: ({column, record, index}) => {
              if (column.dataIndex === 'max_tokens') {
                return h('span', null, record.max_tokens > 0 ? String(record.max_tokens) : '-');
              }
              if (column.dataIndex === 'actions') {
                return h(
                  Button,
                  {danger: true, size: 'small', onClick: () => this.confirmRemoveModel(index)},
                  () => t('optionsTitleThemeRemove', 'Remove'),
                );
              }
              return record[column.dataIndex];
            },
          },
        ),
        h(Form, {layout: 'vertical'}, () => [
          h(Row, {gutter: [10, 0]}, () => [
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleAIModelsName', 'Name')}, () =>
                h(Input, {value: this.newName, 'onUpdate:value': (v) => { this.newName = v; }, placeholder: t('optionsTitleAIModelsNamePlaceholder', 'My Model')}),
              ),
            ),
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleAIModelsProvider', 'Provider')}, () =>
                h(
                  Select,
                  {
                    value: this.newProvider,
                    'onUpdate:value': (v) => { this.newProvider = v; this.onProviderChange(v); },
                    style: {width: '100%'},
                  },
                  () => [
                    h(SelectOption, {value: 'openai'}, () => 'OpenAI'),
                    h(SelectOption, {value: 'anthropic'}, () => 'Anthropic'),
                  ],
                ),
              ),
            ),
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: 'URL'}, () =>
                h(Input, {value: this.newUrl, 'onUpdate:value': (v) => { this.newUrl = v; }, placeholder: 'https://api.openai.com/v1'}),
              ),
            ),
          ]),
          h(Row, {gutter: [10, 0]}, () => [
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleAIModelsAPIKey', 'API Key')}, () =>
                h(Input.Password, {value: this.newApiKey, 'onUpdate:value': (v) => { this.newApiKey = v; }, placeholder: 'sk-...'}),
              ),
            ),
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleAIModelsModel', 'Model')}, () =>
                h(Input, {value: this.newModel, 'onUpdate:value': (v) => { this.newModel = v; }, placeholder: 'gpt-4'}),
              ),
            ),
            h(Col, {xs: 24, sm: 8}, () =>
              h(FormItem, {label: t('optionsTitleAIModelsAdd', 'Actions')}, () =>
                h('div', {class: 'ot-btn-row'}, [
                  h(Button, {type: 'primary', onClick: this.addModel}, () => t('optionsTitleAIModelsAdd', 'Add')),
                  h(Button, {onClick: this.loadModels}, () => t('optionsTitleAIModelsLoad', 'Load models')),
                ]),
              ),
            ),
          ]),
          this.loadStatus ? h('p', {class: `ot-status ot-status-${this.statusColor}`}, this.loadStatus) : null,
        ]),
        h(Collapse, {activeKey: this.activeAdvanced, 'onUpdate:activeKey': (v) => { this.activeAdvanced = v; }, style: {marginBottom: '16px'}}, () => [
          h(CollapsePanel, {header: t('optionsTitleAIModelsAdvanced', 'Advanced options'), key: 'advanced'}, () =>
            h(Form, {layout: 'vertical'}, () => [
              h(Row, {gutter: 10}, () => [
                h(Col, {xs: 24, sm: 12}, () =>
                  h(FormItem, {label: t('optionsTitleAIModelsTimeout', 'Timeout (s)')}, () =>
                    h(InputNumber, {value: this.newTimeout, 'onUpdate:value': (v) => { this.newTimeout = v; }, min: 0, style: {width: '100%'}}),
                  ),
                ),
                h(Col, {xs: 24, sm: 12}, () =>
                  h(FormItem, {label: t('optionsTitleAIModelsMaxTokensLabel', 'Max tokens (0 = default)')}, () =>
                    h(InputNumber, {value: this.newMaxTokens, 'onUpdate:value': (v) => { this.newMaxTokens = v; }, min: 0, style: {width: '100%'}}),
                  ),
                ),
              ]),
            ]),
          ),
        ]),
        this.modelSuggestions.length > 0
          ? h('div', {class: 'ot-tag-list'}, [
              h('p', {class: 'ot-tip'}, t('optionsTitleAIModelsAvailable', 'Available models:')),
              h(
                'div',
                {class: 'ot-tags'},
                () =>
                  this.modelSuggestions.map((m) =>
                    h(
                      Tag,
                      {key: m, style: {cursor: 'pointer'}, onClick: () => { this.newModel = m; }},
                      () => m,
                    ),
                  ),
              ),
            ])
          : null,
      ],
    });
  },
});
